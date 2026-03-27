ALTER TABLE verified_apps
    ADD COLUMN IF NOT EXISTS release_tag VARCHAR(120) DEFAULT NULL AFTER release_artifact_url;

ALTER TABLE verified_apps
    ADD COLUMN IF NOT EXISTS release_name VARCHAR(255) DEFAULT NULL AFTER release_tag;

ALTER TABLE verified_apps
    ADD COLUMN IF NOT EXISTS release_asset_name VARCHAR(255) DEFAULT NULL AFTER release_name;

ALTER TABLE verified_apps
    ADD COLUMN IF NOT EXISTS release_published_at BIGINT DEFAULT NULL AFTER release_asset_name;

ALTER TABLE verified_apps
    ADD COLUMN IF NOT EXISTS project_description VARCHAR(1200) DEFAULT NULL AFTER official_site_url;
