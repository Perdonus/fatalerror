import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteTelegramAdminMessage,
  deleteTelegramAdminTopic,
  fetchTelegramAdminMessages,
  fetchTelegramAdminTopics,
  type TelegramAdminMessage,
  type TelegramAdminTopic
} from '../lib/releaseNotifierAdmin';
import { humanizeError } from '../lib/siteAuth';
import '../styles/telegram-admin.css';

function formatStamp(value?: number | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function topicPreview(topic: TelegramAdminTopic) {
  if (topic.lastMessageText) {
    return topic.lastMessageText;
  }
  return topic.isGeneral ? 'Основная лента группы' : 'Сообщений пока нет';
}

export function TelegramAdminPage() {
  const [topics, setTopics] = useState<TelegramAdminTopic[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number>(0);
  const [messages, setMessages] = useState<TelegramAdminMessage[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [busyMessageId, setBusyMessageId] = useState<number | null>(null);
  const [busyTopicDelete, setBusyTopicDelete] = useState(false);
  const [error, setError] = useState('');

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.threadId === activeThreadId) || topics[0] || null,
    [activeThreadId, topics]
  );

  const loadTopics = useCallback(async (preserveSelection = true) => {
    setLoadingTopics(true);
    const result = await fetchTelegramAdminTopics();
    if (!result.ok || !result.data) {
      setError(result.error || 'Не удалось загрузить темы Telegram.');
      setTopics([]);
      setLoadingTopics(false);
      return;
    }
    setError('');
    setTopics(result.data.topics);
    setLoadingTopics(false);
    setActiveThreadId((current) => {
      if (!result.data) {
        return current;
      }
      if (preserveSelection && result.data.topics.some((topic) => topic.threadId === current)) {
        return current;
      }
      return result.data.topics[0]?.threadId ?? 0;
    });
  }, []);

  const loadMessages = useCallback(async (threadId: number) => {
    setLoadingMessages(true);
    const result = await fetchTelegramAdminMessages(threadId);
    if (!result.ok || !result.data) {
      setError(result.error || 'Не удалось загрузить сообщения темы.');
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    setError('');
    setMessages(result.data.messages.slice().reverse());
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    void loadTopics(false);
  }, [loadTopics]);

  useEffect(() => {
    if (!activeTopic) {
      setMessages([]);
      return;
    }
    void loadMessages(activeTopic.threadId);
  }, [activeTopic, loadMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadTopics(true);
      if (activeTopic) {
        void loadMessages(activeTopic.threadId);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeTopic, loadMessages, loadTopics]);

  async function handleDeleteMessage(message: TelegramAdminMessage) {
    setBusyMessageId(message.messageId);
    const result = await deleteTelegramAdminMessage(message.threadId, message.messageId);
    setBusyMessageId(null);
    if (!result.ok) {
      setError(result.error || 'Не удалось удалить сообщение.');
      return;
    }
    await loadMessages(message.threadId);
    await loadTopics(true);
  }

  async function handleDeleteTopic() {
    if (!activeTopic || activeTopic.isGeneral) {
      return;
    }
    setBusyTopicDelete(true);
    const result = await deleteTelegramAdminTopic(activeTopic.threadId);
    setBusyTopicDelete(false);
    if (!result.ok) {
      setError(result.error || 'Не удалось удалить тему.');
      return;
    }
    await loadTopics(false);
  }

  return (
    <div className="page-stack profile-dashboard-shell telegram-admin-shell">
      <section className="profile-dashboard-grid telegram-admin-layout">
        <aside className="content-card profile-nav-card telegram-admin-topics-card">
          <div className="profile-nav-head">
            <strong>Telegram</strong>
          </div>
          <div className="profile-nav-list telegram-admin-topic-list">
            {loadingTopics ? <div className="profile-empty-copy">Загружаем темы…</div> : null}
            {!loadingTopics && topics.length === 0 ? <div className="profile-empty-copy">Темы пока не найдены.</div> : null}
            {topics.map((topic) => (
              <button
                key={`${topic.chatId}-${topic.threadId}`}
                type="button"
                className={`profile-nav-button telegram-admin-topic-button${activeTopic?.threadId === topic.threadId ? ' is-active' : ''}`}
                onClick={() => setActiveThreadId(topic.threadId)}
              >
                <span className="telegram-admin-topic-title">{topic.title}</span>
                <span className="telegram-admin-topic-preview">{topicPreview(topic)}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="profile-dashboard-main telegram-admin-main">
          <article className="content-card profile-panel-card profile-panel-card-featured telegram-admin-header-card">
            <div className="profile-panel-head telegram-admin-header-row">
              <h1>{activeTopic?.title || 'Telegram'}</h1>
              <div className="telegram-admin-actions">
                <button type="button" className="shell-chip" onClick={() => void loadTopics(true)}>Обновить</button>
                {activeTopic && !activeTopic.isGeneral ? (
                  <button type="button" className="shell-chip shell-chip-danger" onClick={() => void handleDeleteTopic()} disabled={busyTopicDelete}>
                    {busyTopicDelete ? 'Удаляем…' : 'Удалить тему'}
                  </button>
                ) : null}
              </div>
            </div>
          </article>

          {error ? <div className="form-message is-error">{humanizeError(error)}</div> : null}

          <div className="telegram-admin-message-list">
            {loadingMessages ? <div className="content-card profile-panel-card"><div className="profile-empty-copy">Загружаем сообщения…</div></div> : null}
            {!loadingMessages && messages.length === 0 ? (
              <div className="content-card profile-panel-card">
                <div className="profile-empty-copy">В этой теме пока нет сообщений.</div>
              </div>
            ) : null}
            {!loadingMessages && messages.map((message) => (
              <article key={`${message.threadId}-${message.messageId}`} className="content-card profile-panel-card telegram-admin-message-card">
                <div className="telegram-admin-message-head">
                  <div>
                    <strong>{message.senderName}</strong>
                    <div className="telegram-admin-message-meta">
                      <span>{formatStamp(message.createdAt)}</span>
                      <span>{message.kind}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shell-chip shell-chip-danger"
                    onClick={() => void handleDeleteMessage(message)}
                    disabled={busyMessageId === message.messageId}
                  >
                    {busyMessageId === message.messageId ? 'Удаляем…' : 'Удалить'}
                  </button>
                </div>
                <div className="telegram-admin-message-body">{message.text || 'Без текста'}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
