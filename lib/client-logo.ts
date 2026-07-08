export type LogoCandidate = {
  url: string;
  score: number;
  source: string;
};

const MAX_HTML_BYTES = 800_000;

export function normalizeWebsiteUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function attrValue(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() ?? "";
}

function absoluteUrl(value: string, pageUrl: string) {
  if (!value || value.startsWith("data:") || value.startsWith("javascript:")) {
    return null;
  }

  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return null;
  }
}

function scoreUrl(url: string) {
  const normalized = url.toLowerCase();
  let score = 0;

  if (normalized.includes("logo")) score += 80;
  if (normalized.endsWith(".svg")) score += 20;
  if (normalized.endsWith(".png")) score += 12;
  if (normalized.includes("brand")) score += 10;
  if (normalized.includes("favicon")) score -= 25;
  if (normalized.includes("sprite")) score -= 40;

  return score;
}

function pushCandidate(
  candidates: LogoCandidate[],
  urlValue: string,
  pageUrl: string,
  score: number,
  source: string
) {
  const url = absoluteUrl(urlValue, pageUrl);

  if (!url) {
    return;
  }

  candidates.push({
    url,
    score: score + scoreUrl(url),
    source
  });
}

export function extractLogoCandidates(html: string, pageUrl: string) {
  const candidates: LogoCandidate[] = [];

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src = attrValue(tag, "src");
    const alt = attrValue(tag, "alt").toLowerCase();
    const className = attrValue(tag, "class").toLowerCase();
    const id = attrValue(tag, "id").toLowerCase();
    const context = `${src} ${alt} ${className} ${id}`.toLowerCase();

    let score = 20;
    if (context.includes("logo")) score += 90;
    if (context.includes("brand")) score += 30;
    if (context.includes("header")) score += 15;

    pushCandidate(candidates, src, pageUrl, score, "img");
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attrValue(tag, "rel").toLowerCase();
    const href = attrValue(tag, "href");

    if (!href) continue;
    if (rel.includes("apple-touch-icon")) {
      pushCandidate(candidates, href, pageUrl, 45, "apple-touch-icon");
    } else if (rel.includes("icon")) {
      pushCandidate(candidates, href, pageUrl, 20, "icon");
    }
  }

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const property = `${attrValue(tag, "property")} ${attrValue(tag, "name")}`.toLowerCase();
    const content = attrValue(tag, "content");

    if (!content) continue;
    if (property.includes("og:logo")) {
      pushCandidate(candidates, content, pageUrl, 90, "og:logo");
    } else if (property.includes("og:image") || property.includes("twitter:image")) {
      pushCandidate(candidates, content, pageUrl, 30, "social-image");
    }
  }

  const bestByUrl = new Map<string, LogoCandidate>();
  for (const candidate of candidates) {
    const existing = bestByUrl.get(candidate.url);
    if (!existing || candidate.score > existing.score) {
      bestByUrl.set(candidate.url, candidate);
    }
  }

  return [...bestByUrl.values()].sort((first, second) => second.score - first.score);
}

export async function detectLogoFromWebsite(websiteUrl: string | null | undefined) {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl);

  if (!normalizedUrl) {
    return {
      ok: false,
      message: "Adaugă un website valid pentru client."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DigitalDotReportBot/1.0; +https://digitaldot.ro)"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Website-ul a răspuns cu status ${response.status}.`
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html")) {
      return {
        ok: false,
        message: "Website-ul nu a returnat HTML."
      };
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const candidates = extractLogoCandidates(html, response.url || normalizedUrl);
    const best = candidates[0];

    if (!best) {
      return {
        ok: false,
        message: "Nu am găsit automat un logo în website."
      };
    }

    return {
      ok: true,
      logoUrl: best.url,
      websiteUrl: normalizedUrl,
      message: "Logo detectat și salvat."
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.name === "AbortError"
          ? "Detectarea logo-ului a expirat."
          : "Nu am putut citi website-ul clientului."
    };
  } finally {
    clearTimeout(timeout);
  }
}
