const express = require('express');
const router = express.Router();
const {
    getPackageRegistry,
    getPackageDetails,
    resolvePackage
} = require('../services/packageRegistryService');

router.get('/', async (req, res) => {
    try {
        const payload = await getPackageRegistry({ os: req.query.os || req.query.host_os || '' });
        return res.json(payload);
    } catch (error) {
        console.error('Package registry error:', error);
        return res.status(500).json({ error: 'Не удалось загрузить registry пакетов' });
    }
});

router.get('/registry', async (req, res) => {
    try {
        const payload = await getPackageRegistry({ os: req.query.os || req.query.host_os || '' });
        return res.json(payload);
    } catch (error) {
        console.error('Package registry alias error:', error);
        return res.status(500).json({ error: 'Не удалось загрузить registry пакетов' });
    }
});

router.get('/:name/resolve', async (req, res) => {
    try {
        const result = await resolvePackage(req.params.name, {
            os: req.query.os || req.query.host_os || '',
            version: req.query.version || 'latest',
            variant: req.query.variant || ''
        });
        return res.status(result.status).json(result.payload);
    } catch (error) {
        console.error('Package resolve error:', error);
        return res.status(500).json({ error: 'Не удалось разрешить пакет' });
    }
});

router.get('/:name', async (req, res) => {
    try {
        const payload = await getPackageDetails(req.params.name, { os: req.query.os || req.query.host_os || '' });
        if (!payload) {
            return res.status(404).json({ error: 'Пакет не найден' });
        }
        return res.json(payload);
    } catch (error) {
        console.error('Package details error:', error);
        return res.status(500).json({ error: 'Не удалось прочитать пакет' });
    }
});

module.exports = router;
