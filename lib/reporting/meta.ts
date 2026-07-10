import "server-only";

import { createHmac } from "node:crypto";
import { getServerSetting } from "../app-settings";
import type { DateRange } from "../date-ranges";
import type { MetaReport, PlatformKpis, ReportType, SourceState } from "../types/report";
import { missingMeta, round } from "./mock-data";

type MetaResult = {
  state: SourceState;
  report?: MetaReport;
};

type MetaConfig = {
  accessToken: string;
  apiVersion: string;
  appSecret?: string;
};

type GraphParams = Record<string, number | string | undefined>;

type MetaActionMetric = {
  action_type?: string;
  value?: number | string;
};

type MetaInsightRow = {
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  reach?: string;
  impressions?: string;
  clicks?: string;
  inline_link_clicks?: string;
  outbound_clicks?: MetaActionMetric[];
  unique_outbound_clicks?: MetaActionMetric[];
  ctr?: string;
  cpc?: string;
  cost_per_outbound_click?: MetaActionMetric[];
  actions?: MetaActionMetric[];
  action_values?: MetaActionMetric[];
  cost_per_action_type?: MetaActionMetric[];
  purchase_roas?: MetaActionMetric[];
};

type MetaCustomConversionRow = {
  id?: string;
  name?: string;
};

type MetaGraphResponse<T> = {
  data?: T[];
  paging?: {
    next?: string;
  };
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
};

const metaAttributionWindow = "1d_click";

const readyState: SourceState = {
  status: "ready",
  message: "Date Meta Ads live prin Ads Insights API."
};

const emptyState: SourceState = {
  status: "empty",
  message: "Meta Ads nu a returnat date pentru intervalul selectat."
};

function credentialsState(): SourceState {
  return {
    status: "missing_config",
    message: "Lipseste META_ACCESS_TOKEN pentru Meta Ads."
  };
}

export function normalizeMetaAdAccountId(value: string | null | undefined) {
  const compact = value?.trim().replace(/\s+/g, "");

  if (!compact) {
    return null;
  }

  return compact.toLowerCase().startsWith("act_") ? compact : `act_${compact}`;
}

async function getMetaConfig(): Promise<MetaConfig | null> {
  const accessToken = (await getServerSetting("META_ACCESS_TOKEN"))?.trim();

  if (!accessToken) {
    return null;
  }

  const rawVersion = (await getServerSetting("META_API_VERSION"))?.trim() || "v23.0";
  const apiVersion = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;
  const appSecret = (await getServerSetting("META_APP_SECRET"))?.trim();

  return {
    accessToken,
    apiVersion,
    ...(appSecret ? { appSecret } : {})
  };
}

function appSecretProof(config: MetaConfig) {
  if (!config.appSecret) {
    return undefined;
  }

  return createHmac("sha256", config.appSecret)
    .update(config.accessToken)
    .digest("hex");
}

function graphUrl(path: string, params: GraphParams, config: MetaConfig) {
  const url = new URL(
    `https://graph.facebook.com/${config.apiVersion}/${path.replace(/^\/+/, "")}`
  );

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("access_token", config.accessToken);

  const proof = appSecretProof(config);
  if (proof) {
    url.searchParams.set("appsecret_proof", proof);
  }

  return url.toString();
}

class MetaApiError extends Error {
  code?: number;
  type?: string;

  constructor(error?: MetaGraphResponse<unknown>["error"]) {
    super(error?.message || "Meta Ads API error");
    this.code = error?.code;
    this.type = error?.type;
  }
}

export async function fetchMetaGraphPages<T>(
  path: string,
  params: GraphParams,
  config: MetaConfig
) {
  const rows: T[] = [];
  let nextUrl: string | null = graphUrl(path, params, config);
  let pageCount = 0;

  while (nextUrl && pageCount < 50) {
    pageCount += 1;
    const response = await fetch(nextUrl, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as MetaGraphResponse<T>;

    if (!response.ok) {
      throw new MetaApiError(data.error);
    }

    if (Array.isArray(data.data)) {
      rows.push(...data.data);
    }

    nextUrl = data.paging?.next ?? null;
  }

  return rows;
}

function safeMessage(error: unknown) {
  if (error instanceof MetaApiError) {
    const message = error.message.toLowerCase();

    if (error.code === 190 || /token|oauth|session/.test(message)) {
      return "Tokenul Meta Ads este invalid sau expirat.";
    }

    if (/permission|permissions|access|authorize|capability/.test(message)) {
      return "Meta Ads nu poate fi accesat. Verifică permisiunile tokenului și accesul la ad account.";
    }

    if (/unsupported|get request|object|account/.test(message)) {
      return "Meta ad account ID este incorect sau nu este accesibil cu tokenul curent.";
    }
  }

  return "Meta Ads nu a putut fi încărcat momentan.";
}

function number(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

export function isPrimaryMetaAction(actionType: string, reportType: ReportType) {
  const type = actionType.toLowerCase();

  if (isCustomConversionAction(type)) {
    return true;
  }

  if (reportType === "ecommerce") {
    return type.includes("purchase");
  }

  return (
    type.includes("lead") ||
    type.includes("messaging_conversation") ||
    type.includes("onsite_conversion.messaging") ||
    type.includes("contact")
  );
}

function isCustomConversionAction(actionType: string) {
  return (
    actionType.includes("custom_conversion") ||
    /(^|\.)custom(\.|$)/.test(actionType) ||
    actionType.includes("fb_pixel_custom")
  );
}

function sumPrimaryActions(
  actions: MetaActionMetric[] | undefined,
  reportType: ReportType
) {
  return round(
    (actions ?? []).reduce((sum, action) => {
      if (!action.action_type || !isPrimaryMetaAction(action.action_type, reportType)) {
        return sum;
      }

      return sum + number(action.value);
    }, 0),
    2
  );
}

function metricByAction(actions: MetaActionMetric[] | undefined) {
  const map = new Map<string, number>();

  for (const action of actions ?? []) {
    if (!action.action_type) continue;

    map.set(action.action_type, (map.get(action.action_type) ?? 0) + number(action.value));
  }

  return map;
}

function actionMetricValue(
  actions: MetaActionMetric[] | undefined,
  preferredTypes: string[] = []
) {
  const byAction = metricByAction(actions);

  for (const type of preferredTypes) {
    const value = byAction.get(type);
    if (value) {
      return value;
    }
  }

  return [...byAction.values()][0] ?? 0;
}

function landingPageViews(actions: MetaActionMetric[] | undefined) {
  return round(
    [...metricByAction(actions).entries()].reduce((sum, [actionType, value]) => {
      return actionType.toLowerCase().includes("landing_page_view")
        ? sum + value
        : sum;
    }, 0),
    2
  );
}

function rowSpend(rows: Array<Record<string, string | number>>) {
  return round(rows.reduce((sum, row) => sum + Number(row.spend ?? 0), 0));
}

function mapPerformanceRow(row: MetaInsightRow, reportType: ReportType) {
  const spend = round(number(row.spend));
  const impressions = Math.round(number(row.impressions));
  const outboundClicks = Math.round(
    actionMetricValue(row.outbound_clicks, ["outbound_click"]) ||
      number(row.inline_link_clicks) ||
      number(row.clicks)
  );
  const uniqueOutboundClicks = Math.round(
    actionMetricValue(row.unique_outbound_clicks, ["outbound_click"])
  );
  const costPerOutboundClick =
    actionMetricValue(row.cost_per_outbound_click, ["outbound_click"]) ||
    calcCpc(spend, outboundClicks);
  const conversions = sumPrimaryActions(row.actions, reportType);
  const lpViews = landingPageViews(row.actions);
  const conversionValue =
    reportType === "ecommerce" ? sumPrimaryActions(row.action_values, "ecommerce") : 0;

  return {
    ...(row.date_start ? { date: row.date_start } : {}),
    ...(row.campaign_id ? { campaign_id: row.campaign_id } : {}),
    ...(row.campaign_name ? { campaign_name: row.campaign_name } : {}),
    spend,
    reach: Math.round(number(row.reach)),
    impressions,
    link_clicks: outboundClicks,
    outbound_clicks: outboundClicks,
    unique_outbound_clicks: uniqueOutboundClicks,
    landing_page_views: lpViews,
    ctr: calcCtr(outboundClicks, impressions),
    cpc: round(costPerOutboundClick),
    leads: conversions,
    cost_per_lead: calcCpa(spend, conversions),
    conversion_value: round(conversionValue),
    roas: calcRoas(conversionValue, spend)
  };
}

function customConversionId(actionType: string) {
  return (
    actionType.match(/(?:custom_conversion|custom)[._]?([a-z0-9_-]+)/i)?.[1] ??
    actionType.match(/(\d{6,})$/)?.[1] ??
    null
  );
}

function formatActionName(
  actionType: string,
  customConversionNames: Map<string, string>
) {
  const customId = customConversionId(actionType);

  if (customId && customConversionNames.has(customId)) {
    return customConversionNames.get(customId) ?? actionType;
  }

  if (customId && isCustomConversionAction(actionType.toLowerCase())) {
    if (!/^\d+$/.test(customId)) {
      return customId.toUpperCase();
    }

    return `Custom conversion ${customId}`;
  }

  if (actionType.toLowerCase().includes("fb_pixel_custom")) {
    return "Custom event";
  }

  return actionType
    .replace(/^offsite_conversion\./, "")
    .replace(/^onsite_conversion\./, "")
    .replace(/^fb_pixel_/, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildActionRows(
  rows: MetaInsightRow[],
  totalSpend: number,
  reportType: ReportType,
  customConversionNames: Map<string, string>
) {
  const totals = new Map<string, number>();
  const values = new Map<string, number>();
  const costs = new Map<string, number>();

  for (const row of rows) {
    for (const [actionType, value] of metricByAction(row.actions)) {
      totals.set(actionType, (totals.get(actionType) ?? 0) + value);
    }

    for (const [actionType, value] of metricByAction(row.action_values)) {
      values.set(actionType, (values.get(actionType) ?? 0) + value);
    }

    for (const [actionType, value] of metricByAction(row.cost_per_action_type)) {
      costs.set(actionType, value);
    }
  }

  return [...totals.entries()]
    .map(([actionType, value]) => ({
      action_name: formatActionName(actionType, customConversionNames),
      action_type: actionType,
      value: round(value, 2),
      is_primary: isPrimaryMetaAction(actionType, reportType) ? 1 : 0,
      action_value: round(values.get(actionType) ?? 0),
      cost_per_action: round(costs.get(actionType) ?? calcCpa(totalSpend, value))
    }))
    .sort((first, second) => {
      const primaryDelta = Number(second.is_primary) - Number(first.is_primary);
      return primaryDelta || Number(second.value) - Number(first.value);
    });
}

function buildKpis(
  rows: Array<ReturnType<typeof mapPerformanceRow>>,
  reportType: ReportType
): PlatformKpis {
  const spend = rowSpend(rows);
  const impressions = rows.reduce((sum, row) => sum + Number(row.impressions ?? 0), 0);
  const reach = rows.reduce((sum, row) => sum + Number(row.reach ?? 0), 0);
  const clicks = rows.reduce((sum, row) => sum + Number(row.outbound_clicks ?? 0), 0);
  const landingPageViewTotal = rows.reduce(
    (sum, row) => sum + Number(row.landing_page_views ?? 0),
    0
  );
  const conversions = round(
    rows.reduce((sum, row) => sum + Number(row.leads ?? 0), 0),
    2
  );
  const conversionValue =
    reportType === "ecommerce"
      ? round(rows.reduce((sum, row) => sum + Number(row.conversion_value ?? 0), 0))
      : 0;

  return {
    spend,
    reach,
    impressions,
    clicks,
    outboundClicks: clicks,
    landingPageViews: round(landingPageViewTotal, 2),
    ctr: calcCtr(clicks, impressions),
    cpc: calcCpc(spend, clicks),
    conversions,
    conversionValue,
    cpa: calcCpa(spend, conversions),
    roas: calcRoas(conversionValue, spend)
  };
}

function timeRange(range: DateRange) {
  return JSON.stringify({ since: range.startDate, until: range.endDate });
}

const insightFields = [
  "date_start",
  "date_stop",
  "spend",
  "reach",
  "impressions",
  "clicks",
  "inline_link_clicks",
  "outbound_clicks",
  "unique_outbound_clicks",
  "ctr",
  "cpc",
  "cost_per_outbound_click",
  "actions",
  "action_values",
  "cost_per_action_type",
  "purchase_roas"
].join(",");

const campaignFields = ["campaign_id", "campaign_name", insightFields].join(",");
const actionFields = [
  "spend",
  "actions",
  "action_values",
  "cost_per_action_type",
  "purchase_roas"
].join(",");

async function fetchCustomConversionNames(adAccountId: string, config: MetaConfig) {
  try {
    const rows = await fetchMetaGraphPages<MetaCustomConversionRow>(
      `${adAccountId}/customconversions`,
      {
        fields: "id,name",
        limit: 500
      },
      config
    );

    return new Map(
      rows
        .filter((row) => row.id && row.name)
        .map((row) => [String(row.id), String(row.name)])
    );
  } catch {
    return new Map<string, string>();
  }
}

export async function fetchMetaReport(
  metaAdAccountId: string | null,
  reportType: ReportType,
  range: DateRange
): Promise<MetaResult> {
  const adAccountId = normalizeMetaAdAccountId(metaAdAccountId);
  if (!adAccountId) {
    return { state: missingMeta };
  }

  const config = await getMetaConfig();
  if (!config) {
    return { state: credentialsState() };
  }

  const baseParams = {
    time_range: timeRange(range),
    action_attribution_windows: metaAttributionWindow,
    limit: 500
  };

  try {
    const [dailyRows, campaignRows, actionRows, customConversionNames] =
      await Promise.all([
        fetchMetaGraphPages<MetaInsightRow>(
          `${adAccountId}/insights`,
          {
            ...baseParams,
            fields: insightFields,
            time_increment: 1
          },
          config
        ),
        fetchMetaGraphPages<MetaInsightRow>(
          `${adAccountId}/insights`,
          {
            ...baseParams,
            fields: campaignFields,
            level: "campaign"
          },
          config
        ),
        fetchMetaGraphPages<MetaInsightRow>(
          `${adAccountId}/insights`,
          {
            ...baseParams,
            fields: actionFields,
            action_breakdowns: "action_type"
          },
          config
        ),
        fetchCustomConversionNames(adAccountId, config)
      ]);

    if (!dailyRows.length && !campaignRows.length && !actionRows.length) {
      return { state: emptyState };
    }

    const daily = dailyRows.map((row) => mapPerformanceRow(row, reportType));
    const campaigns = campaignRows.map((row) => mapPerformanceRow(row, reportType));
    const kpiRows = daily.length ? daily : campaigns;
    const totalSpend = rowSpend(kpiRows);

    return {
      state: readyState,
      report: {
        kpis: buildKpis(kpiRows, reportType),
        daily,
        campaigns,
        actions: buildActionRows(
          actionRows.length ? actionRows : dailyRows,
          totalSpend,
          reportType,
          customConversionNames
        ),
        attributionWindow: metaAttributionWindow
      }
    };
  } catch (error) {
    return {
      state: {
        status: "error",
        message: safeMessage(error)
      }
    };
  }
}

export async function testMetaConnection(metaAdAccountId: string | null) {
  const adAccountId = normalizeMetaAdAccountId(metaAdAccountId);
  if (!adAccountId) {
    return { ok: false, state: missingMeta };
  }

  const config = await getMetaConfig();
  if (!config) {
    return { ok: false, state: credentialsState() };
  }

  try {
    await fetchMetaGraphPages<MetaInsightRow>(
      `${adAccountId}/insights`,
      {
        fields: "spend,impressions,clicks",
        date_preset: "last_7d",
        limit: 1
      },
      config
    );

    return {
      ok: true,
      state: {
        status: "ready" as const,
        message: "Conexiunea Meta Ads este valida."
      }
    };
  } catch (error) {
    return {
      ok: false,
      state: {
        status: "error" as const,
        message: safeMessage(error)
      }
    };
  }
}
