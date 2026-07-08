import { createHmac, randomBytes } from "node:crypto";
import { safeEqual } from "./tokens";

export const CSRF_COOKIE_NAME = "dd_csrf_token";
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 8;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createCsrfToken(secret: string) {
  const nonce = randomBytes(24).toString("base64url");
  return `${nonce}.${sign(nonce, secret)}`;
}

export function verifyCsrfToken(token: string | undefined, secret: string) {
  if (!token) {
    return false;
  }

  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) {
    return false;
  }

  return safeEqual(signature, sign(nonce, secret));
}

export const csrfCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CSRF_MAX_AGE_SECONDS
};
