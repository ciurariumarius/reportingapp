"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Globe2,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import {
  getDefaultDateRange,
  getPresetDateRange,
  type DatePreset,
  type DateRange
} from "@/lib/date-ranges";
import type {
  AutomatedInsight,
  ReportResponse,
  SourceState,
  TrendStatus
} from "@/lib/types/report";

type ReportDashboardProps = {
  slug: string;
  initialClientName: string;
  initialLocale: "ro" | "en";
};

const ro = {
  report: "Raport de performanță",
  direction: "Marketing cu direcție",
  clarityLine: "Strategie clară. Execuție impecabilă. Rezultate măsurabile.",
  performanceSummary: "Direcția perioadei",
  budgetDirection: "Unde s-a dus bugetul",
  resultsProduced: "Ce rezultate a produs",
  ownerOverview: "Overview pentru owner",
  ownerOverviewHint: "Indicatorii principali pentru decizii rapide de business.",
  comparisonPeriod: "Comparat cu",
  verdict: "Verdict",
  period: "Perioadă",
  yesterday: "Ieri",
  thisWeek: "Săptămâna aceasta",
  last7: "Ultimele 7 zile",
  last30: "Ultimele 30 zile",
  thisMonth: "Luna curentă",
  previousMonth: "Luna trecută",
  custom: "Personalizat",
  apply: "Aplică",
  totalSpend: "Buget consumat",
  googleAdsCost: "Cost Google Ads",
  metaCost: "Cost Meta",
  totalMediaCost: "Cost total media",
  totalClicks: "Clickuri totale",
  googleAdsConversions: "Conversii Google Ads",
  metaConversions: "Conversii Meta",
  totalPlatformConversions: "Conversii platforme total",
  totalCostPerConversion: "Cost / conversie total",
  platform: "Platformă",
  cost: "Cost",
  clicks: "Clickuri",
  costPerConversion: "Cost / conv.",
  total: "Total",
  conversionBreakdown: "Detalii conversii",
  noConversionBreakdown: "Nu există conversii detaliate pentru această platformă.",
  allConversionsShort: "toate",
  platformConversions: "Conversii raportate de platforme",
  platformRevenue: "Valoare generată",
  platformValue: "Valoare raportată de platforme",
  purchases: "Achiziții",
  leads: "Lead-uri",
  costPerLead: "Cost / lead",
  costPerPurchase: "Cost / achiziție",
  roas: "ROAS",
  roasHint: "Valoare / buget",
  websiteSessions: "Sesiuni pe site",
  websiteTotalTraffic: "Trafic total site",
  websiteEvents: "Evenimente importante pe site",
  websiteTotalConversions: "Conversii totale site",
  websiteRevenue: "Venit GA4",
  platformConversionValue: "Valoare conversii platforme",
  totalRoas: "ROAS total",
  attribution:
    "Numerele pot diferi între Google Ads, GA4 și Meta deoarece fiecare platformă folosește propriul model de atribuire și propria logică de raportare. Folosim datele din platforme pentru evaluarea canalelor și GA4 pentru comportamentul pe site.",
  insights: "Insight-uri automate",
  wentWell: "Ce s-a îmbunătățit",
  attention: "Ce necesită atenție",
  nextActions: "Acțiuni recomandate",
  googleAds: "Google Ads",
  ga4: "Website / GA4",
  meta: "Meta Ads",
  sourceStatus: "Status surse",
  lastUpdated: "Ultima actualizare",
  empty: "Nu există date pentru această secțiune.",
  noPaidSources: "Fără date Google Ads / Meta",
  noGa4Data: "Fără date GA4",
  loading: "Se încarcă raportul...",
  error: "Raportul nu poate fi încărcat.",
  noComparison: "fără istoric",
  stable: "stabil",
  kpis: "Indicatori",
  daily: "Evoluție zilnică",
  campaigns: "Campanii",
  conversions: "Conversii",
  devices: "Dispozitive",
  locations: "Locații",
  channels: "Surse / medium",
  events: "Evenimente",
  landingPages: "Landing pages",
  actions: "Acțiuni",
  connected: "Conectat",
  missingConfig: "Neconfigurat",
  sourceEmpty: "Fără date",
  sourceError: "Eroare",
  sourceMock: "Demo",
  needsAttention: "Necesită atenție"
};

const en: typeof ro = {
  report: "Performance report",
  direction: "Marketing with direction",
  clarityLine: "Clear strategy. Sharp execution. Measurable results.",
  performanceSummary: "Period direction",
  budgetDirection: "Where the budget went",
  resultsProduced: "What it produced",
  ownerOverview: "Owner overview",
  ownerOverviewHint: "The main indicators for fast business decisions.",
  comparisonPeriod: "Compared with",
  verdict: "Verdict",
  period: "Period",
  yesterday: "Yesterday",
  thisWeek: "This week",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  previousMonth: "Previous month",
  custom: "Custom",
  apply: "Apply",
  totalSpend: "Spend",
  googleAdsCost: "Google Ads cost",
  metaCost: "Meta cost",
  totalMediaCost: "Total media cost",
  totalClicks: "Total clicks",
  googleAdsConversions: "Google Ads conversions",
  metaConversions: "Meta conversions",
  totalPlatformConversions: "Total platform conversions",
  totalCostPerConversion: "Total cost / conversion",
  platform: "Platform",
  cost: "Cost",
  clicks: "Clicks",
  costPerConversion: "Cost / conv.",
  total: "Total",
  conversionBreakdown: "Conversion details",
  noConversionBreakdown: "No detailed conversions for this platform.",
  allConversionsShort: "all",
  platformConversions: "Platform-reported conversions",
  platformRevenue: "Generated value",
  platformValue: "Platform-reported value",
  purchases: "Purchases",
  leads: "Leads",
  costPerLead: "Cost / lead",
  costPerPurchase: "Cost / purchase",
  roas: "ROAS",
  roasHint: "Value / spend",
  websiteSessions: "Website sessions",
  websiteTotalTraffic: "Total website traffic",
  websiteEvents: "Website key events",
  websiteTotalConversions: "Total website conversions",
  websiteRevenue: "GA4 revenue",
  platformConversionValue: "Platform conversion value",
  totalRoas: "Total ROAS",
  attribution:
    "Numbers may differ between Google Ads, GA4, and Meta because each platform uses its own attribution model and reporting logic. We use platform data to evaluate each channel and GA4 to understand website behavior.",
  insights: "Automated insights",
  wentWell: "What improved",
  attention: "What needs attention",
  nextActions: "Recommended next actions",
  googleAds: "Google Ads",
  ga4: "Website / GA4",
  meta: "Meta Ads",
  sourceStatus: "Source status",
  lastUpdated: "Last updated",
  empty: "No data for this section.",
  noPaidSources: "No Google Ads / Meta data",
  noGa4Data: "No GA4 data",
  loading: "Loading report...",
  error: "The report could not be loaded.",
  noComparison: "no history",
  stable: "stable",
  kpis: "KPIs",
  daily: "Daily trend",
  campaigns: "Campaigns",
  conversions: "Conversions",
  devices: "Devices",
  locations: "Locations",
  channels: "Source / medium",
  events: "Events",
  landingPages: "Landing pages",
  actions: "Actions",
  connected: "Connected",
  missingConfig: "Not configured",
  sourceEmpty: "No data",
  sourceError: "Error",
  sourceMock: "Demo",
  needsAttention: "Needs attention"
};

const statusClass: Record<SourceState["status"], string> = {
  mock: "bg-blue-50 text-blue-700",
  ready: "bg-emerald-50 text-emerald-700",
  missing_config: "bg-amber-50 text-amber-700",
  empty: "bg-slate-100 text-slate-600",
  error: "bg-red-50 text-red-700"
};

export function ReportDashboard({
  slug,
  initialClientName,
  initialLocale
}: ReportDashboardProps) {
  const [range, setRange] = useState<DateRange>(getDefaultDateRange());
  const [customRange, setCustomRange] = useState<DateRange>(range);
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const locale = report?.client.locale ?? initialLocale;
  const copy = locale === "en" ? en : ro;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(
      `/api/client/${slug}/report?startDate=${range.startDate}&endDate=${range.endDate}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? copy.error);
        }

        setReport(data as ReportResponse);
      })
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [copy.error, range.endDate, range.startDate, slug]);

  const clientName = report?.client.name ?? initialClientName;
  const currency = report?.client.currency ?? "RON";
  const reportType = report?.client.reportType ?? "lead";
  const isEcommerceReport = reportType === "ecommerce";
  const metaLabels =
    locale === "en"
      ? {
          impressions: "Impressions",
          linkClicks: "Link clicks",
          primary: isEcommerceReport ? "Purchases" : "Leads",
          cost: isEcommerceReport ? "Cost / purchase" : "Cost / lead",
          value: "Purchase value"
        }
      : {
          impressions: "Afișări",
          linkClicks: "Clickuri link",
          primary: isEcommerceReport ? "Achiziții" : "Leads",
          cost: isEcommerceReport ? "Cost / achiziție" : "Cost / lead",
          value: "Valoare achiziții"
  };
  const metaCampaignColumns: TableColumn[] = [
    ["campaign_name", "Campanie"],
    ["spend", copy.totalSpend, "currency"],
    ["reach", locale === "en" ? "Reach" : "Acoperire"],
    ["link_clicks", metaLabels.linkClicks],
    ["leads", metaLabels.primary],
    ["cost_per_lead", metaLabels.cost, "currency"],
    ...(isEcommerceReport
      ? [
          ["conversion_value", metaLabels.value, "currency"] as TableColumn,
          ["roas", "ROAS"] as [string, string]
        ]
      : [])
  ];
  const metaActionColumns: TableColumn[] = [
    ["action_name", locale === "en" ? "Action" : "Acțiune"],
    ["value", "Valoare"],
    ...(isEcommerceReport
      ? [["action_value", metaLabels.value, "currency"] as TableColumn]
      : []),
    ["cost_per_action", "Cost / acțiune", "currency"]
  ];

  function choosePreset(nextPreset: DatePreset) {
    setPreset(nextPreset);

    if (nextPreset === "custom") {
      return;
    }

    const nextRange = getPresetDateRange(nextPreset);
    setRange(nextRange);
    setCustomRange(nextRange);
  }

  function applyCustomRange() {
    setPreset("custom");
    setRange(customRange);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f7]">
      <header className="relative overflow-hidden bg-[#071111] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(54,180,167,0.22),transparent_32%),linear-gradient(135deg,rgba(28,67,94,0.55),transparent_48%)]" />
        <img
          alt=""
          aria-hidden="true"
          className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-25 mix-blend-screen lg:block"
          src="/branding/chess-hero-wide.png"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-6">
          <img
            alt="DigitalDot"
            className="h-9 w-auto object-contain"
            src="/branding/digitaldot-logo.png"
          />
          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#8fd8ce]">
                {copy.direction}
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                {report?.client.logoUrl ? (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-3 shadow-soft">
                    <img
                      alt={`Logo ${clientName}`}
                      className="max-h-full max-w-full object-contain"
                      src={report.client.logoUrl}
                    />
                  </div>
                ) : null}
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  {clientName}
                </h1>
              </div>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                {copy.report}
              </p>
              <p className="mt-4 max-w-2xl text-sm font-medium text-[#e5d5b8]">
                {copy.clarityLine}
              </p>
            </div>
            <DateRangeControls
              copy={copy}
              customRange={customRange}
              onApplyCustom={applyCustomRange}
              onCustomChange={setCustomRange}
              onPreset={choosePreset}
              preset={preset}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !report ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-soft">
            {copy.loading}
          </div>
        ) : null}

        {report ? (
          <ExecutiveSummary copy={copy} report={report} />
        ) : null}

        {report ? (
          <OwnerOverviewSection
            copy={copy}
            report={report}
          />
        ) : null}

        <InsightsSection copy={copy} report={report} />

        {report?.googleAds ? (
          <PlatformSection
            copy={copy}
            sourceKey="googleAds"
            status={report.sources.googleAds}
            title={copy.googleAds}
          >
            <>
              <ChartBlock title={copy.daily}>
                <ResponsiveContainer height={280} width="100%">
                  <LineChart data={report.googleAds.daily}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      minTickGap={24}
                      tickFormatter={(date) => formatShortDate(String(date), locale)}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => formatFriendlyDate(String(date), locale)}
                    />
                    <Legend />
                    <Line dataKey="cost" name={copy.totalSpend} stroke="#1c435e" />
                    <Line dataKey="clicks" name="Clickuri" stroke="#0f766e" />
                    <Line
                      dataKey="conversions"
                      name="Conversii"
                      stroke="#b45309"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBlock>
              <DataGrid
                currency={currency}
                blocks={[
                  {
                    title: copy.campaigns,
                    rows: report.googleAds.campaigns,
                    columns: [
                      ["campaign_name", "Campanie"],
                      ["cost", copy.totalSpend, "currency"],
                      ["conversions", "Conversii"],
                      [
                        "cpa",
                        isEcommerceReport ? copy.costPerPurchase : copy.costPerLead,
                        "currency"
                      ],
                      ["clicks", "Clickuri"],
                      ...(isEcommerceReport
                        ? [
                            [
                              "conversion_value",
                              copy.platformConversionValue,
                              "currency"
                            ] as [
                              string,
                              string,
                              "currency"
                            ],
                            ["roas", "ROAS"] as [string, string]
                          ]
                        : [])
                    ]
                  },
                  {
                    title: copy.conversions,
                    rows: visibleConversionRows(report.googleAds.conversions),
                    columns: [
                      ["conversion_action_name", "Acțiune"],
                      ["conversions", "Conversii"],
                      ["all_conversions", "Toate conversiile"],
                      ["conversion_value", "Valoare", "currency"]
                    ]
                  },
                  {
                    title: copy.locations,
                    rows: visibleLocationRows(report.googleAds.locations),
                    columns: [
                      ["location_name", "Locație"],
                      ["location_type", "Tip"],
                      ["cost", copy.totalSpend, "currency"],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      [
                        "cpa",
                        isEcommerceReport ? copy.costPerPurchase : copy.costPerLead,
                        "currency"
                      ]
                    ]
                  }
                ]}
              />
            </>
          </PlatformSection>
        ) : null}

        {report?.ga4 ? (
          <PlatformSection
            copy={copy}
            sourceKey="ga4"
            status={report.sources.ga4}
            title={copy.ga4}
          >
            <>
              <ChartBlock title={copy.daily}>
                <ResponsiveContainer height={280} width="100%">
                  <BarChart data={report.ga4.daily}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      minTickGap={24}
                      tickFormatter={(date) => formatShortDate(String(date), locale)}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => formatFriendlyDate(String(date), locale)}
                    />
                    <Legend />
                    <Bar dataKey="sessions" fill="#1c435e" name="Sesiuni" />
                    <Bar
                      dataKey="key_events"
                      fill="#0f766e"
                      name="Conversii website"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBlock>
              <DataGrid
                currency={currency}
                blocks={[
                  {
                    title: copy.channels,
                    rows: report.ga4.channels,
                    columns: [
                      ["source_medium", "Sursa / medium"],
                      ["sessions", "Sesiuni"],
                      ["key_events", "Conversii website"],
                      ["revenue", "Venit", "currency"]
                    ]
                  },
                  {
                    title: copy.landingPages,
                    rows: report.ga4.landingPages,
                    columns: [
                      ["landing_page", "Pagina"],
                      ["sessions", "Sesiuni"],
                      ["key_events", "Conversii website"],
                      ["engagement_rate", "Engagement"]
                    ]
                  },
                  {
                    title: "Conversii website",
                    rows: visibleGa4KeyEventRows(report.ga4.events),
                    columns: [
                      ["event_name", "Conversie"],
                      ["key_events", "Total conversii"]
                    ]
                  }
                ]}
              />
            </>
          </PlatformSection>
        ) : null}

        {report?.meta ? (
          <PlatformSection
            copy={copy}
            sourceKey="meta"
            status={report.sources.meta}
            title={copy.meta}
          >
            <>
              <ChartBlock title={copy.daily}>
                <ResponsiveContainer height={280} width="100%">
                  <LineChart data={report.meta.daily}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      minTickGap={24}
                      tickFormatter={(date) => formatShortDate(String(date), locale)}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => formatFriendlyDate(String(date), locale)}
                    />
                    <Legend />
                    <Line dataKey="spend" name={copy.totalSpend} stroke="#1c435e" />
                    <Line dataKey="link_clicks" name="Clickuri" stroke="#0f766e" />
                    <Line dataKey="leads" name={metaLabels.primary} stroke="#b45309" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBlock>
              <DataGrid
                currency={currency}
                blocks={[
                  {
                    title: copy.campaigns,
                    rows: report.meta.campaigns,
                    columns: metaCampaignColumns
                  },
                  {
                    title: copy.actions,
                    rows: report.meta.actions,
                    columns: metaActionColumns
                  }
                ]}
              />
            </>
          </PlatformSection>
        ) : null}

        {report ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-soft">
            {copy.attribution}
          </p>
        ) : null}

        {report ? <SourceStatusSection copy={copy} report={report} /> : null}
      </div>
    </main>
  );
}

function DateRangeControls({
  copy,
  customRange,
  onApplyCustom,
  onCustomChange,
  onPreset,
  preset
}: {
  copy: typeof ro;
  customRange: DateRange;
  onApplyCustom: () => void;
  onCustomChange: (range: DateRange) => void;
  onPreset: (preset: DatePreset) => void;
  preset: DatePreset;
}) {
  const presets: Array<[DatePreset, string]> = [
    ["yesterday", copy.yesterday],
    ["thisWeek", copy.thisWeek],
    ["last7", copy.last7],
    ["last30", copy.last30],
    ["thisMonth", copy.thisMonth],
    ["previousMonth", copy.previousMonth],
    ["custom", copy.custom]
  ];

  return (
    <div className="w-full max-w-md rounded-lg border border-white/15 bg-white/[0.08] p-3 backdrop-blur">
      <label
        className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300"
        htmlFor="report-period"
      >
        <CalendarDays aria-hidden="true" className="h-4 w-4 text-[#8fd8ce]" />
        {copy.period}
      </label>
      <div className="relative">
        <select
          className="focus-ring w-full appearance-none rounded-md border border-white/20 bg-white/10 px-3 py-2.5 pr-10 text-sm font-semibold text-white outline-none hover:border-[#8fd8ce]"
          id="report-period"
          onChange={(event) => onPreset(event.target.value as DatePreset)}
          value={preset}
        >
          {presets.map(([key, label]) => (
            <option className="bg-[#071111] text-white" key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fd8ce]"
        />
      </div>
      {preset === "custom" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="focus-ring rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-slate-950"
            onChange={(event) =>
              onCustomChange({ ...customRange, startDate: event.target.value })
            }
            type="date"
            value={customRange.startDate}
          />
          <input
            className="focus-ring rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-slate-950"
            onChange={(event) =>
              onCustomChange({ ...customRange, endDate: event.target.value })
            }
            type="date"
            value={customRange.endDate}
          />
          <button
            className="focus-ring rounded-md bg-[#8fd8ce] px-3 py-2 text-sm font-semibold text-[#071111]"
            onClick={onApplyCustom}
            type="button"
          >
            {copy.apply}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExecutiveSummary({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  const verdict = report.automatedInsights?.verdict;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-digital">
            {copy.performanceSummary}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {verdict?.title ?? copy.verdict}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {verdict?.message ?? copy.empty}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex gap-3">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-digital"
            />
            <div>
              <p>
                <span className="font-semibold text-slate-950">
                  {copy.period}:{" "}
                </span>
                {report.displayPeriod}
              </p>
              {report.comparisonRange ? (
                <p className="mt-1">
                  <span className="font-semibold text-slate-950">
                    {copy.comparisonPeriod}:{" "}
                  </span>
                  {report.displayComparisonPeriod ??
                    formatRange(report.comparisonRange, report.client.locale)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {verdict ? (
        <span
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${insightStatusClass(
            verdict.status
          )}`}
        >
          {trendStatusLabel(verdict.status, copy)}
        </span>
      ) : null}
    </section>
  );
}

type MetricIcon = "gads" | "ga4" | "meta";

type PaidPerformanceRow = {
  key: "googleAds" | "meta";
  label: string;
  tone: "google" | "meta";
  spend: number;
  conversions: number;
  clicks: number;
  costPerConversion: number;
  details: ConversionDetail[];
};

type ConversionDetail = {
  key: string;
  label: string;
  conversions: number;
  allConversions?: number;
  value?: number;
  costPerConversion?: number;
  actionType?: string;
};

function OwnerOverviewSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const currency = report.client.currency;
  const platformRows = paidPerformanceRows(report);
  const paid = report.ownerOverview.paid;
  const website = report.ownerOverview.website;
  const isEcommerceReport = report.client.reportType === "ecommerce";
  const metricItems = [
    [copy.totalMediaCost, formatCurrency(paid.totalSpend, currency)],
    [copy.totalPlatformConversions, formatNumber(paid.totalConversions)],
    [copy.totalCostPerConversion, formatCurrency(paid.costPerConversion, currency)],
    [copy.websiteTotalTraffic, formatNumber(website.sessions)],
    [copy.websiteTotalConversions, formatNumber(website.conversions)],
    ...(isEcommerceReport
      ? [
          [copy.websiteRevenue, formatCurrency(website.revenue, currency)],
          [copy.platformConversionValue, formatCurrency(paid.conversionValue, currency)],
          [copy.totalRoas, formatNumber(paid.roas)]
        ]
      : [])
  ];

  function toggleRow(key: string) {
    setExpandedRows((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-digital">
          {copy.ownerOverview}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {copy.resultsProduced}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          {report.ownerOverview.narrative}
        </p>
        <p className="mt-1 text-xs text-slate-500">{copy.ownerOverviewHint}</p>
      </div>
      <div className="p-5">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{copy.platform}</th>
                  <th className="px-4 py-3">{copy.cost}</th>
                  <th className="px-4 py-3">{copy.conversions}</th>
                  <th className="px-4 py-3">{copy.clicks}</th>
                  <th className="px-4 py-3">{copy.costPerConversion}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformRows.length ? (
                  platformRows.map((row) => {
                    const isExpanded = Boolean(expandedRows[row.key]);
                    const canExpand = row.details.length > 0;

                    return (
                      <Fragment key={row.key}>
                        <tr className="align-middle">
                          <td className="whitespace-nowrap px-4 py-3">
                            <button
                              className="focus-ring flex items-center gap-2 rounded-md text-left font-semibold text-slate-950 disabled:cursor-default disabled:opacity-100"
                              disabled={!canExpand}
                              onClick={() => toggleRow(row.key)}
                              type="button"
                            >
                              <ChevronDown
                                aria-hidden="true"
                                className={`h-4 w-4 text-slate-400 transition ${
                                  isExpanded ? "rotate-180" : ""
                                } ${canExpand ? "" : "opacity-0"}`}
                              />
                              <BrandBadge
                                compact
                                label={row.key === "googleAds" ? "GAds" : "Meta"}
                                tone={row.tone}
                              />
                              {row.label}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                            {formatCurrency(row.spend, currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatNumber(row.conversions)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatNumber(row.clicks)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatCurrency(row.costPerConversion, currency)}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td className="bg-slate-50 px-4 py-4" colSpan={5}>
                              <ConversionDetailsTable
                                copy={copy}
                                currency={currency}
                                details={row.details}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      {copy.noPaidSources}
                    </td>
                  </tr>
                )}
                {platformRows.length ? (
                  <tr className="bg-slate-50 font-semibold text-slate-950">
                    <td className="whitespace-nowrap px-4 py-3">{copy.total}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCurrency(paid.totalSpend, currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatNumber(paid.totalConversions)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatNumber(paid.totalClicks)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatCurrency(paid.costPerConversion, currency)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          {metricItems.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function paidPerformanceRows(report: ReportResponse): PaidPerformanceRow[] {
  return report.ownerOverview.platforms.map((platform) => ({
    key: platform.key,
    label: platform.label,
    tone: platform.key === "googleAds" ? "google" : "meta",
    spend: platform.spend,
    conversions: platform.conversions,
    clicks: platform.clicks,
    costPerConversion: platform.costPerConversion,
    details:
      platform.key === "googleAds"
        ? googleConversionDetails(report)
        : metaConversionDetails(report)
  }));
}

function googleConversionDetails(report: ReportResponse): ConversionDetail[] {
  return visibleConversionRows(report.googleAds?.conversions ?? []).map((row) => ({
    key: String(row.conversion_action_name),
    label: String(row.conversion_action_name ?? "Conversion"),
    conversions: Number(row.conversions ?? 0),
    allConversions: Number(row.all_conversions ?? 0),
    value: Number(row.conversion_value ?? 0)
  }));
}

function metaConversionDetails(report: ReportResponse): ConversionDetail[] {
  return (report.meta?.actions ?? [])
    .filter((row) => {
      const value = Number(row.value ?? 0);
      const isPrimary = row.is_primary === undefined || Number(row.is_primary) > 0;

      return value > 0 && isPrimary;
    })
    .map((row) => ({
      key: String(row.action_type ?? row.action_name),
      label: String(row.action_name ?? row.action_type ?? "Action"),
      conversions: Number(row.value ?? 0),
      value: Number(row.action_value ?? 0),
      costPerConversion: Number(row.cost_per_action ?? 0),
      actionType: String(row.action_type ?? "")
    }));
}

function ConversionDetailsTable({
  copy,
  currency,
  details
}: {
  copy: typeof ro;
  currency: string;
  details: ConversionDetail[];
}) {
  if (!details.length) {
    return <p className="text-sm text-slate-500">{copy.noConversionBreakdown}</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {copy.conversionBreakdown}
      </p>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">{copy.conversions}</th>
              <th className="px-3 py-2">{copy.total}</th>
              <th className="px-3 py-2">{copy.costPerConversion}</th>
              <th className="px-3 py-2">{copy.platformValue}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((detail) => (
              <tr key={detail.key}>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-950">{detail.label}</div>
                  {detail.actionType && detail.actionType !== detail.label ? (
                    <div className="mt-0.5 text-xs text-slate-500">
                      {detail.actionType}
                    </div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatNumber(detail.conversions)}
                  {detail.allConversions && detail.allConversions !== detail.conversions ? (
                      <span className="ml-2 text-xs text-slate-500">
                      {copy.allConversionsShort} {formatNumber(detail.allConversions)}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {detail.costPerConversion !== undefined
                    ? formatCurrency(detail.costPerConversion, currency)
                    : "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {detail.value ? formatCurrency(detail.value, currency) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourceStatusSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {copy.sourceStatus}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-digital" />
            {copy.lastUpdated}: {formatDateTime(report.lastUpdatedAt, report.client.locale)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {report.sourceSummary.map((source) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-3"
            key={source.key}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <SourceSummaryIcon sourceKey={source.key} />
                {source.label}
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusClass[source.status]
                }`}
              >
                {sourceStatusLabel(source.status, copy)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{source.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SourceSummaryIcon({ sourceKey }: { sourceKey: string }) {
  if (sourceKey === "googleAds") {
    return <BrandBadge compact label="GAds" tone="google" />;
  }

  if (sourceKey === "ga4") {
    return <BrandBadge compact label="GA4" tone="analytics" />;
  }

  if (sourceKey === "meta") {
    return <BrandBadge compact label="Meta" tone="meta" />;
  }

  return <Globe2 aria-hidden="true" className="h-4 w-4 text-digital" />;
}

function MetricIconView({ icon }: { icon: MetricIcon }) {
  if (icon === "gads") {
    return <BrandBadge label="GAds" tone="google" />;
  }

  if (icon === "ga4") {
    return <BrandBadge label="GA4" tone="analytics" />;
  }

  if (icon === "meta") {
    return <BrandBadge label="Meta" tone="meta" />;
  }

  return null;
}

function BrandBadge({
  compact = false,
  label,
  tone
}: {
  compact?: boolean;
  label: string;
  tone: "google" | "analytics" | "meta";
}) {
  const toneClass =
    tone === "meta"
      ? "bg-blue-50 text-blue-700"
      : tone === "analytics"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${toneClass} ${
        compact
          ? "h-6 min-w-6 px-1.5 text-[9px]"
          : "h-9 min-w-9 px-2 text-[11px]"
      }`}
    >
      {label}
    </span>
  );
}

function InsightsSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse | null;
}) {
  const insights = report?.automatedInsights;
  const groups: Array<[string, AutomatedInsight[] | undefined]> = [
    [copy.wentWell, insights?.improved],
    [copy.attention, insights?.attention],
    [copy.nextActions, insights?.nextActions]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">{copy.insights}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {groups.map(([title, items]) => (
          <div className="rounded-md border border-slate-200 p-4" key={title}>
            <h3 className="text-sm font-semibold text-digital">{title}</h3>
            <div className="mt-3 space-y-3">
              {items?.length ? (
                items.map((item) => (
                  <div key={`${title}-${item.title}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${insightDotClass(
                          item.status
                        )}`}
                      />
                      <p className="text-sm font-semibold text-slate-950">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">{copy.empty}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformSection({
  children,
  copy,
  sourceKey,
  status,
  title
}: {
  children: React.ReactNode;
  copy: typeof ro;
  sourceKey: "googleAds" | "ga4" | "meta";
  status?: SourceState;
  title: string;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white/90 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MetricIconView
              icon={
                sourceKey === "googleAds"
                  ? "gads"
                  : sourceKey === "ga4"
                    ? "ga4"
                    : "meta"
              }
            />
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          </div>
          {status ? <p className="mt-1 text-sm text-slate-500">{status.message}</p> : null}
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            status ? statusClass[status.status] : "bg-slate-100 text-slate-600"
          }`}
        >
          {status ? sourceStatusLabel(status.status, copy) : copy.loading}
        </span>
      </div>
      {children}
    </section>
  );
}

function ChartBlock({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <LineChartIcon aria-hidden="true" className="h-4 w-4 text-digital" />
        {title}
      </h3>
      {children}
    </div>
  );
}

type TableColumn = [string, string, ("currency" | "percent")?];

function DataGrid({
  blocks,
  currency
}: {
  blocks: Array<{
    title: string;
    rows: Array<Record<string, string | number>>;
    columns: TableColumn[];
  }>;
  currency: string;
}) {
  const visibleBlocks = blocks.filter((block) => block.rows.length > 0);

  if (!visibleBlocks.length) {
    return null;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {visibleBlocks.map((block) => (
        <DataTable
          columns={block.columns}
          currency={currency}
          key={block.title}
          rows={block.rows}
          title={block.title}
        />
      ))}
    </div>
  );
}

function DataTable({
  columns,
  currency,
  rows,
  title
}: {
  columns: TableColumn[];
  currency: string;
  rows: Array<Record<string, string | number>>;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map(([, label]) => (
                <th className="px-4 py-3" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {columns.map(([key, , kind]) => (
                    <td className="whitespace-nowrap px-4 py-3" key={key}>
                      {formatCell(row[key], kind, currency)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function visibleConversionRows(rows: Array<Record<string, string | number>>) {
  return rows
    .filter(
      (row) => Number(row.conversions ?? 0) > 0 || Number(row.all_conversions ?? 0) > 0
    )
    .sort((first, second) => {
      const firstConversions = Number(first.conversions ?? 0);
      const secondConversions = Number(second.conversions ?? 0);

      if (firstConversions === 0 && secondConversions > 0) return 1;
      if (firstConversions > 0 && secondConversions === 0) return -1;
      return secondConversions - firstConversions;
    });
}

function visibleLocationRows(rows: Array<Record<string, string | number>>) {
  return rows.filter((row) => {
    const name = String(row.location_name ?? row.location ?? "").trim();
    const type = String(row.location_type ?? "").trim().toLowerCase();
    const isCountry = ["country", "țară", "tara"].includes(type);

    return name && !/^location id \d+$/i.test(name) && !isCountry;
  });
}

function visibleGa4KeyEventRows(rows: Array<Record<string, string | number>>) {
  return rows
    .filter((row) => Number(row.key_events ?? 0) > 0)
    .sort((first, second) => Number(second.key_events ?? 0) - Number(first.key_events ?? 0));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1
  }).format(value);
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatFriendlyDate(value: string, locale: "ro" | "en") {
  const date = new Date(`${value}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).formatToParts(date);

  return parts
    .map((part) => {
      if (part.type !== "month") {
        return part.value;
      }

      return `${part.value.charAt(0).toUpperCase()}${part.value.slice(1)}`;
    })
    .join("");
}

function formatShortDate(value: string, locale: "ro" | "en") {
  const date = new Date(`${value}T00:00:00.000Z`);
  const formatted = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC"
  }).format(date);

  return formatted.replace(".", "");
}

function formatRange(range: DateRange, locale: "ro" | "en") {
  const start = new Date(`${range.startDate}T00:00:00.000Z`);
  const end = new Date(`${range.endDate}T00:00:00.000Z`);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${formatDay(range.startDate, locale)} - ${formatFriendlyDate(
      range.endDate,
      locale
    )}`;
  }

  if (sameYear) {
    return `${formatDayMonth(range.startDate, locale)} - ${formatFriendlyDate(
      range.endDate,
      locale
    )}`;
  }

  return `${formatFriendlyDate(range.startDate, locale)} - ${formatFriendlyDate(
    range.endDate,
    locale
  )}`;
}

function formatDay(value: string, locale: "ro" | "en") {
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    timeZone: "UTC"
  }).format(date);
}

function formatDayMonth(value: string, locale: "ro" | "en") {
  const date = new Date(`${value}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC"
  }).formatToParts(date);

  return parts
    .map((part) =>
      part.type === "month"
        ? `${part.value.charAt(0).toUpperCase()}${part.value.slice(1)}`
        : part.value
    )
    .join("");
}

function formatDateTime(value: string, locale: "ro" | "en") {
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(new Date(value));

  return parts
    .map((part) =>
      part.type === "month"
        ? `${part.value.charAt(0).toUpperCase()}${part.value.slice(1)}`
        : part.value
    )
    .join("");
}

function trendStatusLabel(status: TrendStatus, copy: typeof ro) {
  if (status === "good") {
    return copy.connected === "Connected" ? "Good" : "Bine";
  }

  if (status === "warning") {
    return copy.needsAttention;
  }

  return copy.stable;
}

function sourceStatusLabel(status: SourceState["status"], copy: typeof ro) {
  if (status === "ready") {
    return copy.connected;
  }

  if (status === "missing_config") {
    return copy.missingConfig;
  }

  if (status === "empty") {
    return copy.sourceEmpty;
  }

  if (status === "error") {
    return copy.sourceError;
  }

  return copy.sourceMock;
}

function insightStatusClass(status: TrendStatus) {
  if (status === "good") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "warning") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function insightDotClass(status: TrendStatus) {
  if (status === "good") {
    return "bg-emerald-500";
  }

  if (status === "warning") {
    return "bg-amber-500";
  }

  return "bg-slate-400";
}

function formatCell(
  value: string | number | undefined,
  kind: "currency" | "percent" | undefined,
  currency: string
) {
  if (value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "number") {
    if (kind === "currency") {
      return formatCurrency(value, currency);
    }

    if (kind === "percent") {
      return `${formatNumber(value)}%`;
    }

    return formatNumber(value);
  }

  return value;
}
