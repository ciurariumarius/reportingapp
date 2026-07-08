import "server-only";
import type { DateRange } from "../date-ranges";
import type { GoogleAdsReport, PlatformKpis, SourceState } from "../types/report";
import { missingGoogleAds, round } from "./mock-data";

type GoogleAdsSheetResult = {
  state: SourceState;
  report?: GoogleAdsReport;
};

const REQUIRED_TABS = [
  { name: "gads_daily", headers: ["date", "cost", "impressions", "clicks"] },
  {
    name: "gads_campaigns",
    headers: ["date", "campaign_id", "campaign_name", "cost"]
  },
  {
    name: "gads_conversions",
    headers: ["date", "conversion_action_name", "conversions"]
  },
  { name: "gads_devices", headers: ["date", "device", "cost"] },
  { name: "gads_locations", headers: ["date", "location", "cost"] }
];

export function extractGoogleSheetId(sheetUrl: string | null | undefined) {
  const value = sheetUrl?.trim();

  if (!value) {
    return null;
  }

  const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  return /^[a-zA-Z0-9-_]{20,}$/.test(value) ? value : null;
}

function csvUrl(sheetId: string, sheetName: string) {
  const params = new URLSearchParams({
    tqx: "out:csv",
    sheet: sheetName
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params}`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      value += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim()));
}

function firstCsvRow(text: string) {
  return parseCsv(text)[0]?.map((value) => value.trim().toLowerCase()) ?? [];
}

async function fetchTabCsv(sheetId: string, sheetName: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(csvUrl(sheetId, sheetName), {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Google Sheets a raspuns cu status ${response.status}.`);
    }

    const text = await response.text();

    if (!text.trim() || text.trimStart().startsWith("<")) {
      throw new Error("Sheetul nu poate fi citit ca CSV.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTabHeader(sheetId: string, sheetName: string) {
  return firstCsvRow(await fetchTabCsv(sheetId, sheetName));
}

function safeMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Conexiunea catre Google Sheets a expirat.";
    }

    return error.message;
  }

  return "Nu am putut testa Google Ads Sheet.";
}

function parseNumber(value: string | undefined) {
  const normalized = (value ?? "").trim().replace(/\s/g, "");

  if (!normalized) {
    return 0;
  }

  if (normalized.includes(",") && normalized.includes(".")) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    return Number(
      lastComma > lastDot
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "")
    ) || 0;
  }

  if (normalized.includes(",")) {
    return Number(normalized.replace(",", ".")) || 0;
  }

  return Number(normalized) || 0;
}

function rowObjects(text: string) {
  const [headers = [], ...rows] = parseCsv(text);
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());

  return rows.map((row) =>
    Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, row[index]?.trim() ?? ""])
    )
  );
}

function inRange(row: Record<string, string>, range: DateRange) {
  const date = row.date;
  return date >= range.startDate && date <= range.endDate;
}

function sumRows(rows: Array<Record<string, string>>, key: string) {
  return rows.reduce((sum, row) => sum + parseNumber(row[key]), 0);
}

function calcCtr(clicks: number, impressions: number) {
  return impressions ? round((clicks / impressions) * 100) : 0;
}

function calcCpc(spend: number, clicks: number) {
  return clicks ? round(spend / clicks) : 0;
}

function calcCpa(spend: number, conversions: number) {
  return conversions ? round(spend / conversions) : 0;
}

function calcRoas(value: number, spend: number) {
  return spend ? round(value / spend) : 0;
}

function groupBy<T extends Record<string, string>>(rows: T[], keyFor: (row: T) => string) {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = keyFor(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return groups;
}

function mapDaily(rows: Array<Record<string, string>>) {
  return [...groupBy(rows, (row) => row.date).entries()]
    .map(([date, dateRows]) => {
      const cost = round(sumRows(dateRows, "cost"));
      const impressions = Math.round(sumRows(dateRows, "impressions"));
      const clicks = Math.round(sumRows(dateRows, "clicks"));
      const conversions = round(sumRows(dateRows, "conversions"), 2);
      const allConversions = round(sumRows(dateRows, "all_conversions"), 2);
      const conversionValue = round(sumRows(dateRows, "conversion_value"));
      const allConversionValue = round(sumRows(dateRows, "all_conversion_value"));

      return {
        date,
        cost,
        impressions,
        clicks,
        ctr: calcCtr(clicks, impressions),
        avg_cpc: calcCpc(cost, clicks),
        conversions,
        all_conversions: allConversions,
        conversion_value: conversionValue,
        all_conversion_value: allConversionValue
      };
    })
    .sort((first, second) => String(first.date).localeCompare(String(second.date)));
}

function mapCampaigns(rows: Array<Record<string, string>>) {
  return [...groupBy(rows, (row) => `${row.campaign_id}:${row.campaign_name}`).values()]
    .map((campaignRows) => {
      const cost = round(sumRows(campaignRows, "cost"));
      const impressions = Math.round(sumRows(campaignRows, "impressions"));
      const clicks = Math.round(sumRows(campaignRows, "clicks"));
      const conversions = round(sumRows(campaignRows, "conversions"), 2);
      const allConversions = round(sumRows(campaignRows, "all_conversions"), 2);
      const conversionValue = round(sumRows(campaignRows, "conversion_value"));

      return {
        campaign_id: campaignRows[0].campaign_id,
        campaign_name: campaignRows[0].campaign_name,
        campaign_status: campaignRows[0].campaign_status,
        cost,
        impressions,
        clicks,
        ctr: calcCtr(clicks, impressions),
        avg_cpc: calcCpc(cost, clicks),
        conversions,
        all_conversions: allConversions,
        cpa: calcCpa(cost, conversions),
        conversion_value: conversionValue,
        roas: calcRoas(conversionValue, cost)
      };
    })
    .sort((first, second) => Number(second.cost) - Number(first.cost));
}

function mapConversions(rows: Array<Record<string, string>>) {
  return [...groupBy(rows, (row) => row.conversion_action_name).entries()]
    .map(([conversionActionName, conversionRows]) => ({
      conversion_action_name: conversionActionName,
      conversions: round(sumRows(conversionRows, "conversions"), 2),
      all_conversions: round(sumRows(conversionRows, "all_conversions"), 2),
      conversion_value: round(sumRows(conversionRows, "conversion_value")),
      all_conversion_value: round(sumRows(conversionRows, "all_conversion_value"))
    }))
    .sort((first, second) => Number(second.conversions) - Number(first.conversions));
}

function mapBreakdown(rows: Array<Record<string, string>>, key: "device" | "location") {
  return [...groupBy(rows, (row) => row[key]).entries()]
    .map(([name, breakdownRows]) => {
      const cost = round(sumRows(breakdownRows, "cost"));
      const conversions = round(sumRows(breakdownRows, "conversions"), 2);

      return {
        [key]: name,
        cost,
        impressions: Math.round(sumRows(breakdownRows, "impressions")),
        clicks: Math.round(sumRows(breakdownRows, "clicks")),
        conversions,
        all_conversions: round(sumRows(breakdownRows, "all_conversions"), 2),
        cpa: calcCpa(cost, conversions)
      };
    })
    .sort((first, second) => Number(second.cost) - Number(first.cost));
}

function buildKpis(daily: Array<Record<string, string | number>>): PlatformKpis {
  const spend = round(daily.reduce((sum, row) => sum + Number(row.cost ?? 0), 0));
  const impressions = daily.reduce((sum, row) => sum + Number(row.impressions ?? 0), 0);
  const clicks = daily.reduce((sum, row) => sum + Number(row.clicks ?? 0), 0);
  const conversions = round(
    daily.reduce((sum, row) => sum + Number(row.conversions ?? 0), 0),
    2
  );
  const allConversions = round(
    daily.reduce((sum, row) => sum + Number(row.all_conversions ?? 0), 0),
    2
  );
  const conversionValue = round(
    daily.reduce((sum, row) => sum + Number(row.conversion_value ?? 0), 0)
  );

  return {
    spend,
    impressions,
    clicks,
    ctr: calcCtr(clicks, impressions),
    cpc: calcCpc(spend, clicks),
    conversions,
    allConversions,
    conversionValue,
    cpa: calcCpa(spend, conversions),
    roas: calcRoas(conversionValue, spend)
  };
}

export async function fetchGoogleAdsSheetReport(
  sheetUrl: string | null,
  range: DateRange
): Promise<GoogleAdsSheetResult> {
  const sheetId = extractGoogleSheetId(sheetUrl);

  if (!sheetId) {
    return { state: missingGoogleAds };
  }

  try {
    const [dailyCsv, campaignsCsv, conversionsCsv, devicesCsv, locationsCsv] =
      await Promise.all([
        fetchTabCsv(sheetId, "gads_daily"),
        fetchTabCsv(sheetId, "gads_campaigns"),
        fetchTabCsv(sheetId, "gads_conversions"),
        fetchTabCsv(sheetId, "gads_devices"),
        fetchTabCsv(sheetId, "gads_locations")
      ]);

    const dailyRows = rowObjects(dailyCsv).filter((row) => inRange(row, range));
    const campaignRows = rowObjects(campaignsCsv).filter((row) => inRange(row, range));
    const conversionRows = rowObjects(conversionsCsv).filter((row) => inRange(row, range));
    const deviceRows = rowObjects(devicesCsv).filter((row) => inRange(row, range));
    const locationRows = rowObjects(locationsCsv).filter((row) => inRange(row, range));
    const daily = mapDaily(dailyRows);

    if (!daily.length) {
      return {
        state: {
          status: "empty",
          message: "Google Ads Sheet nu are date pentru perioada selectata."
        }
      };
    }

    return {
      state: {
        status: "ready",
        message: "Date Google Ads live din Google Sheet."
      },
      report: {
        kpis: buildKpis(daily),
        daily,
        campaigns: mapCampaigns(campaignRows),
        conversions: mapConversions(conversionRows),
        devices: mapBreakdown(deviceRows, "device"),
        locations: mapBreakdown(locationRows, "location")
      }
    };
  } catch (error) {
    return {
      state: {
        status: "error",
        message: safeMessage(error)
      }
    };
  }
}

export async function testGoogleAdsSheetConnection(sheetUrl: string | null) {
  const sheetId = extractGoogleSheetId(sheetUrl);

  if (!sheetId) {
    return { ok: false, state: missingGoogleAds };
  }

  try {
    const missingTabs: string[] = [];

    for (const tab of REQUIRED_TABS) {
      const header = await fetchTabHeader(sheetId, tab.name);
      const hasHeaders = tab.headers.every((requiredHeader) =>
        header.includes(requiredHeader)
      );

      if (!hasHeaders) {
        missingTabs.push(tab.name);
      }
    }

    if (missingTabs.length) {
      return {
        ok: false,
        state: {
          status: "error" as const,
          message: `Lipsesc tab-uri sau header-ele scriptului: ${missingTabs.join(", ")}.`
        }
      };
    }

    return {
      ok: true,
      state: {
        status: "ready" as const,
        message: "Google Ads Sheet este accesibil si are tab-urile corecte."
      }
    };
  } catch (error) {
    return {
      ok: false,
      state: {
        status: "error" as const,
        message: safeMessage(error)
      }
    };
  }
}
