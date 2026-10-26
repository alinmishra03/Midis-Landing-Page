import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { emailEnabled } from "@/lib/audit/email";
import { combineIssues, onPageIssues } from "@/lib/audit/findings";
import { checkPage } from "@/lib/audit/page";
import { runLighthouse, type LighthouseOutcome, type StrategyProgress } from "@/lib/audit/pagespeed";
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
 * Each audit gets a unique ID, sealed with its results.
 *
 * PROGRESS. A request sent with `Accept: application/x-ndjson` (the form)
 * gets a stream of newline-delimited JSON events while the audit runs —
 * {"type":"progress","stage":"lighthouse"} when the Google requests go out,
 * {"type":"progress","stage":"mobile"|"desktop","outcome":"done"|"failed"}
 * as each analysis actually finishes, {"type":"progress","stage":"preparing"}
 * — then one {"type":"result","status":<http status>,"body":{…}} with
 * exactly what the plain JSON response would have carried. Nothing is
 * announced before it has happened. Input errors (bad URL, rate limit)
 * are answered before any stream starts, as plain JSON.
 */

type Emit = (event: Record<string, unknown>) => void;

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

  if (request.headers.get("accept")?.includes("application/x-ndjson")) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit: Emit = (event) => {
          try {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          } catch {
            /* The visitor left; the audit's outcome is still logged. */
          }
        };
        try {
          const { status, body: result } = await audit(url, emit);
          emit({ type: "result", status, body: result });
        } catch (error) {
          console.error("[audit] audit crashed:", error);
          emit({
            type: "result",
            status: 500,
            body: { ok: false, retryable: true, message: "Something went wrong while analysing your website. Please try again." },
          });
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const { status, body: result } = await audit(url, () => {});
  return NextResponse.json(result, { status });
}

async function audit(url: URL, emit: Emit): Promise<{ status: number; body: Record<string, unknown> }> {
  emit({ type: "progress", stage: "lighthouse" });
  const onSettled: StrategyProgress = (strategy, outcome) => emit({ type: "progress", stage: strategy, outcome });
  const [page, lighthouse] = await Promise.allSettled([checkPage(url), runLighthouse(url.toString(), onSettled)]);
  emit({ type: "progress", stage: "preparing" });

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
    return { status: 422, body: { ok: false, field: "url", message: pageReason } };
  }

  /* NO SCORES, NO AUDIT. Without Lighthouse there are no scores, and a
     page-checks-only result must never be presented as a completed audit:
     stop here with a retry (the form keeps the URL). One strategy missing
     is a PARTIAL audit and continues, clearly labelled. */
  if (lh.status === "unavailable") {
    const config = lh.misconfigured ? " (CONFIGURATION: check PAGESPEED_API_KEY)" : "";
    console.error(`[audit] audit stopped — no Lighthouse results for ${url}: ${JSON.stringify(lh.missing)}${config}`);
    const pageFault = Object.values(lh.missing).every((m) => /couldn't load your page/.test(m ?? ""));
    return {
      status: 503,
      body: {
        ok: false,
        retryable: true,
        message:
          pageFault && !lh.misconfigured
            ? "We couldn't analyze this website: Google's analysis couldn't load the page. Please check the URL and that the site is publicly reachable, then try again."
            : "Our audit service is temporarily unavailable, so we couldn't score your website. Please try again in a moment.",
      },
    };
  }

  const analyzedAt = new Date().toISOString();
  const result: AuditResult = {
    auditId: `MA-${analyzedAt.slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`,
    url: url.toString(),
    finalUrl: checks?.finalUrl ?? url.toString(),
    analyzedAt,
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
  console.info(`[audit] ${result.auditId} ${complete ? "complete" : "partial"} audit of ${result.finalUrl}`);
  return {
    status: 200,
    body: {
      ok: true,
      token: seal(result),
      preview: {
        auditId: result.auditId,
        url: result.finalUrl,
        analyzedAt: result.analyzedAt,
        status: complete ? "complete" : "partial",
        /* Step 2's wording follows this: email the report, or offer it
           as a download only. */
        emailEnabled: emailEnabled(),
        /* Plain-language note shown with a partial audit. */
        note: complete
          ? undefined
          : [result.lighthouse.reason, result.onPage.reason].filter(Boolean).join(" "),
      },
    },
  };
}

export function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
