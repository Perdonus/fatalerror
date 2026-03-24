const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pool = require('../db/pool');

const RELEASE_NOTIFIER_TELEGRAM_API_BASE = String(process.env.RELEASE_NOTIFIER_TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, '');
const RELEASE_NOTIFIER_BOT_USERNAME = String(process.env.RELEASE_NOTIFIER_TELEGRAM_BOT_USERNAME || '').trim();
const RELEASE_NOTIFIER_ALLOWED_USER_IDS = parseCsvSet(process.env.RELEASE_NOTIFIER_TELEGRAM_ALLOWED_USER_IDS);
const RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH = Math.max(512, Math.min(3900, Number(process.env.RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH || 3600) || 3600));
const RELEASE_NOTIFIER_POLL_INTERVAL_MS = Math.max(1500, Number(process.env.RELEASE_NOTIFIER_POLL_INTERVAL_MS || 4000) || 4000);
const RELEASE_NOTIFIER_CURL_MAX_TIME_SEC = Math.max(8, Math.min(25, Number(process.env.RELEASE_NOTIFIER_CURL_MAX_TIME_SEC || 18) || 18));

let schemaReady = false;
let schemaReadyPromise = null;
let syncPromise = null;
let pollerStarted = false;
let pollerTimer = null;
const execFileAsync = promisify(execFile);

function nowMs() {
    return Date.now();
}

function createHttpError(status, message, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

function parseCsvSet(value) {
    return new Set(
        String(value || '')
            .split(',')
            .map((entry) => String(entry || '').trim())
            .filter(Boolean)
    );
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeOptionalText(value, maxLength = 255) {
    const normalized = String(value || '').replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
    if (!normalized) {
        return null;
    }
    return normalized.slice(0, maxLength);
}

function normalizeVersion(value) {
    const normalized = String(value || '').trim();
    return normalized ? normalized.slice(0, 64) : null;
}

function normalizeReleaseTopicTitle(value, fallback = null) {
    const normalized = normalizeOptionalText(value, 255);
    return normalized || fallback;
}

function normalizeReleaseMessageKind(message) {
    if (Array.isArray(message?.photo) && message.photo.length > 0) {
        return 'PHOTO';
    }
    if (message?.video) {
        return 'VIDEO';
    }
    if (message?.document) {
        return 'DOCUMENT';
    }
    if (typeof message?.text === 'string' && message.text.trim()) {
        return 'TEXT';
    }
    if (typeof message?.caption === 'string' && message.caption.trim()) {
        return 'TEXT';
    }
    return 'OTHER';
}

function extractReleaseMessageText(message) {
    if (typeof message?.text === 'string' && message.text.trim()) {
        return message.text.trim().slice(0, 8000);
    }
    if (typeof message?.caption === 'string' && message.caption.trim()) {
        return message.caption.trim().slice(0, 8000);
    }
    if (message?.forum_topic_created?.name) {
        return `Создана тема «${String(message.forum_topic_created.name).trim()}».`;
    }
    if (message?.forum_topic_edited?.name) {
        return `Переименована тема: ${String(message.forum_topic_edited.name).trim()}.`;
    }
    if (message?.forum_topic_closed) {
        return 'Тема закрыта.';
    }
    if (message?.forum_topic_reopened) {
        return 'Тема снова открыта.';
    }
    if (message?.delete_chat_photo) {
        return 'Фото группы удалено.';
    }
    if (message?.new_chat_title) {
        return `Изменено название группы: ${String(message.new_chat_title).trim()}.`;
    }
    return '';
}

function normalizeChangelogItems(value) {
    if (Array.isArray(value)) {
        return value
            .map((entry) => normalizeOptionalText(entry, 500))
            .filter(Boolean)
            .slice(0, 32);
    }

    const raw = String(value || '').replace(/\r\n/g, '\n').trim();
    if (!raw) {
        return [];
    }

    return raw
        .split('\n')
        .map((entry) => entry.replace(/^[-*•\s]+/, ''))
        .map((entry) => normalizeOptionalText(entry, 500))
        .filter(Boolean)
        .slice(0, 32);
}

function getReleaseNotifierConfig() {
    const token = String(process.env.RELEASE_NOTIFIER_TELEGRAM_BOT_TOKEN || '').trim();
    const webhookSecret = String(process.env.RELEASE_NOTIFIER_TELEGRAM_WEBHOOK_SECRET || '').trim();
    const announceSecret = String(process.env.RELEASE_NOTIFIER_ANNOUNCE_SECRET || '').trim();
    const fallbackChatId = normalizeOptionalText(
        process.env.RELEASE_NOTIFIER_TELEGRAM_CHAT_ID
            || process.env.RELEASE_NOTIFIER_TARGET_CHAT_ID,
        64
    );
    const fallbackThreadId = Number(
        process.env.RELEASE_NOTIFIER_TELEGRAM_THREAD_ID
        || process.env.RELEASE_NOTIFIER_TELEGRAM_TOPIC_ID
        || process.env.RELEASE_NOTIFIER_TARGET_THREAD_ID
        || 0
    ) || null;
    const fallbackChatTitle = normalizeOptionalText(
        process.env.RELEASE_NOTIFIER_TELEGRAM_CHAT_TITLE
            || process.env.RELEASE_NOTIFIER_TARGET_CHAT_TITLE,
        255
    );
    const available = Boolean(token);

    return {
        available,
        token,
        botUsername: RELEASE_NOTIFIER_BOT_USERNAME,
        webhookSecret,
        announceSecret,
        allowedUserIds: RELEASE_NOTIFIER_ALLOWED_USER_IDS,
        command_list: ['/setchat'],
        fallbackTarget: fallbackChatId ? {
            configured: true,
            source: 'env',
            chat_id: fallbackChatId,
            thread_id: fallbackThreadId,
            chat_type: null,
            chat_title: fallbackChatTitle,
            is_topic_message: Boolean(fallbackThreadId),
            set_by_user_id: null,
            set_by_username: null,
            updated_at: null
        } : null,
        message: available
            ? 'Бот анонсов релизов готов.'
            : 'Бот анонсов релизов временно не настроен. Нужен RELEASE_NOTIFIER_TELEGRAM_BOT_TOKEN.'
    };
}

function shouldUseReleaseNotifierPolling() {
    const forced = String(process.env.RELEASE_NOTIFIER_FORCE_POLLING || '').trim().toLowerCase();
    if (forced === '1' || forced === 'true') {
        return true;
    }
    if (forced === '0' || forced === 'false') {
        return false;
    }
    return true;
}

async function ensureReleaseNotifierSchema(db = pool) {
    if (schemaReady) {
        return;
    }
    if (schemaReadyPromise) {
        return schemaReadyPromise;
    }

    schemaReadyPromise = (async () => {
        await db.query(`
            CREATE TABLE IF NOT EXISTS release_notifier_meta (
                meta_key VARCHAR(120) PRIMARY KEY,
                meta_value LONGTEXT DEFAULT NULL,
                updated_at BIGINT NOT NULL
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS release_notifier_topics (
                chat_id VARCHAR(64) NOT NULL,
                thread_id BIGINT NOT NULL,
                topic_title VARCHAR(255) DEFAULT NULL,
                is_general TINYINT(1) NOT NULL DEFAULT 0,
                last_message_id BIGINT DEFAULT NULL,
                last_message_text LONGTEXT DEFAULT NULL,
                last_sender_name VARCHAR(120) DEFAULT NULL,
                deleted_at BIGINT DEFAULT NULL,
                created_at BIGINT NOT NULL,
                updated_at BIGINT NOT NULL,
                PRIMARY KEY (chat_id, thread_id),
                INDEX idx_release_notifier_topics_chat_updated (chat_id, updated_at)
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS release_notifier_messages (
                chat_id VARCHAR(64) NOT NULL,
                thread_id BIGINT NOT NULL,
                message_id BIGINT NOT NULL,
                sender_name VARCHAR(120) DEFAULT NULL,
                sender_username VARCHAR(120) DEFAULT NULL,
                message_text LONGTEXT NOT NULL,
                message_kind ENUM('TEXT','PHOTO','VIDEO','DOCUMENT','OTHER') NOT NULL DEFAULT 'TEXT',
                raw_json LONGTEXT DEFAULT NULL,
                deleted_at BIGINT DEFAULT NULL,
                created_at BIGINT NOT NULL,
                updated_at BIGINT NOT NULL,
                PRIMARY KEY (chat_id, message_id),
                INDEX idx_release_notifier_messages_thread_created (chat_id, thread_id, created_at),
                INDEX idx_release_notifier_messages_thread_message (chat_id, thread_id, message_id)
            )
        `);
        schemaReady = true;
    })().finally(() => {
        schemaReadyPromise = null;
    });

    return schemaReadyPromise;
}

async function getMeta(metaKey, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const [rows] = await db.query(
        'SELECT meta_value FROM release_notifier_meta WHERE meta_key = ? LIMIT 1',
        [metaKey]
    );
    return rows[0] ? rows[0].meta_value : null;
}

async function setMeta(metaKey, metaValue, db = pool) {
    await ensureReleaseNotifierSchema(db);
    await db.query(
        `INSERT INTO release_notifier_meta (meta_key, meta_value, updated_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value), updated_at = VALUES(updated_at)`,
        [metaKey, metaValue, nowMs()]
    );
}

function resolveIndexedThreadId(message) {
    return Number(extractThreadId(message) || 0) || 0;
}

function resolveIndexedTopicTitle(message, threadId, fallbackTitle = null) {
    if (!threadId) {
        return 'General';
    }
    return normalizeReleaseTopicTitle(
        message?.forum_topic_created?.name
            || message?.forum_topic_edited?.name
            || message?.reply_to_message?.forum_topic_created?.name
            || fallbackTitle,
        `Тема ${threadId}`
    );
}

function shapeIndexedTopic(row) {
    if (!row) {
        return null;
    }
    return {
        chat_id: row.chat_id,
        thread_id: Number(row.thread_id || 0) || 0,
        topic_title: normalizeReleaseTopicTitle(row.topic_title, Number(row.thread_id || 0) ? `Тема ${row.thread_id}` : 'General'),
        is_general: Number(row.is_general || 0) === 1,
        last_message_id: Number(row.last_message_id || 0) || null,
        last_message_text: normalizeOptionalText(row.last_message_text, 1200),
        last_sender_name: normalizeOptionalText(row.last_sender_name, 120),
        deleted_at: Number(row.deleted_at || 0) || null,
        created_at: Number(row.created_at || 0) || null,
        updated_at: Number(row.updated_at || 0) || null
    };
}

function shapeIndexedMessage(row) {
    if (!row) {
        return null;
    }
    return {
        chat_id: row.chat_id,
        thread_id: Number(row.thread_id || 0) || 0,
        message_id: Number(row.message_id || 0) || 0,
        sender_name: normalizeOptionalText(row.sender_name, 120) || 'Telegram',
        sender_username: normalizeOptionalText(row.sender_username, 120),
        message_text: String(row.message_text || ''),
        message_kind: String(row.message_kind || 'TEXT'),
        deleted_at: Number(row.deleted_at || 0) || null,
        created_at: Number(row.created_at || 0) || null,
        updated_at: Number(row.updated_at || 0) || null
    };
}

async function upsertIndexedTopic(chatId, threadId, topicTitle, messageId, messageText, senderName, createdAt, db = pool) {
    const timestamp = nowMs();
    await db.query(
        `INSERT INTO release_notifier_topics
         (chat_id, thread_id, topic_title, is_general, last_message_id, last_message_text, last_sender_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            topic_title = COALESCE(NULLIF(VALUES(topic_title), ''), topic_title),
            is_general = VALUES(is_general),
            last_message_id = VALUES(last_message_id),
            last_message_text = VALUES(last_message_text),
            last_sender_name = VALUES(last_sender_name),
            updated_at = VALUES(updated_at),
            deleted_at = NULL`,
        [
            String(chatId),
            Number(threadId || 0),
            String(topicTitle || '').slice(0, 255),
            threadId ? 0 : 1,
            Number(messageId || 0) || null,
            String(messageText || '').slice(0, 8000),
            String(senderName || '').slice(0, 120) || null,
            Number(createdAt || timestamp) || timestamp,
            timestamp
        ]
    );
}

async function refreshIndexedTopicSummary(chatId, threadId, db = pool) {
    const [rows] = await db.query(
        `SELECT sender_name, message_text, message_id, created_at
         FROM release_notifier_messages
         WHERE chat_id = ? AND thread_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC, message_id DESC
         LIMIT 1`,
        [String(chatId), Number(threadId || 0)]
    );
    const latest = rows[0] || null;
    await db.query(
        `UPDATE release_notifier_topics
         SET last_message_id = ?, last_message_text = ?, last_sender_name = ?, updated_at = ?
         WHERE chat_id = ? AND thread_id = ?`,
        [
            latest ? Number(latest.message_id || 0) || null : null,
            latest ? String(latest.message_text || '').slice(0, 8000) : null,
            latest ? String(latest.sender_name || '').slice(0, 120) : null,
            nowMs(),
            String(chatId),
            Number(threadId || 0)
        ]
    );
}

async function indexReleaseNotifierMessage(message, db = pool) {
    if (!message?.chat?.id) {
        return null;
    }

    await ensureReleaseNotifierSchema(db);
    const chatId = String(message.chat.id);
    const threadId = resolveIndexedThreadId(message);
    const messageId = Number(message.message_id || 0) || null;
    if (!messageId) {
        return null;
    }

    const createdAt = Number(message.date || 0) > 0 ? Number(message.date) * 1000 : nowMs();
    const senderName = normalizeOptionalText(
        [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ').trim()
            || message.from?.username
            || message.sender_chat?.title
            || 'Telegram',
        120
    ) || 'Telegram';
    const senderUsername = normalizeOptionalText(message.from?.username || message.sender_chat?.username || '', 120);
    const messageText = extractReleaseMessageText(message);
    const messageKind = normalizeReleaseMessageKind(message);
    const topicTitle = resolveIndexedTopicTitle(message, threadId);

    await db.query(
        `INSERT INTO release_notifier_messages
         (chat_id, thread_id, message_id, sender_name, sender_username, message_text, message_kind, raw_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            thread_id = VALUES(thread_id),
            sender_name = VALUES(sender_name),
            sender_username = VALUES(sender_username),
            message_text = VALUES(message_text),
            message_kind = VALUES(message_kind),
            raw_json = VALUES(raw_json),
            updated_at = VALUES(updated_at),
            deleted_at = NULL`,
        [
            chatId,
            threadId,
            messageId,
            senderName,
            senderUsername,
            messageText,
            messageKind,
            JSON.stringify(message),
            createdAt,
            nowMs()
        ]
    );

    await upsertIndexedTopic(chatId, threadId, topicTitle, messageId, messageText, senderName, createdAt, db);
    return { chatId, threadId, messageId };
}

function verifyReleaseNotifierWebhookSecret(receivedSecret) {
    const expected = String(process.env.RELEASE_NOTIFIER_TELEGRAM_WEBHOOK_SECRET || '').trim();
    if (!expected) {
        return false;
    }
    const left = Buffer.from(String(receivedSecret || ''), 'utf8');
    const right = Buffer.from(expected, 'utf8');
    if (left.length !== right.length) {
        return false;
    }
    return crypto.timingSafeEqual(left, right);
}

function verifyReleaseNotifierAnnounceSecret(receivedSecret) {
    const expected = String(process.env.RELEASE_NOTIFIER_ANNOUNCE_SECRET || '').trim();
    if (!expected) {
        return false;
    }
    const left = Buffer.from(String(receivedSecret || ''), 'utf8');
    const right = Buffer.from(expected, 'utf8');
    if (left.length !== right.length) {
        return false;
    }
    return crypto.timingSafeEqual(left, right);
}

async function callReleaseNotifierTelegram(method, payload) {
    const config = getReleaseNotifierConfig();
    if (!config.available) {
        throw createHttpError(503, config.message, 'RELEASE_NOTIFIER_UNAVAILABLE');
    }

    const url = `${RELEASE_NOTIFIER_TELEGRAM_API_BASE}/bot${config.token}/${method}`;
    const requestBody = JSON.stringify(payload || {});

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: requestBody,
            signal: AbortSignal.timeout(20000)
        });

        const json = await response.json().catch(() => null);
        if (!response.ok || !json || json.ok !== true) {
            const description = String(json?.description || `Telegram API ${response.status}`);
            throw createHttpError(502, description, 'RELEASE_NOTIFIER_TELEGRAM_API_ERROR');
        }

        return json.result;
    } catch (error) {
        const { stdout } = await execFileAsync('curl', [
            '--ipv4',
            '-sS',
            '--retry', '1',
            '--retry-all-errors',
            '--retry-delay', '1',
            '--connect-timeout', '10',
            '--max-time', String(RELEASE_NOTIFIER_CURL_MAX_TIME_SEC),
            '-X', 'POST',
            '-H', 'content-type: application/json',
            '--data', requestBody,
            url
        ], {
            maxBuffer: 4 * 1024 * 1024
        }).catch((curlError) => {
            throw createHttpError(502, curlError?.message || error?.message || 'Telegram API unavailable', 'RELEASE_NOTIFIER_TELEGRAM_API_ERROR');
        });

        const json = JSON.parse(String(stdout || 'null'));
        if (!json || json.ok !== true) {
            const description = String(json?.description || 'Telegram API unavailable');
            throw createHttpError(502, description, 'RELEASE_NOTIFIER_TELEGRAM_API_ERROR');
        }

        return json.result;
    }
}

function extractCommandText(message) {
    if (typeof message?.text === 'string' && message.text.trim()) {
        return message.text.trim();
    }
    return '';
}

function isSetChatCommand(text, botUsername) {
    const normalized = String(text || '').trim();
    if (!normalized.startsWith('/setchat')) {
        return false;
    }

    const match = normalized.match(/^\/setchat(?:@([A-Za-z0-9_]+))?(?:\s|$)/i);
    if (!match) {
        return false;
    }

    const mentionedBot = String(match[1] || '').trim().toLowerCase();
    if (!mentionedBot) {
        return true;
    }

    return Boolean(botUsername) && mentionedBot === String(botUsername || '').trim().toLowerCase();
}

function extractThreadId(message) {
    const direct = Number(message?.message_thread_id || 0) || null;
    if (direct) {
        return direct;
    }
    const replyThread = Number(message?.reply_to_message?.message_thread_id || 0) || null;
    if (replyThread) {
        return replyThread;
    }
    const forumCreatedThread = Number(message?.reply_to_message?.forum_topic_created?.message_thread_id || 0) || null;
    if (forumCreatedThread) {
        return forumCreatedThread;
    }
    return null;
}

async function loadReleaseNotifierTarget(db = pool) {
    const config = getReleaseNotifierConfig();
    await ensureReleaseNotifierSchema(db);
    const [rows] = await db.query(
        `SELECT meta_key, meta_value, updated_at
         FROM release_notifier_meta
         WHERE meta_key IN (
             'target_chat_id',
             'target_thread_id',
             'target_chat_type',
             'target_chat_title',
             'target_is_topic_message',
             'target_set_by_user_id',
             'target_set_by_username',
             'target_updated_at'
         )`
    );

    const meta = new Map(rows.map((row) => [row.meta_key, row.meta_value]));
    const chatId = normalizeOptionalText(meta.get('target_chat_id'), 64);
    const threadId = Number(meta.get('target_thread_id') || 0) || null;
    const updatedAt = Number(meta.get('target_updated_at') || 0) || null;

    if (!chatId && config.fallbackTarget) {
        return {
            ...config.fallbackTarget
        };
    }

    return {
        configured: Boolean(chatId),
        source: chatId ? 'stored' : null,
        chat_id: chatId,
        thread_id: threadId,
        chat_type: normalizeOptionalText(meta.get('target_chat_type'), 32),
        chat_title: normalizeOptionalText(meta.get('target_chat_title'), 255),
        is_topic_message: String(meta.get('target_is_topic_message') || '').trim() === '1',
        set_by_user_id: normalizeOptionalText(meta.get('target_set_by_user_id'), 64),
        set_by_username: normalizeOptionalText(meta.get('target_set_by_username'), 120),
        updated_at: updatedAt
    };
}

async function saveReleaseNotifierTarget(target, db = pool) {
    const updatedAt = nowMs();
    await Promise.all([
        setMeta('target_chat_id', String(target.chatId), db),
        setMeta('target_thread_id', target.threadId ? String(target.threadId) : '', db),
        setMeta('target_chat_type', String(target.chatType || ''), db),
        setMeta('target_chat_title', String(target.chatTitle || ''), db),
        setMeta('target_is_topic_message', target.isTopicMessage ? '1' : '0', db),
        setMeta('target_set_by_user_id', String(target.setByUserId || ''), db),
        setMeta('target_set_by_username', String(target.setByUsername || ''), db),
        setMeta('target_updated_at', String(updatedAt), db)
    ]);
    return loadReleaseNotifierTarget(db);
}

async function getReleaseNotifierState(db = pool) {
    const config = getReleaseNotifierConfig();
    const target = await loadReleaseNotifierTarget(db);
    const fallbackTarget = config.fallbackTarget || {
        configured: false,
        source: 'env',
        chat_id: null,
        thread_id: null,
        chat_type: null,
        chat_title: null,
        is_topic_message: false,
        set_by_user_id: null,
        set_by_username: null,
        updated_at: null
    };
    return {
        availability: config.available,
        message: config.message,
        bot_username: config.botUsername || null,
        command_list: config.command_list,
        target,
        fallback_target: fallbackTarget,
        active_target_source: target.source || (fallbackTarget.configured ? 'env' : null)
    };
}

function buildReleaseAnnouncementLines(payload) {
    const platformName = normalizeOptionalText(payload.platform_name || payload.platform || 'платформы', 80) || 'платформы';
    const oldVersion = normalizeVersion(payload.old_version || payload.previous_version || payload.from_version);
    const newVersion = normalizeVersion(payload.new_version || payload.version || payload.to_version);
    const changelogItems = normalizeChangelogItems(payload.changelog || payload.items || payload.notes);

    if (!newVersion) {
        throw createHttpError(400, 'Нужна новая версия для анонса.', 'RELEASE_NOTIFIER_VERSION_REQUIRED');
    }

    const lines = [`<b>Обновилась ${escapeHtml(platformName)} версия</b>`];
    if (oldVersion) {
        lines.push(`с <s>${escapeHtml(oldVersion)}</s>, на <b>${escapeHtml(newVersion)}</b>`);
    } else {
        lines.push(`Новая версия: <b>${escapeHtml(newVersion)}</b>`);
    }
    if (changelogItems.length > 0) {
        lines.push('');
        lines.push('<b>Что поменялось:</b>');
        for (const item of changelogItems) {
            lines.push(`• ${escapeHtml(item)}`);
        }
    }

    return lines;
}

function splitAnnouncementLines(lines) {
    const chunks = [];
    let current = '';

    for (const line of lines) {
        const candidate = current ? `${current}\n${line}` : String(line || '');
        if (candidate.length <= RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH) {
            current = candidate;
            continue;
        }

        if (current) {
            chunks.push(current);
            current = '';
        }

        if (String(line || '').length <= RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH) {
            current = String(line || '');
            continue;
        }

        let rest = String(line || '');
        while (rest.length > RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH) {
            chunks.push(rest.slice(0, RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH));
            rest = rest.slice(RELEASE_NOTIFIER_MESSAGE_MAX_LENGTH);
        }
        current = rest;
    }

    if (current) {
        chunks.push(current);
    }

    return chunks.filter(Boolean);
}

async function sendReleaseAnnouncement(payload = {}, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const config = getReleaseNotifierConfig();
    if (!config.available) {
        throw createHttpError(503, config.message, 'RELEASE_NOTIFIER_UNAVAILABLE');
    }

    const target = await loadReleaseNotifierTarget(db);
    if (!target.configured || !target.chat_id) {
        throw createHttpError(400, 'Сначала выполните /setchat в нужной группе или теме.', 'RELEASE_NOTIFIER_TARGET_MISSING');
    }

    const messageChunks = splitAnnouncementLines(buildReleaseAnnouncementLines(payload));
    if (messageChunks.length === 0) {
        throw createHttpError(400, 'Ченджлог для анонса пустой.', 'RELEASE_NOTIFIER_CHANGELOG_EMPTY');
    }

    const messageIds = [];
    for (const text of messageChunks) {
        const telegramPayload = {
            chat_id: target.chat_id,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };
        if (target.thread_id) {
            telegramPayload.message_thread_id = Number(target.thread_id);
        }

        const result = await callReleaseNotifierTelegram('sendMessage', telegramPayload);
        messageIds.push(Number(result?.message_id || 0) || null);
    }

    return {
        sent: true,
        target_source: target.source || null,
        target,
        message_id: messageIds[0] || null,
        message_ids: messageIds,
        chunk_count: messageIds.length
    };
}

function isAuthorizedSetChatUser(userId) {
    if (RELEASE_NOTIFIER_ALLOWED_USER_IDS.size === 0) {
        return true;
    }
    return RELEASE_NOTIFIER_ALLOWED_USER_IDS.has(String(userId || '').trim());
}

async function handleSetChatCommand(message, updateId, db = pool) {
    const fromId = String(message?.from?.id || '').trim();
    const chatId = String(message?.chat?.id || '').trim();
    const chatType = String(message?.chat?.type || '').trim();
    const threadId = extractThreadId(message);
    const chatTitle = normalizeOptionalText(message?.chat?.title || message?.chat?.username || '', 255);
    const username = normalizeOptionalText(message?.from?.username || '', 120);
    const isTopicMessage = message?.is_topic_message === true;

    if (!isAuthorizedSetChatUser(fromId)) {
        void callReleaseNotifierTelegram('sendMessage', {
            chat_id: chatId,
            text: 'Эта команда недоступна для вашего аккаунта.',
            message_thread_id: threadId || undefined
        }).catch(() => {});
        return {
            accepted: false,
            ignored: false,
            reason: 'forbidden'
        };
    }

    if (!chatId || !['group', 'supergroup'].includes(chatType)) {
        if (chatId) {
            void callReleaseNotifierTelegram('sendMessage', {
                chat_id: chatId,
                text: 'Выполните /setchat в нужной группе или в нужной теме форума.',
                message_thread_id: threadId || undefined
            }).catch(() => {});
        }
        return {
            accepted: false,
            ignored: false,
            reason: 'wrong-chat-type'
        };
    }

    if (chatType === 'supergroup' && !threadId && message?.chat?.is_forum !== false) {
        void callReleaseNotifierTelegram('sendMessage', {
            chat_id: chatId,
            text: 'Откройте нужную тему форума и выполните /setchat внутри неё. Тогда анонсы будут приходить именно в эту тему.'
        }).catch(() => {});
        return {
            accepted: false,
            ignored: false,
            reason: 'forum-topic-required'
        };
    }

    const target = await saveReleaseNotifierTarget({
        chatId,
        threadId,
        chatType,
        chatTitle,
        isTopicMessage,
        setByUserId: fromId,
        setByUsername: username
    }, db);

    await setMeta('last_update_id', String(Number(updateId || 0) || 0), db);

    const targetLabel = target.thread_id
        ? `тема ${target.thread_id} в ${target.chat_title || target.chat_id}`
        : `${target.chat_title || target.chat_id}`;

    void callReleaseNotifierTelegram('sendMessage', {
        chat_id: chatId,
        message_thread_id: threadId || undefined,
        text: `Бот живой. Анонсы релизов теперь будут приходить сюда: ${targetLabel}.`
    }).catch(() => {});

    return {
        accepted: true,
        ignored: false,
        reason: null,
        target
    };
}

async function receiveReleaseNotifierWebhook(update, db = pool) {
    const config = getReleaseNotifierConfig();
    if (!config.available) {
        return {
            availability: false,
            accepted: false,
            ignored: true,
            reason: 'unavailable'
        };
    }

    await ensureReleaseNotifierSchema(db);
    const message = update?.message || update?.edited_message;
    if (!message) {
        return {
            availability: true,
            accepted: false,
            ignored: true,
            reason: 'no-message'
        };
    }
    await indexReleaseNotifierMessage(message, db).catch((error) => {
        console.error('Release notifier message indexing failed:', error);
    });

    const text = extractCommandText(message);
    if (!isSetChatCommand(text, config.botUsername)) {
        return {
            availability: true,
            accepted: false,
            ignored: true,
            reason: 'unsupported-command'
        };
    }

    const result = await handleSetChatCommand(message, update?.update_id, db);
    if (Number(update?.update_id || 0) > 0) {
        await setMeta('telegram_update_offset', String(Number(update.update_id) + 1), db);
    }
    return {
        availability: true,
        ...result
    };
}

async function syncReleaseNotifierUpdates(db = pool) {
    if (syncPromise) {
        return syncPromise;
    }

    syncPromise = (async () => {
        const config = getReleaseNotifierConfig();
        if (!config.available) {
            return { availability: false, message: config.message };
        }
        if (!shouldUseReleaseNotifierPolling()) {
            return {
                availability: true,
                synced: false,
                updates: 0
            };
        }

        await ensureReleaseNotifierSchema(db);
        const offsetRaw = await getMeta('telegram_update_offset', db);
        const offset = Math.max(0, Number(offsetRaw || 0) || 0);
        const updates = await callReleaseNotifierTelegram('getUpdates', {
            offset,
            limit: 100,
            timeout: 0,
            allowed_updates: ['message', 'edited_message']
        });

        if (!Array.isArray(updates) || updates.length === 0) {
            return {
                availability: true,
                synced: true,
                updates: 0
            };
        }

        let nextOffset = offset;
        for (const update of updates) {
            await receiveReleaseNotifierWebhook(update, db);
            nextOffset = Math.max(nextOffset, Number(update.update_id || 0) + 1);
            await setMeta('telegram_update_offset', String(nextOffset), db);
        }

        return {
            availability: true,
            synced: true,
            updates: updates.length
        };
    })().finally(() => {
        syncPromise = null;
    });

    return syncPromise;
}

async function syncReleaseNotifierCommands() {
    const config = getReleaseNotifierConfig();
    if (!config.available) {
        return {
            availability: false,
            synced: false,
            message: config.message
        };
    }

    await callReleaseNotifierTelegram('setMyCommands', {
        commands: [
            {
                command: 'setchat',
                description: 'Сохранить текущую группу или тему для анонсов'
            }
        ]
    });

    return {
        availability: true,
        synced: true
    };
}

function startReleaseNotifierPolling() {
    if (pollerStarted) {
        return;
    }
    if (!shouldUseReleaseNotifierPolling()) {
        return;
    }
    pollerStarted = true;

    const run = () => {
        syncReleaseNotifierUpdates().catch((error) => {
            if (String(error?.message || '').includes('getUpdates')) {
                return;
            }
            console.error('Release notifier background sync failed:', error);
        });
    };

    callReleaseNotifierTelegram('deleteWebhook', {
        drop_pending_updates: false
    }).catch((error) => {
        console.error('Failed to switch release notifier bot to polling mode:', error);
    });

    pollerTimer = setInterval(run, RELEASE_NOTIFIER_POLL_INTERVAL_MS);
    if (typeof pollerTimer?.unref === 'function') {
        pollerTimer.unref();
    }
    setTimeout(run, 300);
}

async function resolveReleaseNotifierAdminChat(db = pool) {
    const target = await loadReleaseNotifierTarget(db);
    if (target?.configured && target.chat_id) {
        return {
            chat_id: String(target.chat_id),
            target
        };
    }
    const fallbackTarget = getReleaseNotifierConfig().fallbackTarget;
    if (fallbackTarget?.configured && fallbackTarget.chat_id) {
        return {
            chat_id: String(fallbackTarget.chat_id),
            target: fallbackTarget
        };
    }
    throw createHttpError(400, 'Сначала выполните /setchat в нужной группе или теме.', 'RELEASE_NOTIFIER_TARGET_MISSING');
}

async function listForumTopics(options = {}, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const { chat_id: chatId, target } = await resolveReleaseNotifierAdminChat(db);
    const limit = Math.min(200, Math.max(1, Number(options.limit || 80) || 80));
    const [rows] = await db.query(
        `SELECT *
         FROM release_notifier_topics
         WHERE chat_id = ? AND deleted_at IS NULL
         ORDER BY updated_at DESC, thread_id ASC
         LIMIT ?`,
        [chatId, limit]
    );
    return {
        target,
        topics: rows.map((row) => shapeIndexedTopic(row)).filter(Boolean)
    };
}

async function listTopicMessages(threadId, options = {}, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const { chat_id: chatId, target } = await resolveReleaseNotifierAdminChat(db);
    const normalizedThreadId = Math.max(0, Number(threadId || 0) || 0);
    const limit = Math.min(200, Math.max(1, Number(options.limit || 100) || 100));
    const beforeMessageId = Math.max(0, Number(options.beforeMessageId || 0) || 0);
    const [topicRows] = await db.query(
        `SELECT *
         FROM release_notifier_topics
         WHERE chat_id = ? AND thread_id = ?
         LIMIT 1`,
        [chatId, normalizedThreadId]
    );
    const topic = shapeIndexedTopic(topicRows[0] || {
        chat_id: chatId,
        thread_id: normalizedThreadId,
        topic_title: normalizedThreadId ? `Тема ${normalizedThreadId}` : 'General',
        is_general: normalizedThreadId ? 0 : 1,
        created_at: nowMs(),
        updated_at: nowMs()
    });
    const params = [chatId, normalizedThreadId];
    let predicate = '';
    if (beforeMessageId > 0) {
        predicate = ' AND message_id < ?';
        params.push(beforeMessageId);
    }
    params.push(limit);
    const [rows] = await db.query(
        `SELECT *
         FROM release_notifier_messages
         WHERE chat_id = ? AND thread_id = ? AND deleted_at IS NULL${predicate}
         ORDER BY message_id DESC
         LIMIT ?`,
        params
    );
    return {
        target,
        topic,
        messages: rows.map((row) => shapeIndexedMessage(row)).filter(Boolean)
    };
}

async function deleteTopicMessage(threadId, messageId, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const { chat_id: chatId, target } = await resolveReleaseNotifierAdminChat(db);
    const normalizedThreadId = Math.max(0, Number(threadId || 0) || 0);
    const normalizedMessageId = Math.max(1, Number(messageId || 0) || 0);
    if (!normalizedMessageId) {
        throw createHttpError(400, 'Не указан message_id.', 'RELEASE_NOTIFIER_MESSAGE_ID_REQUIRED');
    }

    await callReleaseNotifierTelegram('deleteMessage', {
        chat_id: chatId,
        message_id: normalizedMessageId
    });

    await db.query(
        `UPDATE release_notifier_messages
         SET deleted_at = ?, updated_at = ?
         WHERE chat_id = ? AND thread_id = ? AND message_id = ?`,
        [nowMs(), nowMs(), chatId, normalizedThreadId, normalizedMessageId]
    );
    await refreshIndexedTopicSummary(chatId, normalizedThreadId, db);

    return {
        deleted: true,
        target,
        thread_id: normalizedThreadId,
        message_id: normalizedMessageId
    };
}

async function deleteForumTopic(threadId, db = pool) {
    await ensureReleaseNotifierSchema(db);
    const { chat_id: chatId, target } = await resolveReleaseNotifierAdminChat(db);
    const normalizedThreadId = Math.max(0, Number(threadId || 0) || 0);
    if (!normalizedThreadId) {
        throw createHttpError(400, 'Нельзя удалить General как тему форума.', 'RELEASE_NOTIFIER_TOPIC_REQUIRED');
    }

    await callReleaseNotifierTelegram('deleteForumTopic', {
        chat_id: chatId,
        message_thread_id: normalizedThreadId
    });

    await db.query(
        `UPDATE release_notifier_topics
         SET deleted_at = ?, updated_at = ?
         WHERE chat_id = ? AND thread_id = ?`,
        [nowMs(), nowMs(), chatId, normalizedThreadId]
    );
    await db.query(
        `UPDATE release_notifier_messages
         SET deleted_at = ?, updated_at = ?
         WHERE chat_id = ? AND thread_id = ?`,
        [nowMs(), nowMs(), chatId, normalizedThreadId]
    );

    return {
        deleted: true,
        target,
        thread_id: normalizedThreadId
    };
}

module.exports = {
    getReleaseNotifierConfig,
    getReleaseNotifierState,
    ensureReleaseNotifierSchema,
    verifyReleaseNotifierWebhookSecret,
    verifyReleaseNotifierAnnounceSecret,
    receiveReleaseNotifierWebhook,
    syncReleaseNotifierUpdates,
    sendReleaseAnnouncement,
    syncReleaseNotifierCommands,
    startReleaseNotifierPolling,
    listForumTopics,
    listTopicMessages,
    deleteTopicMessage,
    deleteForumTopic
};
