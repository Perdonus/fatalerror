const express = require('express');
const auth = require('../middleware/auth');
const {
    listForumTopics,
    listTopicMessages,
    deleteTopicMessage,
    deleteForumTopic
} = require('../services/releaseNotifierService');

const router = express.Router();

const allowedEmails = new Set(
    String(process.env.TELEGRAM_ADMIN_ALLOWED_EMAILS || '')
        .split(',')
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter(Boolean)
);
const allowedUserIds = new Set(
    String(process.env.TELEGRAM_ADMIN_ALLOWED_USER_IDS || '')
        .split(',')
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
);

function ensureTelegramAdmin(req, res, next) {
    if (allowedEmails.size === 0 && allowedUserIds.size === 0) {
        return next();
    }
    if (allowedUserIds.has(String(req.userId || '').trim())) {
        return next();
    }
    if (allowedEmails.has(String(req.userEmail || '').trim().toLowerCase())) {
        return next();
    }
    return res.status(403).json({ error: 'Доступ к Telegram admin закрыт.' });
}

function sendError(res, error, fallbackMessage) {
    const status = Number(error?.status || 500);
    const body = {
        error: error?.message || fallbackMessage
    };
    if (error?.code) {
        body.code = error.code;
    }
    return res.status(status).json(body);
}

router.get('/releases/telegram/admin/topics', auth, ensureTelegramAdmin, async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 80) || 80));
        const result = await listForumTopics({ limit });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Release notifier admin topics error:', error);
        return sendError(res, error, 'Не удалось получить темы Telegram.');
    }
});

router.get('/releases/telegram/admin/topics/:threadId/messages', auth, ensureTelegramAdmin, async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100) || 100));
        const beforeMessageId = Math.max(0, Number(req.query.before || req.query.before_message_id || 0) || 0);
        const result = await listTopicMessages(req.params.threadId, { limit, beforeMessageId });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Release notifier admin topic messages error:', error);
        return sendError(res, error, 'Не удалось получить сообщения темы.');
    }
});

router.delete('/releases/telegram/admin/topics/:threadId/messages/:messageId', auth, ensureTelegramAdmin, async (req, res) => {
    try {
        const result = await deleteTopicMessage(req.params.threadId, req.params.messageId);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Release notifier admin delete message error:', error);
        return sendError(res, error, 'Не удалось удалить сообщение из Telegram.');
    }
});

router.delete('/releases/telegram/admin/topics/:threadId', auth, ensureTelegramAdmin, async (req, res) => {
    try {
        const result = await deleteForumTopic(req.params.threadId);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Release notifier admin delete topic error:', error);
        return sendError(res, error, 'Не удалось удалить тему Telegram.');
    }
});

module.exports = router;
