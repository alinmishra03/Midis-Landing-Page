import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * URL intake for the audit tool — normalisation plus SSRF defence.
 *
 * Visitors type "midis.in", "www.midis.in/" or a full URL; all are
 * accepted and normalised to an https:// URL. What is REFUSED, with a
 * helpful message: anything that is not a public website. The server
 * fetches the submitted address itself (for the on-page checks), so a
 * crafted URL must never reach localhost, a private network, link-local
 * cloud metadata (169.254.169.254) or any other internal service:
 *
 *   1. Syntax: http(s) only, no credentials, default ports only, a real
 *      dotted host name — no IP literals, no internal-only suffixes.
 *   2. DNS: every address the name resolves to must be public.
 *   3. Connection time: page.ts re-checks the address actually connected
 *      to (its `lookup` hook), which defeats DNS-rebinding between the
 *      check above and the request — and every redirect hop is re-run
 *      through all three steps.
 */

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".private",
  ".test",
  ".invalid",
  ".example",
];

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);

export type UrlCheck = { ok: true; url: URL } | { ok: false; message: string };

export function normaliseUrl(raw: unknown): UrlCheck {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, message: "Please enter your website address." };
  }
  const input = raw.trim();
  if (input.length > 2048) {
    return { ok: false, message: "That address is too long. Please check it and try again." };
  }

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, message: "Please enter a valid website address, for example https://www.yourwebsite.com." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, message: "Please enter a website address starting with https://." };
  }
  if (url.username || url.password) {
    return { ok: false, message: "Please enter the address without a username or password." };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, message: "Please enter the public address of your website (without a port number)." };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isIP(host.replace(/^\[|\]$/g, "")) !== 0) {
    return { ok: false, message: "Please enter your website's domain name rather than an IP address." };
  }
  if (
    !host.includes(".") ||
    BLOCKED_HOSTS.has(host) ||
    BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    !/^[a-z\d.-]+$/.test(host) ||
    !/\.[a-z]{2,63}$/.test(host)
  ) {
    return { ok: false, message: "Please enter a public website address, for example https://www.yourwebsite.com." };
  }

  url.hash = "";
  return { ok: true, url };
}

/* ---- address classification ---- */

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isPrivateV4(ip: string): boolean {
  const value = v4ToInt(ip);
  return PRIVATE_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (v4ToInt(base) & mask);
  });
}

/** True for any address that is not a routable public address. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const family = isIP(ip);
  if (family === 4) return isPrivateV4(ip);
  if (family !== 6) return true;

  /* IPv4-mapped / -compatible / NAT64 forms carry a v4 address: judge that. */
  const embedded = ip.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) return isPrivateV4(embedded[1]) || !ip.startsWith("::ffff:");

  if (ip === "::" || ip === "::1") return true;
  const first = parseInt(ip.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (ip.startsWith("2001:db8:") || ip.startsWith("2001:0db8:")) return true; // documentation
  if (ip.startsWith("64:ff9b:")) return true; // NAT64
  return false;
}

/** Resolve a host and refuse it unless EVERY address is public. */
export async function assertPublicHost(hostname: string): Promise<void> {
  let records: { address: string }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new AuditInputError(
      "We couldn't find that website. Please check the address is spelled correctly and the site is online.",
    );
  }
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new AuditInputError(
      "That address doesn't point to a public website, so we can't audit it.",
    );
  }
}

/** A problem with what the visitor entered — its message is safe to show. */
export class AuditInputError extends Error {}
