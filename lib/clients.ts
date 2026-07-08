import type { Client, MonthlyInsight } from "@prisma/client";
import { emptyToNull, type ClientPayload } from "./validation";

export function clientDataFromPayload(payload: ClientPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    active: payload.active,
    timezone: payload.timezone,
    currency: payload.currency.toUpperCase(),
    locale: payload.locale,
    reportType: payload.reportType,
    websiteUrl: emptyToNull(payload.websiteUrl),
    logoUrl: emptyToNull(payload.logoUrl),
    ga4PropertyId: emptyToNull(payload.ga4PropertyId),
    metaAdAccountId: emptyToNull(payload.metaAdAccountId),
    googleAdsSheetUrl: emptyToNull(payload.googleAdsSheetUrl),
    notes: emptyToNull(payload.notes)
  };
}

export function publicClient(client: Client & { monthlyInsights?: MonthlyInsight[] }) {
  return {
    id: client.id,
    name: client.name,
    slug: client.slug,
    active: client.active,
    timezone: client.timezone,
    currency: client.currency,
    locale: client.locale,
    reportType: client.reportType,
    websiteUrl: client.websiteUrl,
    logoUrl: client.logoUrl,
    ga4PropertyId: client.ga4PropertyId,
    metaAdAccountId: client.metaAdAccountId,
    googleAdsSheetUrl: client.googleAdsSheetUrl,
    notes: client.notes,
    hasShareToken: Boolean(client.shareTokenHash),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    monthlyInsights: client.monthlyInsights?.map((insight) => ({
      id: insight.id,
      month: insight.month,
      whatWentWell: insight.whatWentWell,
      whatNeedsAttention: insight.whatNeedsAttention,
      recommendedNextActions: insight.recommendedNextActions
    }))
  };
}
