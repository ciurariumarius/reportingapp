import { pbkdf2Sync, randomBytes } from "node:crypto";
import { safeEqual } from "./tokens";

const HASH_PREFIX = "pbkdf2";
const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = pbkdf2Sync(
    password,
    salt,
    DEFAULT_ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString("hex");

  return `${HASH_PREFIX}$${DEFAULT_ITERATIONS}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, iterationsRaw, salt, expected] = storedHash.split("$");

  if (prefix !== HASH_PREFIX || !iterationsRaw || !salt || !expected) {
    return false;
  }

  const iterations = Number(iterationsRaw);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actual = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString(
    "hex"
  );

  return safeEqual(actual, expected);
}
