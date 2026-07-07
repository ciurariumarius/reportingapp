import { describe, expect, it } from "vitest";
import { clientPayloadSchema, slugSchema } from "@/lib/validation";

describe("client validation", () => {
  it("accepts normalized client payloads", () => {
    const parsed = clientPayloadSchema.parse({
      name: "Demo Client",
      slug: "demo-client",
      active: true,
      timezone: "Europe/Bucharest",
      currency: "ron",
      locale: "ro"
    });

    expect(parsed.slug).toBe("demo-client");
  });

  it("rejects invalid slugs", () => {
    expect(() => slugSchema.parse("Demo Client")).toThrow();
    expect(() => slugSchema.parse("demo_client")).toThrow();
  });
});
