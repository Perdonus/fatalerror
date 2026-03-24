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

module.exports = router;
