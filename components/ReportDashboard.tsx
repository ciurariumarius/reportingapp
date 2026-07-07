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
import type { ReportResponse, SourceState } from "@/lib/types/report";

type ReportDashboardProps = {
  slug: string;
  initialClientName: string;
  initialLocale: "ro" | "en";
};

const ro = {
  report: "Raport marketing",
  period: "Perioada",
  last7: "Ultimele 7 zile",
  last30: "Ultimele 30 zile",
  thisMonth: "Luna curenta",
  previousMonth: "Luna trecuta",
  custom: "Custom",
  apply: "Aplica",
  totalSpend: "Buget cheltuit",
  totalClicks: "Clickuri totale",
  platformConversions: "Conversii raportate de platforme",
  websiteSessions: "Sesiuni pe site",
  websiteEvents: "Evenimente importante pe site",
  attribution:
    "Numerele pot diferi intre Google Ads, GA4 si Meta deoarece fiecare platforma foloseste propriul model de atribuire si propria logica de raportare. Folosim datele din platforme pentru evaluarea canalelor si GA4 pentru comportamentul pe site.",
  insights: "Monthly insights",
  wentWell: "Ce a mers bine",
  attention: "Ce necesita atentie",
  nextActions: "Actiuni recomandate",
  googleAds: "Google Ads",
  ga4: "Website / GA4",
  meta: "Meta Ads",
  empty: "Nu exista date pentru aceasta sectiune.",
  loading: "Se incarca raportul...",
  error: "Raportul nu poate fi incarcat.",
  kpis: "Indicatori",
  daily: "Evolutie zilnica",
  campaigns: "Campanii",
  conversions: "Conversii",
  devices: "Dispozitive",
  locations: "Locatii",
  channels: "Surse / medium",
  events: "Evenimente",
  landingPages: "Landing pages",
  actions: "Actiuni"
};

const en: typeof ro = {
  report: "Marketing report",
  period: "Period",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  previousMonth: "Previous month",
  custom: "Custom",
  apply: "Apply",
  totalSpend: "Spend",
  totalClicks: "Total clicks",
  platformConversions: "Platform-reported conversions",
  websiteSessions: "Website sessions",
  websiteEvents: "Website key events",
  attribution:
    "Numbers may differ between Google Ads, GA4, and Meta because each platform uses its own attribution model and reporting logic. We use platform data to evaluate each channel and GA4 to understand website behavior.",
  insights: "Monthly insights",
  wentWell: "What went well",
  attention: "What needs attention",
  nextActions: "Recommended next actions",
  googleAds: "Google Ads",
  ga4: "Website / GA4",
  meta: "Meta Ads",
  empty: "No data for this section.",
  loading: "Loading report...",
  error: "The report could not be loaded.",
  kpis: "KPIs",
  daily: "Daily trend",
  campaigns: "Campaigns",
  conversions: "Conversions",
  devices: "Devices",
  locations: "Locations",
  channels: "Source / medium",
  events: "Events",
  landingPages: "Landing pages",
  actions: "Actions"
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
  const copy = report?.client.locale === "en" || initialLocale === "en" ? en : ro;

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
    () => [
      {
        label: copy.totalSpend,
        value: formatCurrency(overview?.totalSpend ?? 0, currency),
        hint: "Google Ads + Meta"
      },
      {
        label: copy.totalClicks,
        value: formatNumber(overview?.totalClicks ?? 0),
        hint: "Google Ads + Meta"
      },
      {
        label: copy.platformConversions,
        value: formatNumber(overview?.platformReportedConversions ?? 0),
        hint: "Google Ads + Meta"
      },
      {
        label: copy.websiteSessions,
        value: formatNumber(overview?.websiteSessions ?? 0),
        hint: "GA4"
      },
      {
        label: copy.websiteEvents,
        value: formatNumber(overview?.websiteKeyEvents ?? 0),
        hint: "GA4"
      }
    ],
    [copy, currency, overview]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-digital">
            DigitalDot
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                {clientName}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{copy.report}</p>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overviewCards.map((card) => (
            <MetricCard
              hint={card.hint}
              key={card.label}
              label={card.label}
              value={card.value}
            />
          ))}
        </section>

        <p className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          {copy.attribution}
        </p>

        <InsightsSection copy={copy} report={report} />

        <PlatformSection
          copy={copy}
          status={report?.sources.googleAds}
          title={copy.googleAds}
        >
          {report?.googleAds ? (
            <>
              <KpiStrip
                currency={currency}
                items={[
                  ["Cost", report.googleAds.kpis.spend, "currency"],
                  ["Clickuri", report.googleAds.kpis.clicks],
                  ["CTR", report.googleAds.kpis.ctr, "percent"],
                  ["Conversii", report.googleAds.kpis.conversions],
                  ["CPA", report.googleAds.kpis.cpa, "currency"],
                  ["ROAS", report.googleAds.kpis.roas]
                ]}
              />
              <ChartBlock title={copy.daily}>
                <ResponsiveContainer height={280} width="100%">
                  <LineChart data={report.googleAds.daily}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="cost" name="Cost" stroke="#1c435e" />
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
                      ["cost", "Cost"],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", "CPA"],
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
                      ["cost", "Cost"],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", "CPA"]
                    ]
                  },
                  {
                    title: copy.locations,
                    rows: report.googleAds.locations,
                    columns: [
                      ["location", "Locatie"],
                      ["cost", "Cost"],
                      ["clicks", "Clickuri"],
                      ["conversions", "Conversii"],
                      ["cpa", "CPA"]
                    ]
                  }
                ]}
              />
            </>
          ) : (
            <EmptyState message={report?.sources.googleAds.message ?? copy.empty} />
          )}
        </PlatformSection>

        <PlatformSection copy={copy} status={report?.sources.ga4} title={copy.ga4}>
          {report?.ga4 ? (
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
                    <XAxis dataKey="date" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
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
          ) : (
            <EmptyState message={report?.sources.ga4.message ?? copy.empty} />
          )}
        </PlatformSection>

        <PlatformSection copy={copy} status={report?.sources.meta} title={copy.meta}>
          {report?.meta ? (
            <>
              <KpiStrip
                currency={currency}
                items={[
                  ["Spend", report.meta.kpis.spend, "currency"],
                  ["Reach", report.meta.kpis.reach],
                  ["Afisari", report.meta.kpis.impressions],
                  ["Clickuri link", report.meta.kpis.clicks],
                  ["Leads", report.meta.kpis.conversions],
                  ["Cost / lead", report.meta.kpis.cpa, "currency"]
                ]}
              />
              <ChartBlock title={copy.daily}>
                <ResponsiveContainer height={280} width="100%">
                  <LineChart data={report.meta.daily}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" minTickGap={24} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="spend" name="Spend" stroke="#1c435e" />
                    <Line dataKey="link_clicks" name="Clickuri" stroke="#0f766e" />
                    <Line dataKey="leads" name="Leads" stroke="#b45309" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBlock>
              <DataGrid
                blocks={[
                  {
                    title: copy.campaigns,
                    rows: report.meta.campaigns,
                    columns: [
                      ["campaign_name", "Campanie"],
                      ["spend", "Spend"],
                      ["reach", "Reach"],
                      ["link_clicks", "Clickuri"],
                      ["leads", "Leads"],
                      ["cost_per_lead", "Cost / lead"]
                    ]
                  },
                  {
                    title: copy.actions,
                    rows: report.meta.actions,
                    columns: [
                      ["action_type", "Action type"],
                      ["value", "Valoare"],
                      ["cost_per_action", "Cost / actiune"]
                    ]
                  }
                ]}
              />
            </>
          ) : (
            <EmptyState message={report?.sources.meta.message ?? copy.empty} />
          )}
        </PlatformSection>
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
    ["last7", copy.last7],
    ["last30", copy.last30],
    ["thisMonth", copy.thisMonth],
    ["previousMonth", copy.previousMonth],
    ["custom", copy.custom]
  ];

  return (
    <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {copy.period}
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map(([key, label]) => (
          <button
            className={
              key === preset
                ? "focus-ring rounded-md bg-digital px-3 py-2 text-sm font-semibold text-white"
                : "focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-digital"
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
            className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              onCustomChange({ ...customRange, startDate: event.target.value })
            }
            type="date"
            value={customRange.startDate}
          />
          <input
            className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              onCustomChange({ ...customRange, endDate: event.target.value })
            }
            type="date"
            value={customRange.endDate}
          />
          <button
            className="focus-ring rounded-md bg-digital px-3 py-2 text-sm font-semibold text-white"
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

function MetricCard({
  hint,
  label,
  value
}: {
  hint: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
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
  const insights = report?.insights;
  const items = [
    [copy.wentWell, insights?.whatWentWell],
    [copy.attention, insights?.whatNeedsAttention],
    [copy.nextActions, insights?.recommendedNextActions]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">{copy.insights}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {items.map(([title, text]) => (
          <div className="rounded-md border border-slate-200 p-4" key={title}>
            <h3 className="text-sm font-semibold text-digital">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text || copy.empty}
            </p>
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
          {status?.status ?? copy.loading}
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
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {blocks.map((block) => (
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
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {columns.map(([key]) => (
                    <td className="whitespace-nowrap px-4 py-3" key={key}>
                      {formatCell(row[key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                  Nu exista date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
      {message}
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

function formatCell(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return "-";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  return value;
}
