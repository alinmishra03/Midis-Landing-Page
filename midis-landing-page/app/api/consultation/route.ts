import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { consultationSchema } from "@/lib/consultation";
import { submitPortfolioInquiry } from "@/lib/portfolio-inquiry";
import { clientIp, makeLimiter } from "@/lib/audit/limits";

/**
 * The consultation form (homepage hero, lead popup and the audit page's
 * in-place form — one component, ConsultationForm) → the unified Strapi
 * collection portfolio-inquiries (2026-10-28; it replaced
 * portfolio-consultations). Validation: lib/consultation.ts; field mapping,
 * enum values and the request itself: lib/portfolio-inquiry.ts.
 *
 * A server-side proxy, the same convention as /api/enquiry: input is
 * validated here, a spam trap and a rate limit apply, and any future API
 * token would stay on the server. A 200 is returned ONLY when Strapi
 * confirms the record (2xx with a record id) — never because a request
 * was merely sent. Personal data is never logged: only statuses and
 * Strapi's error names.
 *
 *   MIDIS_ADMIN_API_URL   base URL of the admin Strapi (optional;
 *                         defaults to https://admins.midis.in)
 *   MIDIS_ADMIN_API_TOKEN a token with create on Portfolio Inquiry — needed
 *                         unless the Public role has that permission
 */

const FALLBACK_EMAIL = site.email;

const limited = makeLimiter(5, 60_000);

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many submissions from this connection. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that submission. Please try again." }, { status: 400 });
  }

  const parsed = consultationSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && key !== "hp" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields and try again.", fieldErrors },
      { status: 422 },
    );
  }

  if (parsed.data.hp !== "") {
    console.warn("[consultation] spam trap triggered");
    return NextResponse.json({ ok: false, message: "We could not process that submission. Please refresh and try again." }, { status: 400 });
  }

  /* Each failure keeps its own status (it used to be 502 for all of them):
     422 a field Strapi rejected · 503 the API refused us (token/permission)
     · 504 Strapi unreachable or timed out · 502 anything else upstream. */
  const result = await submitPortfolioInquiry(parsed.data);
  if (!result.ok) {
    if (result.reason === "invalid") {
      return NextResponse.json(
        { ok: false, message: "Please check the highlighted fields and try again.", fieldErrors: result.fieldErrors },
        { status: 422 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message:
          result.reason === "forbidden"
            ? `We could not submit your request just now. Please email us at ${FALLBACK_EMAIL}.`
            : `We could not submit your request just now. Please try again, or email us at ${FALLBACK_EMAIL}.`,
      },
      { status: result.reason === "forbidden" ? 503 : result.reason === "unreachable" ? 504 : 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
