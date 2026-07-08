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
import { useEffect, useMemo, useState } from "react";
import {
  getDefaultDateRange,
  getPresetDateRange,
  type DatePreset,
  type DateRange
} from "@/lib/date-ranges";
import type {
  AutomatedInsight,
  MetricTrend,
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
  report: "Raport de performanta",
  direction: "Marketing cu directie",
  performanceSummary: "Directia perioadei",
  comparisonPeriod: "Comparat cu",
  verdict: "Verdict",
  period: "Perioada",
  yesterday: "Ieri",
  thisWeek: "Saptamana aceasta",
  last7: "Ultimele 7 zile",
  last30: "Ultimele 30 zile",
  thisMonth: "Luna curenta",
  previousMonth: "Luna trecuta",
  custom: "Personalizat",
  apply: "Aplica",
  totalSpend: "Buget consumat",
  totalClicks: "Clickuri totale",
  platformConversions: "Conversii raportate de platforme",
  platformRevenue: "Valoare generata",
  platformValue: "Valoare raportata de platforme",
  purchases: "Achizitii",
  leads: "Lead-uri",
  costPerLead: "Cost / lead",
  costPerPurchase: "Cost / achizitie",
  roas: "ROAS",
  roasHint: "Valoare / buget",
  websiteSessions: "Sesiuni pe site",
  websiteEvents: "Evenimente importante pe site",
  websiteRevenue: "Venit GA4",
  attribution:
    "Numerele pot diferi intre Google Ads, GA4 si Meta deoarece fiecare platforma foloseste propriul model de atribuire si propria logica de raportare. Folosim datele din platforme pentru evaluarea canalelor si GA4 pentru comportamentul pe site.",
  insights: "Insight-uri automate",
  wentWell: "Ce s-a imbunatatit",
  attention: "Ce necesita atentie",
  nextActions: "Actiuni recomandate",
  googleAds: "Google Ads",
  ga4: "Website / GA4",
  meta: "Meta Ads",
  sourceStatus: "Status surse",
  lastUpdated: "Ultima actualizare",
  empty: "Nu exista date pentru aceasta sectiune.",
  noPaidSources: "Fara date Google Ads / Meta",
  noGa4Data: "Fara date GA4",
  loading: "Se incarca raportul...",
  error: "Raportul nu poate fi incarcat.",
  noComparison: "fara istoric",
  stable: "stabil",
  kpis: "Indicatori",
  daily: "Evolutie zilnica",
  campaigns: "Campanii",
  conversions: "Conversii",
  devices: "Dispozitive",
  locations: "Locatii",
  channels: "Surse / medium",
  events: "Evenimente",
  landingPages: "Landing pages",
  actions: "Actiuni",
  connected: "Conectat",
  missingConfig: "Neconfigurat",
  sourceEmpty: "Fara date",
  sourceError: "Eroare",
  sourceMock: "Demo",
  needsAttention: "Necesita atentie"
};

const en: typeof ro = {
  report: "Performance report",
  direction: "Marketing with direction",
  performanceSummary: "Period direction",
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
  totalClicks: "Total clicks",
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
  websiteEvents: "Website key events",
  websiteRevenue: "GA4 revenue",
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
  const overview = report?.overview;
  const reportType = report?.client.reportType ?? "lead";
  const isEcommerceReport = reportType === "ecommerce";
  const comparison = report?.comparison;
  const platformValue =
    (report?.googleAds?.kpis.conversionValue ?? 0) +
    (report?.meta?.kpis.conversionValue ?? 0);
  const websiteRevenue = report?.ga4?.kpis.revenue ?? 0;
  const paidSourceHint = joinSourceLabels(
    [
      report?.googleAds ? "Google Ads" : null,
      report?.meta ? "Meta" : null
    ],
    copy.noPaidSources
  );
  const ga4SourceHint = report?.ga4 ? "GA4" : copy.noGa4Data;
  const ecommerceRoas =
    overview?.totalSpend && platformValue
      ? platformValue / overview.totalSpend
      : 0;
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
          impressions: "Afisari",
          linkClicks: "Clickuri link",
          primary: isEcommerceReport ? "Achizitii" : "Leads",
          cost: isEcommerceReport ? "Cost / achizitie" : "Cost / lead",
          value: "Valoare achizitii"
  };
  const metaKpiItems: Array<[string, number | undefined, ("currency" | "percent")?]> = [
    [copy.totalSpend, report?.meta?.kpis.spend, "currency"],
    [locale === "en" ? "Reach" : "Acoperire", report?.meta?.kpis.reach],
    [metaLabels.impressions, report?.meta?.kpis.impressions],
    [metaLabels.linkClicks, report?.meta?.kpis.clicks],
    [metaLabels.primary, report?.meta?.kpis.conversions],
    [metaLabels.cost, report?.meta?.kpis.cpa, "currency"],
    ...(isEcommerceReport
      ? [
          [metaLabels.value, report?.meta?.kpis.conversionValue, "currency"] as [
            string,
            number | undefined,
            "currency"
          ],
          ["ROAS", report?.meta?.kpis.roas] as [string, number | undefined]
        ]
      : [])
  ];
  const metaCampaignColumns: Array<[string, string]> = [
    ["campaign_name", "Campanie"],
    ["spend", copy.totalSpend],
    ["reach", locale === "en" ? "Reach" : "Acoperire"],
    ["link_clicks", metaLabels.linkClicks],
    ["leads", metaLabels.primary],
    ["cost_per_lead", metaLabels.cost],
    ...(isEcommerceReport
      ? [
          ["conversion_value", metaLabels.value] as [string, string],
          ["roas", "ROAS"] as [string, string]
        ]
      : [])
  ];
  const metaActionColumns: Array<[string, string]> = [
    ["action_type", locale === "en" ? "Action type" : "Tip actiune"],
    ["value", "Valoare"],
    ...(isEcommerceReport ? [["action_value", metaLabels.value] as [string, string]] : []),
    ["cost_per_action", "Cost / actiune"]
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

  const overviewCards = useMemo(
    () =>
      isEcommerceReport
        ? [
            {
              label: copy.totalSpend,
              value: formatCurrency(overview?.totalSpend ?? 0, currency),
              hint: paidSourceHint,
              trend: comparison?.totalSpend
            },
            {
              label: copy.platformValue,
              value: formatCurrency(platformValue, currency),
              hint: paidSourceHint,
              trend: comparison?.platformValue
            },
            {
              label: copy.purchases,
              value: formatNumber(overview?.platformReportedConversions ?? 0),
              hint: paidSourceHint,
              trend: comparison?.primaryResults
            },
            {
              label: copy.roas,
              value: formatNumber(ecommerceRoas),
              hint: copy.roasHint,
              trend: comparison?.roas
            },
            {
              label: copy.websiteSessions,
              value: formatNumber(overview?.websiteSessions ?? 0),
              hint: ga4SourceHint,
              trend: comparison?.websiteSessions
            },
            {
              label: copy.websiteRevenue,
              value: formatCurrency(websiteRevenue, currency),
              hint: ga4SourceHint,
              trend: comparison?.websiteRevenue
            }
          ]
        : [
            {
              label: copy.totalSpend,
              value: formatCurrency(overview?.totalSpend ?? 0, currency),
              hint: paidSourceHint,
              trend: comparison?.totalSpend
            },
            {
              label: copy.leads,
              value: formatNumber(overview?.platformReportedConversions ?? 0),
              hint: paidSourceHint,
              trend: comparison?.primaryResults
            },
            {
              label: copy.costPerLead,
              value: formatCurrency(comparison?.costPerResult.current ?? 0, currency),
              hint: paidSourceHint,
              trend: comparison?.costPerResult
            },
            {
              label: copy.websiteSessions,
              value: formatNumber(overview?.websiteSessions ?? 0),
              hint: ga4SourceHint,
              trend: comparison?.websiteSessions
            },
            {
              label: copy.websiteEvents,
              value: formatNumber(overview?.websiteKeyEvents ?? 0),
              hint: ga4SourceHint,
              trend: comparison?.websiteKeyEvents
            }
          ],
    [
      comparison,
      copy,
      currency,
      ecommerceRoas,
      ga4SourceHint,
      isEcommerceReport,
      overview,
      paidSourceHint,
      platformValue,
      websiteRevenue
    ]
  );

  return (
    <main className="min-h-screen bg-[#f5f7f7]">
      <header className="relative overflow-hidden bg-[#071111] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(54,180,167,0.22),transparent_32%),linear-gradient(135deg,rgba(28,67,94,0.55),transparent_48%)]" />
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
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
                {clientName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                {copy.report}
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

        <section
          className={`grid gap-4 md:grid-cols-2 ${
            isEcommerceReport ? "xl:grid-cols-6" : "xl:grid-cols-5"
          }`}
        >
          {overviewCards.map((card) => (
            <MetricCard
              hint={card.hint}
              key={card.label}
              label={card.label}
              trend={card.trend}
              value={card.value}
              copy={copy}
            />
          ))}
        </section>

        <InsightsSection copy={copy} report={report} />

        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-soft">
          {copy.attribution}
        </p>

        {report ? <SourceStatusSection copy={copy} report={report} /> : null}

        {report?.googleAds ? (
          <PlatformSection
            copy={copy}
            status={report.sources.googleAds}
            title={copy.googleAds}
          >
            <>
              <KpiStrip
                currency={currency}
                items={[
                  [copy.totalSpend, report.googleAds.kpis.spend, "currency"],
                  ["Clickuri", report.googleAds.kpis.clicks],
                  ["CTR", report.googleAds.kpis.ctr, "percent"],
                  ["Conversii", report.googleAds.kpis.conversions],
                  [
                    isEcommerceReport ? copy.costPerPurchase : copy.costPerLead,
                    report.googleAds.kpis.cpa,
                    "currency"
                  ],
                  ["ROAS", report.googleAds.kpis.roas]
                ]}
              />
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
                blocks={[
                  {
                    title: copy.campaigns,
                    rows: report.googleAds.campaigns,
                    columns: [
                      ["campaign_name", "Campanie"],
                      ["cost", copy.totalSpend],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", isEcommerceReport ? copy.costPerPurchase : copy.costPerLead],
                      ["roas", "ROAS"]
                    ]
                  },
                  {
                    title: copy.conversions,
                    rows: report.googleAds.conversions,
                    columns: [
                      ["conversion_action_name", "Actiune"],
                      ["conversions", "Conversii"],
                      ["all_conversions", "Toate conversiile"],
                      ["conversion_value", "Valoare"]
                    ]
                  },
                  {
                    title: copy.devices,
                    rows: report.googleAds.devices,
                    columns: [
                      ["device", "Dispozitiv"],
                      ["cost", copy.totalSpend],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", isEcommerceReport ? copy.costPerPurchase : copy.costPerLead]
                    ]
                  },
                  {
                    title: copy.locations,
                    rows: report.googleAds.locations,
                    columns: [
                      ["location", "Locatie"],
                      ["cost", copy.totalSpend],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", isEcommerceReport ? copy.costPerPurchase : copy.costPerLead]
                    ]
                  }
                ]}
              />
            </>
          </PlatformSection>
        ) : null}

        {report?.ga4 ? (
          <PlatformSection copy={copy} status={report.sources.ga4} title={copy.ga4}>
            <>
              <KpiStrip
                currency={currency}
                items={[
                  ["Utilizatori", report.ga4.kpis.users],
                  ["Sesiuni", report.ga4.kpis.sessions],
                  ["Sesiuni engaged", report.ga4.kpis.engagedSessions],
                  ["Rata engagement", report.ga4.kpis.engagementRate, "percent"],
                  ["Evenimente cheie", report.ga4.kpis.keyEvents],
                  ["Venit", report.ga4.kpis.revenue, "currency"]
                ]}
              />
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
                    <Bar dataKey="key_events" fill="#0f766e" name="Evenimente" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBlock>
              <DataGrid
                blocks={[
                  {
                    title: copy.channels,
                    rows: report.ga4.channels,
                    columns: [
                      ["source_medium", "Sursa / medium"],
                      ["sessions", "Sesiuni"],
                      ["key_events", "Evenimente"],
                      ["revenue", "Venit"]
                    ]
                  },
                  {
                    title: copy.landingPages,
                    rows: report.ga4.landingPages,
                    columns: [
                      ["landing_page", "Pagina"],
                      ["sessions", "Sesiuni"],
                      ["key_events", "Evenimente"],
                      ["engagement_rate", "Engagement"]
                    ]
                  },
                  {
                    title: copy.events,
                    rows: report.ga4.events,
                    columns: [
                      ["event_name", "Eveniment"],
                      ["event_count", "Total"],
                      ["key_events", "Evenimente cheie"]
                    ]
                  }
                ]}
              />
            </>
          </PlatformSection>
        ) : null}

        {report?.meta ? (
          <PlatformSection copy={copy} status={report.sources.meta} title={copy.meta}>
            <>
              <KpiStrip
                currency={currency}
                items={metaKpiItems}
              />
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
    <div className="w-full max-w-2xl rounded-lg border border-white/15 bg-white/[0.08] p-3 backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {copy.period}
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map(([key, label]) => (
          <button
            className={
              key === preset
                ? "focus-ring rounded-md bg-[#8fd8ce] px-3 py-2 text-sm font-semibold text-[#071111]"
                : "focus-ring rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:border-[#8fd8ce]"
            }
            key={key}
            onClick={() => onPreset(key)}
            type="button"
          >
            {label}
          </button>
        ))}
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
          <p>
            <span className="font-semibold text-slate-950">{copy.period}: </span>
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
          <p className="mt-1 text-sm text-slate-500">
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
              <p className="text-sm font-semibold text-slate-950">{source.label}</p>
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

function MetricCard({
  copy,
  hint,
  label,
  trend,
  value
}: {
  copy: typeof ro;
  hint: string;
  label: string;
  trend?: MetricTrend;
  value: string;
}) {
  const trendText = trend ? formatTrend(trend, copy) : null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {trendText ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${insightStatusClass(
              trend?.status ?? "neutral"
            )}`}
          >
            {trendText}
          </span>
        ) : null}
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </article>
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
  status,
  title
}: {
  children: React.ReactNode;
  copy: typeof ro;
  status?: SourceState;
  title: string;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
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

function KpiStrip({
  currency,
  items
}: {
  currency: string;
  items: Array<[string, number | undefined, ("currency" | "percent")?]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map(([label, value, kind]) => (
        <div className="rounded-md bg-slate-50 p-3" key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {kind === "currency"
              ? formatCurrency(value ?? 0, currency)
              : kind === "percent"
                ? `${formatNumber(value ?? 0)}%`
                : formatNumber(value ?? 0)}
          </p>
        </div>
      ))}
    </div>
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
      <h3 className="mb-3 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </div>
  );
}

function DataGrid({
  blocks
}: {
  blocks: Array<{
    title: string;
    rows: Array<Record<string, string | number>>;
    columns: Array<[string, string]>;
  }>;
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
  rows,
  title
}: {
  columns: Array<[string, string]>;
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
                  {columns.map(([key]) => (
                    <td className="whitespace-nowrap px-4 py-3" key={key}>
                      {formatCell(row[key])}
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

function joinSourceLabels(sources: Array<string | null>, fallback: string) {
  const activeSources = sources.filter(Boolean);
  return activeSources.length ? activeSources.join(" + ") : fallback;
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
  return `${formatFriendlyDate(range.startDate, locale)} - ${formatFriendlyDate(
    range.endDate,
    locale
  )}`;
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

function formatTrend(trend: MetricTrend, copy: typeof ro) {
  if (trend.percentChange === null) {
    return trend.previous === 0 && trend.current === 0 ? copy.stable : copy.noComparison;
  }

  if (trend.direction === "flat") {
    return copy.stable;
  }

  const arrow = trend.direction === "up" ? "↑" : "↓";
  return `${arrow} ${Math.abs(trend.percentChange).toLocaleString("ro-RO")}%`;
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

function formatCell(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  return value;
}
