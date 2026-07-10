import { NextRequest, NextResponse } from "next/server";
import { getPreviousEquivalentDateRange, normalizeDateRange } from "@/lib/date-ranges";
import { buildReport } from "@/lib/reporting/report-service";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  let dateRange;
  let comparisonRange = null;
  const compareEnabled = url.searchParams.get("compare") === "true";

  try {
    dateRange = normalizeDateRange({
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate")
    });

    if (compareEnabled) {
      const comparisonStartDate = url.searchParams.get("comparisonStartDate");
      const comparisonEndDate = url.searchParams.get("comparisonEndDate");
      comparisonRange =
        comparisonStartDate || comparisonEndDate
          ? normalizeDateRange({
              startDate: comparisonStartDate,
              endDate: comparisonEndDate
            })
          : getPreviousEquivalentDateRange(dateRange);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interval invalid." },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  return NextResponse.json(
    await buildReport(client, dateRange, {
      comparisonRange
    })
  );
}
