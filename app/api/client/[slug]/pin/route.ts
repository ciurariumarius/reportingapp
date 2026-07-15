import { NextResponse } from "next/server";
import {
  createReportSessionCookie,
  getReportCookieName,
  reportCookieOptions
} from "@/lib/auth";
import { verifyReportPin } from "@/lib/report-access";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  recordFailedLogin
} from "@/lib/security/rate-limit";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function requestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const key = `report-pin:${slug}:${requestIp(request)}`;

  if (isLoginRateLimited(key)) {
    return NextResponse.json(
      { error: "Prea multe incercari. Incearca din nou mai tarziu." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const pin = String(body.pin ?? "").trim();
  const ok = await verifyReportPin(slug, pin);

  if (!ok) {
    const attempt = recordFailedLogin(key);
    return NextResponse.json(
      {
        error: attempt.limited
          ? "Prea multe incercari. Incearca din nou mai tarziu."
          : "PIN incorect."
      },
      { status: attempt.limited ? 429 : 401 }
    );
  }

  clearLoginAttempts(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    getReportCookieName(slug),
    createReportSessionCookie(slug),
    reportCookieOptions(slug)
  );

  return response;
}
