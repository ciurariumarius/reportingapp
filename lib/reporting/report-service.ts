import type { Client } from "@prisma/client";
import { formatFriendlyRange, type DateRange } from "../date-ranges";
import type {
  Ga4Report,
  GoogleAdsReport,
  MetaReport,
  ReportResponse,
  SourceState
} from "../types/report";
import { fetchGa4Report } from "./ga4";
import { fetchGoogleAdsSheetReport } from "./google-ads-sheet";
import { buildAutomatedInsights, buildReportComparison } from "./insights";
import { fetchMetaReport } from "./meta";
import { buildReportResponse } from "./mock-data";

type ClientWithSources = Pick<
  Client,
  | "name"
  | "slug"
  | "timezone"
  | "currency"
  | "locale"
  | "reportType"
  | "websiteUrl"
  | "logoUrl"
  | "ga4PropertyId"
  | "metaAdAccountId"
  | "metaPrimaryConversions"
  | "googleAdsSheetUrl"
>;

type SourceResult<T> = {
  state: SourceState;
  report?: T;
};

type ReportBuildOptions = {
  comparisonRange?: DateRange | null;
};

const REPORT_CACHE_TTL_MS = 15 * 60 * 1000;
const SOURCE_TIMEOUT_MS = 12_000;
const reportCache = new Map<
  string,
  {
    expiresAt: number;
    report: ReportResponse;
  }
>();

function cacheKey(
  client: ClientWithSources,
  range: DateRange,
  comparisonRange?: DateRange | null
) {
  return [
    client.slug,
    client.reportType,
    client.logoUrl ?? "",
    range.startDate,
    range.endDate,
    comparisonRange?.startDate ?? "",
    comparisonRange?.endDate ?? "",
    client.ga4PropertyId ?? "",
    client.metaAdAccountId ?? "",
    client.metaPrimaryConversions ?? "",
    client.googleAdsSheetUrl ?? ""
  ].join("|");
}

function timeoutError(label: string): SourceState {
  return {
    status: "error",
    message: `${label} nu a raspuns la timp. Incearca din nou in cateva minute.`
  };
}

async function safeSource<T>(
  label: string,
  promise: Promise<SourceResult<T>>
): Promise<SourceResult<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<SourceResult<T>>((resolve) => {
        timeout = setTimeout(() => resolve({ state: timeoutError(label) }), SOURCE_TIMEOUT_MS);
      })
    ]);
  } catch {
    return {
      state: {
        status: "error",
        message: `${label} nu a putut fi încărcat momentan.`
      }
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function buildSinglePeriodReport(client: ClientWithSources, range: DateRange) {
  const reportType = client.reportType === "ecommerce" ? "ecommerce" : "lead";
  const [googleAds, ga4, meta] = await Promise.all([
    safeSource<GoogleAdsReport>(
      "Google Ads",
      fetchGoogleAdsSheetReport(client.googleAdsSheetUrl, range)
    ),
    safeSource<Ga4Report>("GA4", fetchGa4Report(client.ga4PropertyId, range)),
    safeSource<MetaReport>(
      "Meta Ads",
      fetchMetaReport(
        client.metaAdAccountId,
        reportType,
        range,
        client.metaPrimaryConversions
      )
    )
  ]);

  return buildReportResponse({
    client,
    range,
    googleAds,
    ga4,
    meta
  });
}

async function buildFreshReport(
  client: ClientWithSources,
  range: DateRange,
  options: ReportBuildOptions = {}
) {
  const reportType = client.reportType === "ecommerce" ? "ecommerce" : "lead";
  const currentReport = await buildSinglePeriodReport(client, range);

  if (!options.comparisonRange) {
    return currentReport;
  }

  const comparisonRange = options.comparisonRange;
  const comparisonReport = await buildSinglePeriodReport(client, comparisonRange);

  return {
    ...currentReport,
    comparisonRange,
    displayComparisonPeriod: formatFriendlyRange(
      comparisonRange,
      currentReport.client.locale
    ),
    comparison: buildReportComparison(currentReport, comparisonReport),
    automatedInsights: buildAutomatedInsights(
      currentReport,
      comparisonReport,
      reportType
    )
  };
}

export async function buildReport(
  client: ClientWithSources,
  range: DateRange,
  options: ReportBuildOptions = {}
) {
  const key = cacheKey(client, range, options.comparisonRange);
  const cached = reportCache.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.report;
  }

  try {
    const report = await buildFreshReport(client, range, options);
    reportCache.set(key, {
      expiresAt: now + REPORT_CACHE_TTL_MS,
      report
    });
    return report;
  } catch (error) {
    if (cached) {
      return cached.report;
    }

    throw error;
  }
}

export function clearReportCacheForTests() {
  reportCache.clear();
}
