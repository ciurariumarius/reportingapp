import { createHmac } from "node:crypto";
import { safeEqual } from "./tokens";

export type AdminSessionPayload = {
  scope: "admin";
  username: string;
  exp: number;
};

export type ReportSessionPayload = {
  scope: "report";
  slug: string;
  exp: number;
};

export type SessionPayload = AdminSessionPayload | ReportSessionPayload;

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSignedSession(payload: SessionPayload, secret: string) {
  const body = encode(payload);
  const signature = sign(body, secret);

  return `${body}.${signature}`;
}

export function verifySignedSession<T extends SessionPayload>(
  token: string | undefined,
  secret: string
) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature || !safeEqual(sign(body, secret), signature)) {
    return null;
  }

  const payload = decode<T>(body);

  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "development-only-auth-secret-change-me";
}
