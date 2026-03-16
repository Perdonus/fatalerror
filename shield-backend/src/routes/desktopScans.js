const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createDesktopScanJob,
    attachDesktopArtifact,
    getDesktopScanJob,
    cancelActiveDesktopScans,
    getDesktopFullReports,
    extractDesktopFailureReason
} = require('../services/desktopScanService');

const UPLOAD_LIMIT_BYTES = parseUploadLimitBytes(process.env.DESKTOP_SCAN_UPLOAD_LIMIT || '512mb');

function parseUploadLimitBytes(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const matched = normalized.match(/^(\d+)(b|kb|mb|gb)?$/);
    if (!matched) return 512 * 1024 * 1024;
    const amount = Number(matched[1] || 0);
    const unit = matched[2] || 'b';
    const multiplier = unit === 'gb' ? 1024 ** 3 : unit === 'mb' ? 1024 ** 2 : unit === 'kb' ? 1024 : 1;
    return amount * multiplier;
}

async function readArtifactUpload(req) {
    const tempPath = path.join(os.tmpdir(), `neuralv-desktop-${crypto.randomUUID()}.bin`);
    const writeStream = fs.createWriteStream(tempPath, { flags: 'wx' });
    const hash = crypto.createHash('sha256');
    let total = 0;
    let settled = false;

    return new Promise((resolve, reject) => {
        const cleanup = async () => {
            try {
                await fsp.rm(tempPath, { force: true });
            } catch (_) {}
        };
        const fail = async (error) => {
            if (settled) return;
            settled = true;
            req.unpipe(writeStream);
            writeStream.destroy();
            await cleanup();
            reject(error);
        };

        writeStream.on('error', (error) => { void fail(error); });
        req.on('error', (error) => { void fail(error); });
        req.on('data', (chunk) => {
            total += chunk.length;
            if (total > UPLOAD_LIMIT_BYTES) {
                const error = new Error('Artifact payload is too large');
                error.code = 'PAYLOAD_TOO_LARGE';
                req.destroy(error);
                return;
            }
            hash.update(chunk);
        });
        writeStream.on('finish', () => {
            if (settled) return;
            settled = true;
            if (total <= 0) {
                void cleanup().finally(() => reject(new Error('Artifact payload is empty')));
                return;
            }
            resolve({
                tempFilePath: tempPath,
                sizeBytes: total,
                sha256: hash.digest('hex'),
                mimeType: req.get('Content-Type') || 'application/octet-stream'
            });
        });
        req.pipe(writeStream);
    });
}

router.post('/start', auth, async (req, res) => {
    try {
        const job = await createDesktopScanJob(req.userId, req.body || {});
        if (job?.error) {
            return res.status(job.status_code || 400).json({ error: job.error });
        }
        return res.status(202).json({ success: true, scan: job });
    } catch (error) {
        console.error('Desktop scan start error:', error);
        const failure = extractDesktopFailureReason(error);
        return res.status(failure.status || 500).json({ error: failure.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const job = await getDesktopScanJob(req.params.id, req.userId);
        if (!job) {
            return res.status(404).json({ error: 'Desktop scan not found' });
        }
        return res.json({ success: true, scan: job });
    } catch (error) {
        console.error('Desktop scan get error:', error);
        return res.status(500).json({ error: 'Не удалось прочитать desktop-задачу' });
    }
});

router.post('/:id/artifact', auth, async (req, res) => {
    let upload = null;
    try {
        upload = await readArtifactUpload(req);
        const scan = await attachDesktopArtifact(req.params.id, req.userId, {
            ...upload,
            originalName: req.get('X-File-Name') || 'artifact.bin'
        });
        if (scan?.error) {
            return res.status(400).json({ error: scan.error });
        }
        if (!scan) {
            return res.status(404).json({ error: 'Desktop scan not found' });
        }
        return res.status(202).json({ success: true, scan });
    } catch (error) {
        if (upload?.tempFilePath) {
            await fsp.rm(upload.tempFilePath, { force: true }).catch(() => {});
        }
        if (String(error?.code || '').toUpperCase() === 'PAYLOAD_TOO_LARGE') {
            return res.status(413).json({ error: 'Artifact payload is too large' });
        }
        console.error('Desktop artifact upload error:', error);
        return res.status(500).json({ error: 'Не удалось загрузить desktop-артефакт' });
    }
});

router.post('/cancel-active', auth, async (req, res) => {
    try {
        const result = await cancelActiveDesktopScans(req.userId);
        return res.json(result);
    } catch (error) {
        console.error('Desktop cancel error:', error);
        return res.status(500).json({ error: 'Не удалось отменить desktop-проверку' });
    }
});

router.post('/full-report', auth, async (req, res) => {
    try {
        const payload = await getDesktopFullReports(req.userId, req.body?.scan_ids || req.body?.scanIds || []);
        return res.json({ success: true, ...payload });
    } catch (error) {
        console.error('Desktop full report error:', error);
        return res.status(500).json({ error: 'Не удалось собрать desktop full report' });
    }
});

module.exports = router;
