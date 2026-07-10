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
import { useEffect, useState } from "react";
import {
  getDefaultDateRange,
  getPreviousEquivalentDateRange,
  getPresetDateRange,
  type DatePreset,
  type DateRange
} from "@/lib/date-ranges";
import {
  friendlyLandingPageLabel,
  metaActionCategory,
  type MetaActionCategory
} from "@/lib/reporting/presentation";
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
  direction: "Marketing cu direcție",
  executiveSummary: "Rezumat executiv",
  budgetDirection: "Unde s-a dus bugetul",
  resultsProduced: "Ce rezultate a produs",
  ownerOverview: "Overview pentru owner",
  ownerOverviewHint: "Indicatorii principali pentru decizii rapide de business.",
  clientWebsite: "Website",
  statusGood: "Campaniile sunt active și generează date utile",
  statusPartial: "Raport parțial: unele surse necesită verificare",
  statusNoData: "Așteptăm date relevante în perioada selectată",
  comparisonPeriod: "Comparat cu",
  comparisonToggle: "Activează comparația",
  comparisonStart: "Start comparație",
  comparisonEnd: "Final comparație",
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
  totalMediaCost: "Cost: Google Ads + Facebook Ads",
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
  metaAttributionWindow: "Atribuire Meta: 1 zi click",
  investedBudgetHelp: "Investiție cumulată în Google Ads și Facebook Ads.",
  platformConversionsHelp: "Acțiuni urmărite în platformele de promovare.",
  costPerConversionHelp: "Cost mediu pentru o acțiune urmărită.",
  websiteTrafficHelp: "Sesiuni măsurate în GA4 pentru perioada analizată.",
  websiteConversionsHelp: "Totalul tuturor evenimentelor marcate ca key events în GA4.",
  adsChannelBreakdown: "Canale ads detaliat",
  googleOwnerTitle: "Google Ads pe scurt",
  googleOwnerSubtitle:
    "Cost, clickuri și conversii din campaniile Google Ads în perioada selectată.",
  metaOwnerTitle: "Facebook Ads pe scurt",
  metaOwnerSubtitle:
    "Cost, clickuri și acțiuni/conversii din campaniile Facebook Ads în perioada selectată.",
  channelCampaignsSummary: "Campanii principale",
  channelConversionsSummary: "Conversii / acțiuni",
  cpc: "CPC",
  outboundClicks: "Clickuri outbound",
  landingPageViews: "Landing page views",
  actionsConversionSummary: "Acțiuni / conversii",
  actionsConversionHelp:
    "Platformele și GA4 pot atribui diferit, de aceea le afișăm separat.",
  platformActionsShort: "Platforme",
  websiteConversionsShort: "Website",
  channelComparison: "Rolul fiecărui canal",
  channel: "Canal",
  campaignRole: "Rol în campanie",
  mainResult: "Rezultat principal",
  interpretation: "Interpretare",
  googleRole: "Cerere activă",
  googleInterpretation: "Utilizatorii caută activ serviciile sau produsele promovate.",
  metaRole: "Vizibilitate + retargeting",
  metaInterpretation: "Bun pentru awareness, trafic și reactivarea audiențelor calde.",
  ga4Role: "Validare trafic",
  ga4Interpretation: "Arată comportamentul pe site după ce utilizatorii ajung din campanii.",
  mainChartTitle: "Evoluția conversiilor și a traficului",
  observations: "Ce observăm în această perioadă",
  optimizeNext: "Ce optimizăm mai departe",
  finalConclusion: "Concluzie",
  detailGoogleTitle: "Detalii Google Ads — campanii, costuri și conversii",
  detailGoogleSubtitle: "Date utile pentru analiza internă și optimizarea campaniilor Search.",
  detailMetaTitle: "Detalii Meta Ads — trafic, interacțiuni și retargeting",
  detailMetaSubtitle: "Meta Ads susține vizibilitatea brandului, traficul către site și reactivarea audiențelor calde.",
  detailWebsiteTitle: "Detalii website — trafic, pagini și comportament",
  detailWebsiteSubtitle: "Aceste date arată cum se comportă utilizatorii după ce ajung pe site.",
  detailTrackingTitle: "Status tehnic și sincronizare date",
  detailTrackingSubtitle: "Informații despre conexiunile de date și ultima actualizare a raportului.",
  trafficActions: "Trafic",
  engagementActions: "Interacțiuni",
  conversionActions: "Conversii importante",
  otherActions: "Alte acțiuni",
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
  websiteTotalConversions: "Total key events GA4",
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
  direction: "Marketing with direction",
  executiveSummary: "Executive summary",
  budgetDirection: "Where the budget went",
  resultsProduced: "What it produced",
  ownerOverview: "Owner overview",
  ownerOverviewHint: "The main indicators for fast business decisions.",
  clientWebsite: "Website",
  statusGood: "Campaigns are active and producing useful data",
  statusPartial: "Partial report: some sources need review",
  statusNoData: "Waiting for relevant data in the selected period",
  comparisonPeriod: "Compared with",
  comparisonToggle: "Enable comparison",
  comparisonStart: "Comparison start",
  comparisonEnd: "Comparison end",
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
  totalMediaCost: "Cost: Google Ads + Facebook Ads",
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
  metaAttributionWindow: "Meta attribution: 1-day click",
  investedBudgetHelp: "Combined investment in Google Ads and Facebook Ads.",
  platformConversionsHelp: "Tracked actions reported by advertising platforms.",
  costPerConversionHelp: "Average cost for one tracked action.",
  websiteTrafficHelp: "Sessions measured in GA4 for the selected period.",
  websiteConversionsHelp: "Total of all events marked as key events in GA4.",
  adsChannelBreakdown: "Ads channel breakdown",
  googleOwnerTitle: "Google Ads at a glance",
  googleOwnerSubtitle:
    "Cost, clicks and conversions from Google Ads campaigns in the selected period.",
  metaOwnerTitle: "Facebook Ads at a glance",
  metaOwnerSubtitle:
    "Cost, clicks and actions/conversions from Facebook Ads campaigns in the selected period.",
  channelCampaignsSummary: "Main campaigns",
  channelConversionsSummary: "Conversions / actions",
  cpc: "CPC",
  outboundClicks: "Outbound clicks",
  landingPageViews: "Landing page views",
  actionsConversionSummary: "Actions / conversions",
  actionsConversionHelp:
    "Platforms and GA4 can attribute differently, so they are shown separately.",
  platformActionsShort: "Platforms",
  websiteConversionsShort: "Website",
  channelComparison: "Role of each channel",
  channel: "Channel",
  campaignRole: "Campaign role",
  mainResult: "Main result",
  interpretation: "Interpretation",
  googleRole: "Active demand",
  googleInterpretation: "Users are actively searching for the promoted services or products.",
  metaRole: "Visibility + retargeting",
  metaInterpretation: "Useful for awareness, traffic and reactivating warm audiences.",
  ga4Role: "Traffic validation",
  ga4Interpretation: "Shows how users behave after arriving from campaigns.",
  mainChartTitle: "Conversions and traffic trend",
  observations: "What we observe in this period",
  optimizeNext: "What we optimize next",
  finalConclusion: "Conclusion",
  detailGoogleTitle: "Google Ads details — campaigns, costs and conversions",
  detailGoogleSubtitle: "Useful data for internal analysis and Search campaign optimization.",
  detailMetaTitle: "Meta Ads details — traffic, interactions and retargeting",
  detailMetaSubtitle: "Meta Ads supports brand visibility, website traffic and warm audience reactivation.",
  detailWebsiteTitle: "Website details — traffic, pages and behavior",
  detailWebsiteSubtitle: "These data show how users behave after they reach the website.",
  detailTrackingTitle: "Technical status and data sync",
  detailTrackingSubtitle: "Information about data connections and the latest report update.",
  trafficActions: "Traffic",
  engagementActions: "Engagement",
  conversionActions: "Important conversions",
  otherActions: "Other actions",
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
  websiteTotalConversions: "Total GA4 key events",
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
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonRange, setComparisonRange] = useState<DateRange>(
    getPreviousEquivalentDateRange(range)
  );
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
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate
    });

    if (comparisonEnabled) {
      params.set("compare", "true");
      params.set("comparisonStartDate", comparisonRange.startDate);
      params.set("comparisonEndDate", comparisonRange.endDate);
    }

    fetch(`/api/client/${slug}/report?${params.toString()}`, {
      signal: controller.signal
    })
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
  }, [
    comparisonEnabled,
    comparisonRange.endDate,
    comparisonRange.startDate,
    copy.error,
    range.endDate,
    range.startDate,
    slug
  ]);

  const clientName = report?.client.name ?? initialClientName;
  const currency = report?.client.currency ?? "RON";
  const reportType = report?.client.reportType ?? "lead";
  const isEcommerceReport = reportType === "ecommerce";
  const metaLabels =
    locale === "en"
      ? {
          impressions: "Impressions",
          linkClicks: copy.outboundClicks,
          primary: isEcommerceReport ? "Purchases" : "Leads",
          cost: copy.cpc,
          value: "Purchase value"
        }
      : {
          impressions: "Afișări",
          linkClicks: copy.outboundClicks,
          primary: isEcommerceReport ? "Achiziții" : "Leads",
          cost: copy.cpc,
          value: "Valoare achiziții"
  };
  const metaCampaignColumns: TableColumn[] = [
    ["campaign_name", "Campanie"],
    ["spend", copy.totalSpend, "currency"],
    ["reach", locale === "en" ? "Reach" : "Acoperire"],
    ["link_clicks", metaLabels.linkClicks],
    ["landing_page_views", copy.landingPageViews],
    ["cpc", metaLabels.cost, "currency"],
    ["leads", metaLabels.primary],
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
    setComparisonRange(getPreviousEquivalentDateRange(nextRange));
  }

  function applyCustomRange() {
    setPreset("custom");
    setRange(customRange);
    setComparisonRange(getPreviousEquivalentDateRange(customRange));
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
            </div>
            <DateRangeControls
              comparisonEnabled={comparisonEnabled}
              comparisonRange={comparisonRange}
              copy={copy}
              customRange={customRange}
              onApplyCustom={applyCustomRange}
              onComparisonChange={setComparisonRange}
              onComparisonEnabledChange={setComparisonEnabled}
              onCustomChange={setCustomRange}
              onPreset={choosePreset}
              preset={preset}
              report={report}
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

        {report ? <OwnerKpiCards copy={copy} report={report} /> : null}

        {report ? (
          <OwnerAdsChannelSections
            copy={copy}
            currency={currency}
            isEcommerceReport={isEcommerceReport}
            metaActionColumns={metaActionColumns}
            report={report}
          />
        ) : null}

        {report ? <ChannelComparisonSection copy={copy} report={report} /> : null}

        {report ? <OwnerTrendChart copy={copy} report={report} /> : null}

        {report ? <ObservationsSection copy={copy} report={report} /> : null}

        {report ? <OptimizationSection copy={copy} report={report} /> : null}

        {report ? <ConclusionSection copy={copy} report={report} /> : null}

        {report ? (
          <div className="space-y-4">
            <DetailAccordion
              subtitle={copy.detailGoogleSubtitle}
              title={copy.detailGoogleTitle}
            >
              <GoogleAdsDetails
                copy={copy}
                currency={currency}
                isEcommerceReport={isEcommerceReport}
                report={report}
              />
            </DetailAccordion>
            <DetailAccordion subtitle={copy.detailMetaSubtitle} title={copy.detailMetaTitle}>
              <MetaAdsDetails
                columns={metaCampaignColumns}
                copy={copy}
                currency={currency}
                metaActionColumns={metaActionColumns}
                metaLabels={metaLabels}
                report={report}
              />
            </DetailAccordion>
            <DetailAccordion
              subtitle={copy.detailWebsiteSubtitle}
              title={copy.detailWebsiteTitle}
            >
              <WebsiteDetails copy={copy} currency={currency} report={report} />
            </DetailAccordion>
            <DetailAccordion
              subtitle={copy.detailTrackingSubtitle}
              title={copy.detailTrackingTitle}
            >
              <SourceStatusSection copy={copy} report={report} />
            </DetailAccordion>
          </div>
        ) : null}

        {report ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-soft">
            {copy.attribution}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function DateRangeControls({
  comparisonEnabled,
  comparisonRange,
  copy,
  customRange,
  onApplyCustom,
  onComparisonChange,
  onComparisonEnabledChange,
  onCustomChange,
  onPreset,
  preset,
  report
}: {
  comparisonEnabled: boolean;
  comparisonRange: DateRange;
  copy: typeof ro;
  customRange: DateRange;
  onApplyCustom: () => void;
  onComparisonChange: (range: DateRange) => void;
  onComparisonEnabledChange: (enabled: boolean) => void;
  onCustomChange: (range: DateRange) => void;
  onPreset: (preset: DatePreset) => void;
  preset: DatePreset;
  report: ReportResponse | null;
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
      <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          checked={comparisonEnabled}
          className="h-4 w-4 rounded border-white/30 bg-white/10"
          onChange={(event) => onComparisonEnabledChange(event.target.checked)}
          type="checkbox"
        />
        {copy.comparisonToggle}
      </label>
      {comparisonEnabled ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              {copy.comparisonStart}
            </span>
            <input
              className="focus-ring w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-slate-950"
              onChange={(event) =>
                onComparisonChange({
                  ...comparisonRange,
                  startDate: event.target.value
                })
              }
              type="date"
              value={comparisonRange.startDate}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              {copy.comparisonEnd}
            </span>
            <input
              className="focus-ring w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-slate-950"
              onChange={(event) =>
                onComparisonChange({
                  ...comparisonRange,
                  endDate: event.target.value
                })
              }
              type="date"
              value={comparisonRange.endDate}
            />
          </label>
        </div>
      ) : null}
      {report ? (
        <div className="mt-3 rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-sm leading-6 text-slate-200">
          <p>
            <span className="font-semibold text-white">{copy.period}: </span>
            {report.displayPeriod}
          </p>
          {report.comparisonRange ? (
            <p>
              <span className="font-semibold text-white">
                {copy.comparisonPeriod}:{" "}
              </span>
              {report.displayComparisonPeriod ??
                formatRange(report.comparisonRange, report.client.locale)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OwnerKpiCards({ copy, report }: { copy: typeof ro; report: ReportResponse }) {
  const currency = report.client.currency;
  const paid = report.ownerOverview.paid;
  const website = report.ownerOverview.website;
  const items = [
    {
      label: copy.totalMediaCost,
      value: formatCurrency(paid.totalSpend, currency),
      description: copy.investedBudgetHelp
    },
    {
      label: copy.websiteTotalTraffic,
      value: formatNumber(website.sessions),
      description: copy.websiteTrafficHelp
    },
    {
      label: copy.actionsConversionSummary,
      value: `${formatNumber(paid.totalConversions)} / ${formatNumber(
        website.conversions
      )}`,
      description: copy.actionsConversionHelp,
      details: [
        `${copy.platformActionsShort}: ${formatNumber(paid.totalConversions)}`,
        `${copy.websiteConversionsShort}: ${formatNumber(website.conversions)}`
      ]
    },
    {
      label: copy.totalCostPerConversion,
      value: formatCurrency(paid.costPerConversion, currency),
      description: copy.costPerConversionHelp
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
          key={item.label}
        >
          <p className="text-sm font-semibold text-slate-600">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          {"details" in item && item.details?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.details.map((detail) => (
                <span
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  key={detail}
                >
                  {detail}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
        </div>
      ))}
    </section>
  );
}

function OwnerAdsChannelSections({
  copy,
  currency,
  isEcommerceReport,
  metaActionColumns,
  report
}: {
  copy: typeof ro;
  currency: string;
  isEcommerceReport: boolean;
  metaActionColumns: TableColumn[];
  report: ReportResponse;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-950">
        {copy.adsChannelBreakdown}
      </h2>
      <div className="grid gap-4 xl:grid-cols-2">
        <OwnerAdsChannelCard
          campaignColumns={[
            ["campaign_name", "Campanie"],
            ["cost", copy.cost, "currency"],
            ["clicks", copy.clicks],
            ["avg_cpc", copy.cpc, "currency"],
            ["conversions", copy.conversions]
          ]}
          campaigns={report.googleAds?.campaigns ?? []}
          conversionColumns={[
            ["conversion_action_name", "Acțiune"],
            ["conversions", copy.conversions],
            ["all_conversions", copy.allConversionsShort]
          ]}
          conversions={visibleConversionRows(report.googleAds?.conversions ?? [])}
          copy={copy}
          currency={currency}
          kpis={[
            {
              label: copy.cost,
              value: formatCurrency(report.googleAds?.kpis.spend ?? 0, currency)
            },
            {
              label: copy.clicks,
              value: formatNumber(report.googleAds?.kpis.clicks ?? 0)
            },
            {
              label: copy.cpc,
              value: formatCurrency(report.googleAds?.kpis.cpc ?? 0, currency)
            },
            {
              label: copy.conversions,
              value: formatNumber(report.googleAds?.kpis.conversions ?? 0)
            }
          ]}
          subtitle={copy.googleOwnerSubtitle}
          title={copy.googleOwnerTitle}
        />
        <OwnerAdsChannelCard
          campaignColumns={[
            ["campaign_name", "Campanie"],
            ["spend", copy.cost, "currency"],
            ["link_clicks", copy.outboundClicks],
            ["landing_page_views", copy.landingPageViews],
            ["cpc", copy.cpc, "currency"],
            ["leads", copy.conversions],
            ["cost_per_lead", copy.costPerConversion, "currency"],
            ...(isEcommerceReport
              ? [
                  ["conversion_value", copy.platformConversionValue, "currency"] as TableColumn,
                  ["roas", "ROAS"] as TableColumn
                ]
              : [])
          ]}
          campaigns={report.meta?.campaigns ?? []}
          conversionColumns={metaActionColumns}
          conversions={ownerMetaConversionRows(report.meta?.actions ?? [])}
          copy={copy}
          currency={currency}
          kpis={[
            {
              label: copy.cost,
              value: formatCurrency(report.meta?.kpis.spend ?? 0, currency)
            },
            {
              label: copy.outboundClicks,
              value: formatNumber(report.meta?.kpis.clicks ?? 0)
            },
            {
              label: copy.cpc,
              value: formatCurrency(report.meta?.kpis.cpc ?? 0, currency)
            },
            {
              label: copy.landingPageViews,
              value: formatNumber(report.meta?.kpis.landingPageViews ?? 0)
            },
            {
              label: copy.conversions,
              value: formatNumber(report.meta?.kpis.conversions ?? 0)
            }
          ]}
          subtitle={copy.metaOwnerSubtitle}
          title={copy.metaOwnerTitle}
        />
      </div>
    </section>
  );
}

function OwnerAdsChannelCard({
  campaignColumns,
  campaigns,
  conversionColumns,
  conversions,
  copy,
  currency,
  kpis,
  subtitle,
  title
}: {
  campaignColumns: TableColumn[];
  campaigns: Array<Record<string, string | number>>;
  conversionColumns: TableColumn[];
  conversions: Array<Record<string, string | number>>;
  copy: typeof ro;
  currency: string;
  kpis: Array<{ label: string; value: string }>;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {kpis.map((item) => (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {conversions.length ? (
          <DataTable
            columns={conversionColumns}
            currency={currency}
            rows={conversions.slice(0, 5)}
            title={copy.channelConversionsSummary}
          />
        ) : (
          <OwnerEmptyTable message={copy.empty} title={copy.channelConversionsSummary} />
        )}
        {campaigns.length ? (
          <DataTable
            columns={campaignColumns}
            currency={currency}
            rows={campaigns.slice(0, 5)}
            title={copy.channelCampaignsSummary}
          />
        ) : (
          <OwnerEmptyTable message={copy.empty} title={copy.channelCampaignsSummary} />
        )}
      </div>
    </article>
  );
}

function OwnerEmptyTable({ message, title }: { message: string; title: string }) {
  return (
    <div className="rounded-md border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      <p className="px-4 py-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function ChannelComparisonSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  const rows = channelComparisonRows(report, copy);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">
        {copy.channelComparison}
      </h2>
      <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{copy.channel}</th>
                <th className="px-4 py-3">{copy.campaignRole}</th>
                <th className="px-4 py-3">{copy.mainResult}</th>
                <th className="px-4 py-3">{copy.interpretation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr className="align-top" key={row.channel}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                    {row.channel}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.role}</td>
                  <td className="px-4 py-3 text-slate-700">{row.result}</td>
                  <td className="px-4 py-3 text-slate-600">{row.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function OwnerTrendChart({ copy, report }: { copy: typeof ro; report: ReportResponse }) {
  const rows = ownerTrendRows(report);

  if (!rows.length) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">{copy.mainChartTitle}</h2>
      <div className="mt-4">
        <ResponsiveContainer height={300} width="100%">
          <LineChart data={rows}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tickFormatter={(date) => formatShortDate(String(date), report.client.locale)}
            />
            <YAxis yAxisId="traffic" />
            <YAxis orientation="right" yAxisId="conversions" />
            <Tooltip
              labelFormatter={(date) =>
                formatFriendlyDate(String(date), report.client.locale)
              }
            />
            <Legend />
            <Line
              dataKey="website_sessions"
              name={copy.websiteTotalTraffic}
              stroke="#1c435e"
              strokeWidth={2}
              yAxisId="traffic"
            />
            <Line
              dataKey="platform_conversions"
              name={copy.conversionActions}
              stroke="#0f766e"
              strokeWidth={2}
              yAxisId="conversions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ObservationsSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  const observations = [
    ...(report.automatedInsights?.improved ?? []),
    ...(report.automatedInsights?.attention ?? [])
  ].slice(0, 4);

  return (
    <InsightListSection
      copy={copy}
      emptyText={copy.empty}
      items={observations}
      title={copy.observations}
    />
  );
}

function OptimizationSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  return (
    <InsightListSection
      copy={copy}
      emptyText={copy.empty}
      items={report.automatedInsights?.nextActions ?? []}
      title={copy.optimizeNext}
    />
  );
}

function InsightListSection({
  copy,
  emptyText,
  items,
  title
}: {
  copy: typeof ro;
  emptyText: string;
  items: AutomatedInsight[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length ? (
          items.map((item) => (
            <div className="rounded-md border border-slate-200 p-4" key={item.title}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${insightDotClass(item.status)}`} />
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${insightStatusClass(
                  item.status
                )}`}
              >
                {trendStatusLabel(item.status, copy)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-600">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function ConclusionSection({
  copy,
  report
}: {
  copy: typeof ro;
  report: ReportResponse;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">{copy.finalConclusion}</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
        {ownerConclusion(report)}
      </p>
    </section>
  );
}

function DetailAccordion({
  children,
  subtitle,
  title
}: {
  children: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white shadow-soft">
      <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 p-5">
        <span>
          <span className="block text-lg font-semibold text-slate-950">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">{subtitle}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-slate-100 p-5">{children}</div>
    </details>
  );
}

function GoogleAdsDetails({
  copy,
  currency,
  isEcommerceReport,
  report
}: {
  copy: typeof ro;
  currency: string;
  isEcommerceReport: boolean;
  report: ReportResponse;
}) {
  if (!report.googleAds) {
    return <DataUnavailable copy={copy} />;
  }

  return (
    <div className="space-y-4">
      <ChartBlock title={copy.daily}>
        <ResponsiveContainer height={280} width="100%">
          <LineChart data={report.googleAds.daily}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tickFormatter={(date) => formatShortDate(String(date), report.client.locale)}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) =>
                formatFriendlyDate(String(date), report.client.locale)
              }
            />
            <Legend />
            <Line dataKey="cost" name={copy.totalSpend} stroke="#1c435e" />
            <Line dataKey="clicks" name={copy.clicks} stroke="#0f766e" />
            <Line dataKey="conversions" name={copy.conversions} stroke="#b45309" />
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
              ["conversions", copy.conversions],
              [
                "cpa",
                isEcommerceReport ? copy.costPerPurchase : copy.costPerLead,
                "currency"
              ],
              ["clicks", copy.clicks],
              ...(isEcommerceReport
                ? [
                    [
                      "conversion_value",
                      copy.platformConversionValue,
                      "currency"
                    ] as TableColumn,
                    ["roas", "ROAS"] as TableColumn
                  ]
                : [])
            ]
          },
          {
            title: copy.conversions,
            rows: visibleConversionRows(report.googleAds.conversions),
            columns: [
              ["conversion_action_name", "Acțiune"],
              ["conversions", copy.conversions],
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
              ["clicks", copy.clicks],
              ["conversions", copy.conversions],
              [
                "cpa",
                isEcommerceReport ? copy.costPerPurchase : copy.costPerLead,
                "currency"
              ]
            ]
          }
        ]}
      />
    </div>
  );
}

function MetaAdsDetails({
  columns,
  copy,
  currency,
  metaActionColumns,
  metaLabels,
  report
}: {
  columns: TableColumn[];
  copy: typeof ro;
  currency: string;
  metaActionColumns: TableColumn[];
  metaLabels: {
    impressions: string;
    linkClicks: string;
    primary: string;
    cost: string;
    value: string;
  };
  report: ReportResponse;
}) {
  if (!report.meta) {
    return <DataUnavailable copy={copy} />;
  }

  return (
    <div className="space-y-4">
      <ChartBlock title={copy.daily}>
        <ResponsiveContainer height={280} width="100%">
          <LineChart data={report.meta.daily}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tickFormatter={(date) => formatShortDate(String(date), report.client.locale)}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) =>
                formatFriendlyDate(String(date), report.client.locale)
              }
            />
            <Legend />
            <Line dataKey="spend" name={copy.totalSpend} stroke="#1c435e" />
            <Line dataKey="link_clicks" name={copy.outboundClicks} stroke="#0f766e" />
            <Line
              dataKey="landing_page_views"
              name={copy.landingPageViews}
              stroke="#7c3aed"
            />
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
            columns
          },
          ...metaActionBlocks(report.meta.actions, copy, metaActionColumns)
        ]}
      />
    </div>
  );
}

function WebsiteDetails({
  copy,
  currency,
  report
}: {
  copy: typeof ro;
  currency: string;
  report: ReportResponse;
}) {
  if (!report.ga4) {
    return <DataUnavailable copy={copy} />;
  }

  return (
    <div className="space-y-4">
      <ChartBlock title={copy.daily}>
        <ResponsiveContainer height={280} width="100%">
          <BarChart data={report.ga4.daily}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              minTickGap={24}
              tickFormatter={(date) => formatShortDate(String(date), report.client.locale)}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) =>
                formatFriendlyDate(String(date), report.client.locale)
              }
            />
            <Legend />
            <Bar dataKey="sessions" fill="#1c435e" name={copy.websiteTotalTraffic} />
            <Bar
              dataKey="key_events"
              fill="#0f766e"
              name={copy.websiteTotalConversions}
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
              ["key_events", copy.websiteTotalConversions],
              ["revenue", "Venit", "currency"]
            ]
          },
          {
            title: copy.landingPages,
            rows: friendlyGa4LandingRows(report.ga4.landingPages),
            columns: [
              ["landing_page_label", "Pagina"],
              ["landing_page", "URL"],
              ["sessions", "Sesiuni"],
              ["key_events", copy.websiteTotalConversions],
              ["engagement_rate", "Engagement"]
            ]
          },
          {
            title: copy.websiteTotalConversions,
            rows: visibleGa4KeyEventRows(report.ga4.events),
            columns: [
              ["event_name", "Conversie"],
              ["key_events", "Total conversii"]
            ]
          }
        ]}
      />
    </div>
  );
}

function DataUnavailable({ copy }: { copy: typeof ro }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {copy.empty}
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
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
    </div>
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

function ownerMetaConversionRows(rows: Array<Record<string, string | number>>) {
  return rows
    .filter(
      (row) =>
        Number(row.value ?? 0) > 0 && metaActionCategory(row.action_type) === "conversions"
    )
    .sort((first, second) => Number(second.value ?? 0) - Number(first.value ?? 0));
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

function channelComparisonRows(report: ReportResponse, copy: typeof ro) {
  const currency = report.client.currency;
  const google = report.ownerOverview.platforms.find(
    (platform) => platform.key === "googleAds"
  );
  const meta = report.ownerOverview.platforms.find((platform) => platform.key === "meta");

  return [
    {
      channel: copy.googleAds,
      role: copy.googleRole,
      result: google
        ? `${formatNumber(google.conversions)} ${copy.conversions.toLowerCase()} / ${formatCurrency(
            google.costPerConversion,
            currency
          )}`
        : copy.empty,
      interpretation: copy.googleInterpretation
    },
    {
      channel: copy.meta,
      role: copy.metaRole,
      result: meta
        ? `${formatNumber(meta.clicks)} ${copy.clicks.toLowerCase()} / ${formatNumber(
            meta.conversions
          )} ${copy.conversions.toLowerCase()}`
        : copy.empty,
      interpretation: copy.metaInterpretation
    },
    {
      channel: copy.ga4,
      role: copy.ga4Role,
      result: `${formatNumber(report.ownerOverview.website.sessions)} ${copy.websiteTotalTraffic.toLowerCase()} / ${formatNumber(
        report.ownerOverview.website.conversions
      )} ${copy.websiteTotalConversions.toLowerCase()}`,
      interpretation: copy.ga4Interpretation
    }
  ];
}

function ownerTrendRows(report: ReportResponse) {
  const rows = new Map<
    string,
    {
      date: string;
      platform_conversions: number;
      website_sessions: number;
    }
  >();

  function ensure(date: string) {
    const existing = rows.get(date);
    if (existing) return existing;

    const created = {
      date,
      platform_conversions: 0,
      website_sessions: 0
    };
    rows.set(date, created);
    return created;
  }

  for (const row of report.googleAds?.daily ?? []) {
    const date = String(row.date ?? "");
    if (!date) continue;
    ensure(date).platform_conversions += Number(row.conversions ?? 0);
  }

  for (const row of report.meta?.daily ?? []) {
    const date = String(row.date ?? "");
    if (!date) continue;
    ensure(date).platform_conversions += Number(row.leads ?? 0);
  }

  for (const row of report.ga4?.daily ?? []) {
    const date = String(row.date ?? "");
    if (!date) continue;
    ensure(date).website_sessions += Number(row.sessions ?? 0);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      platform_conversions: Math.round(row.platform_conversions * 10) / 10
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

function ownerConclusion(report: ReportResponse) {
  const currency = report.client.currency;
  const paid = report.ownerOverview.paid;
  const website = report.ownerOverview.website;

  if (report.client.locale === "en") {
    return `The campaigns invested ${formatCurrency(
      paid.totalSpend,
      currency
    )} and generated ${formatNumber(
      paid.totalConversions
    )} relevant platform actions, supported by ${formatNumber(
      website.sessions
    )} website visits. The next focus is to move budget and optimization effort toward commercially valuable actions: calls, WhatsApp, forms and bookings, not just traffic volume.`;
  }

  return `Campaniile au investit ${formatCurrency(
    paid.totalSpend,
    currency
  )} și au generat ${formatNumber(
    paid.totalConversions
  )} acțiuni relevante raportate de platforme, susținute de ${formatNumber(
    website.sessions
  )} vizite pe site. Următorul focus este optimizarea bugetului către acțiuni cu valoare comercială ridicată: telefon, WhatsApp, formulare și programări, nu doar volum de trafic.`;
}

function friendlyGa4LandingRows(rows: Array<Record<string, string | number>>) {
  return rows.map((row) => ({
    ...row,
    landing_page_label: friendlyLandingPageLabel(row.landing_page)
  }));
}

function metaActionBlocks(
  rows: Array<Record<string, string | number>>,
  copy: typeof ro,
  columns: TableColumn[]
) {
  const labels: Record<MetaActionCategory, string> = {
    conversions: copy.conversionActions,
    traffic: copy.trafficActions,
    engagement: copy.engagementActions,
    other: copy.otherActions
  };
  const categories: MetaActionCategory[] = [
    "conversions",
    "traffic",
    "engagement",
    "other"
  ];

  return categories.map((category) => ({
    title: labels[category],
    rows: rows.filter(
      (row) =>
        Number(row.value ?? 0) > 0 && metaActionCategory(row.action_type) === category
    ),
    columns
  }));
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
