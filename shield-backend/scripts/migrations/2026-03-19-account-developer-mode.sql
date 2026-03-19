ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_developer_mode TINYINT(1) DEFAULT 0 AFTER is_dev_mode;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS developer_mode_activated_at BIGINT DEFAULT NULL AFTER is_developer_mode;

UPDATE users
SET
    is_developer_mode = CASE
        WHEN is_developer_mode = 1 THEN 1
        WHEN is_dev_mode = 1 THEN 1
        ELSE 0
    END,
    developer_mode_activated_at = CASE
        WHEN (is_developer_mode = 1 OR is_dev_mode = 1) AND developer_mode_activated_at IS NULL THEN COALESCE(updated_at, created_at, UNIX_TIMESTAMP() * 1000)
        ELSE developer_mode_activated_at
    END;
