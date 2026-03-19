const express = require('express');

const auth = require('../middleware/auth');
const {
    getNetworkProtectionManifest,
    getNetworkProtectionFeed,
    getNetworkProtectionState,
    updateNetworkProtectionState,
    recordNetworkProtectionEvent
} = require('../services/networkProtectionService');

const router = express.Router();

function sendError(res, error, fallbackMessage) {
    const status = Number(error?.status || 500);
    const body = { error: error?.message || fallbackMessage };
    if (error?.code) {
        body.code = error.code;
    }
    return res.status(status).json(body);
}

router.get('/manifest', async (req, res) => {
    try {
        const manifest = await getNetworkProtectionManifest();
        res.set('Cache-Control', 'public, max-age=900');
        return res.json({ success: true, manifest });
    } catch (error) {
        console.error('Network protection manifest error:', error);
        return sendError(res, error, 'Не удалось получить манифест сетевой защиты');
    }
});

router.get('/feeds/:feedId', async (req, res) => {
    try {
        const result = await getNetworkProtectionFeed(req.params.feedId, req.query.format);
        if (result.etag && req.headers['if-none-match'] === result.etag) {
            res.status(304).end();
            return;
        }

        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.set('Cache-Control', `public, max-age=${result.cacheMaxAgeSec}`);
        if (result.etag) {
            res.set('ETag', result.etag);
        }
        return res.send(result.body);
    } catch (error) {
        console.error('Network protection feed error:', error);
        return sendError(res, error, 'Не удалось получить правила сетевой защиты');
    }
});

router.get('/state', auth, async (req, res) => {
    try {
        const state = await getNetworkProtectionState(req.userId, req.query.platform);
        return res.json({ success: true, state });
    } catch (error) {
        console.error('Network protection read error:', error);
        return sendError(res, error, 'Не удалось прочитать состояние сетевой защиты');
    }
});

router.put('/state', auth, async (req, res) => {
    try {
        const state = await updateNetworkProtectionState(req.userId, req.body || {});
        return res.json({ success: true, state });
    } catch (error) {
        console.error('Network protection update error:', error);
        return sendError(res, error, 'Не удалось обновить состояние сетевой защиты');
    }
});

router.post('/events', auth, async (req, res) => {
    try {
        const result = await recordNetworkProtectionEvent(req.userId, req.body || {});
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Network protection event error:', error);
        return sendError(res, error, 'Не удалось обновить счётчики сетевой защиты');
    }
});

module.exports = router;
