import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseDebugTokenResponse,
  testMetaTokenStatus
} from "@/lib/reporting/meta-token";

const originalFetch = global.fetch;
const originalToken = process.env.META_ACCESS_TOKEN;
const originalVersion = process.env.META_API_VERSION;
const originalAppId = process.env.META_APP_ID;
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

  if (originalAppId === undefined) {
    delete process.env.META_APP_ID;
  } else {
    process.env.META_APP_ID = originalAppId;
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

describe("Meta token status parser", () => {
  it("marks invalid tokens without leaking raw error details", () => {
    const result = parseDebugTokenResponse({
      data: {
        is_valid: false,
        error: {
          message: "Session expired for SECRET_TOKEN"
        }
      }
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("invalid");
    expect(result.message).not.toContain("SECRET_TOKEN");
  });

  it("accepts a valid token without expires_at as never-expiring", () => {
    const result = parseDebugTokenResponse({
      data: {
        app_id: "123",
        is_valid: true,
        scopes: ["ads_read"],
        type: "SYSTEM_USER"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("valid_never_expires");
    expect(result.message).toContain("fara expirare");
    expect(result.scopes).toEqual(["ads_read"]);
  });

  it("warns and blocks policy when a valid token has expires_at", () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const result = parseDebugTokenResponse({
      data: {
        expires_at: expiresAt,
        is_valid: true,
        scopes: ["ads_read"],
        type: "USER"
      }
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("valid_expiring");
    expect(result.expiresAt).toBe(new Date(expiresAt * 1000).toISOString());
  });

  it("uses the ad account fallback when app id and secret are missing", async () => {
    process.env.META_ACCESS_TOKEN = "SECRET_TOKEN";
    process.env.META_API_VERSION = "v23.0";
    delete process.env.META_APP_ID;
    delete process.env.META_APP_SECRET;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      expect(url.pathname).toContain("/act_123/insights");
      expect(url.searchParams.get("access_token")).toBe("SECRET_TOKEN");

      return new Response(JSON.stringify({ data: [{ spend: "10" }] }));
    }) as typeof fetch;

    const result = await testMetaTokenStatus({ fallbackAdAccountId: "123" });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("fallback_valid");
    expect(result.checkedWith).toBe("ad_account_fallback");
    expect(JSON.stringify(result)).not.toContain("SECRET_TOKEN");
  });
});
