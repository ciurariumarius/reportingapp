import type { DateRange } from "../date-ranges";

export type PlatformKpis = {
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  conversions?: number;
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

export type SourceStatus = "mock" | "ready" | "missing_config" | "empty" | "error";

export type SourceState = {
  status: SourceStatus;
  message: string;
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
};

export type ReportResponse = {
  client: {
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: "ro" | "en";
  };
  dateRange: DateRange;
  overview: {
    totalSpend: number;
    totalClicks: number;
    platformReportedConversions: number;
    websiteSessions: number;
    websiteKeyEvents: number;
  };
  sources: {
    googleAds: SourceState;
    ga4: SourceState;
    meta: SourceState;
  };
  googleAds?: GoogleAdsReport;
  ga4?: Ga4Report;
  meta?: MetaReport;
  insights?: {
    whatWentWell: string;
    whatNeedsAttention: string;
    recommendedNextActions: string;
  };
};
