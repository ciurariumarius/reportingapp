import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getServerSetting } from "../app-settings";
import type { DateRange } from "../date-ranges";
import type { Ga4Report, PlatformKpis, SourceState } from "../types/report";
import { missingGa4, round } from "./mock-data";

type Ga4Result = {
  state: SourceState;
  report?: Ga4Report;
};

const readyState: SourceState = {
  status: "ready",
  message: "Date GA4 live prin Google Analytics Data API."
};

const emptyState: SourceState = {
  status: "empty",
  message: "GA4 nu a returnat date pentru intervalul selectat."
};

function credentialsState(): SourceState {
  return {
    status: "missing_config",
    message:
      "Lipsesc credentialele GA4. Configureaza GA4_CLIENT_EMAIL si GA4_PRIVATE_KEY."
  };
}

function normalizePropertyId(propertyId: string) {
  const trimmed = propertyId.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}

async function getPrivateKey() {
  return (await getServerSetting("GA4_PRIVATE_KEY"))?.replace(/\\n/g, "\n");
}

async function createClient() {
  const clientEmail = await getServerSetting("GA4_CLIENT_EMAIL");
  const privateKey = await getPrivateKey();

  if (!clientEmail || !privateKey) {
    return null;
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey
    }
  });
}

function metric(row: unknown, index: number) {
  const metricValues = (row as { metricValues?: Array<{ value?: string | null }> })
    .metricValues;
  return Number(metricValues?.[index]?.value ?? 0);
}

function dimension(row: unknown, index: number) {
  const dimensionValues = (
    row as { dimensionValues?: Array<{ value?: string | null }> }
  ).dimensionValues;
  return dimensionValues?.[index]?.value ?? "";
}

function formatGaDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function calcEngagementRate(engagedSessions: number, sessions: number) {
  return sessions ? round((engagedSessions / sessions) * 100) : 0;
}

function safeMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/permission|denied|credentials|auth|unauthenticated/i.test(error.message)) {
      return "GA4 nu poate fi accesat. Verifică permisiunile service account-ului pe proprietatea GA4.";
    }

    if (/not found|property/i.test(error.message)) {
      return "Proprietatea GA4 nu a fost gasita sau ID-ul este incorect.";
    }
  }

  return "GA4 nu a putut fi încărcat momentan.";
}

export async function fetchGa4Report(
  ga4PropertyId: string | null,
  range: DateRange
): Promise<Ga4Result> {
  if (!ga4PropertyId) {
    return { state: missingGa4 };
  }

  const analyticsClient = await createClient();

  if (!analyticsClient) {
    return { state: credentialsState() };
  }

  const property = normalizePropertyId(ga4PropertyId);
  const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];

  try {
    const [overviewResponse, dailyResponse, channelsResponse, eventsResponse, landingResponse] =
      await Promise.all([
        analyticsClient.runReport({
          property,
          dateRanges,
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "engagedSessions" },
            { name: "eventCount" },
            { name: "keyEvents" },
            { name: "totalRevenue" }
          ]
        }),
        analyticsClient.runReport({
          property,
          dateRanges,
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "engagedSessions" },
            { name: "engagementRate" },
            { name: "eventCount" },
            { name: "keyEvents" },
            { name: "totalRevenue" }
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }]
        }),
        analyticsClient.runReport({
          property,
          dateRanges,
          dimensions: [{ name: "sessionSourceMedium" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "keyEvents" },
            { name: "totalRevenue" }
          ],
          limit: 20,
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
        }),
        analyticsClient.runReport({
          property,
          dateRanges,
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }, { name: "keyEvents" }],
          limit: 30,
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }]
        }),
        analyticsClient.runReport({
          property,
          dateRanges,
          dimensions: [{ name: "landingPagePlusQueryString" }],
          metrics: [
            { name: "sessions" },
            { name: "keyEvents" },
            { name: "engagementRate" }
          ],
          limit: 20,
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
        })
      ]);

    const overviewRow = overviewResponse[0].rows?.[0];

    if (!overviewRow) {
      return { state: emptyState };
    }

    const users = metric(overviewRow, 0);
    const sessions = metric(overviewRow, 1);
    const engagedSessions = metric(overviewRow, 2);
    const eventCount = metric(overviewRow, 3);
    const keyEvents = metric(overviewRow, 4);
    const revenue = metric(overviewRow, 5);

    const daily =
      dailyResponse[0].rows?.map((row) => ({
        date: formatGaDate(dimension(row, 0)),
        users: metric(row, 0),
        sessions: metric(row, 1),
        engaged_sessions: metric(row, 2),
        engagement_rate: round(metric(row, 3) * 100),
        event_count: metric(row, 4),
        key_events: metric(row, 5),
        revenue: round(metric(row, 6))
      })) ?? [];

    const channels =
      channelsResponse[0].rows?.map((row) => ({
        source_medium: dimension(row, 0) || "(not set)",
        users: metric(row, 0),
        sessions: metric(row, 1),
        key_events: metric(row, 2),
        revenue: round(metric(row, 3))
      })) ?? [];

    const events =
      eventsResponse[0].rows?.map((row) => ({
        event_name: dimension(row, 0) || "(not set)",
        event_count: metric(row, 0),
        key_events: metric(row, 1)
      })) ?? [];

    const landingPages =
      landingResponse[0].rows?.map((row) => ({
        landing_page: dimension(row, 0) || "(not set)",
        sessions: metric(row, 0),
        key_events: metric(row, 1),
        engagement_rate: round(metric(row, 2) * 100)
      })) ?? [];

    const kpis: PlatformKpis = {
      users,
      sessions,
      engagedSessions,
      engagementRate: calcEngagementRate(engagedSessions, sessions),
      eventCount,
      keyEvents,
      revenue: round(revenue)
    };

    return {
      state: readyState,
      report: {
        kpis,
        daily,
        channels,
        events,
        landingPages
      }
    };
  } catch (error) {
    console.error("GA4 fetch failed", error);

    return {
      state: {
        status: "error",
        message: safeMessage(error)
      }
    };
  }
}

export async function testGa4Connection(ga4PropertyId: string | null) {
  if (!ga4PropertyId) {
    return { ok: false, state: missingGa4 };
  }

  const analyticsClient = await createClient();

  if (!analyticsClient) {
    return { ok: false, state: credentialsState() };
  }

  try {
    await analyticsClient.runReport({
      property: normalizePropertyId(ga4PropertyId),
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }],
      limit: 1
    });

    return {
      ok: true,
      state: {
        status: "ready" as const,
        message: "Conexiunea GA4 este valida."
      }
    };
  } catch (error) {
    console.error("GA4 connection test failed", error);

    return {
      ok: false,
      state: {
        status: "error" as const,
        message: safeMessage(error)
      }
    };
  }
}
