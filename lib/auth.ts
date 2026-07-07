import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSignedSession,
  getAuthSecret,
  type AdminSessionPayload,
  type ReportSessionPayload,
  verifySignedSession
} from "./security/sessions";

export const ADMIN_COOKIE_NAME = "dd_admin_session";
const REPORT_COOKIE_PREFIX = "dd_report_";
const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8;
const REPORT_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export function getReportCookieName(slug: string) {
  return `${REPORT_COOKIE_PREFIX}${slug}`;
}

export function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function createAdminSessionCookie(username: string) {
  return createSignedSession(
    {
      scope: "admin",
      username,
      exp: Date.now() + ADMIN_MAX_AGE_SECONDS * 1000
    },
    getAuthSecret()
  );
}

export function createReportSessionCookie(slug: string) {
  return createSignedSession(
    {
      scope: "report",
      slug,
      exp: Date.now() + REPORT_MAX_AGE_SECONDS * 1000
    },
    getAuthSecret()
  );
}

export function verifyAdminCookie(value?: string) {
  const session = verifySignedSession<AdminSessionPayload>(value, getAuthSecret());
  return session?.scope === "admin" ? session : null;
}

export function verifyReportCookie(slug: string, value?: string) {
  const session = verifySignedSession<ReportSessionPayload>(value, getAuthSecret());
  return session?.scope === "report" && session.slug === slug ? session : null;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function hasReportAccess(slug: string) {
  const cookieStore = await cookies();
  return Boolean(
    verifyReportCookie(slug, cookieStore.get(getReportCookieName(slug))?.value)
  );
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: secureCookie(),
  path: "/",
  maxAge: ADMIN_MAX_AGE_SECONDS
};

export function reportCookieOptions(slug: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie(),
    path: `/client/${slug}/report`,
    maxAge: REPORT_MAX_AGE_SECONDS
  };
}
