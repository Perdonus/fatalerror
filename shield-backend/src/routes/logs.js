const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const router = express.Router();
const LOG_ROOT = process.env.CLIENT_LOGS_DIR || path.join(process.cwd(), 'logs');
const MAX_EVENTS_PER_BATCH = parseInt(process.env.CLIENT_LOGS_MAX_EVENTS || '5000', 10);
const MAX_CRASHES_PER_BATCH = parseInt(process.env.CLIENT_LOGS_MAX_CRASHES || '200', 10);

function sanitizeSegment(value, fallback) {
    const normalized = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 80);
    return normalized || fallback;
}

function sanitizeEmailSegment(value, fallback) {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._@-]/g, '_')
        .slice(0, 120);
    return normalized || fallback;
}

function normalizeItems(value, limit) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, limit).map((item) => {
        if (item && typeof item === 'object') {
            return item;
        }
        return { value: String(item || '') };
    });
}

async function writeJsonLines(filePath, records) {
    if (!records.length) return;
    const lines = records.map((item) => JSON.stringify(item)).join('\n') + '\n';
    await fs.writeFile(filePath, lines, 'utf8');
}

router.post('/client', auth, async (req, res) => {
    try {
        const body = req.body || {};
        const events = normalizeItems(body.events, MAX_EVENTS_PER_BATCH);
        const crashes = normalizeItems(body.crashes, MAX_CRASHES_PER_BATCH);

        if (events.length === 0 && crashes.length === 0) {
            return res.status(400).json({ error: 'events or crashes required' });
        }
        if (!req.userId || !req.userEmail) {
            return res.status(403).json({ error: 'Registered user is required for client log upload' });
        }

        const userEmail = sanitizeEmailSegment(req.userEmail, 'unknown_email');
        const sessionId = sanitizeSegment(body.sessionId || req.sessionId, 'unknown_session');
        const iso = new Date().toISOString();
        const dayKey = iso.slice(0, 10);
        const hourKey = iso.slice(11, 13);
        const runDir = path.join(
            LOG_ROOT,
            userEmail,
            dayKey,
            `hour-${hourKey}`,
            sessionId
        );

        const batchId = `${Date.now()}-${crypto.randomUUID()}`;
        const batchDir = path.join(runDir, `batch-${batchId}`);
        await fs.mkdir(batchDir, { recursive: true });

        const metaPath = path.join(batchDir, 'meta.json');
        const eventsPath = path.join(batchDir, 'events.jsonl');
        const crashesPath = path.join(batchDir, 'crashes.jsonl');
        const payload = {
            received_at: Date.now(),
            user_id: req.userId,
            user_email: req.userEmail,
            session_id: body.sessionId || req.sessionId || null,
            app_version: body.appVersion || null,
            device: body.device || null,
            counts: {
                events: events.length,
                crashes: crashes.length
            }
        };
        await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), 'utf8');
        await writeJsonLines(eventsPath, events);
        await writeJsonLines(crashesPath, crashes);

        return res.json({
            success: true,
            accepted: {
                events: events.length,
                crashes: crashes.length
            },
            batch_id: batchId,
            stored_under: path.join(userEmail, dayKey, `hour-${hourKey}`, sessionId, `batch-${batchId}`)
        });
    } catch (error) {
        console.error('Client log ingest error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
