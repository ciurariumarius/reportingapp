"use client";

import { useMemo, useState } from "react";

type GoogleAdsScriptModalProps = {
  sheetUrl: string;
};

const PLACEHOLDER_SHEET_URL = "PASTE_GOOGLE_SHEET_URL_HERE";

export function GoogleAdsScriptModal({ sheetUrl }: GoogleAdsScriptModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const script = useMemo(() => buildGoogleAdsScript(sheetUrl), [sheetUrl]);

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <section className="rounded-md border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Google Ads Script
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Copiaza scriptul in Google Ads. In script trebuie schimbat doar
              `SPREADSHEET_URL`.
            </p>
          </div>
          <button
            className="focus-ring w-fit rounded-md border border-digital px-4 py-2 text-sm font-semibold text-digital hover:bg-digital-mist"
            onClick={() => setOpen(true)}
            type="button"
          >
            Vezi script
          </button>
        </div>
      </section>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
          role="dialog"
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-soft">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Google Ads Script pentru export in Sheet
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Creeaza automat taburile `gads_daily`, `gads_campaigns`,
                  `gads_conversions`, `gads_devices` si `gads_locations` pentru
                  ultimele 90 de zile.
                </p>
              </div>
              <button
                className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-digital hover:text-digital"
                onClick={() => setOpen(false)}
                type="button"
              >
                Inchide
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                Daca nu ai completat URL-ul de Google Sheet in setarile clientului,
                inlocuieste `PASTE_GOOGLE_SHEET_URL_HERE` cu URL-ul Sheetului tau
                inainte sa rulezi scriptul.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-slate-600">
                  Sheet URL folosit:{" "}
                  <strong>{sheetUrl.trim() || PLACEHOLDER_SHEET_URL}</strong>
                </span>
                <button
                  className="focus-ring rounded-md bg-digital px-4 py-2 text-sm font-semibold text-white hover:bg-digital-ink"
                  onClick={copyScript}
                  type="button"
                >
                  {copied ? "Copiat" : "Copiaza script"}
                </button>
              </div>

              <textarea
                className="h-[52vh] w-full resize-none rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-50"
                readOnly
                value={script}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function buildGoogleAdsScript(sheetUrl: string) {
  const safeSheetUrl = JSON.stringify(sheetUrl.trim() || PLACEHOLDER_SHEET_URL);

  return `/**
 * DigitalDot Google Ads export script.
 *
 * Replace only SPREADSHEET_URL, then run this inside the Google Ads account.
 * Schedule it daily. Each run refreshes the last 90 days.
 */
const SPREADSHEET_URL = ${safeSheetUrl};
const LOOKBACK_DAYS = 90;

const TABS = {
  daily: {
    name: "gads_daily",
    headers: [
      "date",
      "cost",
      "impressions",
      "clicks",
      "ctr",
      "avg_cpc",
      "conversions",
      "all_conversions",
      "conversion_value",
      "all_conversion_value"
    ]
  },
  campaigns: {
    name: "gads_campaigns",
    headers: [
      "date",
      "campaign_id",
      "campaign_name",
      "campaign_status",
      "cost",
      "impressions",
      "clicks",
      "ctr",
      "avg_cpc",
      "conversions",
      "all_conversions",
      "cpa",
      "conversion_value",
      "roas"
    ]
  },
  conversions: {
    name: "gads_conversions",
    headers: [
      "date",
      "campaign_id",
      "campaign_name",
      "conversion_action_name",
      "conversions",
      "all_conversions",
      "conversion_value",
      "all_conversion_value"
    ]
  },
  devices: {
    name: "gads_devices",
    headers: [
      "date",
      "device",
      "cost",
      "impressions",
      "clicks",
      "conversions",
      "all_conversions",
      "cpa"
    ]
  },
  locations: {
    name: "gads_locations",
    headers: [
      "date",
      "location",
      "cost",
      "impressions",
      "clicks",
      "conversions",
      "all_conversions",
      "cpa"
    ]
  }
};

function main() {
  if (!SPREADSHEET_URL || SPREADSHEET_URL === "PASTE_GOOGLE_SHEET_URL_HERE") {
    throw new Error("Replace SPREADSHEET_URL with the client Google Sheet URL.");
  }

  const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  const dateRange = getDateRange();

  writeSheet(spreadsheet, TABS.daily, getDailyRows(dateRange));
  writeSheet(spreadsheet, TABS.campaigns, getCampaignRows(dateRange));
  writeSheet(spreadsheet, TABS.conversions, getConversionRows(dateRange));
  writeSheet(spreadsheet, TABS.devices, getDeviceRows(dateRange));
  writeSheet(spreadsheet, TABS.locations, getLocationRows(dateRange));
}

function getDateRange() {
  const timeZone = AdsApp.currentAccount().getTimeZone();
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - LOOKBACK_DAYS + 1);

  return {
    start: Utilities.formatDate(start, timeZone, "yyyy-MM-dd"),
    end: Utilities.formatDate(end, timeZone, "yyyy-MM-dd")
  };
}

function getDailyRows(dateRange) {
  const query = \`
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.all_conversions_value
    FROM customer
    WHERE segments.date BETWEEN '\${dateRange.start}' AND '\${dateRange.end}'
    ORDER BY segments.date ASC
  \`;

  return rowsFromSearch(query, (row) => [
    row.segments.date,
    micros(row.metrics.costMicros),
    number(row.metrics.impressions),
    number(row.metrics.clicks),
    percent(row.metrics.ctr),
    micros(row.metrics.averageCpc),
    number(row.metrics.conversions),
    number(row.metrics.allConversions),
    number(row.metrics.conversionsValue),
    number(row.metrics.allConversionsValue)
  ]);
}

function getCampaignRows(dateRange) {
  const query = \`
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '\${dateRange.start}' AND '\${dateRange.end}'
    ORDER BY segments.date ASC
  \`;

  return rowsFromSearch(query, (row) => {
    const cost = micros(row.metrics.costMicros);
    const conversions = number(row.metrics.conversions);
    const value = number(row.metrics.conversionsValue);

    return [
      row.segments.date,
      row.campaign.id,
      row.campaign.name,
      row.campaign.status,
      cost,
      number(row.metrics.impressions),
      number(row.metrics.clicks),
      percent(row.metrics.ctr),
      micros(row.metrics.averageCpc),
      conversions,
      number(row.metrics.allConversions),
      safeDivide(cost, conversions),
      value,
      safeDivide(value, cost)
    ];
  });
}

function getConversionRows(dateRange) {
  const query = \`
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      segments.conversion_action_name,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.all_conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '\${dateRange.start}' AND '\${dateRange.end}'
      AND metrics.all_conversions > 0
    ORDER BY segments.date ASC
  \`;

  return rowsFromSearch(query, (row) => [
    row.segments.date,
    row.campaign.id,
    row.campaign.name,
    row.segments.conversionActionName || "Unknown conversion action",
    number(row.metrics.conversions),
    number(row.metrics.allConversions),
    number(row.metrics.conversionsValue),
    number(row.metrics.allConversionsValue)
  ]);
}

function getDeviceRows(dateRange) {
  const query = \`
    SELECT
      segments.date,
      segments.device,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions
    FROM customer
    WHERE segments.date BETWEEN '\${dateRange.start}' AND '\${dateRange.end}'
    ORDER BY segments.date ASC
  \`;

  return rowsFromSearch(query, (row) => {
    const cost = micros(row.metrics.costMicros);
    const conversions = number(row.metrics.conversions);

    return [
      row.segments.date,
      row.segments.device,
      cost,
      number(row.metrics.impressions),
      number(row.metrics.clicks),
      conversions,
      number(row.metrics.allConversions),
      safeDivide(cost, conversions)
    ];
  });
}

function getLocationRows(dateRange) {
  const query = \`
    SELECT
      segments.date,
      segments.geo_target_country,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions
    FROM geographic_view
    WHERE segments.date BETWEEN '\${dateRange.start}' AND '\${dateRange.end}'
    ORDER BY segments.date ASC
  \`;

  return rowsFromSearch(query, (row) => {
    const cost = micros(row.metrics.costMicros);
    const conversions = number(row.metrics.conversions);

    return [
      row.segments.date,
      row.segments.geoTargetCountry || "Unknown location",
      cost,
      number(row.metrics.impressions),
      number(row.metrics.clicks),
      conversions,
      number(row.metrics.allConversions),
      safeDivide(cost, conversions)
    ];
  });
}

function rowsFromSearch(query, mapper) {
  const iterator = AdsApp.search(query);
  const output = [];

  while (iterator.hasNext()) {
    output.push(mapper(iterator.next()));
  }

  return output;
}

function writeSheet(spreadsheet, tab, rows) {
  let sheet = spreadsheet.getSheetByName(tab.name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(tab.name);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, 1, tab.headers.length).setValues([tab.headers]);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, tab.headers.length).setValues(rows);
  }

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, tab.headers.length);
}

function micros(value) {
  return round(number(value) / 1000000);
}

function percent(value) {
  return round(number(value) * 100);
}

function number(value) {
  return Number(value || 0);
}

function safeDivide(numerator, denominator) {
  return denominator ? round(numerator / denominator) : 0;
}

function round(value) {
  return Math.round(number(value) * 100) / 100;
}
`;
}
