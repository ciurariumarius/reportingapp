import { NextResponse } from "next/server";
import {
  createReportSessionCookie,
  getReportCookieName,
  reportCookieOptions
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashToken, safeEqual } from "@/lib/security/tokens";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const deniedUrl = new URL(`/client/${slug}/report?access=denied`, url.origin);

  if (!token) {
    return NextResponse.redirect(deniedUrl);
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true },
    select: { shareTokenHash: true }
  });

  if (
    !client?.shareTokenHash ||
    !safeEqual(hashToken(token), client.shareTokenHash)
  ) {
    return NextResponse.redirect(deniedUrl);
  }

  const cleanUrl = new URL(`/client/${slug}/report`, url.origin);
  const response = NextResponse.redirect(cleanUrl);
  response.cookies.set(
    getReportCookieName(slug),
    createReportSessionCookie(slug),
    reportCookieOptions(slug)
  );

  return response;
}
