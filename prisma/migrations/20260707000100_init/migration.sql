CREATE TABLE `clients` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `timezone` VARCHAR(191) NOT NULL DEFAULT 'Europe/Bucharest',
  `currency` VARCHAR(191) NOT NULL DEFAULT 'RON',
  `locale` VARCHAR(191) NOT NULL DEFAULT 'ro',
  `ga4_property_id` VARCHAR(191) NULL,
  `meta_ad_account_id` VARCHAR(191) NULL,
  `google_ads_sheet_url` VARCHAR(512) NULL,
  `notes` TEXT NULL,
  `share_token_hash` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `clients_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `monthly_insights` (
  `id` VARCHAR(191) NOT NULL,
  `client_id` VARCHAR(191) NOT NULL,
  `month` VARCHAR(191) NOT NULL,
  `what_went_well` TEXT NOT NULL,
  `what_needs_attention` TEXT NOT NULL,
  `recommended_next_actions` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `monthly_insights_client_id_month_key`(`client_id`, `month`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `monthly_insights`
  ADD CONSTRAINT `monthly_insights_client_id_fkey`
  FOREIGN KEY (`client_id`)
  REFERENCES `clients`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
