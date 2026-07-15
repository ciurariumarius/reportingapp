import { describe, expect, it } from "vitest";
import { buildMockReportResponse } from "@/lib/reporting/mock-data";
import { buildReport } from "@/lib/reporting/report-service";

const configuredClient = {
  name: "Demo Client",
  slug: "demo-client",
  timezone: "Europe/Bucharest",
  currency: "RON",
  locale: "ro",
  reportType: "lead",
  websiteUrl: "https://demo.example",
  logoUrl: null,
  ga4PropertyId: "properties/123",
  metaAdAccountId: "act_123",
  metaPrimaryConversions: null,
  googleAdsSheetUrl: "https://docs.google.com/spreadsheets/d/demo/edit"
};

describe("mock report aggregation", () => {
  it("returns separate platform sections and overview totals", () => {
    const report = buildMockReportResponse(configuredClient, {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(report.sources.googleAds.status).toBe("mock");
    expect(report.client.websiteUrl).toBe("https://demo.example");
    expect(report.displayPeriod).toBe("01 - 07 Iulie 2026");
    expect(report.lastUpdatedAt).toBeTruthy();
    expect(report.sourceSummary.map((source) => source.key)).toEqual([
      "googleAds",
      "ga4",
      "meta"
    ]);
    expect(report.sources.ga4.status).toBe("mock");
    expect(report.sources.meta.status).toBe("mock");
    expect(report.googleAds?.conversions[0].conversion_action_name).toBeTruthy();
    expect(report.ga4?.events[0].event_name).toBeTruthy();
    expect(report.meta?.actions[0].action_type).toBeTruthy();
    expect(report.overview.websiteSessions).toBe(report.ga4?.kpis.sessions);
    expect(report.overview.platformReportedConversions).toBeGreaterThan(0);
    expect(report.ownerOverview.platforms.map((platform) => platform.key)).toEqual([
      "googleAds",
      "meta"
    ]);
    expect(report.ownerOverview.paid.totalSpend).toBe(report.overview.totalSpend);
    expect(report.ownerOverview.paid.totalConversions).toBe(
      report.overview.platformReportedConversions
    );
    expect(report.ownerOverview.website.conversions).toBe(report.ga4?.kpis.keyEvents);
  });

  it("marks missing source configuration without crashing", () => {
    const report = buildMockReportResponse(
      {
        ...configuredClient,
        ga4PropertyId: null,
        metaAdAccountId: null,
        googleAdsSheetUrl: null
      },
      {
        startDate: "2026-07-01",
        endDate: "2026-07-07"
      }
    );

    expect(report.sources.googleAds.status).toBe("missing_config");
    expect(report.sources.ga4.status).toBe("missing_config");
    expect(report.sources.meta.status).toBe("missing_config");
    expect(report.googleAds).toBeUndefined();
    expect(report.ga4).toBeUndefined();
    expect(report.meta).toBeUndefined();
    expect(report.ownerOverview.platforms).toEqual([]);
  });

  it("builds ecommerce owner overview with value and ROAS", () => {
    const report = buildMockReportResponse(
      {
        ...configuredClient,
        reportType: "ecommerce"
      },
      {
        startDate: "2026-07-01",
        endDate: "2026-07-07"
      }
    );

    expect(report.ownerOverview.ecommerce).toBeTruthy();
    expect(report.ownerOverview.paid.conversionValue).toBeGreaterThan(0);
    expect(report.ownerOverview.paid.roas).toBeGreaterThan(0);
  });

  it("does not build comparison by default for the public report contract", async () => {
    const report = await buildReport(
      {
        ...configuredClient,
        ga4PropertyId: null,
        metaAdAccountId: null,
        googleAdsSheetUrl: null
      },
      {
        startDate: "2026-07-01",
        endDate: "2026-07-07"
      }
    );

    expect(report.comparisonRange).toBeUndefined();
    expect(report.displayComparisonPeriod).toBeUndefined();
    expect(report.comparison).toBeUndefined();
    expect(report.automatedInsights).toBeUndefined();
    expect(report.sources.googleAds.status).toBe("missing_config");
    expect(report.googleAds).toBeUndefined();
    expect("insights" in report).toBe(false);
  });

  it("builds comparison and automated insights when comparison range is requested", async () => {
    const report = await buildReport(
      {
        ...configuredClient,
        ga4PropertyId: null,
        metaAdAccountId: null,
        googleAdsSheetUrl: null
      },
      {
        startDate: "2026-07-01",
        endDate: "2026-07-07"
      },
      {
        comparisonRange: {
          startDate: "2026-06-24",
          endDate: "2026-06-30"
        }
      }
    );

    expect(report.comparisonRange).toEqual({
      startDate: "2026-06-24",
      endDate: "2026-06-30"
    });
    expect(report.displayComparisonPeriod).toBe("24 - 30 Iunie 2026");
    expect(report.sources.googleAds.status).toBe("missing_config");
    expect(report.googleAds).toBeUndefined();
    expect(report.automatedInsights?.verdict.message).toBeTruthy();
    expect("insights" in report).toBe(false);
  });
});
