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
  const deniedPath = `/client/${slug}/report?access=denied`;

  if (!token) {
    return redirectRelative(deniedPath);
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true },
    select: { shareTokenHash: true }
  });

  if (
    !client?.shareTokenHash ||
    !safeEqual(hashToken(token), client.shareTokenHash)
  ) {
    return redirectRelative(deniedPath);
  }

  const response = redirectRelative(`/client/${slug}/report`);
  response.cookies.set(
    getReportCookieName(slug),
    createReportSessionCookie(slug),
    reportCookieOptions(slug)
  );

  return response;
}

function redirectRelative(location: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: location,
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}
