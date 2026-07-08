type LoginAttempt = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, LoginAttempt>();

function currentAttempt(key: string, now = Date.now()) {
  const attempt = attempts.get(key);

  if (!attempt || attempt.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, fresh);
    return fresh;
  }

  return attempt;
}

export function isLoginRateLimited(key: string, now = Date.now()) {
  return currentAttempt(key, now).count >= MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string, now = Date.now()) {
  const attempt = currentAttempt(key, now);
  attempt.count += 1;
  attempts.set(key, attempt);

  return {
    limited: attempt.count >= MAX_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000))
  };
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}

export function resetLoginRateLimitForTests() {
  attempts.clear();
}
