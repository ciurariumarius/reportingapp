import { describe, expect, it } from "vitest";
import { fetchGa4Report } from "@/lib/reporting/ga4";

describe("GA4 connector", () => {
  it("reports missing client property id", async () => {
    const result = await fetchGa4Report(null, {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    expect(result.state.status).toBe("missing_config");
    expect(result.report).toBeUndefined();
  });

  it("reports missing credentials without throwing", async () => {
    const originalEmail = process.env.GA4_CLIENT_EMAIL;
    const originalKey = process.env.GA4_PRIVATE_KEY;
    delete process.env.GA4_CLIENT_EMAIL;
    delete process.env.GA4_PRIVATE_KEY;

    const result = await fetchGa4Report("properties/123456789", {
      startDate: "2026-07-01",
      endDate: "2026-07-07"
    });

    if (originalEmail === undefined) {
      delete process.env.GA4_CLIENT_EMAIL;
    } else {
      process.env.GA4_CLIENT_EMAIL = originalEmail;
    }

    if (originalKey === undefined) {
      delete process.env.GA4_PRIVATE_KEY;
    } else {
      process.env.GA4_PRIVATE_KEY = originalKey;
    }

    expect(result.state.status).toBe("missing_config");
    expect(result.state.message).toContain("GA4_CLIENT_EMAIL");
    expect(result.report).toBeUndefined();
  });
});
