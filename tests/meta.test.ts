import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMetaGraphPages,
  fetchMetaReport,
  isPrimaryMetaAction,
  normalizeMetaAdAccountId
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
                actions: [
                  { action_type: "purchase", value: "2" },
                  { action_type: "lead", value: "5" }
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
                actions: [{ action_type: "purchase", value: "2" }],
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

    expect(result.state.status).toBe("ready");
    expect(result.report?.kpis.conversions).toBe(2);
    expect(result.report?.kpis.conversionValue).toBe(500);
    expect(result.report?.kpis.roas).toBe(5);
    expect(result.report?.campaigns[0].campaign_name).toBe("Sales");
    expect(result.report?.actions[0]).toMatchObject({
      action_type: "purchase",
      value: 2,
      action_value: 500,
      cost_per_action: 50
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
