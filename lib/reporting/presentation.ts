export type MetaActionCategory = "conversions" | "traffic" | "engagement" | "other";

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function friendlyLandingPageLabel(value: string | number | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "(not set)") {
    return "Pagina necunoscuta";
  }

  let pathname = raw;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    pathname = raw.split("?")[0] || raw;
  }

  const segments = pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return "Homepage";
  }

  const lastMeaningfulSegment = segments[segments.length - 1]
    .replace(/\.(html|php|aspx?)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!lastMeaningfulSegment) {
    return "Homepage";
  }

  return `Pagina ${titleCase(lastMeaningfulSegment)}`;
}

export function metaActionCategory(
  actionType: string | number | null | undefined
): MetaActionCategory {
  const type = String(actionType ?? "").toLowerCase();

  if (
    type.includes("lead") ||
    type.includes("contact") ||
    type.includes("purchase") ||
    type.includes("messaging_conversation") ||
    type.includes("onsite_conversion.messaging") ||
    type.includes("custom_conversion") ||
    /(^|\.)custom(\.|$)/.test(type) ||
    type.includes("fb_pixel_custom")
  ) {
    return "conversions";
  }

  if (
    type.includes("link_click") ||
    type.includes("landing_page_view") ||
    type.includes("page_view") ||
    type.includes("view_content")
  ) {
    return "traffic";
  }

  if (
    type.includes("engagement") ||
    type.includes("video") ||
    type.includes("comment") ||
    type.includes("like") ||
    type.includes("share")
  ) {
    return "engagement";
  }

  return "other";
}
