import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMetaGraphPages,
  fetchMetaReport,
  isPrimaryMetaAction,
  normalizeMetaAdAccountId,
  parseMetaPrimaryConversionRules
} from "@/lib/reporting/meta";

const originalFetch = global.fetch;
const originalToken = process.env.META_ACCESS_TOKEN;
const originalVersion = process.env.META_API_VERSION;
const originalSecret = process.env.META_APP_SECRET;

function restoreEnv() {
  if (originalToken === undefined) {
    delete process.env.META_ACCESS_TOKEN;
  } else {
    process.env.META_ACCESS_TOKEN = originalToken;
  }

  if (originalVersion === undefined) {
    delete process.env.META_API_VERSION;
  } else {
    process.env.META_API_VERSION = originalVersion;
  }

  if (originalSecret === undefined) {
    delete process.env.META_APP_SECRET;
  } else {
    process.env.META_APP_SECRET = originalSecret;
  }
}

afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
  vi.restoreAllMocks();
});

describe("Meta Ads connector", () => {
  it("normalizes ad account ids", () => {
    expect(normalizeMetaAdAccountId("123456")).toBe("act_123456");
    expect(normalizeMetaAdAccountId("act_123456")).toBe("act_123456");
    expect(normalizeMetaAdAccountId("")).toBeNull();
  });

  it("classifies primary actions by report type", () => {
    expect(isPrimaryMetaAction("lead", "lead")).toBe(true);
    expect(
      isPrimaryMetaAction(
        "onsite_conversion.messaging_conversation_started_7d",
        "lead"
      )
    ).toBe(true);
    expect(isPrimaryMetaAction("purchase", "lead")).toBe(false);
    expect(isPrimaryMetaAction("offsite_conversion.custom.123456789", "lead")).toBe(
      false
    );
    expect(isPrimaryMetaAction("offsite_conversion.custom.CL001", "lead")).toBe(false);
    expect(
      isPrimaryMetaAction("offsite_conversion.custom.CL001", "lead", {
        primaryConversionRules: parseMetaPrimaryConversionRules("CL001")
      })
    ).toBe(true);
    expect(
      isPrimaryMetaAction("offsite_conversion.custom.123456789", "lead", {
        actionName: "Programare consultanta",
        primaryConversionRules: parseMetaPrimaryConversionRules("programare consultanta")
      })
    ).toBe(true);
    expect(isPrimaryMetaAction("offsite_conversion.fb_pixel_purchase", "ecommerce")).toBe(
      true
    );
  });

  it("reports missing credentials without throwing", async () => {
    delete process.env.META_ACCESS_TOKEN;

    const result = await fetchMetaReport("act_123", "lead", {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(result.state.status).toBe("missing_config");
    expect(result.report).toBeUndefined();
  });

  it("follows Graph API pagination", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: "first" }],
            paging: { next: "https://graph.facebook.com/v23.0/next-page" }
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: "second" }] }))
      ) as typeof fetch;

    const rows = await fetchMetaGraphPages<{ id: string }>(
      "act_123/insights",
      { fields: "spend" },
      { accessToken: "token", apiVersion: "v23.0" }
    );

    expect(rows).toEqual([{ id: "first" }, { id: "second" }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("maps ecommerce insights into dashboard report fields", async () => {
    process.env.META_ACCESS_TOKEN = "token";
    process.env.META_API_VERSION = "v23.0";
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.searchParams.get("time_increment") === "1") {
        return new Response(
          JSON.stringify({
            data: [
              {
                date_start: "2026-07-01",
                spend: "100",
                reach: "900",
                impressions: "1200",
                clicks: "80",
                inline_link_clicks: "40",
                outbound_clicks: [{ action_type: "outbound_click", value: "30" }],
                unique_outbound_clicks: [{ action_type: "outbound_click", value: "24" }],
                cost_per_outbound_click: [
                  { action_type: "outbound_click", value: "3.33" }
                ],
                actions: [
                  { action_type: "purchase", value: "2" },
                  { action_type: "lead", value: "5" },
                  { action_type: "landing_page_view", value: "21" }
                ],
                action_values: [{ action_type: "purchase", value: "500" }]
              }
            ]
          })
        );
      }

      if (url.searchParams.get("level") === "campaign") {
        return new Response(
          JSON.stringify({
            data: [
              {
                campaign_id: "cmp_1",
                campaign_name: "Sales",
                spend: "100",
                reach: "900",
                impressions: "1200",
                inline_link_clicks: "40",
                outbound_clicks: [{ action_type: "outbound_click", value: "30" }],
                cost_per_outbound_click: [
                  { action_type: "outbound_click", value: "3.33" }
                ],
                actions: [
                  { action_type: "purchase", value: "2" },
                  { action_type: "landing_page_view", value: "21" }
                ],
                action_values: [{ action_type: "purchase", value: "500" }]
              }
            ]
          })
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              spend: "100",
              actions: [{ action_type: "purchase", value: "2" }],
              action_values: [{ action_type: "purchase", value: "500" }],
              cost_per_action_type: [{ action_type: "purchase", value: "50" }]
            }
          ]
        })
      );
    }) as typeof fetch;

    const result = await fetchMetaReport("123", "ecommerce", {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("action_attribution_windows=1d_click"),
      expect.any(Object)
    );
    expect(result.state.status).toBe("ready");
    expect(result.report?.attributionWindow).toBe("1d_click");
    expect(result.report?.kpis.clicks).toBe(30);
    expect(result.report?.kpis.outboundClicks).toBe(30);
    expect(result.report?.kpis.cpc).toBe(3.33);
    expect(result.report?.kpis.landingPageViews).toBe(21);
    expect(result.report?.kpis.conversions).toBe(2);
    expect(result.report?.kpis.conversionValue).toBe(500);
    expect(result.report?.kpis.roas).toBe(5);
    expect(result.report?.campaigns[0].campaign_name).toBe("Sales");
    expect(result.report?.campaigns[0].link_clicks).toBe(30);
    expect(result.report?.campaigns[0].landing_page_views).toBe(21);
    expect(result.report?.actions[0]).toMatchObject({
      action_type: "purchase",
      value: 2,
      action_value: 500,
      cost_per_action: 50
    });
  });

  it("counts custom conversions as primary Meta conversions", async () => {
    process.env.META_ACCESS_TOKEN = "token";
    process.env.META_API_VERSION = "v23.0";
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/customconversions")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "123456789", name: "Programare consultanta" }]
          })
        );
      }

      if (url.searchParams.get("time_increment") === "1") {
        return new Response(
          JSON.stringify({
            data: [
              {
                date_start: "2026-07-01",
                spend: "200",
                reach: "900",
                impressions: "1200",
                clicks: "80",
                inline_link_clicks: "50",
                actions: [
                  { action_type: "offsite_conversion.fb_pixel_custom", value: "11" },
                  { action_type: "post_engagement", value: "20" }
                ],
                conversions: [
                  { action_type: "offsite_conversion.fb_pixel_custom.123456789", value: "7" },
                  { action_type: "offsite_conversion.fb_pixel_custom.CL001", value: "4" }
                ]
              }
            ]
          })
        );
      }

      if (url.searchParams.get("level") === "campaign") {
        return new Response(
          JSON.stringify({
            data: [
              {
                campaign_id: "cmp_1",
                campaign_name: "Lead custom",
                spend: "200",
                reach: "900",
                impressions: "1200",
                inline_link_clicks: "50",
                actions: [
                  { action_type: "offsite_conversion.fb_pixel_custom", value: "11" }
                ],
                conversions: [
                  { action_type: "offsite_conversion.fb_pixel_custom.123456789", value: "7" },
                  { action_type: "offsite_conversion.fb_pixel_custom.CL001", value: "4" }
                ]
              }
            ]
          })
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              spend: "200",
              actions: [
                { action_type: "offsite_conversion.fb_pixel_custom", value: "11" },
                { action_type: "post_engagement", value: "20" }
              ],
              conversions: [
                { action_type: "offsite_conversion.fb_pixel_custom.123456789", value: "7" },
                { action_type: "offsite_conversion.fb_pixel_custom.CL001", value: "4" }
              ],
              cost_per_action_type: [
                { action_type: "offsite_conversion.fb_pixel_custom", value: "18.18" }
              ]
            }
          ]
        })
      );
    }) as typeof fetch;

    const result = await fetchMetaReport(
      "123",
      "lead",
      {
        startDate: "2026-07-01",
        endDate: "2026-07-07"
      },
      "Programare consultanta, CL001"
    );

    expect(result.state.status).toBe("ready");
    expect(result.report?.kpis.conversions).toBe(11);
    expect(result.report?.kpis.cpa).toBe(18.18);
    expect(result.report?.actions[0]).toMatchObject({
      action_name: "Programare consultanta",
      action_type: "offsite_conversion.fb_pixel_custom.123456789",
      is_primary: 1,
      primary_label: "Primary",
      value: 7,
      cost_per_action: 28.57
    });
    expect(result.report?.actions[1]).toMatchObject({
      action_name: "CL001",
      action_type: "offsite_conversion.fb_pixel_custom.CL001",
      is_primary: 1,
      primary_label: "Primary",
      value: 4,
      cost_per_action: 50
    });
  });

  it("keeps generic Meta custom pixel events visible but secondary by default", async () => {
    process.env.META_ACCESS_TOKEN = "token";
    process.env.META_API_VERSION = "v23.0";
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname.endsWith("/customconversions")) {
        return new Response(JSON.stringify({ data: [] }));
      }

      expect(url.searchParams.get("action_attribution_windows")).toBe("1d_click");

      if (url.searchParams.get("time_increment") === "1") {
        return new Response(
          JSON.stringify({
            data: [
              {
                date_start: "2026-07-01",
                spend: "80",
                impressions: "1000",
                inline_link_clicks: "40",
                actions: [
                  { action_type: "offsite_conversion.fb_pixel_custom", value: "3" }
                ]
              }
            ]
          })
        );
      }

      if (url.searchParams.get("level") === "campaign") {
        return new Response(
          JSON.stringify({
            data: [
              {
                campaign_id: "cmp_1",
                campaign_name: "Custom event campaign",
                spend: "80",
                impressions: "1000",
                inline_link_clicks: "40",
                actions: [
                  { action_type: "offsite_conversion.fb_pixel_custom", value: "3" }
                ]
              }
            ]
          })
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              spend: "80",
              actions: [
                { action_type: "offsite_conversion.fb_pixel_custom", value: "3" }
              ],
              cost_per_action_type: [
                { action_type: "offsite_conversion.fb_pixel_custom", value: "26.67" }
              ]
            }
          ]
        })
      );
    }) as typeof fetch;

    const result = await fetchMetaReport("123", "lead", {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(result.state.status).toBe("ready");
    expect(result.report?.kpis.conversions).toBe(0);
    expect(result.report?.actions[0]).toMatchObject({
      action_name: "Custom event",
      action_type: "offsite_conversion.fb_pixel_custom",
      is_primary: 0,
      primary_label: "Secondary",
      value: 3,
      cost_per_action: 26.67
    });
  });

  it("does not leak tokens in public error messages", async () => {
    process.env.META_ACCESS_TOKEN = "SECRET_TOKEN";
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 190,
              message: "Bad token SECRET_TOKEN"
            }
          }),
          { status: 400 }
        )
    ) as typeof fetch;

    const result = await fetchMetaReport("act_123", "lead", {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(result.state.status).toBe("error");
    expect(result.state.message).not.toContain("SECRET_TOKEN");
    expect(result.state.message).toContain("invalid");
  });
});
