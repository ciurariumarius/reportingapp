import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/settings/meta-token-test/route";

const apiMocks = vi.hoisted(() => ({
  handleApiError: vi.fn(
    () => new Response(JSON.stringify({ error: "mock error" }), { status: 500 })
  ),
  requireAdminMutation: vi.fn()
}));

const prismaMocks = vi.hoisted(() => ({
  prisma: {
    client: {
      findFirst: vi.fn()
    }
  }
}));

const metaTokenMocks = vi.hoisted(() => ({
  testMetaTokenStatus: vi.fn()
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("@/lib/prisma", () => prismaMocks);
vi.mock("@/lib/reporting/meta-token", () => metaTokenMocks);

function postRequest(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/admin/settings/meta-token-test", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  apiMocks.requireAdminMutation.mockReset();
  apiMocks.handleApiError.mockClear();
  prismaMocks.prisma.client.findFirst.mockReset();
  metaTokenMocks.testMetaTokenStatus.mockReset();
});

describe("admin meta token test route", () => {
  it("requires admin auth", async () => {
    apiMocks.requireAdminMutation.mockResolvedValue(
      new Response(JSON.stringify({ error: "Autentificare necesara." }), {
        status: 401
      })
    );

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(metaTokenMocks.testMetaTokenStatus).not.toHaveBeenCalled();
  });

  it("requires CSRF validation", async () => {
    apiMocks.requireAdminMutation.mockResolvedValue(
      new Response(JSON.stringify({ error: "CSRF" }), {
        status: 403
      })
    );

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(metaTokenMocks.testMetaTokenStatus).not.toHaveBeenCalled();
  });

  it("does not return token or secret material", async () => {
    apiMocks.requireAdminMutation.mockResolvedValue(null);
    prismaMocks.prisma.client.findFirst.mockResolvedValue({
      metaAdAccountId: "act_123"
    });
    metaTokenMocks.testMetaTokenStatus.mockResolvedValue({
      ok: false,
      status: "invalid",
      message: "Tokenul Meta este invalid sau expirat.",
      checkedWith: "debug_token",
      appIdConfigured: true,
      appSecretConfigured: true,
      scopes: ["ads_read"]
    });

    const response = await POST(
      postRequest({
        metaAccessToken: "SECRET_TOKEN",
        metaAppSecret: "APP_SECRET"
      })
    );
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).not.toContain("SECRET_TOKEN");
    expect(text).not.toContain("APP_SECRET");
  });
});
