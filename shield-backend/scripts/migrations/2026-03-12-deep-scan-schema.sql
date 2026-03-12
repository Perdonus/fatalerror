ALTER TABLE deep_scan_jobs
    ADD COLUMN IF NOT EXISTS scan_mode ENUM('FULL','SELECTIVE','APK') NOT NULL DEFAULT 'FULL' AFTER sha256;

ALTER TABLE deep_scan_jobs
    MODIFY COLUMN status ENUM('QUEUED','AWAITING_UPLOAD','RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED';

CREATE INDEX IF NOT EXISTS idx_deep_scan_jobs_user_mode_created
    ON deep_scan_jobs (user_id, scan_mode, created_at);

CREATE TABLE IF NOT EXISTS deep_scan_daily_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    usage_date CHAR(10) NOT NULL,
    scan_mode ENUM('FULL','SELECTIVE','APK') NOT NULL,
    launches_count INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    UNIQUE KEY uniq_deep_scan_daily_usage (user_id, usage_date, scan_mode),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_deep_scan_daily_usage_user_date (user_id, usage_date)
);
