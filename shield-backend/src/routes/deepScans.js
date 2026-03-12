const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createDeepScanJob,
    getDeepScanJob,
    attachDeepScanApk,
    getUserDeepScanLimits,
    getDeepScanFullReports
} = require('../services/deepScanService');

router.post('/start', auth, async (req, res) => {
    try {
        const job = await createDeepScanJob(req.userId, req.body || {});
        if (job?.error) {
            return res.status(job.status_code || 400).json({
                error: job.error,
                code: job.code || null,
                limits: job.limits || null
            });
        }

        return res.status(job.status === 'AWAITING_UPLOAD' ? 202 : 202).json({
            success: true,
            scan: job
        });
    } catch (error) {
        console.error('Deep scan start error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post(
    '/:id/apk',
    auth,
    express.raw({
        type: ['application/octet-stream', 'application/vnd.android.package-archive'],
        limit: process.env.DEEP_SCAN_UPLOAD_LIMIT || '256mb'
    }),
    async (req, res) => {
        try {
            const scan = await attachDeepScanApk(
                req.params.id,
                req.userId,
                req.body,
                req.get('X-File-Name') || 'sample.apk'
            );
            if (scan?.error) {
                return res.status(400).json({ error: scan.error });
            }
            if (!scan) {
                return res.status(404).json({ error: 'Deep scan not found' });
            }
            return res.status(202).json({ success: true, scan });
        } catch (error) {
            console.error('Deep scan upload error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
);

router.get('/limits', auth, async (req, res) => {
    try {
        const limits = await getUserDeepScanLimits(req.userId);
        if (limits?.error) {
            return res.status(404).json({ error: limits.error, code: limits.code || null });
        }
        return res.json({
            success: true,
            limits
        });
    } catch (error) {
        console.error('Deep scan limits error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/full-report', auth, async (req, res) => {
    try {
        const ids = req.body?.ids;
        const hasValidId = Array.isArray(ids) && ids.some((id) => String(id || '').trim().length > 0);
        if (!hasValidId) {
            return res.status(400).json({
                error: 'ids must be a non-empty array'
            });
        }
        const normalizedIds = ids
            .map((value) => String(value || '').trim())
            .filter(Boolean);
        const allValid = normalizedIds.length > 0 && normalizedIds.every((value) => /^[a-zA-Z0-9-]{20,64}$/.test(value));
        if (!allValid) {
            return res.status(400).json({
                error: 'ids contains invalid scan identifiers'
            });
        }

        const reports = await getDeepScanFullReports(normalizedIds, req.userId);
        if (!Array.isArray(reports) || reports.length === 0) {
            return res.status(404).json({
                error: 'No deep scan reports found for current user'
            });
        }

        return res.json({
            success: true,
            generated_at: Date.now(),
            reports
        });
    } catch (error) {
        console.error('Deep scan full-report error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const scan = await getDeepScanJob(req.params.id, req.userId);
        if (!scan) {
            return res.status(404).json({ error: 'Deep scan not found' });
        }

        return res.json({
            success: true,
            scan
        });
    } catch (error) {
        console.error('Deep scan fetch error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
