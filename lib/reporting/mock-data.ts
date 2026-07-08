import type { Client } from "@prisma/client";
import { formatFriendlyRange, listDates, type DateRange } from "../date-ranges";
import type {
  Ga4Report,
  GoogleAdsReport,
  MetaReport,
  PlatformKpis,
  ReportResponse,
  SourceState
} from "../types/report";

type ReportBlock<T> = {
  state: SourceState;
  report?: T;
};

type ClientConfig = Pick<
  Client,
  | "name"
  | "slug"
  | "timezone"
  | "currency"
  | "locale"
  | "reportType"
  | "ga4PropertyId"
  | "metaAdAccountId"
  | "googleAdsSheetUrl"
>;

export const missingGoogleAds: SourceState = {
  status: "missing_config",
  message: "Lipseste URL-ul Google Sheet pentru Google Ads."
};

export const missingGa4: SourceState = {
  status: "missing_config",
  message: "Lipseste GA4 property ID."
};

export const missingMeta: SourceState = {
  status: "missing_config",
  message: "Lipseste Meta ad account ID."
};

export const mockState: SourceState = {
  status: "mock",
  message: "Date demonstrative V1. Conectorul live se poate activa ulterior."
};

export function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function numericSeed(input: string) {
  let hash = 0;

  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10_000;
  }

  return hash;
}

function sumRows(rows: Array<Record<string, string | number>>, key: string) {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
}

function calcCtr(clicks: number, impressions: number) {
  return impressions ? round((clicks / impressions) * 100) : 0;
}

function calcCpc(spend: number, clicks: number) {
  return clicks ? round(spend / clicks) : 0;
}

function calcCpa(spend: number, conversions: number) {
  return conversions ? round(spend / conversions) : 0;
}

function calcRoas(value: number, spend: number) {
  return spend ? round(value / spend) : 0;
}

export function googleAdsReport(client: ClientConfig, range: DateRange) {
  if (!client.googleAdsSheetUrl) {
    return { state: missingGoogleAds };
  }

  const daily = listDates(range).map((date, index) => {
    const seed = numericSeed(`${client.slug}:gads:${date}`);
    const cost = round(320 + (seed % 160) + index * 2.1);
    const impressions = 5_500 + (seed % 2_400);
    const clicks = 190 + (seed % 95);
    const conversions = round(7 + (seed % 8) + index * 0.08, 1);
    const conversionValue = round(conversions * (330 + (seed % 80)));

    return {
      date,
      cost,
      impressions,
      clicks,
      ctr: calcCtr(clicks, impressions),
      avg_cpc: calcCpc(cost, clicks),
      conversions,
      all_conversions: round(conversions * 1.16, 1),
      conversion_value: conversionValue,
      all_conversion_value: round(conversionValue * 1.12)
    };
  });

  const spend = sumRows(daily, "cost");
  const clicks = sumRows(daily, "clicks");
  const impressions = sumRows(daily, "impressions");
  const conversions = sumRows(daily, "conversions");
  const conversionValue = sumRows(daily, "conversion_value");

  const campaigns = [
    "Search - Brand",
    "Search - Servicii",
    "Performance Max",
    "Remarketing"
  ].map((campaignName, index) => {
    const ratio = [0.2, 0.35, 0.32, 0.13][index];
    const campaignSpend = round(spend * ratio);
    const campaignClicks = Math.round(clicks * ratio);
    const campaignConversions = round(conversions * ratio, 1);
    const value = round(conversionValue * ratio);

    return {
      campaign_id: `10${index + 1}`,
      campaign_name: campaignName,
      campaign_status: index === 3 ? "PAUSED" : "ENABLED",
      cost: campaignSpend,
      impressions: Math.round(impressions * ratio),
      clicks: campaignClicks,
      ctr: calcCtr(campaignClicks, Math.round(impressions * ratio)),
      avg_cpc: calcCpc(campaignSpend, campaignClicks),
      conversions: campaignConversions,
      all_conversions: round(campaignConversions * 1.15, 1),
      cpa: calcCpa(campaignSpend, campaignConversions),
      conversion_value: value,
      roas: calcRoas(value, campaignSpend)
    };
  });

  const conversionsBreakdown = [
    "Lead form submit",
    "Phone click",
    "WhatsApp click",
    "Purchase"
  ].map((conversionActionName, index) => {
    const ratio = [0.46, 0.19, 0.22, 0.13][index];
    const actionConversions = round(conversions * ratio, 1);
    const value = round(conversionValue * ratio);

    return {
      conversion_action_name: conversionActionName,
      conversions: actionConversions,
      all_conversions: round(actionConversions * 1.13, 1),
      conversion_value: value,
      all_conversion_value: round(value * 1.11)
    };
  });

  const devices = ["Mobile", "Desktop", "Tablet"].map((device, index) => {
    const ratio = [0.64, 0.3, 0.06][index];
    const deviceSpend = round(spend * ratio);
    const deviceConversions = round(conversions * ratio, 1);

    return {
      device,
      cost: deviceSpend,
      impressions: Math.round(impressions * ratio),
      clicks: Math.round(clicks * ratio),
      conversions: deviceConversions,
      all_conversions: round(deviceConversions * 1.12, 1),
      cpa: calcCpa(deviceSpend, deviceConversions)
    };
  });

  const locations = ["Bucuresti", "Cluj-Napoca", "Timisoara", "Iasi"].map(
    (location, index) => {
      const ratio = [0.48, 0.2, 0.17, 0.15][index];
      const locationSpend = round(spend * ratio);
      const locationConversions = round(conversions * ratio, 1);

      return {
        location,
        cost: locationSpend,
        impressions: Math.round(impressions * ratio),
        clicks: Math.round(clicks * ratio),
        conversions: locationConversions,
        all_conversions: round(locationConversions * 1.1, 1),
        cpa: calcCpa(locationSpend, locationConversions)
      };
    }
  );

  const kpis: PlatformKpis = {
    spend: round(spend),
    impressions,
    clicks,
    ctr: calcCtr(clicks, impressions),
    cpc: calcCpc(spend, clicks),
    conversions: round(conversions, 1),
    allConversions: round(sumRows(daily, "all_conversions"), 1),
    conversionValue: round(conversionValue),
    cpa: calcCpa(spend, conversions),
    roas: calcRoas(conversionValue, spend)
  };

  return {
    state: mockState,
    report: {
      kpis,
      daily,
      campaigns,
      conversions: conversionsBreakdown,
      devices,
      locations
    } satisfies GoogleAdsReport
  };
}

export function ga4Report(client: ClientConfig, range: DateRange) {
  if (!client.ga4PropertyId) {
    return { state: missingGa4 };
  }

  const daily = listDates(range).map((date, index) => {
    const seed = numericSeed(`${client.slug}:ga4:${date}`);
    const users = 420 + (seed % 180);
    const sessions = Math.round(users * 1.32);
    const engagedSessions = Math.round(sessions * (0.56 + (index % 8) / 100));
    const keyEvents = round(18 + (seed % 16) + index * 0.12, 1);
    const eventCount = Math.round(sessions * 4.7);
    const revenue = round(keyEvents * (210 + (seed % 90)));

    return {
      date,
      users,
      sessions,
      engaged_sessions: engagedSessions,
      engagement_rate: round((engagedSessions / sessions) * 100),
      key_events: keyEvents,
      event_count: eventCount,
      revenue
    };
  });

  const users = sumRows(daily, "users");
  const sessions = sumRows(daily, "sessions");
  const engagedSessions = sumRows(daily, "engaged_sessions");
  const keyEvents = sumRows(daily, "key_events");
  const eventCount = sumRows(daily, "event_count");
  const revenue = sumRows(daily, "revenue");

  const channels = [
    ["google / cpc", 0.42],
    ["facebook / paid", 0.27],
    ["google / organic", 0.19],
    ["direct / none", 0.12]
  ].map(([sourceMedium, ratio]) => ({
    source_medium: sourceMedium,
    users: Math.round(users * Number(ratio)),
    sessions: Math.round(sessions * Number(ratio)),
    key_events: round(keyEvents * Number(ratio), 1),
    revenue: round(revenue * Number(ratio))
  }));

  const events = [
    ["generate_lead", 0.34],
    ["contact_click", 0.24],
    ["phone_click", 0.2],
    ["purchase", 0.13],
    ["newsletter_signup", 0.09]
  ].map(([eventName, ratio]) => ({
    event_name: eventName,
    event_count: Math.round(eventCount * Number(ratio)),
    key_events: round(keyEvents * Number(ratio), 1)
  }));

  const landingPages = [
    ["/", 0.34],
    ["/servicii", 0.26],
    ["/contact", 0.18],
    ["/oferta", 0.14],
    ["/blog/ghid-marketing", 0.08]
  ].map(([landingPage, ratio]) => ({
    landing_page: landingPage,
    sessions: Math.round(sessions * Number(ratio)),
    key_events: round(keyEvents * Number(ratio), 1),
    engagement_rate: round(54 + Number(ratio) * 32)
  }));

  const kpis: PlatformKpis = {
    users,
    sessions,
    engagedSessions,
    engagementRate: round((engagedSessions / sessions) * 100),
    keyEvents: round(keyEvents, 1),
    eventCount,
    revenue: round(revenue)
  };

  return {
    state: mockState,
    report: {
      kpis,
      daily,
      channels,
      events,
      landingPages
    } satisfies Ga4Report
  };
}

export function metaReport(client: ClientConfig, range: DateRange) {
  if (!client.metaAdAccountId) {
    return { state: missingMeta };
  }

  const daily = listDates(range).map((date, index) => {
    const seed = numericSeed(`${client.slug}:meta:${date}`);
    const spend = round(210 + (seed % 130) + index * 1.4);
    const reach = 4_800 + (seed % 2_100);
    const impressions = Math.round(reach * (1.35 + (seed % 18) / 100));
    const linkClicks = 120 + (seed % 75);
    const leads = round(5 + (seed % 8) + index * 0.05, 1);

    return {
      date,
      spend,
      reach,
      impressions,
      link_clicks: linkClicks,
      ctr: calcCtr(linkClicks, impressions),
      cpc: calcCpc(spend, linkClicks),
      leads,
      cost_per_lead: calcCpa(spend, leads)
    };
  });

  const spend = sumRows(daily, "spend");
  const reach = sumRows(daily, "reach");
  const impressions = sumRows(daily, "impressions");
  const clicks = sumRows(daily, "link_clicks");
  const leads = sumRows(daily, "leads");

  const campaigns = [
    "Lead Gen - Prospectare",
    "Traffic - Continut",
    "Remarketing - Oferte"
  ].map((campaignName, index) => {
    const ratio = [0.47, 0.31, 0.22][index];
    const campaignSpend = round(spend * ratio);
    const campaignClicks = Math.round(clicks * ratio);
    const campaignLeads = round(leads * ratio, 1);
    const campaignImpressions = Math.round(impressions * ratio);

    return {
      campaign_name: campaignName,
      spend: campaignSpend,
      reach: Math.round(reach * ratio),
      impressions: campaignImpressions,
      link_clicks: campaignClicks,
      ctr: calcCtr(campaignClicks, campaignImpressions),
      cpc: calcCpc(campaignSpend, campaignClicks),
      leads: campaignLeads,
      cost_per_lead: calcCpa(campaignSpend, campaignLeads)
    };
  });

  const actions = [
    ["lead", 0.42],
    ["onsite_conversion.messaging_conversation_started_7d", 0.26],
    ["link_click", 1],
    ["post_engagement", 3.4]
  ].map(([actionType, ratio]) => ({
    action_type: actionType,
    value:
      actionType === "link_click"
        ? clicks
        : actionType === "post_engagement"
          ? Math.round(clicks * Number(ratio))
          : round(leads * Number(ratio), 1),
    cost_per_action:
      actionType === "link_click"
        ? calcCpc(spend, clicks)
        : calcCpa(spend, leads * Number(ratio))
  }));

  const kpis: PlatformKpis = {
    spend: round(spend),
    reach,
    impressions,
    clicks,
    ctr: calcCtr(clicks, impressions),
    cpc: calcCpc(spend, clicks),
    conversions: round(leads, 1),
    cpa: calcCpa(spend, leads)
  };

  return {
    state: mockState,
    report: {
      kpis,
      daily,
      campaigns,
      actions
    } satisfies MetaReport
  };
}

export function buildMockReportResponse(
  client: ClientConfig,
  range: DateRange
): ReportResponse {
  const googleAds = googleAdsReport(client, range);
  const ga4 = ga4Report(client, range);
  const meta = metaReport(client, range);

  return buildReportResponse({
    client,
    range,
    googleAds,
    ga4,
    meta
  });
}

export function buildReportResponse({
  client,
  range,
  googleAds,
  ga4,
  meta
}: {
  client: ClientConfig;
  range: DateRange;
  googleAds: ReportBlock<GoogleAdsReport>;
  ga4: ReportBlock<Ga4Report>;
  meta: ReportBlock<MetaReport>;
}): ReportResponse {
  const locale = client.locale === "en" ? "en" : "ro";
  const googleSpend = googleAds.report?.kpis.spend ?? 0;
  const metaSpend = meta.report?.kpis.spend ?? 0;
  const googleClicks = googleAds.report?.kpis.clicks ?? 0;
  const metaClicks = meta.report?.kpis.clicks ?? 0;
  const googleConversions = googleAds.report?.kpis.conversions ?? 0;
  const metaConversions = meta.report?.kpis.conversions ?? 0;

  return {
    client: {
      name: client.name,
      slug: client.slug,
      currency: client.currency,
      timezone: client.timezone,
      locale,
      reportType: client.reportType === "ecommerce" ? "ecommerce" : "lead"
    },
    dateRange: range,
    displayPeriod: formatFriendlyRange(range, locale),
    lastUpdatedAt: new Date().toISOString(),
    overview: {
      totalSpend: round(googleSpend + metaSpend),
      totalClicks: googleClicks + metaClicks,
      platformReportedConversions: round(googleConversions + metaConversions, 1),
      websiteSessions: ga4.report?.kpis.sessions ?? 0,
      websiteKeyEvents: ga4.report?.kpis.keyEvents ?? 0
    },
    sources: {
      googleAds: googleAds.state,
      ga4: ga4.state,
      meta: meta.state
    },
    sourceSummary: [
      { key: "googleAds", label: "Google Ads", ...googleAds.state },
      { key: "ga4", label: "Website / GA4", ...ga4.state },
      { key: "meta", label: "Meta Ads", ...meta.state }
    ],
    googleAds: googleAds.report,
    ga4: ga4.report,
    meta: meta.report
  };
}
