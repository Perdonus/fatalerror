const express = require('express');

const auth = require('../middleware/auth');
const { getUserProfileOverview } = require('../services/profileOverviewService');

const router = express.Router();

router.get('/overview', auth, async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 60) || 60));
        const offset = Math.max(0, Number(req.query.offset || 0) || 0);
        const overview = await getUserProfileOverview(req.userId, { limit, offset });
        return res.json({ success: true, overview });
    } catch (error) {
        console.error('Profile overview error:', error);
        const status = Number(error?.status || 500);
        return res.status(status).json({ error: error?.message || 'Не удалось собрать профиль пользователя' });
    }
});

router.get('/systems', auth, async (req, res) => {
    try {
        const overview = await getUserProfileOverview(req.userId, { limit: 12, offset: 0 });
        return res.json({
            success: true,
            systems: overview?.protection?.platforms || {}
        });
    } catch (error) {
        console.error('Profile systems error:', error);
        const status = Number(error?.status || 500);
        return res.status(status).json({ error: error?.message || 'Не удалось получить состояние систем' });
    }
});

router.get('/scans', auth, async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 60) || 60));
        const offset = Math.max(0, Number(req.query.offset || 0) || 0);
        const overview = await getUserProfileOverview(req.userId, { limit, offset });
        return res.json({
            success: true,
            scans: Array.isArray(overview?.scans) ? overview.scans : [],
            total_scans: Number(overview?.total_scans || 0) || 0,
            scan_sources: overview?.scan_sources || {}
        });
    } catch (error) {
        console.error('Profile scans error:', error);
        const status = Number(error?.status || 500);
        return res.status(status).json({ error: error?.message || 'Не удалось получить историю проверок' });
    }
});

module.exports = router;
