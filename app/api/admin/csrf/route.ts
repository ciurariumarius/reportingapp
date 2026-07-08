import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api";
import {
  CSRF_COOKIE_NAME,
  createCsrfToken,
  csrfCookieOptions
} from "@/lib/security/csrf";
import { getAuthSecret } from "@/lib/security/sessions";

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CSRF_COOKIE_NAME, createCsrfToken(getAuthSecret()), csrfCookieOptions);
  return response;
}
