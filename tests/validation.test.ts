import { describe, expect, it } from "vitest";
import {
  adminSettingsPayloadSchema,
  clientPayloadSchema,
  slugSchema
} from "@/lib/validation";

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

  it("accepts 4 digit report pins", () => {
    expect(
      clientPayloadSchema.parse({
        name: "Demo Client",
        slug: "demo-client",
        active: true,
        timezone: "Europe/Bucharest",
        currency: "ron",
        locale: "ro",
        reportPin: "2657"
      }).reportPin
    ).toBe("2657");

    expect(
      adminSettingsPayloadSchema.parse({
        metaApiVersion: "v23.0",
        reportDefaultPin: "1234"
      }).reportDefaultPin
    ).toBe("1234");
  });

  it("rejects invalid report pins", () => {
    expect(() =>
      clientPayloadSchema.parse({
        name: "Demo Client",
        slug: "demo-client",
        active: true,
        timezone: "Europe/Bucharest",
        currency: "ron",
        locale: "ro",
        reportPin: "12345"
      })
    ).toThrow();

    expect(() =>
      adminSettingsPayloadSchema.parse({
        metaApiVersion: "v23.0",
        reportDefaultPin: "abcd"
      })
    ).toThrow();
  });
});
