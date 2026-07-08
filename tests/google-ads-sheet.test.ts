import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractGoogleSheetId,
  fetchGoogleAdsSheetReport,
  testGoogleAdsSheetConnection
} from "@/lib/reporting/google-ads-sheet";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Google Ads Sheet connector", () => {
  it("extracts the spreadsheet id from a Google Sheets URL", () => {
    expect(
      extractGoogleSheetId(
        "https://docs.google.com/spreadsheets/d/abc123_DEF-456/edit#gid=0"
      )
    ).toBe("abc123_DEF-456");
  });

  it("reports missing sheet URL", async () => {
    const result = await testGoogleAdsSheetConnection("");

    expect(result.ok).toBe(false);
    expect(result.state.status).toBe("missing_config");
  });

  it("validates the required export tabs", async () => {
    const csvHeader =
      "date,cost,impressions,clicks,campaign_id,campaign_name,conversion_action_name,conversions,device,location\n";
    global.fetch = vi.fn(async () => new Response(csvHeader)) as typeof fetch;

    const result = await testGoogleAdsSheetConnection(
      "https://docs.google.com/spreadsheets/d/abc123_DEF-456/edit"
    );

    expect(result.ok).toBe(true);
    expect(result.state.status).toBe("ready");
    expect(global.fetch).toHaveBeenCalledTimes(5);
  });

  it("reads and aggregates report rows from Google Sheet tabs", async () => {
    const csvBySheet: Record<string, string> = {
      gads_daily:
        "date,cost,impressions,clicks,ctr,avg_cpc,conversions,all_conversions,conversion_value,all_conversion_value\n" +
        "2026-06-30,50,500,25,5,2,1,1,100,100\n" +
        "2026-07-01,100,1000,50,5,2,4,5,800,900\n",
      gads_campaigns:
        "date,campaign_id,campaign_name,campaign_status,cost,impressions,clicks,ctr,avg_cpc,conversions,all_conversions,cpa,conversion_value,roas\n" +
        "2026-07-01,1,Search,ENABLED,100,1000,50,5,2,4,5,25,800,8\n",
      gads_conversions:
        "date,campaign_id,campaign_name,conversion_action_name,conversions,all_conversions,conversion_value,all_conversion_value\n" +
        "2026-07-01,1,Search,Lead form,4,5,800,900\n",
      gads_devices:
        "date,device,cost,impressions,clicks,conversions,all_conversions,cpa\n" +
        "2026-07-01,Mobile,100,1000,50,4,5,25\n",
      gads_locations:
        "date,location,cost,impressions,clicks,conversions,all_conversions,cpa\n" +
        "2026-07-01,Romania,100,1000,50,4,5,25\n"
    };
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const sheet = url.searchParams.get("sheet") ?? "";
      return new Response(csvBySheet[sheet] ?? "");
    }) as typeof fetch;

    const result = await fetchGoogleAdsSheetReport(
      "https://docs.google.com/spreadsheets/d/abc123_DEF-456/edit",
      {
        startDate: "2026-07-01",
        endDate: "2026-07-01"
      }
    );

    expect(result.state.status).toBe("ready");
    expect(result.report?.kpis.spend).toBe(100);
    expect(result.report?.kpis.conversions).toBe(4);
    expect(result.report?.kpis.conversionValue).toBe(800);
    expect(result.report?.campaigns[0].campaign_name).toBe("Search");
    expect(result.report?.conversions[0].conversion_action_name).toBe("Lead form");
    expect(result.report?.devices[0].device).toBe("Mobile");
    expect(result.report?.locations[0].location).toBe("Romania");
  });
});
