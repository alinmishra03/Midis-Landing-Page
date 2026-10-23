import "server-only";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";
import type { OnPageChecks } from "./types";
import { AuditInputError, assertPublicHost, isPrivateAddress, normaliseUrl } from "./url";

/**
 * The on-page half of the audit: fetch the visitor's page ourselves and
 * read the fundamentals straight from its HTML — title, meta description,
 * canonical, robots noindex (meta and header), viewport, language, heading
 * outline, image alt text, HTTPS.
 *
 * The fetch is the SSRF-sensitive part of the whole feature, so it does
 * not use fetch(): a raw request with a `lookup` hook lets us inspect the
 * exact address being connected to and refuse a private one at connect
 * time (DNS rebinding cannot slip past a check made earlier). Redirects
 * are followed by hand, each hop re-validated. Hard limits on time
 * (10s), size (2 MB) and redirects (5).
 */

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; MIDIS-Website-Audit/1.0; +https://midis.in)";

/** Refuses private addresses at the moment of connection. */
function safeLookup(
  hostname: string,
  options: object,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  dnsLookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as LookupAddress[];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (bad || list.length === 0) {
      return callback(Object.assign(new Error("Blocked private address"), { code: "EBLOCKED" }), "");
    }
    if ((options as { all?: boolean }).all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

interface RawResponse {
  status: number;
  headers: IncomingMessage["headers"];
  body: string;
}

function getOnce(url: URL): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = send(
      url,
      {
        method: "GET",
        lookup: safeLookup as never,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        /* Redirects: hand back the headers, never read the body. */
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, headers: res.headers, body: "" });
        }
        const type = String(res.headers["content-type"] ?? "");
        if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
          res.resume();
          return resolve({ status, headers: res.headers, body: "" });
        }
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          encoding === "gzip"
            ? res.pipe(createGunzip())
            : encoding === "deflate"
              ? res.pipe(createInflate())
              : encoding === "br"
                ? res.pipe(createBrotliDecompress())
                : res;
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            /* Enough to read the head and a good part of the body. */
            stream.destroy();
            req.destroy();
            return resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
          }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        stream.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/** GET with manual, re-validated redirects. */
async function fetchPage(start: URL): Promise<{ url: URL; res: RawResponse }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    let res: RawResponse;
    try {
      res = await getOnce(url);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EBLOCKED") {
        throw new AuditInputError("That address doesn't point to a public website, so we can't audit it.");
      }
      throw new AuditInputError(
        "We couldn't connect to your website. Please check it's online and try again.",
      );
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.location;
      if (!location) return { url, res };
      const next = normaliseUrl(new URL(String(location), url).toString());
      if (!next.ok) {
        throw new AuditInputError("Your website redirects to an address we can't audit.");
      }
      url = next.url;
      continue;
    }
    return { url, res };
  }
  throw new AuditInputError("Your website redirects too many times for us to follow.");
}

/* ---- HTML reading (deliberately tolerant; regexes over a capped body) ---- */

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[2] ?? match[3] ?? match[4] ?? "").trim() : null;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = (attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase();
    if (name === key) return decode(attr(tag, "content") ?? "");
  }
  return null;
}

export function readHtml(html: string, finalUrl: URL, status: number, headers: IncomingMessage["headers"]): OnPageChecks {
  /* Scripts, styles and comments would only produce false matches. */
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ");

  const titleMatch = clean.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]) || null : null;

  let canonical: string | null = null;
  for (const tag of clean.match(/<link\b[^>]*>/gi) ?? []) {
    if ((attr(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")) {
      canonical = attr(tag, "href");
      break;
    }
  }

  const robots = (metaContent(clean, "robots") ?? "").toLowerCase();
  const xRobots = String(headers["x-robots-tag"] ?? "").toLowerCase();
  const htmlTag = clean.match(/<html\b[^>]*>/i)?.[0] ?? "";

  const headings: { level: number; text: string }[] = [];
  for (const match of clean.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decode(match[2].replace(/<[^>]+>/g, " "));
    if (text) headings.push({ level: Number(match[1]), text: text.slice(0, 120) });
    if (headings.length >= 40) break;
  }
  const h1Count = (clean.match(/<h1\b/gi) ?? []).length;

  const images = clean.match(/<img\b[^>]*>/gi) ?? [];
  /* alt="" is a valid choice (decorative); only a MISSING alt is a fault. */
  const imagesMissingAlt = images.filter((tag) => attr(tag, "alt") === null).length;

  /* A JavaScript application shell: scripts, and almost no visible text
     in the body until they run. Its raw HTML can't speak for the content. */
  const body = clean.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? clean;
  const bodyText = decode(body.replace(/<[^>]+>/g, " "));
  const clientRendered = /<script\b/i.test(html) && bodyText.length < 200;

  return {
    finalUrl: finalUrl.toString(),
    https: finalUrl.protocol === "https:",
    statusCode: status,
    title,
    metaDescription: metaContent(clean, "description") || null,
    canonical,
    noindex: robots.includes("noindex") || xRobots.includes("noindex"),
    viewport: metaContent(clean, "viewport") !== null,
    lang: attr(htmlTag, "lang") || null,
    clientRendered,
    h1Count: clientRendered ? null : h1Count,
    headings: clientRendered ? [] : headings,
    imageCount: clientRendered ? null : images.length,
    imagesMissingAlt: clientRendered ? null : imagesMissingAlt,
  };
}

/** Fetch and check. Throws AuditInputError when the site can't be reached. */
export async function checkPage(url: URL): Promise<OnPageChecks> {
  const { url: finalUrl, res } = await fetchPage(url);
  if (res.status >= 400) {
    throw new AuditInputError(
      `Your website responded with an error (HTTP ${res.status}), so we couldn't read the page.`,
    );
  }
  if (!res.body) {
    throw new AuditInputError("That address didn't return a web page we could read.");
  }
  return readHtml(res.body, finalUrl, res.status, res.headers);
}
