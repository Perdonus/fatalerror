CREATE TABLE IF NOT EXISTS support_chats (
    id VARCHAR(36) PRIMARY KEY,
    ticket_number BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
    telegram_chat_id VARCHAR(64) DEFAULT NULL,
    telegram_thread_id BIGINT DEFAULT NULL,
    telegram_topic_name VARCHAR(255) DEFAULT NULL,
    last_message_from ENUM('client','support','system') NOT NULL DEFAULT 'client',
    last_message_at BIGINT DEFAULT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    closed_at BIGINT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_chats_user_updated (user_id, updated_at),
    INDEX idx_support_chats_status_updated (status, updated_at),
    UNIQUE KEY uniq_support_telegram_thread (telegram_chat_id, telegram_thread_id)
);

CREATE TABLE IF NOT EXISTS support_chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    sender_role ENUM('client','support','system') NOT NULL,
    sender_name VARCHAR(120) DEFAULT NULL,
    message_text LONGTEXT NOT NULL,
    source ENUM('web','telegram','system') NOT NULL DEFAULT 'web',
    telegram_chat_id VARCHAR(64) DEFAULT NULL,
    telegram_thread_id BIGINT DEFAULT NULL,
    telegram_message_id BIGINT DEFAULT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_chat_messages_chat_created (chat_id, created_at),
    UNIQUE KEY uniq_support_chat_telegram_message (telegram_chat_id, telegram_message_id)
);

CREATE TABLE IF NOT EXISTS support_chat_meta (
    meta_key VARCHAR(120) PRIMARY KEY,
    meta_value LONGTEXT DEFAULT NULL,
    updated_at BIGINT NOT NULL
);
