import { NextRequest, NextResponse } from "next/server";
import { getMonthFromDateRange, normalizeDateRange } from "@/lib/date-ranges";
import { buildMockReportResponse } from "@/lib/reporting/mock-data";
import { getReportCookieName, verifyReportCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const session = verifyReportCookie(
    slug,
    request.cookies.get(getReportCookieName(slug))?.value
  );

  if (!session) {
    return NextResponse.json({ error: "Acces neautorizat." }, { status: 401 });
  }

  const url = new URL(request.url);
  let dateRange;

  try {
    dateRange = normalizeDateRange({
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interval invalid." },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true },
    include: {
      monthlyInsights: {
        where: { month: getMonthFromDateRange(dateRange) },
        take: 1
      }
    }
  });

  if (!client) {
    return NextResponse.json({ error: "Clientul nu exista." }, { status: 404 });
  }

  return NextResponse.json(
    buildMockReportResponse(client, dateRange, client.monthlyInsights[0] ?? null)
  );
}
