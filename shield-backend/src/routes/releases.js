const express = require('express');
const router = express.Router();
const { getReleaseManifest } = require('../services/releaseManifestService');

router.get('/manifest', async (req, res) => {
    try {
        const manifest = await getReleaseManifest();
        return res.json({
            success: true,
            generated_at: manifest.generated_at,
            release_channel: 'stable',
            artifacts: Object.values(manifest.artifacts || {}),
            manifest
        });
    } catch (error) {
        console.error('Release manifest error:', error);
        return res.status(500).json({ error: 'Release manifest is unavailable' });
    }
});

module.exports = router;
