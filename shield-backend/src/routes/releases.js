const express = require('express');
const router = express.Router();
const { getReleaseManifest } = require('../services/releaseManifestService');

function normalizePlatform(input) {
    const value = String(input || '').trim().toLowerCase();
    switch (value) {
        case 'win':
        case 'win32':
        case 'windows':
        case 'windows-gui':
        case 'windows-native':
        case 'desktop':
            return 'windows';
        case 'linux':
        case 'linux-gui':
            return 'linux';
        case 'shell':
        case 'linux-cli':
        case 'linux-shell':
        case 'cli':
            return 'shell';
        case 'nv-win':
        case 'nv-windows':
            return 'nv-windows';
        case 'nv-linux':
            return 'nv-linux';
        case 'android':
            return 'android';
        case 'site':
            return 'site';
        default:
            return value;
    }
}

router.get('/manifest', async (req, res) => {
    try {
        const manifest = await getReleaseManifest();
        res.set('Cache-Control', 'no-store, max-age=0');
        const artifacts = Array.isArray(manifest.artifacts)
            ? manifest.artifacts
            : Object.values(manifest.artifacts || {});
        const sources = Array.isArray(manifest.sources) ? manifest.sources : [];
        const platform = normalizePlatform(req.query.platform);
        const selectedArtifact = platform
            ? artifacts.find((artifact) => String(artifact.platform || '').trim().toLowerCase() === platform) || null
            : null;

        return res.json({
            success: true,
            generated_at: manifest.generated_at,
            release_channel: manifest.release_channel || 'main',
            partial: Boolean(manifest.partial),
            platform: platform || null,
            version: selectedArtifact?.version || null,
            download_url: selectedArtifact?.download_url || null,
            install_command: selectedArtifact?.install_command || null,
            update_command: selectedArtifact?.update_command || null,
            update_policy: selectedArtifact?.update_policy || null,
            auto_update: typeof selectedArtifact?.auto_update === 'boolean' ? selectedArtifact.auto_update : null,
            setupUrl: selectedArtifact?.metadata?.setupUrl || selectedArtifact?.download_url || null,
            portableUrl: selectedArtifact?.metadata?.portableUrl || selectedArtifact?.download_url || null,
            package_registry_url: selectedArtifact?.metadata?.package_registry_url || null,
            package_name: selectedArtifact?.metadata?.package_name || null,
            variant_id: selectedArtifact?.metadata?.variant_id || null,
            selected_artifact: selectedArtifact,
            sources,
            artifacts,
            manifest: {
                ...manifest,
                artifacts,
                sources
            }
        });
    } catch (error) {
        console.error('Release manifest error:', error);
        return res.status(500).json({ error: 'Release manifest is unavailable' });
    }
});

module.exports = router;
