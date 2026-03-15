CREATE DATABASE IF NOT EXISTS shield_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shield_auth;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    is_premium TINYINT(1) DEFAULT 0,
    premium_expires_at BIGINT DEFAULT NULL,
    is_dev_mode TINYINT(1) DEFAULT 0,
    last_login_at BIGINT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(120) NOT NULL,
    refresh_token_hash VARCHAR(64) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    last_seen_at BIGINT NOT NULL,
    refresh_expires_at BIGINT NOT NULL,
    revoked_at BIGINT DEFAULT NULL,
    revoke_reason VARCHAR(64) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(64) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_auth_sessions_user_id (user_id),
    INDEX idx_auth_sessions_refresh_expires_at (refresh_expires_at),
    INDEX idx_auth_sessions_revoked_at (revoked_at)
);

CREATE TABLE IF NOT EXISTS email_auth_challenges (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,
    purpose ENUM('REGISTER', 'LOGIN') NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    payload_json LONGTEXT DEFAULT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    consumed_at BIGINT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email_auth_email_purpose (email, purpose),
    INDEX idx_email_auth_expires_at (expires_at),
    INDEX idx_email_auth_consumed_at (consumed_at)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    consumed_at BIGINT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_expires_at (expires_at),
    INDEX idx_password_reset_consumed_at (consumed_at)
);

CREATE TABLE IF NOT EXISTS login_attempts (
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    failed_count INT NOT NULL DEFAULT 0,
    first_failed_at BIGINT NOT NULL,
    last_failed_at BIGINT NOT NULL,
    locked_until BIGINT DEFAULT NULL,
    PRIMARY KEY (email, ip_address),
    INDEX idx_login_attempts_locked_until (locked_until)
);

CREATE TABLE IF NOT EXISTS scan_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    scan_type ENUM('QUICK','FULL','SELECTIVE') NOT NULL,
    started_at BIGINT NOT NULL,
    completed_at BIGINT NOT NULL,
    total_scanned INT DEFAULT 0,
    threats_found INT DEFAULT 0,
    threats_json LONGTEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_scan_sessions_user_started (user_id, started_at)
);

CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    purchase_token VARCHAR(500),
    amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    purchased_at BIGINT NOT NULL,
    expires_at BIGINT DEFAULT NULL,
    status ENUM('ACTIVE','EXPIRED','CANCELLED') DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_purchases_user_status (user_id, status)
);

CREATE TABLE IF NOT EXISTS threat_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255),
    sha256 VARCHAR(64),
    threat_name VARCHAR(255),
    severity VARCHAR(20),
    detection_engine VARCHAR(100),
    reported_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_threat_reports_user_reported (user_id, reported_at)
);

CREATE TABLE IF NOT EXISTS deep_scan_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    package_name VARCHAR(255) DEFAULT NULL,
    app_name VARCHAR(255) DEFAULT NULL,
    sha256 VARCHAR(64) DEFAULT NULL,
    scan_mode ENUM('FULL','SELECTIVE','APK') NOT NULL DEFAULT 'FULL',
    status ENUM('QUEUED','AWAITING_UPLOAD','RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED',
    verdict VARCHAR(20) DEFAULT NULL,
    risk_score INT NOT NULL DEFAULT 0,
    vt_status VARCHAR(32) DEFAULT NULL,
    vt_malicious INT DEFAULT NULL,
    vt_suspicious INT DEFAULT NULL,
    vt_harmless INT DEFAULT NULL,
    request_json LONGTEXT NOT NULL,
    summary_json LONGTEXT DEFAULT NULL,
    findings_json LONGTEXT DEFAULT NULL,
    error_message VARCHAR(255) DEFAULT NULL,
    created_at BIGINT NOT NULL,
    started_at BIGINT DEFAULT NULL,
    completed_at BIGINT DEFAULT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_deep_scan_jobs_user_created (user_id, created_at),
    INDEX idx_deep_scan_jobs_user_mode_created (user_id, scan_mode, created_at),
    INDEX idx_deep_scan_jobs_status_created (status, created_at),
    INDEX idx_deep_scan_jobs_sha256 (sha256)
);

CREATE TABLE IF NOT EXISTS deep_scan_daily_usage (
    user_id VARCHAR(36) NOT NULL,
    usage_date CHAR(10) NOT NULL,
    scan_mode ENUM('FULL','SELECTIVE','APK') NOT NULL,
    launches_count INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, usage_date, scan_mode),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_deep_scan_daily_usage_user_date (user_id, usage_date)
);

CREATE TABLE IF NOT EXISTS desktop_scan_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    platform ENUM('WINDOWS','LINUX') NOT NULL,
    mode ENUM('QUICK','FULL','SELECTIVE','ARTIFACT','RESIDENT_EVENT','ON_DEMAND') NOT NULL DEFAULT 'FULL',
    artifact_kind VARCHAR(32) DEFAULT 'UNKNOWN',
    target_name VARCHAR(255) DEFAULT NULL,
    target_path VARCHAR(700) DEFAULT NULL,
    sha256 VARCHAR(64) DEFAULT NULL,
    status ENUM('QUEUED','AWAITING_UPLOAD','RUNNING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
    verdict VARCHAR(20) DEFAULT NULL,
    risk_score INT NOT NULL DEFAULT 0,
    surfaced_findings INT NOT NULL DEFAULT 0,
    hidden_findings INT NOT NULL DEFAULT 0,
    artifact_required TINYINT(1) NOT NULL DEFAULT 0,
    request_json LONGTEXT NOT NULL,
    summary_json LONGTEXT DEFAULT NULL,
    findings_json LONGTEXT DEFAULT NULL,
    full_report_json LONGTEXT DEFAULT NULL,
    error_message VARCHAR(255) DEFAULT NULL,
    created_at BIGINT NOT NULL,
    started_at BIGINT DEFAULT NULL,
    completed_at BIGINT DEFAULT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_desktop_scan_jobs_user_created (user_id, created_at),
    INDEX idx_desktop_scan_jobs_status_created (status, created_at),
    INDEX idx_desktop_scan_jobs_user_platform_mode (user_id, platform, mode, created_at),
    INDEX idx_desktop_scan_jobs_sha256 (sha256)
);

CREATE TABLE IF NOT EXISTS desktop_scan_artifacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(700) NOT NULL,
    sha256 VARCHAR(64) DEFAULT NULL,
    size_bytes BIGINT DEFAULT NULL,
    mime_type VARCHAR(120) DEFAULT NULL,
    created_at BIGINT NOT NULL,
    uploaded_at BIGINT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES desktop_scan_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_desktop_scan_artifacts_job (job_id, uploaded_at),
    INDEX idx_desktop_scan_artifacts_user (user_id, uploaded_at),
    INDEX idx_desktop_scan_artifacts_sha256 (sha256)
);

CREATE TABLE IF NOT EXISTS release_artifacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('android','windows','linux','shell','site') NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'main',
    version VARCHAR(64) NOT NULL,
    sha256 VARCHAR(128) DEFAULT '',
    download_url VARCHAR(700) NOT NULL,
    install_command VARCHAR(700) DEFAULT NULL,
    file_name VARCHAR(255) DEFAULT NULL,
    notes_json LONGTEXT DEFAULT NULL,
    metadata_json LONGTEXT DEFAULT NULL,
    is_latest TINYINT(1) NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_release_artifacts_platform_latest (platform, is_latest, updated_at)
);

CREATE TABLE IF NOT EXISTS desktop_scan_jobs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    platform ENUM('WINDOWS','LINUX') NOT NULL,
    scan_mode ENUM('ON_DEMAND','SELECTIVE','ARTIFACT','RESIDENT_EVENT') NOT NULL DEFAULT 'ON_DEMAND',
    artifact_kind VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    target_name VARCHAR(255) DEFAULT NULL,
    target_path VARCHAR(512) DEFAULT NULL,
    sha256 VARCHAR(64) DEFAULT NULL,
    status ENUM('QUEUED','AWAITING_UPLOAD','RUNNING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
    verdict VARCHAR(20) DEFAULT NULL,
    risk_score INT NOT NULL DEFAULT 0,
    user_summary VARCHAR(255) DEFAULT NULL,
    request_json LONGTEXT NOT NULL,
    summary_json LONGTEXT DEFAULT NULL,
    findings_json LONGTEXT DEFAULT NULL,
    raw_findings_json LONGTEXT DEFAULT NULL,
    full_report_markdown LONGTEXT DEFAULT NULL,
    error_message VARCHAR(255) DEFAULT NULL,
    created_at BIGINT NOT NULL,
    started_at BIGINT DEFAULT NULL,
    completed_at BIGINT DEFAULT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_desktop_scan_jobs_user_created (user_id, created_at),
    INDEX idx_desktop_scan_jobs_user_platform_created (user_id, platform, created_at),
    INDEX idx_desktop_scan_jobs_status_created (status, created_at),
    INDEX idx_desktop_scan_jobs_sha256 (sha256)
);

CREATE TABLE IF NOT EXISTS desktop_scan_artifacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    original_name VARCHAR(255) DEFAULT NULL,
    stored_name VARCHAR(255) DEFAULT NULL,
    mime_type VARCHAR(120) DEFAULT NULL,
    size_bytes BIGINT DEFAULT NULL,
    sha256 VARCHAR(64) DEFAULT NULL,
    storage_path VARCHAR(512) NOT NULL,
    deleted_at BIGINT DEFAULT NULL,
    created_at BIGINT NOT NULL,
    INDEX idx_desktop_scan_artifacts_job (job_id),
    INDEX idx_desktop_scan_artifacts_sha256 (sha256)
);

CREATE TABLE IF NOT EXISTS release_artifacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('ANDROID','WINDOWS','LINUX','LINUX_SHELL','WEBSITE') NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'stable',
    version VARCHAR(64) NOT NULL,
    artifact_name VARCHAR(255) NOT NULL,
    sha256 VARCHAR(128) DEFAULT NULL,
    download_url VARCHAR(1024) DEFAULT NULL,
    install_command LONGTEXT DEFAULT NULL,
    page_url VARCHAR(255) DEFAULT NULL,
    is_latest TINYINT(1) NOT NULL DEFAULT 1,
    published_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_release_artifacts_platform_channel_latest (platform, channel, is_latest, published_at),
    INDEX idx_release_artifacts_published_at (published_at)
);
