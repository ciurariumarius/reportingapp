import { describe, expect, it } from "vitest";
import {
  buildAutomatedInsights,
  buildReportComparison,
  calculateMetricTrend
} from "@/lib/reporting/insights";
import type { ReportResponse } from "@/lib/types/report";

type ReportOverrides = Omit<Partial<ReportResponse>, "overview"> & {
  overview?: Partial<ReportResponse["overview"]>;
};

function report(overrides: ReportOverrides = {}): ReportResponse {
  const { overview, ...rest } = overrides;

  return {
    client: {
      name: "Demo",
      slug: "demo",
      currency: "RON",
      timezone: "Europe/Bucharest",
      locale: "en",
      reportType: "lead"
    },
    dateRange: {
      startDate: "2026-07-01",
      endDate: "2026-07-30"
    },
    displayPeriod: "01 July 2026 - 30 July 2026",
    lastUpdatedAt: "2026-07-30T10:00:00.000Z",
    overview: {
      totalSpend: overview?.totalSpend ?? 0,
      totalClicks: overview?.totalClicks ?? 0,
      platformReportedConversions: overview?.platformReportedConversions ?? 0,
      websiteSessions: overview?.websiteSessions ?? 0,
      websiteKeyEvents: overview?.websiteKeyEvents ?? 0
    },
    sources: {
      googleAds: { status: "missing_config", message: "" },
      ga4: { status: "missing_config", message: "" },
      meta: { status: "missing_config", message: "" }
    },
    sourceSummary: [
      { key: "googleAds", label: "Google Ads", status: "missing_config", message: "" },
      { key: "ga4", label: "Website / GA4", status: "missing_config", message: "" },
      { key: "meta", label: "Meta Ads", status: "missing_config", message: "" }
    ],
    ...rest
  };
}

describe("automated report insights", () => {
  it("calculates trend direction, percentage and status", () => {
    expect(calculateMetricTrend(120, 100)).toMatchObject({
      direction: "up",
      percentChange: 20,
      status: "good"
    });
    expect(calculateMetricTrend(120, 100, "lower")).toMatchObject({
      direction: "up",
      status: "warning"
    });
  });

  it("handles missing previous values without misleading percentages", () => {
    expect(calculateMetricTrend(20, 0)).toMatchObject({
      direction: "up",
      percentChange: null,
      status: "good"
    });
  });

  it("generates positive lead insights from conversion and CPL movement", () => {
    const current = report({
      overview: {
        totalSpend: 1000,
        platformReportedConversions: 120,
        websiteSessions: 2000,
        websiteKeyEvents: 80
      }
    });
    const previous = report({
      overview: {
        totalSpend: 900,
        platformReportedConversions: 80,
        websiteSessions: 1500,
        websiteKeyEvents: 70
      }
    });

    const insights = buildAutomatedInsights(current, previous, "lead");

    expect(insights.verdict.status).toBe("good");
    expect(insights.improved.map((item) => item.status)).toContain("good");
  });

  it("generates ecommerce insights from purchases, value and ROAS", () => {
    const current = report({
      client: {
        name: "Shop",
        slug: "shop",
        currency: "RON",
        timezone: "Europe/Bucharest",
        locale: "en",
        reportType: "ecommerce"
      },
      overview: {
        totalSpend: 200,
        platformReportedConversions: 10,
        websiteSessions: 1000,
        websiteKeyEvents: 20
      },
      meta: {
        kpis: { conversionValue: 1200 },
        daily: [],
        campaigns: [],
        actions: []
      }
    });
    const previous = report({
      client: current.client,
      overview: {
        totalSpend: 200,
        platformReportedConversions: 5,
        websiteSessions: 900,
        websiteKeyEvents: 15
      },
      meta: {
        kpis: { conversionValue: 600 },
        daily: [],
        campaigns: [],
        actions: []
      }
    });

    const comparison = buildReportComparison(current, previous);
    const insights = buildAutomatedInsights(current, previous, "ecommerce");

    expect(comparison.platformValue.percentChange).toBe(100);
    expect(comparison.roas.percentChange).toBe(100);
    expect(insights.verdict.status).toBe("good");
  });
});
