import { NextResponse } from "next/server";
import { combineIssues, onPageIssues } from "@/lib/audit/findings";
import { checkPage } from "@/lib/audit/page";
import { runLighthouse, type LighthouseOutcome } from "@/lib/audit/pagespeed";
import { clientIp, makeLimiter } from "@/lib/audit/limits";
import { seal } from "@/lib/audit/seal";
import type { AuditResult, OnPageChecks } from "@/lib/audit/types";
import { AuditInputError, assertPublicHost, normaliseUrl } from "@/lib/audit/url";

/**
 * STEP 1 of the Free Website Audit: run a real audit of the visitor's URL.
 *
 * Two evidence sources, in parallel:
 *   - Google PageSpeed Insights (Lighthouse), mobile and desktop — scores,
 *     metrics, findings (lib/audit/pagespeed.ts);
 *   - our own SSRF-guarded fetch of the page — the HTML fundamentals
 *     (lib/audit/page.ts).
 *
 * Outcomes, all truthful:
 *   - the site can't be reached / isn't public → 422 with the reason;
 *   - Lighthouse fails but the page was read → a PARTIAL audit, marked as
 *     such, with page checks only and no scores;
 *   - otherwise a complete audit.
 * The result goes back as an encrypted token (lib/audit/seal.ts) plus a
 * status-only preview: the scores are revealed after the contact step.
 */

export const maxDuration = 60;

/* Each audit spends PageSpeed quota: a few per IP per ten minutes. */
const limited = makeLimiter(4, 10 * 60_000);

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: "You've run several audits in a short time. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: { url?: unknown; hp?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We couldn't read that request. Please refresh the page and try again." }, { status: 400 });
  }

  /* Spam trap (a hidden field only bots fill — see WebsiteAuditTool).
     Logged, so a false positive can never again be invisible. */
  if (typeof body.hp === "string" && body.hp !== "") {
    console.warn(`[audit] spam trap triggered on /api/audit (ip ${clientIp(request)})`);
    return NextResponse.json(
      { ok: false, message: "We couldn't process that request. Please refresh the page and try again." },
      { status: 400 },
    );
  }

  const checked = normaliseUrl(body.url);
  if (!checked.ok) {
    return NextResponse.json({ ok: false, field: "url", message: checked.message }, { status: 422 });
  }
  const url = checked.url;

  try {
    await assertPublicHost(url.hostname);
  } catch (error) {
    const message = error instanceof AuditInputError ? error.message : "We couldn't check that address.";
    return NextResponse.json({ ok: false, field: "url", message }, { status: 422 });
  }

  const [page, lighthouse] = await Promise.allSettled([checkPage(url), runLighthouse(url.toString())]);

  let checks: OnPageChecks | undefined;
  let pageReason: string | undefined;
  if (page.status === "fulfilled") {
    checks = page.value;
  } else {
    pageReason =
      page.reason instanceof AuditInputError
        ? page.reason.message
        : "We couldn't read your page directly.";
    if (!(page.reason instanceof AuditInputError)) console.error("[audit] page check failed:", page.reason);
  }

  const lh: LighthouseOutcome =
    lighthouse.status === "fulfilled"
      ? lighthouse.value
      : { status: "unavailable", reason: "Google's analysis failed.", missing: {}, issues: [] };
  if (lighthouse.status === "rejected") console.error("[audit] lighthouse crashed:", lighthouse.reason);

  /* The site itself couldn't be reached: that's about the URL. */
  if (!checks && page.status === "rejected" && page.reason instanceof AuditInputError && lh.status === "unavailable") {
    return NextResponse.json({ ok: false, field: "url", message: pageReason }, { status: 422 });
  }

  /* NO SCORES, NO AUDIT. Without Lighthouse there are no scores, and a
     page-checks-only result must never be presented as a completed audit:
     stop here with a retry (the form keeps the URL). One strategy missing
     is a PARTIAL audit and continues, clearly labelled. */
  if (lh.status === "unavailable") {
    const config = lh.misconfigured ? " (CONFIGURATION: check PAGESPEED_API_KEY)" : "";
    console.error(`[audit] audit stopped — no Lighthouse results for ${url}: ${JSON.stringify(lh.missing)}${config}`);
    const pageFault = Object.values(lh.missing).every((m) => /couldn't load your page/.test(m ?? ""));
    return NextResponse.json(
      {
        ok: false,
        retryable: true,
        message:
          pageFault && !lh.misconfigured
            ? "We couldn't analyze this website: Google's analysis couldn't load the page. Please check the URL and that the site is publicly reachable, then try again."
            : "Our audit service is temporarily unavailable, so we couldn't score your website. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  const result: AuditResult = {
    url: url.toString(),
    finalUrl: checks?.finalUrl ?? url.toString(),
    analyzedAt: new Date().toISOString(),
    lighthouse: {
      status: lh.status,
      reason: lh.reason,
      missing: lh.missing,
      mobile: lh.mobile,
      desktop: lh.desktop,
    },
    onPage: checks
      ? { status: "complete", checks }
      : { status: "unavailable", reason: pageReason },
    /* Lighthouse ran (scoreless audits stopped above), so it is authoritative. */
    issues: combineIssues(lh.issues, checks ? onPageIssues(checks) : [], true).slice(0, 40),
  };

  const complete = result.lighthouse.status === "complete" && result.onPage.status === "complete";
  return NextResponse.json({
    ok: true,
    token: seal(result),
    preview: {
      url: result.finalUrl,
      analyzedAt: result.analyzedAt,
      status: complete ? "complete" : "partial",
      /* Plain-language note shown with a partial audit. */
      note: complete
        ? undefined
        : [result.lighthouse.reason, result.onPage.reason].filter(Boolean).join(" "),
    },
  });
}

export function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
