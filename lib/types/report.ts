import type { DateRange } from "../date-ranges";

export type PlatformKpis = {
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  outboundClicks?: number;
  ctr?: number;
  cpc?: number;
  conversions?: number;
  landingPageViews?: number;
  allConversions?: number;
  conversionValue?: number;
  cpa?: number;
  roas?: number;
  users?: number;
  sessions?: number;
  engagedSessions?: number;
  engagementRate?: number;
  keyEvents?: number;
  eventCount?: number;
  revenue?: number;
};

export type ReportType = "lead" | "ecommerce";

export type SourceStatus = "mock" | "ready" | "missing_config" | "empty" | "error";

export type SourceState = {
  status: SourceStatus;
  message: string;
};

export type SourceSummaryItem = SourceState & {
  key: "googleAds" | "ga4" | "meta";
  label: string;
};

export type OwnerPlatformOverview = {
  key: "googleAds" | "meta";
  label: string;
  spend: number;
  clicks: number;
  conversions: number;
  costPerConversion: number;
  conversionValue: number;
  roas: number;
};

export type OwnerOverview = {
  narrative: string;
  platforms: OwnerPlatformOverview[];
  paid: {
    totalSpend: number;
    totalClicks: number;
    totalConversions: number;
    costPerConversion: number;
    conversionValue: number;
    roas: number;
  };
  website: {
    sessions: number;
    conversions: number;
    revenue: number;
  };
  ecommerce?: {
    websiteRevenue: number;
    platformValue: number;
    totalRoas: number;
  };
};

export type TrendDirection = "up" | "down" | "flat";
export type TrendStatus = "good" | "warning" | "neutral";

export type MetricTrend = {
  current: number;
  previous: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: TrendDirection;
  status: TrendStatus;
};

export type ReportComparison = {
  totalSpend: MetricTrend;
  totalClicks: MetricTrend;
  primaryResults: MetricTrend;
  costPerResult: MetricTrend;
  platformValue: MetricTrend;
  roas: MetricTrend;
  websiteSessions: MetricTrend;
  websiteKeyEvents: MetricTrend;
  websiteRevenue: MetricTrend;
};

export type AutomatedInsight = {
  title: string;
  message: string;
  status: TrendStatus;
};

export type AutomatedInsights = {
  verdict: AutomatedInsight;
  improved: AutomatedInsight[];
  attention: AutomatedInsight[];
  nextActions: AutomatedInsight[];
};

export type GoogleAdsReport = {
  kpis: PlatformKpis;
  daily: Array<Record<string, string | number>>;
  campaigns: Array<Record<string, string | number>>;
  conversions: Array<Record<string, string | number>>;
  devices: Array<Record<string, string | number>>;
  locations: Array<Record<string, string | number>>;
};

export type Ga4Report = {
  kpis: PlatformKpis;
  daily: Array<Record<string, string | number>>;
  channels: Array<Record<string, string | number>>;
  events: Array<Record<string, string | number>>;
  landingPages: Array<Record<string, string | number>>;
};

export type MetaReport = {
  kpis: PlatformKpis;
  daily: Array<Record<string, string | number>>;
  campaigns: Array<Record<string, string | number>>;
  actions: Array<Record<string, string | number>>;
  attributionWindow?: string;
};

export type ReportResponse = {
  client: {
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: "ro" | "en";
    reportType: ReportType;
    logoUrl?: string | null;
    websiteUrl?: string | null;
  };
  dateRange: DateRange;
  displayPeriod: string;
  comparisonRange?: DateRange;
  displayComparisonPeriod?: string;
  lastUpdatedAt: string;
  overview: {
    totalSpend: number;
    totalClicks: number;
    platformReportedConversions: number;
    websiteSessions: number;
    websiteKeyEvents: number;
  };
  ownerOverview: OwnerOverview;
  comparison?: ReportComparison;
  automatedInsights?: AutomatedInsights;
  sources: {
    googleAds: SourceState;
    ga4: SourceState;
    meta: SourceState;
  };
  sourceSummary: SourceSummaryItem[];
  googleAds?: GoogleAdsReport;
  ga4?: Ga4Report;
  meta?: MetaReport;
};
