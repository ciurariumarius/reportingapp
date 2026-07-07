import { describe, expect, it } from "vitest";
import { buildMockReportResponse } from "@/lib/reporting/mock-data";

const configuredClient = {
  name: "Demo Client",
  slug: "demo-client",
  timezone: "Europe/Bucharest",
  currency: "RON",
  locale: "ro",
  ga4PropertyId: "properties/123",
  metaAdAccountId: "act_123",
  googleAdsSheetUrl: "https://docs.google.com/spreadsheets/d/demo/edit"
};

describe("mock report aggregation", () => {
  it("returns separate platform sections and overview totals", () => {
    const report = buildMockReportResponse(configuredClient, {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(report.sources.googleAds.status).toBe("mock");
    expect(report.sources.ga4.status).toBe("mock");
    expect(report.sources.meta.status).toBe("mock");
    expect(report.googleAds?.conversions[0].conversion_action_name).toBeTruthy();
    expect(report.ga4?.events[0].event_name).toBeTruthy();
    expect(report.meta?.actions[0].action_type).toBeTruthy();
    expect(report.overview.websiteSessions).toBe(report.ga4?.kpis.sessions);
    expect(report.overview.platformReportedConversions).toBeGreaterThan(0);
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
  });
});
