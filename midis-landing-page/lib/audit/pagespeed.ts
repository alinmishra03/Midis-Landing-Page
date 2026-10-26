import "server-only";
import type { CategoryKey, Issue, Metric, Priority, StrategyResult, Strategy } from "./types";

/**
 * Google PageSpeed Insights (Lighthouse) — the scoring engine.
 *
 * Runs server-side only, with PAGESPEED_API_KEY from the environment (the
 * keyless quota is shared worldwide and is routinely exhausted, so a key is
 * required in practice). Mobile and desktop run in parallel. Every number
 * returned here is Lighthouse's own; when a run fails it is reported as a
 * failure with a reason — it is never replaced with an estimate.
 */

/* Overridable only to route through a proxy or a local test double. */
const ENDPOINT =
  process.env.PAGESPEED_ENDPOINT ?? "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const TIMEOUT_MS = 55_000;

const CATEGORY_PARAMS = ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"];

const METRICS: [string, string][] = [
  ["first-contentful-paint", "First Contentful Paint"],
  ["largest-contentful-paint", "Largest Contentful Paint"],
  ["total-blocking-time", "Total Blocking Time"],
  ["cumulative-layout-shift", "Cumulative Layout Shift"],
  ["speed-index", "Speed Index"],
];

const FIELD_METRICS: [string, string][] = [
  ["LARGEST_CONTENTFUL_PAINT_MS", "Largest Contentful Paint"],
  ["INTERACTION_TO_NEXT_PAINT", "Interaction to Next Paint"],
  ["CUMULATIVE_LAYOUT_SHIFT_SCORE", "Cumulative Layout Shift"],
];

/* ---- the shapes of the parts of the Lighthouse result we read ---- */

interface LhAudit {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  details?: { type?: string; overallSavingsMs?: number; items?: unknown[] };
  metricSavings?: Record<string, number>;
}

interface LhCategory {
  score: number | null;
  auditRefs: { id: string; weight: number; group?: string }[];
}

interface PsiResponse {
  lighthouseResult?: {
    categories: Record<string, LhCategory>;
    audits: Record<string, LhAudit>;
    runtimeError?: { code: string; message: string };
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile: number; category: string }>;
  };
  error?: { code: number; message: string };
}

export class LighthouseError extends Error {
  constructor(
    message: string,
    /** Safe, plain-language reason for the visitor. */
    readonly reason: string,
    /** Worth retrying: rate limits, Google-side 5xx, network failures. */
    readonly transient = false,
  ) {
    super(message);
  }
}

const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
/* An attempt is only started if it has at least this long to run. */
const MIN_ATTEMPT_MS = 20_000;

async function attempt(url: string, strategy: Strategy, key: string, timeoutMs: number): Promise<PsiResponse> {
  const query = new URLSearchParams({ url, strategy, key });
  for (const category of CATEGORY_PARAMS) query.append("category", category);

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${query}`, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = (error as Error).name === "TimeoutError";
    throw new LighthouseError(
      `PSI ${strategy} request failed: ${(error as Error).message}`,
      timedOut ? "Google's analysis took too long to complete." : "Google's analysis service couldn't be reached.",
      true,
    );
  }
  const body = (await response.json().catch(() => ({}))) as PsiResponse;
  if (!response.ok || body.error) {
    const status = body.error?.code ?? response.status;
    const message = body.error?.message ?? "";
    /* A bad key is a 400 ("API key not valid"), a disabled API a 403:
       configuration, never the visitor's page — and never worth a retry. */
    const badKey = status === 401 || status === 403 || /API key not valid|API_KEY_INVALID|API key expired/i.test(message);
    /* A DAILY quota won't reset within this request: no retry. A
       per-minute rate limit will. */
    const dailyQuota = status === 429 && /per day/i.test(message);
    /* The log says exactly what went wrong; the visitor gets plain words. */
    const hint = badKey
      ? " — PAGESPEED_API_KEY was rejected: check the key, and that the PageSpeed Insights API is enabled for its Google Cloud project"
      : status === 429
        ? dailyQuota
          ? " — daily quota exhausted for this key (resets at midnight Pacific time)"
          : " — rate limited"
        : "";
    /* PSI answers 500 both for its own faults and for "couldn't load the
       page"; the message tells them apart. */
    const pageFault =
      !badKey &&
      (status === 400 || /FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|NO_FCP|DNS_FAILURE|Unable to process request/i.test(message));
    throw new LighthouseError(
      `PSI ${strategy} ${status}${hint}: ${message}`.slice(0, 500),
      pageFault ? "Google's analysis couldn't load your page." : "Google's analysis service is temporarily unavailable.",
      TRANSIENT_STATUS.has(status) && !pageFault && !dailyQuota,
    );
  }
  if (!body.lighthouseResult || body.lighthouseResult.runtimeError?.code) {
    throw new LighthouseError(
      `PSI ${strategy} runtime error: ${body.lighthouseResult?.runtimeError?.code ?? ""} ${body.lighthouseResult?.runtimeError?.message ?? "no result"}`,
      "Google's analysis couldn't load your page.",
    );
  }
  return body;
}

/**
 * One strategy, with BOUNDED retries: up to three attempts, backing off
 * 1.5s then 3s, and only for transient failures — and never starting an
 * attempt that couldn't finish inside the deadline (the route's own time
 * limit). Permanent failures (a rejected key, a page Google can't load)
 * fail at once.
 */
async function runStrategy(url: string, strategy: Strategy, key: string, deadline: number): Promise<PsiResponse> {
  for (let n = 1; ; n++) {
    const left = deadline - Date.now();
    try {
      return await attempt(url, strategy, key, Math.min(TIMEOUT_MS, left));
    } catch (error) {
      const e = error as LighthouseError;
      const backoff = 1500 * 2 ** (n - 1);
      const canRetry = e.transient && n < MAX_ATTEMPTS && deadline - Date.now() - backoff >= MIN_ATTEMPT_MS;
      console.error(`[audit] ${e.message}${canRetry ? ` — retrying in ${backoff}ms (attempt ${n + 1}/${MAX_ATTEMPTS})` : ""}`);
      if (!canRetry) throw e;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

const CATEGORY_IDS: Record<CategoryKey, string> = {
  performance: "performance",
  seo: "seo",
  accessibility: "accessibility",
  "best-practices": "best-practices",
};

/** Lighthouse descriptions end in "[Learn more](…)" links: keep the prose. */
export function plain(text = ""): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s*Learn (more|how)[^.]*\.?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentences(text: string | undefined, max = 240): string {
  const prose = plain(text);
  if (prose.length <= max) return prose;
  const cut = prose.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

/* Audits whose failure matters most, by category. */
const CRITICAL = new Set(["is-crawlable", "is-on-https", "http-status-code", "document-title"]);
const HIGH = new Set([
  "meta-description",
  "viewport",
  "image-alt",
  "color-contrast",
  "link-name",
  "button-name",
  "label",
  "html-has-lang",
  "crawlable-anchors",
  "redirects-http",
  "errors-in-console",
]);

function issuesFrom(lh: NonNullable<PsiResponse["lighthouseResult"]>, strategy: Strategy): Issue[] {
  const issues: Issue[] = [];
  for (const category of Object.keys(CATEGORY_IDS) as CategoryKey[]) {
    const cat = lh.categories[CATEGORY_IDS[category]];
    if (!cat) continue;
    for (const ref of cat.auditRefs) {
      const audit = lh.audits[ref.id];
      if (!audit || audit.score === null || audit.score >= 0.9) continue;
      const mode = audit.scoreDisplayMode ?? "";
      if (mode === "notApplicable" || mode === "manual" || mode === "informative" || mode === "error") continue;

      if (category === "performance") {
        /* Only the actionable groups. Metrics (FCP, LCP…) are reported
           separately, and "hidden" refs (TTI, max FID) are not findings. */
        if (ref.group !== "diagnostics" && ref.group !== "load-opportunities") continue;
        /* Lighthouse 12 states savings per metric; the largest time saving
           (LCP, FCP or blocking time — CLS is unitless) is the one that
           matters. Older results carry overallSavingsMs instead. */
        const ms = audit.metricSavings ?? {};
        const savings = Math.round(
          Math.max(audit.details?.overallSavingsMs ?? 0, ms.LCP ?? 0, ms.FCP ?? 0, ms.TBT ?? 0),
        );
        const isOpportunity = audit.details?.type === "opportunity" || savings > 0;
        if (!isOpportunity && audit.score > 0.5) continue;
        /* A poor overall score raises the stakes of each sizeable saving. */
        const poorPerf = (cat.score ?? 1) < 0.5;
        const priority: Priority =
          savings >= 3000
            ? "critical"
            : savings >= 1000 || (poorPerf && savings >= 500)
              ? "high"
              : "medium";
        issues.push({
          id: audit.id,
          category,
          priority,
          title: audit.title,
          detail: audit.displayValue
            ? `${firstSentences(audit.description)} Measured: ${audit.displayValue}.`
            : firstSentences(audit.description),
          suggestion: SUGGESTIONS[audit.id] ?? firstSentences(audit.description, 160),
          savingsMs: savings || undefined,
          source: strategy,
        });
        continue;
      }

      if (ref.weight <= 0) continue;
      const priority: Priority = CRITICAL.has(audit.id)
        ? "critical"
        : HIGH.has(audit.id) || ref.weight >= 7
          ? "high"
          : "medium";
      issues.push({
        id: audit.id,
        category,
        priority,
        title: audit.title,
        detail: firstSentences(audit.description),
        suggestion: SUGGESTIONS[audit.id] ?? firstSentences(audit.description, 160),
        source: strategy,
      });
    }
  }
  return issues;
}

/** Plain-English next steps for the findings people meet most often. */
const SUGGESTIONS: Record<string, string> = {
  "render-blocking-resources": "Defer non-critical CSS and JavaScript, and inline the CSS needed for the first screen.",
  "unused-javascript": "Remove or split JavaScript that isn't used on this page, and load third-party scripts only where needed.",
  "unused-css-rules": "Remove unused CSS or split styles so each page loads only what it uses.",
  "uses-optimized-images": "Compress images before upload and serve them at the quality the page actually needs.",
  "modern-image-formats": "Serve images in WebP or AVIF instead of large JPEG or PNG files.",
  "uses-responsive-images": "Serve images at the size they are displayed, using responsive srcset sizes.",
  "offscreen-images": "Lazy-load images that are below the first screen.",
  "unminified-javascript": "Minify JavaScript files as part of the build.",
  "unminified-css": "Minify CSS files as part of the build.",
  "uses-text-compression": "Enable Gzip or Brotli compression on the server.",
  "server-response-time": "Reduce server response time with caching, a faster host or a CDN.",
  "uses-long-cache-ttl": "Set long cache lifetimes for static assets such as images, fonts and scripts.",
  "total-byte-weight": "Reduce the total page weight — mainly images, video and third-party scripts.",
  "dom-size": "Simplify the page structure; very large pages are slow to render and update.",
  "largest-contentful-paint-element": "Make the main hero element load first: optimise and preload it.",
  "layout-shifts": "Reserve space for images, ads and embeds so content doesn't jump while loading.",
  "lcp-lazy-loaded": "Don't lazy-load the main above-the-fold image.",
  "third-party-summary": "Review third-party scripts and remove or delay the ones that aren't essential.",
  "bootup-time": "Reduce JavaScript execution time by removing, splitting or deferring scripts.",
  "mainthread-work-breakdown": "Reduce main-thread work — mostly JavaScript execution and style recalculation.",
  "font-display": "Use font-display: swap so text stays visible while web fonts load.",
  "redirects": "Remove unnecessary redirects so the page is reached in one request.",
  "document-title": "Add a unique, descriptive <title> to every page.",
  "meta-description": "Add a meta description that summarises the page in 150–160 characters.",
  "is-crawlable": "Remove the noindex directive if you want this page to appear in search results.",
  "link-text": "Use descriptive link text instead of phrases like “click here”.",
  "crawlable-anchors": "Make sure links use real href addresses search engines can follow.",
  "image-alt": "Add descriptive alt text to every meaningful image.",
  "color-contrast": "Increase the contrast between text and background colours.",
  "link-name": "Give every link a discernible name.",
  "button-name": "Give every button an accessible name.",
  "label": "Associate every form field with a visible label.",
  "html-has-lang": "Add a lang attribute to the <html> element.",
  "heading-order": "Use headings in order (H1, then H2, then H3) without skipping levels.",
  "viewport": "Add a responsive viewport meta tag.",
  "is-on-https": "Serve the whole site, including its assets, over HTTPS.",
  "errors-in-console": "Fix the errors logged in the browser console.",
  "inspector-issues": "Resolve the issues reported in the browser's Issues panel.",
  "image-aspect-ratio": "Display images at their natural aspect ratio.",
  "image-size-responsive": "Serve images with enough resolution for high-density screens.",
};

function parse(body: PsiResponse, strategy: Strategy): { result: StrategyResult; issues: Issue[] } {
  const lh = body.lighthouseResult!;
  const scores: StrategyResult["scores"] = {};
  for (const key of Object.keys(CATEGORY_IDS) as CategoryKey[]) {
    const score = lh.categories[CATEGORY_IDS[key]]?.score;
    if (typeof score === "number") scores[key] = Math.round(score * 100);
  }
  const metrics: Metric[] = METRICS.flatMap(([id, label]) => {
    const audit = lh.audits[id];
    return audit?.displayValue ? [{ id, label, display: audit.displayValue, score: audit.score }] : [];
  });
  const fieldData = FIELD_METRICS.flatMap(([id, label]) => {
    const metric = body.loadingExperience?.metrics?.[id];
    if (!metric) return [];
    const display =
      id === "CUMULATIVE_LAYOUT_SHIFT_SCORE"
        ? (metric.percentile / 100).toFixed(2)
        : `${(metric.percentile / 1000).toFixed(1)} s`;
    const rating = metric.category === "FAST" ? "Good" : metric.category === "AVERAGE" ? "Needs improvement" : "Poor";
    return [{ label, display, rating }];
  });
  return { result: { strategy, scores, metrics, fieldData }, issues: issuesFrom(lh, strategy) };
}

export interface LighthouseOutcome {
  status: "complete" | "partial" | "unavailable";
  /** Plain-language summary when not complete. */
  reason?: string;
  /** Why each missing strategy is missing. */
  missing: Partial<Record<Strategy, string>>;
  /** True when the cause is MIDIS-side configuration, not Google or the site. */
  misconfigured?: boolean;
  mobile?: StrategyResult;
  desktop?: StrategyResult;
  issues: Issue[];
}

function report<T>(run: Promise<T>, strategy: Strategy, onSettled?: StrategyProgress): Promise<T> {
  run.then(
    () => onSettled?.(strategy, "done"),
    () => onSettled?.(strategy, "failed"),
  );
  return run;
}

/** Total time Lighthouse may take, inside the route's 60s limit. */
const BUDGET_MS = 52_000;

/** Called as each strategy settles — the real progress the form shows. */
export type StrategyProgress = (strategy: Strategy, outcome: "done" | "failed") => void;

export async function runLighthouse(url: string, onSettled?: StrategyProgress): Promise<LighthouseOutcome> {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) {
    /* A configuration gap for MIDIS, not something a visitor can act on:
       loud in the log, plain on screen. */
    console.error(
      "[audit] PAGESPEED_API_KEY is not set — no Lighthouse audit was attempted. Add the key to the server environment (see .env.example) and redeploy.",
    );
    const reason = "Our scoring service is unavailable right now.";
    return { status: "unavailable", reason, missing: { mobile: reason, desktop: reason }, misconfigured: true, issues: [] };
  }
  const deadline = Date.now() + BUDGET_MS;
  /* Exactly two requests, in parallel — never more. */
  const [mobile, desktop] = await Promise.allSettled([
    report(runStrategy(url, "mobile", key, deadline), "mobile", onSettled),
    report(runStrategy(url, "desktop", key, deadline), "desktop", onSettled),
  ]);
  const out: LighthouseOutcome = { status: "unavailable", missing: {}, issues: [] };
  let misconfigured = false;
  for (const [settled, strategy] of [
    [mobile, "mobile"],
    [desktop, "desktop"],
  ] as const) {
    if (settled.status === "fulfilled") {
      const parsed = parse(settled.value, strategy);
      out[strategy] = parsed.result;
      out.issues.push(...parsed.issues);
    } else {
      const error = settled.reason as LighthouseError;
      out.missing[strategy] = error.reason ?? "Google's analysis failed.";
      if (/rejected|daily quota/.test(error.message)) misconfigured = true;
    }
  }
  out.status = out.mobile && out.desktop ? "complete" : out.mobile || out.desktop ? "partial" : "unavailable";
  if (out.status === "partial") {
    const which = out.mobile ? "desktop" : "mobile";
    out.reason = `${which === "mobile" ? "Mobile" : "Desktop"} results aren't available: ${out.missing[which]}`;
  } else if (out.status === "unavailable") {
    out.reason = [...new Set(Object.values(out.missing))].join(" ");
    out.misconfigured = misconfigured;
  }
  return out;
}
