import { NextResponse } from "next/server";
import { projectEstimateSchema, toPortfolioProjectEstimate } from "@/lib/project-estimate";
import { clientIp, makeLimiter } from "@/lib/audit/limits";

/**
 * The four-step "Get Your Project Estimate" form → MIDIS admin Strapi.
 *
 * A server-side proxy, the same convention as /api/consultation: input is
 * validated here, a spam trap and a rate limit apply, and any future API
 * token would stay on the server. ONE record per completed form — the
 * four steps are submitted together. A 200 is returned ONLY when Strapi
 * confirms the record (2xx with a record id) — never because a request
 * was merely sent. Personal data is never logged: only statuses and
 * Strapi's error names.
 *
 *   MIDIS_ADMIN_API_URL   base URL of the admin Strapi (optional;
 *                         defaults to https://admins.midis.in)
 *   MIDIS_ADMIN_API_TOKEN only if the collection's create permission is
 *                         ever moved off the Public role (optional)
 */

const BASE = (process.env.MIDIS_ADMIN_API_URL ?? "https://admins.midis.in").replace(/\/$/, "");
const ENDPOINT = `${BASE}/api/portfolio-project-estimates`;
const FALLBACK_EMAIL = "hello@midis.in";

const limited = makeLimiter(5, 60_000);

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: `Too many submissions from this connection. Please wait a minute and try again, or email us at ${FALLBACK_EMAIL}.` },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that submission. Please try again." }, { status: 400 });
  }

  const parsed = projectEstimateSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    /* The spam trap ("website", a field people never see). */
    if ("website" in fieldErrors) {
      console.warn("[project-estimate] spam trap triggered");
      return NextResponse.json({ ok: false, message: "We could not process that submission. Please refresh and try again." }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields and try again.", fieldErrors },
      { status: 422 },
    );
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MIDIS_ADMIN_API_TOKEN ? { Authorization: `Bearer ${process.env.MIDIS_ADMIN_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: toPortfolioProjectEstimate(parsed.data) }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[project-estimate] Strapi unreachable:", (error as Error).name);
    return NextResponse.json(
      { ok: false, message: `We could not submit your request just now. Please try again, or email us at ${FALLBACK_EMAIL}.` },
      { status: 502 },
    );
  }

  const body = (await response.json().catch(() => ({}))) as {
    data?: { id?: number | string; documentId?: string } | null;
    error?: { status?: number; name?: string; message?: string };
  };

  if (!response.ok || !body.data || (body.data.id === undefined && !body.data.documentId)) {
    /* Strapi's error name/message describe the schema, not the visitor. */
    console.error(
      `[project-estimate] Strapi rejected the submission (${response.status}): ${body.error?.name ?? ""} ${body.error?.message ?? ""}`.trim(),
    );
    return NextResponse.json(
      {
        ok: false,
        message:
          response.status === 401 || response.status === 403
            ? `We could not submit your request just now. Please email us at ${FALLBACK_EMAIL}.`
            : `We could not submit your request just now. Please try again, or email us at ${FALLBACK_EMAIL}.`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
