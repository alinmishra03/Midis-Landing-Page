/**
 * Shared shapes for the Free Website Audit tool.
 *
 * Client-safe (types and pure helpers only): the browser renders the short
 * report from these, the server builds them from REAL analysis — Google
 * PageSpeed Insights (Lighthouse) plus a direct check of the page's own
 * HTML. Nothing here is ever filled with an estimate: a value that could not
 * be measured is absent, and every consumer renders absence as
 * "Not available", never as a number.
 */

export type Strategy = "mobile" | "desktop";

export const CATEGORIES = [
  { key: "performance", label: "Performance" },
  { key: "seo", label: "SEO" },
  { key: "accessibility", label: "Accessibility" },
  { key: "best-practices", label: "Best Practices" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export type Priority = "critical" | "high" | "medium";

export interface Metric {
  id: string;
  label: string;
  /** Lighthouse's own formatted value, e.g. "2.4 s". */
  display: string;
  /** Lighthouse's 0–1 rating for this metric, when it gives one. */
  score: number | null;
}

export interface Issue {
  id: string;
  /** Which part of the report it belongs to. */
  category: CategoryKey;
  priority: Priority;
  title: string;
  /** What was found — from the audit's own evidence. */
  detail: string;
  /** What to do about it. */
  suggestion: string;
  /** Estimated time saving Lighthouse attaches to performance findings. */
  savingsMs?: number;
  /** Where it was observed. */
  source: "mobile" | "desktop" | "both" | "page";
}

export interface StrategyResult {
  strategy: Strategy;
  /** 0–100, only for categories Lighthouse actually scored. */
  scores: Partial<Record<CategoryKey, number>>;
  metrics: Metric[];
  /** Real-user (Chrome UX Report) field data, when Google has any. */
  fieldData: { label: string; display: string; rating: string }[];
}

export interface OnPageChecks {
  finalUrl: string;
  https: boolean;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  noindex: boolean;
  viewport: boolean;
  lang: string | null;
  /**
   * True when the HTML is a JavaScript application shell (almost no text
   * until scripts run). The raw HTML then says nothing reliable about the
   * page content, so the content checks below are null — "not assessed" —
   * rather than reporting a missing H1 the rendered page actually has.
   */
  clientRendered: boolean;
  h1Count: number | null;
  headings: { level: number; text: string }[];
  imageCount: number | null;
  imagesMissingAlt: number | null;
}

export type SourceStatus = "complete" | "unavailable";

export interface AuditResult {
  /** The address the visitor asked about (normalised). */
  url: string;
  /** Where it ended up after redirects, if the page was fetched. */
  finalUrl: string;
  analyzedAt: string;
  lighthouse: {
    status: "complete" | "partial" | "unavailable";
    /** Plain-language reason when not complete. */
    reason?: string;
    /** Why each strategy that has no results is missing. */
    missing?: Partial<Record<Strategy, string>>;
    mobile?: StrategyResult;
    desktop?: StrategyResult;
  };
  onPage: {
    status: SourceStatus;
    reason?: string;
    checks?: OnPageChecks;
  };
  /** Every finding, most important first. */
  issues: Issue[];
}

/* ---- presentation helpers shared by the page, the email and the PDF ---- */

/** Lighthouse's own score bands. */
export function band(score: number): "good" | "average" | "poor" {
  if (score >= 90) return "good";
  if (score >= 50) return "average";
  return "poor";
}

export const BAND_LABEL = {
  good: "Good",
  average: "Needs improvement",
  poor: "Poor",
} as const;

/**
 * One sentence per category and band. Written to be true for ANY site in
 * that band — they describe what the score means, never a specific cause
 * the audit did not establish.
 */
export function interpret(category: CategoryKey, score: number): string {
  const b = band(score);
  const lines: Record<CategoryKey, Record<typeof b, string>> = {
    performance: {
      good: "Your pages load quickly and respond well in this test.",
      average:
        "Your performance score indicates opportunities to improve page loading and responsiveness.",
      poor: "Your pages load slowly in this test, which can cost you visitors before they see your content.",
    },
    seo: {
      good: "The technical SEO fundamentals Lighthouse checks are in place.",
      average:
        "Some technical SEO fundamentals are missing or incomplete, which can limit how search engines read your pages.",
      poor: "Several technical SEO fundamentals are missing, which can make it harder for search engines to index and present your pages.",
    },
    accessibility: {
      good: "Your page passes most of the automated accessibility checks.",
      average:
        "Some automated accessibility checks failed — fixing them makes your site easier to use for more people.",
      poor: "Many automated accessibility checks failed, which can stop some visitors from using your site.",
    },
    "best-practices": {
      good: "Your page follows most of the technical best practices Lighthouse checks.",
      average:
        "Some technical best-practice checks failed, covering areas such as security and browser compatibility.",
      poor: "Many technical best-practice checks failed, covering areas such as security and browser compatibility.",
    },
  };
  return lines[category][b];
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High priority",
  medium: "Recommended",
};

/** Which strategies produced scores, in words. */
export function scopeLabel(result: AuditResult): string {
  const m = Boolean(result.lighthouse.mobile);
  const d = Boolean(result.lighthouse.desktop);
  if (m && d) return "Mobile and desktop";
  if (m) return "Mobile only";
  if (d) return "Desktop only";
  return "Page checks only (Lighthouse unavailable)";
}
