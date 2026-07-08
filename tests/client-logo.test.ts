import { describe, expect, it } from "vitest";
import { extractLogoCandidates, normalizeWebsiteUrl } from "@/lib/client-logo";

describe("client logo detection helpers", () => {
  it("normalizes website URLs", () => {
    expect(normalizeWebsiteUrl("digitaldot.ro")).toBe("https://digitaldot.ro/");
    expect(normalizeWebsiteUrl("https://digitaldot.ro/test")).toBe(
      "https://digitaldot.ro/test"
    );
    expect(normalizeWebsiteUrl("ftp://digitaldot.ro")).toBeNull();
  });

  it("prioritizes real logo images over favicon or social image", () => {
    const candidates = extractLogoCandidates(
      `
        <html>
          <head>
            <link rel="icon" href="/favicon.ico" />
            <meta property="og:image" content="/share.jpg" />
          </head>
          <body>
            <img src="/assets/client-logo.svg" alt="Client logo" />
          </body>
        </html>
      `,
      "https://client.ro/path/"
    );

    expect(candidates[0]).toMatchObject({
      url: "https://client.ro/assets/client-logo.svg",
      source: "img"
    });
  });
});
