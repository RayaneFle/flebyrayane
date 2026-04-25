type Bucket = { count: number; firstAttempt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  if (buckets.size > 1000) {
    for (const [k, v] of buckets.entries()) {
      if (now - v.firstAttempt > opts.windowMs) buckets.delete(k);
    }
  }
  const record = buckets.get(key);
  if (!record || now - record.firstAttempt > opts.windowMs) {
    buckets.set(key, { count: 1, firstAttempt: now });
    return false;
  }
  record.count++;
  return record.count > opts.max;
}

export function getClientKey(request: Request, prefix = ""): string {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return prefix + ":" + ip;
}
