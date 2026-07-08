import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionCookie
} from "@/lib/auth";
import { handleApiError, requireAdminMutation } from "@/lib/api";
import {
  CSRF_COOKIE_NAME,
  createCsrfToken,
  csrfCookieOptions
} from "@/lib/security/csrf";
import { verifyPassword } from "@/lib/security/passwords";
import { clearLoginAttempts, isLoginRateLimited, recordFailedLogin } from "@/lib/security/rate-limit";
import { getAuthSecret } from "@/lib/security/sessions";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

function loginKey(request: Request, username: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";

  return `${ip}:${username.toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const rateLimitKey = loginKey(request, payload.username);

    if (!expectedUsername || !passwordHash) {
      return NextResponse.json(
        { error: "Admin login nu este configurat." },
        { status: 500 }
      );
    }

    if (isLoginRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Prea multe incercari esuate. Incearca din nou in cateva minute." },
        { status: 429 }
      );
    }

    const isValid =
      payload.username === expectedUsername &&
      verifyPassword(payload.password, passwordHash);

    if (!isValid) {
      const attempt = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        { error: "Utilizator sau parola incorecta." },
        {
          status: attempt.limited ? 429 : 401,
          headers: attempt.limited
            ? { "Retry-After": String(attempt.retryAfterSeconds) }
            : undefined
        }
      );
    }

    clearLoginAttempts(rateLimitKey);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createAdminSessionCookie(payload.username),
      adminCookieOptions
    );
    response.cookies.set(
      CSRF_COOKIE_NAME,
      createCsrfToken(getAuthSecret()),
      csrfCookieOptions
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminMutation(request);
  if (authError) return authError;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions,
    maxAge: 0
  });
  response.cookies.set(CSRF_COOKIE_NAME, "", {
    ...csrfCookieOptions,
    maxAge: 0
  });
  return response;
}
