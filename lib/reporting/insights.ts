import type {
  AutomatedInsight,
  AutomatedInsights,
  MetricTrend,
  ReportComparison,
  ReportResponse,
  ReportType,
  TrendStatus
} from "../types/report";
import { round } from "./mock-data";

type Locale = "ro" | "en";
type MetricPreference = "higher" | "lower" | "neutral";

function ratio(numerator: number, denominator: number) {
  return denominator ? round(numerator / denominator, 2) : 0;
}

function platformValue(report: ReportResponse) {
  return round(
    (report.googleAds?.kpis.conversionValue ?? 0) +
      (report.meta?.kpis.conversionValue ?? 0)
  );
}

function metricSnapshot(report: ReportResponse) {
  const totalSpend = report.overview.totalSpend;
  const primaryResults = report.overview.platformReportedConversions;
  const platformReportedValue = platformValue(report);

  return {
    totalSpend,
    totalClicks: report.overview.totalClicks,
    primaryResults,
    costPerResult: ratio(totalSpend, primaryResults),
    platformValue: platformReportedValue,
    roas: ratio(platformReportedValue, totalSpend),
    websiteSessions: report.overview.websiteSessions,
    websiteKeyEvents: report.overview.websiteKeyEvents,
    websiteRevenue: report.ga4?.kpis.revenue ?? 0
  };
}

export function calculateMetricTrend(
  current: number,
  previous: number,
  preference: MetricPreference = "higher"
): MetricTrend {
  const absoluteChange = round(current - previous, 2);
  const percentChange = previous ? round((absoluteChange / previous) * 100, 1) : null;
  const direction =
    Math.abs(absoluteChange) < 0.01 || percentChange === 0
      ? "flat"
      : absoluteChange > 0
        ? "up"
        : "down";

  let status: TrendStatus = "neutral";

  if (direction !== "flat" && preference !== "neutral") {
    status =
      (preference === "higher" && direction === "up") ||
      (preference === "lower" && direction === "down")
        ? "good"
        : "warning";
  }

  return {
    current: round(current, 2),
    previous: round(previous, 2),
    absoluteChange,
    percentChange,
    direction,
    status
  };
}

export function buildReportComparison(
  current: ReportResponse,
  previous: ReportResponse
): ReportComparison {
  const currentMetrics = metricSnapshot(current);
  const previousMetrics = metricSnapshot(previous);

  return {
    totalSpend: calculateMetricTrend(
      currentMetrics.totalSpend,
      previousMetrics.totalSpend,
      "neutral"
    ),
    totalClicks: calculateMetricTrend(
      currentMetrics.totalClicks,
      previousMetrics.totalClicks
    ),
    primaryResults: calculateMetricTrend(
      currentMetrics.primaryResults,
      previousMetrics.primaryResults
    ),
    costPerResult: calculateMetricTrend(
      currentMetrics.costPerResult,
      previousMetrics.costPerResult,
      "lower"
    ),
    platformValue: calculateMetricTrend(
      currentMetrics.platformValue,
      previousMetrics.platformValue
    ),
    roas: calculateMetricTrend(currentMetrics.roas, previousMetrics.roas),
    websiteSessions: calculateMetricTrend(
      currentMetrics.websiteSessions,
      previousMetrics.websiteSessions
    ),
    websiteKeyEvents: calculateMetricTrend(
      currentMetrics.websiteKeyEvents,
      previousMetrics.websiteKeyEvents
    ),
    websiteRevenue: calculateMetricTrend(
      currentMetrics.websiteRevenue,
      previousMetrics.websiteRevenue
    )
  };
}

function hasHistoricalData(comparison: ReportComparison) {
  const hasAnyBaseline = Object.values(comparison).some((trend) => trend.previous > 0);
  const hasEnoughVolume =
    comparison.totalSpend.previous >= 100 ||
    comparison.primaryResults.previous >= 3 ||
    comparison.websiteSessions.previous >= 50 ||
    comparison.websiteKeyEvents.previous >= 3 ||
    comparison.websiteRevenue.previous >= 100;

  return hasAnyBaseline && hasEnoughVolume;
}

function percentText(trend: MetricTrend, locale: Locale) {
  if (trend.percentChange === null) {
    return locale === "en" ? "new historical baseline" : "baza istorica noua";
  }

  return `${Math.abs(trend.percentChange).toLocaleString(locale === "en" ? "en-US" : "ro-RO")}%`;
}

function insight(title: string, message: string, status: TrendStatus): AutomatedInsight {
  return { title, message, status };
}

function fallbackByLocale(locale: Locale) {
  if (locale === "en") {
    return {
      verdict: insight(
        "Comparison baseline is building",
        "There is not enough previous-period data yet for a reliable performance verdict.",
        "neutral"
      ),
      improved: [
        insight(
          "Current data is available",
          "The report is ready for this period. Trends will become more useful once the previous period has data.",
          "neutral"
        )
      ],
      attention: [
        insight(
          "No reliable comparison yet",
          "Avoid judging performance from deltas until the previous period contains comparable data.",
          "neutral"
        )
      ],
      nextActions: [
        insight(
          "Keep tracking sources",
          "Make sure Google Ads, GA4 and Meta stay connected so future reports can compare performance correctly.",
          "neutral"
        )
      ]
    };
  }

  return {
    verdict: insight(
      "Construim baza de comparație",
      "Nu există încă suficiente date în perioada precedentă pentru un verdict sigur.",
      "neutral"
    ),
    improved: [
      insight(
        "Datele curente sunt disponibile",
        "Raportul este pregătit pentru perioada selectată. Trendurile vor deveni mai utile după ce există date comparabile în perioada precedentă.",
        "neutral"
      )
    ],
    attention: [
      insight(
        "Comparație insuficientă",
        "Evită interpretarea strictă a procentelor până când perioada precedentă are date comparabile.",
        "neutral"
      )
    ],
    nextActions: [
      insight(
        "Păstrează sursele conectate",
        "Asigură-te că Google Ads, GA4 și Meta rămân conectate pentru comparații corecte în rapoartele următoare.",
        "neutral"
      )
    ]
  } satisfies AutomatedInsights;
}

function leadInsights(comparison: ReportComparison, locale: Locale): AutomatedInsights {
  const copy =
    locale === "en"
      ? {
          verdictGood: ["Lead efficiency improved", "Leads grew while cost per lead stayed stable or improved."],
          verdictWarn: ["Efficiency needs attention", "Leads dropped or cost per lead increased versus the previous period."],
          verdictNeutral: ["Performance is broadly stable", "The main lead metrics are close to the previous period."],
          leadsUp: "Platform-reported leads increased by",
          cplDown: "Cost per lead improved by",
          sessionsUp: "Website sessions increased by",
          leadsDown: "Platform-reported leads decreased by",
          cplUp: "Cost per lead increased by",
          trafficMismatch: "Website traffic increased, but key events did not follow the same direction.",
          scale: "Review the strongest campaigns and consider moving more budget toward the best CPL segments.",
          fixCpl: "Review campaigns with high spend and low lead volume before increasing budget.",
          fixSite: "Check landing pages, forms and contact flows because traffic is not converting proportionally."
        }
      : {
          verdictGood: ["Eficiența lead-urilor s-a îmbunătățit", "Lead-urile au crescut, iar costul per lead a rămas stabil sau s-a îmbunătățit."],
          verdictWarn: ["Eficiența necesită atenție", "Lead-urile au scăzut sau costul per lead a crescut față de perioada precedentă."],
          verdictNeutral: ["Performanța este relativ stabilă", "Metricile principale de lead sunt apropiate de perioada precedentă."],
          leadsUp: "Lead-urile raportate de platforme au crescut cu",
          cplDown: "Costul per lead s-a îmbunătățit cu",
          sessionsUp: "Sesiunile pe site au crescut cu",
          leadsDown: "Lead-urile raportate de platforme au scăzut cu",
          cplUp: "Costul per lead a crescut cu",
          trafficMismatch: "Traficul pe site a crescut, dar evenimentele importante nu au urmat aceeași direcție.",
          scale: "Verifică cele mai bune campanii și ia în calcul mutarea bugetului către segmentele cu CPL bun.",
          fixCpl: "Revizuiește campaniile cu buget mare și volum mic de lead-uri înainte de creșterea bugetului.",
          fixSite: "Verifică landing page-urile, formularele și fluxurile de contact pentru că traficul nu convertește proporțional."
        };

  const improved: AutomatedInsight[] = [];
  const attention: AutomatedInsight[] = [];
  const nextActions: AutomatedInsight[] = [];

  if (comparison.primaryResults.status === "good") {
    improved.push(
      insight(
        locale === "en" ? "More leads" : "Mai multe lead-uri",
        `${copy.leadsUp} ${percentText(comparison.primaryResults, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.costPerResult.status === "good") {
    improved.push(
      insight(
        locale === "en" ? "Better CPL" : "CPL mai bun",
        `${copy.cplDown} ${percentText(comparison.costPerResult, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.websiteSessions.status === "good") {
    improved.push(
      insight(
        locale === "en" ? "More website traffic" : "Trafic mai mare pe site",
        `${copy.sessionsUp} ${percentText(comparison.websiteSessions, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.primaryResults.status === "warning") {
    attention.push(
      insight(
        locale === "en" ? "Lead volume declined" : "Volumul de lead-uri a scăzut",
        `${copy.leadsDown} ${percentText(comparison.primaryResults, locale)}.`,
        "warning"
      )
    );
  }

  if (comparison.costPerResult.status === "warning") {
    attention.push(
      insight(
        locale === "en" ? "CPL increased" : "CPL în creștere",
        `${copy.cplUp} ${percentText(comparison.costPerResult, locale)}.`,
        "warning"
      )
    );
  }

  if (
    comparison.websiteSessions.direction === "up" &&
    comparison.websiteKeyEvents.status !== "good"
  ) {
    attention.push(
      insight(
        locale === "en" ? "Traffic is not becoming leads" : "Traficul nu devine lead",
        copy.trafficMismatch,
        "warning"
      )
    );
  }

  if (attention.some((item) => item.title.includes("CPL") || item.title.includes("lead"))) {
    nextActions.push(
      insight(locale === "en" ? "Improve efficiency first" : "Optimizează eficiența", copy.fixCpl, "warning")
    );
  }

  if (attention.some((item) => item.message === copy.trafficMismatch)) {
    nextActions.push(
      insight(locale === "en" ? "Audit landing pages" : "Verifică landing page-urile", copy.fixSite, "warning")
    );
  }

  if (!nextActions.length) {
    nextActions.push(
      insight(locale === "en" ? "Scale carefully" : "Scalează controlat", copy.scale, "good")
    );
  }

  const verdictStatus: TrendStatus =
    comparison.primaryResults.status === "good" &&
    comparison.costPerResult.status !== "warning"
      ? "good"
      : comparison.primaryResults.status === "warning" ||
          comparison.costPerResult.status === "warning"
        ? "warning"
        : "neutral";
  const [verdictTitle, verdictMessage] =
    verdictStatus === "good"
      ? copy.verdictGood
      : verdictStatus === "warning"
        ? copy.verdictWarn
        : copy.verdictNeutral;

  return {
    verdict: insight(verdictTitle, verdictMessage, verdictStatus),
    improved: improved.length ? improved.slice(0, 3) : [insight(locale === "en" ? "No major improvement" : "Fără îmbunătățire majoră", locale === "en" ? "The main lead metrics are close to the comparison period." : "Metricile principale de lead sunt apropiate de perioada de comparație.", "neutral")],
    attention: attention.length ? attention.slice(0, 3) : [insight(locale === "en" ? "No major risk" : "Fără risc major", locale === "en" ? "No major negative movement stands out in the selected period." : "Nu se vede o mișcare negativă majoră în perioada selectată.", "neutral")],
    nextActions: nextActions.slice(0, 3)
  };
}

function ecommerceInsights(
  comparison: ReportComparison,
  locale: Locale
): AutomatedInsights {
  const copy =
    locale === "en"
      ? {
          verdictGood: ["Revenue efficiency improved", "Purchase value or ROAS improved versus the previous period."],
          verdictWarn: ["Revenue efficiency needs attention", "Purchases, value or ROAS moved in the wrong direction."],
          verdictNeutral: ["Ecommerce performance is stable", "Purchases and ROAS are close to the previous period."],
          purchasesUp: "Purchases increased by",
          valueUp: "Platform purchase value increased by",
          roasUp: "ROAS improved by",
          purchasesDown: "Purchases decreased by",
          valueDown: "Purchase value decreased by",
          roasDown: "ROAS decreased by",
          revenueGap: "Website sessions increased, but website revenue did not follow.",
          scale: "Prioritize campaigns and products with the strongest ROAS before scaling spend.",
          fixRoas: "Review campaigns with high spend and weak purchase value before increasing budget.",
          fixSite: "Check product pages, checkout and tracking because sessions are not turning into revenue proportionally."
        }
      : {
          verdictGood: ["Eficiența ecommerce s-a îmbunătățit", "Valoarea achizițiilor sau ROAS-ul s-a îmbunătățit față de perioada precedentă."],
          verdictWarn: ["Eficiența ecommerce necesită atenție", "Achizițiile, valoarea sau ROAS-ul s-au mișcat în direcția greșită."],
          verdictNeutral: ["Performanța ecommerce este stabilă", "Achizițiile și ROAS-ul sunt apropiate de perioada precedentă."],
          purchasesUp: "Achizițiile au crescut cu",
          valueUp: "Valoarea achizițiilor raportată de platforme a crescut cu",
          roasUp: "ROAS-ul s-a îmbunătățit cu",
          purchasesDown: "Achizițiile au scăzut cu",
          valueDown: "Valoarea achizițiilor a scăzut cu",
          roasDown: "ROAS-ul a scăzut cu",
          revenueGap: "Sesiunile pe site au crescut, dar venitul din site nu a urmat aceeași direcție.",
          scale: "Prioritizează campaniile și produsele cu ROAS bun înainte de creșterea bugetului.",
          fixRoas: "Revizuiește campaniile cu spend mare și valoare slabă înainte de creșterea bugetului.",
          fixSite: "Verifică paginile de produs, checkout-ul și trackingul pentru că sesiunile nu se transformă proporțional în venit."
        };

  const improved: AutomatedInsight[] = [];
  const attention: AutomatedInsight[] = [];
  const nextActions: AutomatedInsight[] = [];

  if (comparison.primaryResults.status === "good") {
    improved.push(
      insight(
        locale === "en" ? "More purchases" : "Mai multe achizitii",
        `${copy.purchasesUp} ${percentText(comparison.primaryResults, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.platformValue.status === "good") {
    improved.push(
      insight(
        locale === "en" ? "Higher purchase value" : "Valoare mai mare",
        `${copy.valueUp} ${percentText(comparison.platformValue, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.roas.status === "good") {
    improved.push(
      insight(
        "ROAS",
        `${copy.roasUp} ${percentText(comparison.roas, locale)}.`,
        "good"
      )
    );
  }

  if (comparison.primaryResults.status === "warning") {
    attention.push(
      insight(
        locale === "en" ? "Purchases declined" : "Achizițiile au scăzut",
        `${copy.purchasesDown} ${percentText(comparison.primaryResults, locale)}.`,
        "warning"
      )
    );
  }

  if (comparison.platformValue.status === "warning") {
    attention.push(
      insight(
        locale === "en" ? "Purchase value declined" : "Valoarea a scăzut",
        `${copy.valueDown} ${percentText(comparison.platformValue, locale)}.`,
        "warning"
      )
    );
  }

  if (comparison.roas.status === "warning") {
    attention.push(
      insight(
        locale === "en" ? "ROAS declined" : "ROAS în scădere",
        `${copy.roasDown} ${percentText(comparison.roas, locale)}.`,
        "warning"
      )
    );
  }

  if (
    comparison.websiteSessions.direction === "up" &&
    comparison.websiteRevenue.status !== "good"
  ) {
    attention.push(
      insight(
        locale === "en" ? "Traffic is not becoming revenue" : "Traficul nu devine venit",
        copy.revenueGap,
        "warning"
      )
    );
  }

  if (attention.some((item) => item.title.includes("ROAS") || item.message.includes("valoare") || item.message.includes("value"))) {
    nextActions.push(
      insight(locale === "en" ? "Protect ROAS" : "Protejează ROAS-ul", copy.fixRoas, "warning")
    );
  }

  if (attention.some((item) => item.message === copy.revenueGap)) {
    nextActions.push(
      insight(locale === "en" ? "Audit checkout" : "Verifică checkout-ul", copy.fixSite, "warning")
    );
  }

  if (!nextActions.length) {
    nextActions.push(
      insight(locale === "en" ? "Scale profitable demand" : "Scalează cererea profitabilă", copy.scale, "good")
    );
  }

  const verdictStatus: TrendStatus =
    (comparison.platformValue.status === "good" || comparison.roas.status === "good") &&
    comparison.roas.status !== "warning"
      ? "good"
      : comparison.primaryResults.status === "warning" ||
          comparison.platformValue.status === "warning" ||
          comparison.roas.status === "warning"
        ? "warning"
        : "neutral";
  const [verdictTitle, verdictMessage] =
    verdictStatus === "good"
      ? copy.verdictGood
      : verdictStatus === "warning"
        ? copy.verdictWarn
        : copy.verdictNeutral;

  return {
    verdict: insight(verdictTitle, verdictMessage, verdictStatus),
    improved: improved.length ? improved.slice(0, 3) : [insight(locale === "en" ? "No major improvement" : "Fără îmbunătățire majoră", locale === "en" ? "The main ecommerce metrics are close to the comparison period." : "Metricile principale ecommerce sunt apropiate de perioada de comparație.", "neutral")],
    attention: attention.length ? attention.slice(0, 3) : [insight(locale === "en" ? "No major risk" : "Fără risc major", locale === "en" ? "No major negative movement stands out in the selected period." : "Nu se vede o mișcare negativă majoră în perioada selectată.", "neutral")],
    nextActions: nextActions.slice(0, 3)
  };
}

export function buildAutomatedInsights(
  current: ReportResponse,
  previous: ReportResponse,
  reportType: ReportType
): AutomatedInsights {
  const locale = current.client.locale;
  const comparison = buildReportComparison(current, previous);

  if (!hasHistoricalData(comparison)) {
    return fallbackByLocale(locale);
  }

  return reportType === "ecommerce"
    ? ecommerceInsights(comparison, locale)
    : leadInsights(comparison, locale);
}
