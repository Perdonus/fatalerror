import { ensureActiveSiteSession, humanizeError, type SiteAuthResult } from './siteAuth';

const RELEASE_ADMIN_BASE_URL = String(import.meta.env.VITE_SITE_VERIFIED_APPS_BASE_URL || '/basedata/api').replace(/\/+$/, '');

type JsonRecord = Record<string, unknown>;

export type TelegramAdminTopic = {
  chatId: string;
  threadId: number;
  title: string;
  isGeneral: boolean;
  lastMessageId?: number | null;
  lastMessageText?: string | null;
  lastSenderName?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

export type TelegramAdminMessage = {
  chatId: string;
  threadId: number;
  messageId: number;
  senderName: string;
  senderUsername?: string | null;
  text: string;
  kind: string;
  createdAt?: number | null;
  updatedAt?: number | null;
};

function mapTopic(raw: JsonRecord): TelegramAdminTopic {
  return {
    chatId: String(raw.chat_id || ''),
    threadId: Number(raw.thread_id || 0) || 0,
    title: String(raw.topic_title || (Number(raw.thread_id || 0) ? `Тема ${raw.thread_id}` : 'General')),
    isGeneral: Boolean(raw.is_general),
    lastMessageId: Number(raw.last_message_id || 0) || null,
    lastMessageText: typeof raw.last_message_text === 'string' ? raw.last_message_text : null,
    lastSenderName: typeof raw.last_sender_name === 'string' ? raw.last_sender_name : null,
    createdAt: Number(raw.created_at || 0) || null,
    updatedAt: Number(raw.updated_at || 0) || null
  };
}

function mapMessage(raw: JsonRecord): TelegramAdminMessage {
  return {
    chatId: String(raw.chat_id || ''),
    threadId: Number(raw.thread_id || 0) || 0,
    messageId: Number(raw.message_id || 0) || 0,
    senderName: String(raw.sender_name || 'Telegram'),
    senderUsername: typeof raw.sender_username === 'string' ? raw.sender_username : null,
    text: String(raw.message_text || ''),
    kind: String(raw.message_kind || 'TEXT'),
    createdAt: Number(raw.created_at || 0) || null,
    updatedAt: Number(raw.updated_at || 0) || null
  };
}

async function authorizedFetch<T>(path: string, options: RequestInit = {}, map: (json: JsonRecord) => T): Promise<SiteAuthResult<T>> {
  const sessionResult = await ensureActiveSiteSession();
  if (!sessionResult.ok || !sessionResult.data) {
    return sessionResult as SiteAuthResult<T>;
  }

  try {
    const response = await fetch(`${RELEASE_ADMIN_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${sessionResult.data.token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: humanizeError(typeof json?.error === 'string' ? json.error : `HTTP ${response.status}`)
      };
    }
    return { ok: true, data: map(json as JsonRecord) };
  } catch (error) {
    return {
      ok: false,
      error: humanizeError(error)
    };
  }
}

export async function fetchTelegramAdminTopics(limit = 80): Promise<SiteAuthResult<{ topics: TelegramAdminTopic[] }>> {
  return authorizedFetch(`/releases/telegram/admin/topics?limit=${encodeURIComponent(String(limit))}`, { method: 'GET' }, (json) => ({
    topics: Array.isArray(json.topics) ? json.topics.map((entry) => mapTopic(entry as JsonRecord)) : []
  }));
}

export async function fetchTelegramAdminMessages(threadId: number, limit = 100): Promise<SiteAuthResult<{ topic?: TelegramAdminTopic | null; messages: TelegramAdminMessage[] }>> {
  return authorizedFetch(`/releases/telegram/admin/topics/${encodeURIComponent(String(threadId))}/messages?limit=${encodeURIComponent(String(limit))}`, { method: 'GET' }, (json) => ({
    topic: json.topic && typeof json.topic === 'object' ? mapTopic(json.topic as JsonRecord) : null,
    messages: Array.isArray(json.messages) ? json.messages.map((entry) => mapMessage(entry as JsonRecord)) : []
  }));
}

export async function deleteTelegramAdminMessage(threadId: number, messageId: number): Promise<SiteAuthResult<{ deleted: boolean }>> {
  return authorizedFetch(`/releases/telegram/admin/topics/${encodeURIComponent(String(threadId))}/messages/${encodeURIComponent(String(messageId))}`, {
    method: 'DELETE'
  }, (json) => ({
    deleted: Boolean(json.deleted)
  }));
}

export async function deleteTelegramAdminTopic(threadId: number): Promise<SiteAuthResult<{ deleted: boolean }>> {
  return authorizedFetch(`/releases/telegram/admin/topics/${encodeURIComponent(String(threadId))}`, {
    method: 'DELETE'
  }, (json) => ({
    deleted: Boolean(json.deleted)
  }));
}
