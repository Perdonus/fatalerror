const express = require('express');
const router = express.Router();
const {
    getPackageRegistry,
    getPackageDetails,
    resolvePackage
} = require('../services/packageRegistryService');

function packageRefFromRequest(req) {
    const fromQuery = [req.query.name, req.query.package, req.query.ref].find((value) => typeof value === 'string' && value.trim());
    if (fromQuery) {
        return String(fromQuery).trim();
    }
    if (req.params.scope && req.params.name) {
        const scope = String(req.params.scope).trim();
        const packageName = String(req.params.name).trim();
        if (scope && packageName) {
            return `${scope.startsWith('@') ? scope : `@${scope}`}/${packageName}`;
        }
    }
    return String(req.params.name || '').trim();
}

function requestedOs(req) {
    return req.query.os || req.query.host_os || '';
}

router.get('/', async (req, res) => {
    try {
        const payload = await getPackageRegistry({ os: requestedOs(req) });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json(payload);
    } catch (error) {
        console.error('Package registry error:', error);
        return res.status(500).json({ error: 'Не удалось загрузить registry пакетов' });
    }
});

router.get('/registry', async (req, res) => {
    try {
        const payload = await getPackageRegistry({ os: requestedOs(req) });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json(payload);
    } catch (error) {
        console.error('Package registry alias error:', error);
        return res.status(500).json({ error: 'Не удалось загрузить registry пакетов' });
    }
});

router.get('/resolve', async (req, res) => {
    try {
        const packageRef = packageRefFromRequest(req);
        const result = await resolvePackage(packageRef, {
            os: requestedOs(req),
            version: req.query.version || 'latest',
            variant: req.query.variant || ''
        });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Package resolve query error:', error);
        return res.status(500).json({ error: 'Не удалось разрешить пакет' });
    }
});

router.get('/details', async (req, res) => {
    try {
        const packageRef = packageRefFromRequest(req);
        const payload = await getPackageDetails(packageRef, { os: requestedOs(req) });
        if (!payload) {
            return res.status(404).json({ error: 'Пакет не найден' });
        }
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json(payload);
    } catch (error) {
        console.error('Package details query error:', error);
        return res.status(500).json({ error: 'Не удалось прочитать пакет' });
    }
});

router.get('/:scope/:name/resolve', async (req, res) => {
    try {
        const result = await resolvePackage(packageRefFromRequest(req), {
            os: requestedOs(req),
            version: req.query.version || 'latest',
            variant: req.query.variant || ''
        });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Package scoped resolve error:', error);
        return res.status(500).json({ error: 'Не удалось разрешить пакет' });
    }
});

router.get('/:name/resolve', async (req, res) => {
    try {
        const result = await resolvePackage(packageRefFromRequest(req), {
            os: requestedOs(req),
            version: req.query.version || 'latest',
            variant: req.query.variant || ''
        });
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Package resolve error:', error);
        return res.status(500).json({ error: 'Не удалось разрешить пакет' });
    }
});

router.get('/:scope/:name', async (req, res) => {
    try {
        const payload = await getPackageDetails(packageRefFromRequest(req), { os: requestedOs(req) });
        if (!payload) {
            return res.status(404).json({ error: 'Пакет не найден' });
        }
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json(payload);
    } catch (error) {
        console.error('Package scoped details error:', error);
        return res.status(500).json({ error: 'Не удалось прочитать пакет' });
    }
});

router.get('/:name', async (req, res) => {
    try {
        const payload = await getPackageDetails(packageRefFromRequest(req), { os: requestedOs(req) });
        if (!payload) {
            return res.status(404).json({ error: 'Пакет не найден' });
        }
        res.set('Cache-Control', 'no-store, max-age=0');
        return res.json(payload);
    } catch (error) {
        console.error('Package details error:', error);
        return res.status(500).json({ error: 'Не удалось прочитать пакет' });
    }
});

module.exports = router;
