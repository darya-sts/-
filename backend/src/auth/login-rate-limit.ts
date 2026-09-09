/** Простой in-memory rate limit для login (защита от brute-force). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function assertLoginRateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000): void {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  cur.count += 1;
  if (cur.count > limit) {
    const err = new Error("Слишком много попыток входа. Подождите 15 минут.");
    (err as Error & { statusCode?: number }).statusCode = 429;
    throw err;
  }
}
