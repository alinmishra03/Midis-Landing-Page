import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { AuditResult } from "./types";

/**
 * Carries a finished audit from step 1 to step 2 WITHOUT a database.
 *
 * The result is encrypted and authenticated (AES-256-GCM) with a server
 * secret and handed to the browser as an opaque token. The browser can't
 * read it (the full report stays hidden until the contact step) and can't
 * alter it (any change fails authentication) — so the scores that end up
 * in the visitor's report and in MIDIS's lead record are exactly the ones
 * the audit produced. Tokens expire after two hours.
 *
 * AUDIT_TOKEN_SECRET must be set in production. In development a random
 * per-process secret is used so the tool works locally out of the box.
 */

const MAX_AGE_MS = 2 * 60 * 60 * 1000;
let devSecret: Buffer | null = null;

function key(): Buffer {
  const secret = process.env.AUDIT_TOKEN_SECRET;
  if (secret && secret.length >= 16) return createHash("sha256").update(secret).digest();
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUDIT_TOKEN_SECRET is not set (needs at least 16 characters).");
  }
  devSecret ??= randomBytes(32);
  return devSecret;
}

export function seal(result: AuditResult): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify({ t: Date.now(), r: result }), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** Returns the audit, or null for a forged, damaged or expired token. */
export function unseal(token: unknown): AuditResult | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 200_000) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const { t, r } = JSON.parse(text) as { t: number; r: AuditResult };
    if (typeof t !== "number" || Date.now() - t > MAX_AGE_MS) return null;
    return r;
  } catch {
    return null;
  }
}
