import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import { createCsrfToken, verifyCsrfToken } from "@/lib/security/csrf";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  recordFailedLogin,
  resetLoginRateLimitForTests
} from "@/lib/security/rate-limit";
import {
  createSignedSession,
  verifySignedSession,
  type AdminSessionPayload
} from "@/lib/security/sessions";
import { createRawToken, hashToken, safeEqual } from "@/lib/security/tokens";

describe("password security", () => {
  it("verifies generated password hashes", () => {
    const hash = hashPassword("correct horse battery staple", "fixed-salt");

    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("signed sessions", () => {
  it("accepts valid sessions and rejects tampered sessions", () => {
    const token = createSignedSession(
      {
        scope: "admin",
        username: "admin",
        exp: Date.now() + 60_000
      },
      "secret"
    );

    expect(verifySignedSession<AdminSessionPayload>(token, "secret")?.username).toBe(
      "admin"
    );
    expect(verifySignedSession(`${token}x`, "secret")).toBeNull();
  });

  it("rejects expired sessions", () => {
    const token = createSignedSession(
      {
        scope: "admin",
        username: "admin",
        exp: Date.now() - 1
      },
      "secret"
    );

    expect(verifySignedSession(token, "secret")).toBeNull();
  });
});

describe("share tokens", () => {
  it("hashes raw tokens for storage", () => {
    const token = createRawToken();
    const hash = hashToken(token);

    expect(token).not.toBe(hash);
    expect(safeEqual(hashToken(token), hash)).toBe(true);
  });
});

describe("csrf tokens", () => {
  it("accepts signed csrf tokens and rejects tampering", () => {
    const token = createCsrfToken("secret");

    expect(verifyCsrfToken(token, "secret")).toBe(true);
    expect(verifyCsrfToken(`${token}x`, "secret")).toBe(false);
    expect(verifyCsrfToken(token, "other-secret")).toBe(false);
  });
});

describe("login rate limiting", () => {
  it("blocks after repeated failed attempts and can be cleared", () => {
    resetLoginRateLimitForTests();

    for (let index = 0; index < 4; index += 1) {
      recordFailedLogin("127.0.0.1:admin");
    }

    expect(isLoginRateLimited("127.0.0.1:admin")).toBe(false);
    recordFailedLogin("127.0.0.1:admin");
    expect(isLoginRateLimited("127.0.0.1:admin")).toBe(true);

    clearLoginAttempts("127.0.0.1:admin");
    expect(isLoginRateLimited("127.0.0.1:admin")).toBe(false);
  });
});
