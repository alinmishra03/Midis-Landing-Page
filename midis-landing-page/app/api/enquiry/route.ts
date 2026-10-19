import { NextResponse } from "next/server";
import { enquirySchema, toStrapi } from "@/lib/enquiry";

/**
 * Enquiry submission proxy.
 *
 * Posts to the EXISTING MIDIS Strapi instance so leads land in the inbox the
 * team already monitors. Proxying server-side rather than calling Strapi from
 * the browser means we can validate input, apply a honeypot and a rate limit,
 * and keep any API token off the client entirely — the token is read from the
 * environment here and never reaches the bundle.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: a 200 is returned only when
 * Strapi accepted the record. If the CMS is unreachable, rejects the payload,
 * or is not configured, the caller gets a non-2xx and an honest message. The
 * form then shows a failure and offers the email address instead. A lead that
 * did not land must never be shown a success screen.
 */

const STRAPI_BASE =
  process.env.STRAPI_URL ?? "https://jubilant-sparkle-2f7bfe100e.strapiapp.com";
const STRAPI_ENDPOINT = `${STRAPI_BASE.replace(/\/$/, "")}/api/enquiries`;

/** Contact route offered whenever a submission could not be stored. */
const FALLBACK_EMAIL = "hello@midis.in";

/* ==========================================================================
   Rate limiting
   --------------------------------------------------------------------------
   A fixed window per IP, held in module memory. This is deliberately modest:
   it stops a form being hammered from one machine, and it is not a defence
   against a distributed flood. On a serverless platform each instance keeps
   its own map, so the real limit is per-instance — which is fine for the job
   it is doing here. A durable limit belongs at the edge, not in this file.
   ========================================================================== */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });

    /* Opportunistic sweep so the map cannot grow without bound on a
       long-lived instance. Cheap, and only runs on a fresh window. */
    if (hits.size > 500) {
      for (const [key, value] of hits) {
        if (now > value.resetAt) hits.delete(key);
      }
    }
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  /* The left-most entry is the original client; the rest are proxies. */
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* ==========================================================================
   Handler
   ========================================================================== */

export async function POST(request: Request) {
  const now = Date.now();

  if (rateLimited(clientIp(request), now)) {
    return NextResponse.json(
      {
        ok: false,
        message: `Too many submissions from this connection. Please wait a minute and try again, or email us at ${FALLBACK_EMAIL}.`,
      },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "We could not read that submission." },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    /*
     * Field-level messages are returned so the form can mark the exact
     * inputs that failed, rather than showing one generic banner and leaving
     * the visitor to hunt for the problem.
     */
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    /* The honeypot is the one failure we do not explain. */
    if ("website" in fieldErrors) {
      return NextResponse.json({ ok: true, spam: true }, { status: 200 });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Please check the highlighted fields and try again.",
        fieldErrors,
      },
      { status: 422 },
    );
  }

  const record = toStrapi(parsed.data);

  let response: Response;
  try {
    response = await fetch(STRAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ data: record }),
      /* Never let a hanging CMS hold a visitor's browser open indefinitely. */
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.error("[enquiry] CMS unreachable:", error);
    return NextResponse.json(
      {
        ok: false,
        message: `We could not submit your request just now. Please email us at ${FALLBACK_EMAIL} and we'll pick it up straight away.`,
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    /*
     * Logged with the CMS's own body, because the useful detail is in there
     * — a rejected enum value names itself in the ValidationError. Not
     * forwarded to the browser: it can carry schema internals.
     */
    const body = await response.text().catch(() => "");
    console.error(
      `[enquiry] CMS rejected submission (${response.status}):`,
      body.slice(0, 600),
    );

    return NextResponse.json(
      {
        ok: false,
        message: `We could not submit your request just now. Please email us at ${FALLBACK_EMAIL} and we'll pick it up straight away.`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Anything other than POST is not a thing this route does. */
export function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
