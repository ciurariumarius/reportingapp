CREATE TABLE "clients" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Bucharest',
  "currency" TEXT NOT NULL DEFAULT 'RON',
  "locale" TEXT NOT NULL DEFAULT 'ro',
  "ga4_property_id" TEXT,
  "meta_ad_account_id" TEXT,
  "google_ads_sheet_url" TEXT,
  "notes" TEXT,
  "share_token_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monthly_insights" (
  "id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "what_went_well" TEXT NOT NULL DEFAULT '',
  "what_needs_attention" TEXT NOT NULL DEFAULT '',
  "recommended_next_actions" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "monthly_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");
CREATE UNIQUE INDEX "monthly_insights_client_id_month_key" ON "monthly_insights"("client_id", "month");

ALTER TABLE "monthly_insights"
  ADD CONSTRAINT "monthly_insights_client_id_fkey"
  FOREIGN KEY ("client_id")
  REFERENCES "clients"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
