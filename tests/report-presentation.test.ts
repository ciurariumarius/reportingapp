import { describe, expect, it } from "vitest";
import {
  friendlyLandingPageLabel,
  metaActionCategory
} from "@/lib/reporting/presentation";

describe("report presentation helpers", () => {
  it("turns GA4 landing page paths into owner-friendly labels", () => {
    expect(friendlyLandingPageLabel("/locatii/suceava")).toBe("Pagina Suceava");
    expect(friendlyLandingPageLabel("https://example.ro/programare-online")).toBe(
      "Pagina Programare Online"
    );
    expect(friendlyLandingPageLabel("/")).toBe("Homepage");
    expect(friendlyLandingPageLabel("(not set)")).toBe("Pagina necunoscuta");
  });

  it("groups Meta action types into owner-friendly categories", () => {
    expect(metaActionCategory("link_click")).toBe("traffic");
    expect(metaActionCategory("post_engagement")).toBe("engagement");
    expect(metaActionCategory("lead")).toBe("conversions");
    expect(metaActionCategory("contact")).toBe("conversions");
    expect(metaActionCategory("offsite_conversion.fb_pixel_custom")).toBe(
      "conversions"
    );
    expect(metaActionCategory("unknown_action")).toBe("other");
  });
});
