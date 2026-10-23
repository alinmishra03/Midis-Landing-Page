import "server-only";

/**
 * Per-IP fixed-window rate limiting, in module memory — the same modest,
 * per-instance approach as /api/enquiry. It stops one machine hammering
 * the tool (each audit spends PageSpeed quota); a durable, distributed
 * limit belongs at the edge.
 */

export function makeLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (ip: string): boolean => {
    /* Off under `next dev`: locally every request shares one "unknown"
       address, so a developer's own retries would lock them out. */
    if (process.env.NODE_ENV === "development") return false;
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      if (hits.size > 1000) {
        for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
      }
      return false;
    }
    entry.count += 1;
    return entry.count > max;
  };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
