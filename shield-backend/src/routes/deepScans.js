const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createDeepScanJob,
    getDeepScanJob,
    attachDeepScanApk
} = require('../services/deepScanService');

router.post('/start', auth, async (req, res) => {
    try {
        const job = await createDeepScanJob(req.userId, req.body || {});
        if (job?.error) {
            return res.status(400).json({ error: job.error });
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
