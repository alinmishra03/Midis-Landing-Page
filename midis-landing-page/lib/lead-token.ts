import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The estimator's LEAD TOKEN: which Strapi record a visitor's saves belong
 * to, and the furthest step they have saved — signed, so a browser can
 * neither point its saves at someone else's record nor rewind progress.
 *
 * The browser only ever holds this opaque string, never the record's id.
 * It lives for 24 hours (a visitor who returns later starts a new lead).
 *
 * Signed with LEAD_TOKEN_SECRET, or AUDIT_TOKEN_SECRET when that is the one
 * configured. Production refuses to run without one; development uses a
 * random per-process secret so the form works locally out of the box.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
let devSecret: Buffer | null = null;

function key(): Buffer {
  const secret = process.env.LEAD_TOKEN_SECRET || process.env.AUDIT_TOKEN_SECRET;
  if (secret && secret.length >= 16) return createHash("sha256").update(`lead:${secret}`).digest();
  if (process.env.NODE_ENV === "production") {
    throw new Error("LEAD_TOKEN_SECRET (or AUDIT_TOKEN_SECRET) is not set — needs at least 16 characters.");
  }
  devSecret ??= randomBytes(32);
  return devSecret;
}

export interface Lead {
  /** The Strapi documentId. */
  id: string;
  /** The furthest step saved (0 = Step 1 still in progress, 4 = submitted). */
  step: number;
}

export function signLead(lead: Lead): string {
  const body = Buffer.from(JSON.stringify({ i: lead.id, s: lead.step, t: Date.now() })).toString("base64url");
  const mac = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** The lead, or null for a forged, damaged or expired token. */
export function readLead(token: unknown): Lead | null {
  if (typeof token !== "string" || token.length > 400) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", key()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { i, s, t } = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof i !== "string" || typeof s !== "number" || typeof t !== "number") return null;
    if (Date.now() - t > MAX_AGE_MS) return null;
    return { id: i, step: s };
  } catch {
    return null;
  }
}
