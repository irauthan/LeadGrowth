-- Meta Marketing API Schema Migration Script
-- Database: leadgrowth

-- 1. campaigns table additions
ALTER TABLE `campaigns`
  ADD COLUMN `external_campaign_id` VARCHAR(64) NULL,
  ADD COLUMN `ad_account_id` VARCHAR(64) NULL,
  ADD COLUMN `objective` VARCHAR(50) NULL,
  ADD INDEX `idx_ext_campaign` (`workspace_id`, `external_campaign_id`);

-- 2. leads table additions
ALTER TABLE `leads`
  ADD COLUMN `external_lead_id` VARCHAR(64) NULL,
  ADD COLUMN `form_id` VARCHAR(64) NULL,
  ADD COLUMN `ad_id` VARCHAR(64) NULL,
  ADD COLUMN `ad_name` VARCHAR(100) NULL,
  ADD COLUMN `adset_id` VARCHAR(64) NULL,
  ADD COLUMN `adset_name` VARCHAR(100) NULL,
  ADD COLUMN `is_organic` TINYINT(1) DEFAULT 0,
  ADD COLUMN `raw_form_data` TEXT NULL,
  ADD INDEX `idx_ext_lead` (`workspace_id`, `external_lead_id`);

-- 3. ad_metrics table additions
ALTER TABLE `ad_metrics`
  ADD COLUMN `reach` INT DEFAULT 0,
  ADD COLUMN `frequency` DECIMAL(6,2) DEFAULT 1.00,
  ADD COLUMN `cpm` DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN `cpc` DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN `ctr` DECIMAL(6,2) DEFAULT 0.00,
  ADD COLUMN `leads_count` INT DEFAULT 0,
  ADD INDEX `idx_ad_metrics_ws_camp_date` (`workspace_id`, `campaign_id`, `date`),
  ADD INDEX `idx_ad_metrics_ws_date` (`workspace_id`, `date`);
