import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { site } from "@/content/site";
import {
  BAND_LABEL,
  CATEGORIES,
  PRIORITY_LABEL,
  band,
  interpret,
  scopeLabel,
  type AuditResult,
  type CategoryKey,
  type Issue,
  type StrategyResult,
} from "./types";

/**
 * The full, branded PDF report — built from the audit result alone. Every
 * score, metric and finding in it is the audit's own; a category that was
 * not measured is printed as "Not available", never as a number.
 *
 * Standard PDF fonts (Helvetica) keep the file small and need no font
 * files; their WinAnsi encoding can't draw every character a website might
 * contain, so all text passes through `safe()` first.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const WIDTH = A4[0] - MARGIN * 2;

const C = {
  ink: rgb(0.09, 0.09, 0.09),
  muted: rgb(0.4, 0.4, 0.39),
  line: rgb(0.89, 0.89, 0.87),
  orange: rgb(0.965, 0.545, 0.075),
  orangeInk: rgb(0.667, 0.353, 0.039),
  paper: rgb(0.98, 0.976, 0.965),
  good: rgb(0.11, 0.49, 0.29),
  average: rgb(0.7, 0.42, 0.0),
  poor: rgb(0.76, 0.2, 0.11),
};

const BAND_COLOR = { good: C.good, average: C.average, poor: C.poor };

/* cp1252 characters above 0xFF that WinAnsi can encode. */
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

function safe(text: string): string {
  return [...text.normalize("NFC")]
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (ch === "\n") return " ";
      if (code < 0x20) return "";
      if (code <= 0xff || WIN_ANSI_EXTRA.has(ch)) return ch;
      if (ch === "≤") return "<=";
      if (ch === "≥") return ">=";
      if (ch === "→") return "->";
      return "?";
    })
    .join("");
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  logo: PDFImage | null;
  pageNo: number;
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage(A4);
  ctx.pageNo += 1;
  ctx.y = A4[1] - MARGIN;
  footer(ctx);
}

function ensure(ctx: Ctx, space: number) {
  if (ctx.y - space < MARGIN + 30) newPage(ctx);
}

function footer(ctx: Ctx) {
  const text = safe(`MIDIS  ·  ${site.url.replace(/^https?:\/\//, "")}  ·  Page ${ctx.pageNo}`);
  ctx.page.drawLine({
    start: { x: MARGIN, y: MARGIN + 14 },
    end: { x: A4[0] - MARGIN, y: MARGIN + 14 },
    thickness: 0.6,
    color: C.line,
  });
  ctx.page.drawText(text, { x: MARGIN, y: MARGIN, size: 8, font: ctx.regular, color: C.muted });
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
    } else {
      if (line) lines.push(line);
      /* A single over-long token (a URL): hard-break it. */
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width) {
        let cut = rest.length;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function text(
  ctx: Ctx,
  value: string,
  opts: { size?: number; bold?: boolean; color?: RGB; indent?: number; gap?: number; width?: number } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.bold ? ctx.bold : ctx.regular;
  const leading = size * 1.42;
  const lines = wrap(value, font, size, (opts.width ?? WIDTH) - (opts.indent ?? 0));
  for (const line of lines) {
    ensure(ctx, leading);
    ctx.y -= leading;
    ctx.page.drawText(line, {
      x: MARGIN + (opts.indent ?? 0),
      y: ctx.y + size * 0.28,
      size,
      font,
      color: opts.color ?? C.ink,
    });
  }
  ctx.y -= opts.gap ?? 0;
}

function heading(ctx: Ctx, number: number, title: string) {
  ensure(ctx, 70);
  ctx.y -= 18;
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 2, width: 18, height: 3, color: C.orange });
  ctx.y -= 16;
  ctx.page.drawText(safe(`${number}. ${title}`), { x: MARGIN, y: ctx.y, size: 15, font: ctx.bold, color: C.ink });
  ctx.y -= 10;
}

function row(ctx: Ctx, label: string, value: string) {
  const lines = wrap(value, ctx.regular, 9.5, WIDTH - 150);
  ensure(ctx, lines.length * 14 + 6);
  const top = ctx.y;
  ctx.page.drawText(safe(label), { x: MARGIN, y: top - 12, size: 9.5, font: ctx.bold, color: C.muted });
  lines.forEach((line, i) =>
    ctx.page.drawText(line, { x: MARGIN + 150, y: top - 12 - i * 13.5, size: 9.5, font: ctx.regular, color: C.ink }),
  );
  ctx.y = top - Math.max(1, lines.length) * 13.5 - 5;
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: A4[0] - MARGIN, y: ctx.y }, thickness: 0.4, color: C.line });
}

/** A score ring: grey track, coloured arc proportional to the score. */
function ring(ctx: Ctx, cx: number, cy: number, score: number | undefined, label: string) {
  const r = 22;
  ctx.page.drawCircle({ x: cx, y: cy, size: r, borderColor: C.line, borderWidth: 5 });
  if (score !== undefined) {
    const color = BAND_COLOR[band(score)];
    if (score >= 100) {
      ctx.page.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: 5 });
    } else if (score > 0) {
      const angle = (score / 100) * Math.PI * 2;
      const ex = r * Math.sin(angle);
      const ey = -r * Math.cos(angle);
      /* SVG coordinates: y grows downward from the origin given. */
      ctx.page.drawSvgPath(`M 0 ${-r} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${ex} ${ey}`, {
        x: cx,
        y: cy,
        borderColor: color,
        borderWidth: 5,
      });
    }
  }
  const value = score === undefined ? "n/a" : String(score);
  const size = score === undefined ? 10 : 15;
  const w = ctx.bold.widthOfTextAtSize(value, size);
  ctx.page.drawText(value, { x: cx - w / 2, y: cy - size * 0.35, size, font: ctx.bold, color: score === undefined ? C.muted : C.ink });
  const lw = ctx.regular.widthOfTextAtSize(label, 8.5);
  ctx.page.drawText(label, { x: cx - lw / 2, y: cy - r - 16, size: 8.5, font: ctx.regular, color: C.muted });
}

function scoreRow(ctx: Ctx, title: string, result: StrategyResult | undefined) {
  ensure(ctx, 92);
  ctx.page.drawText(safe(title), { x: MARGIN, y: ctx.y - 14, size: 10, font: ctx.bold, color: C.ink });
  const cy = ctx.y - 52;
  const step = (WIDTH - 90) / 4;
  CATEGORIES.forEach((cat, i) => ring(ctx, MARGIN + 90 + step * i + step / 2, cy, result?.scores[cat.key], cat.label));
  ctx.y -= 96;
}

function issueBlock(ctx: Ctx, issue: Issue) {
  ensure(ctx, 60);
  const tag = safe(PRIORITY_LABEL[issue.priority].toUpperCase());
  const color = issue.priority === "critical" ? C.poor : issue.priority === "high" ? C.orangeInk : C.muted;
  ctx.y -= 6;
  ctx.page.drawText(tag, { x: MARGIN, y: ctx.y - 10, size: 7.5, font: ctx.bold, color });
  ctx.y -= 12;
  text(ctx, issue.title, { size: 10.5, bold: true });
  text(ctx, issue.detail, { size: 9, color: C.muted });
  text(ctx, `Suggested improvement: ${issue.suggestion}`, { size: 9, gap: 4 });
}

function categorySection(ctx: Ctx, result: AuditResult, key: CategoryKey) {
  const mobile = result.lighthouse.mobile?.scores[key];
  const desktop = result.lighthouse.desktop?.scores[key];
  const parts = [
    `Mobile: ${mobile ?? "Not available"}`,
    `Desktop: ${desktop ?? "Not available"}`,
  ];
  text(ctx, `Lighthouse score — ${parts.join("  ·  ")}`, { size: 10, bold: true, gap: 2 });
  const basis = mobile ?? desktop;
  if (basis !== undefined) {
    text(ctx, `${BAND_LABEL[band(basis)]}. ${interpret(key, basis)}`, { size: 9.5, color: C.muted, gap: 4 });
  }
}

export async function buildReportPdf(
  result: AuditResult,
  /** siteUrl: this landing page's own origin, where the estimator lives. */
  meta: { reference: string; preparedFor: string; siteUrl: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(safe(`Website Audit Report — ${result.finalUrl}`));
  doc.setAuthor("MIDIS");
  doc.setCreator("MIDIS Free Website Audit");

  let logo: PDFImage | null = null;
  try {
    const bytes = await readFile(path.join(process.cwd(), "public/brand/wordmark-on-light.png"));
    logo = await doc.embedPng(bytes);
  } catch {
    /* The report still renders without the image; the name is in text. */
  }

  const ctx: Ctx = {
    doc,
    page: doc.addPage(A4),
    y: A4[1] - MARGIN,
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    logo,
    pageNo: 1,
  };
  footer(ctx);

  /* ---- cover band ---- */
  if (logo) {
    const h = 24;
    ctx.page.drawImage(logo, { x: MARGIN, y: ctx.y - h, width: (logo.width / logo.height) * h, height: h });
  } else {
    ctx.page.drawText("MIDIS", { x: MARGIN, y: ctx.y - 20, size: 20, font: ctx.bold, color: C.ink });
  }
  const tag = "FREE WEBSITE AUDIT";
  ctx.page.drawText(tag, {
    x: A4[0] - MARGIN - ctx.bold.widthOfTextAtSize(tag, 8),
    y: ctx.y - 14,
    size: 8,
    font: ctx.bold,
    color: C.orangeInk,
  });
  ctx.y -= 58;
  ctx.page.drawText("Website Audit Report", { x: MARGIN, y: ctx.y, size: 26, font: ctx.bold, color: C.ink });
  ctx.y -= 8;
  text(ctx, result.finalUrl, { size: 12, color: C.orangeInk });
  const date = new Date(result.analyzedAt);
  const dateText = date.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  text(ctx, `Prepared for ${meta.preparedFor}  ·  Analysed ${dateText}  ·  Reference ${meta.reference}`, {
    size: 9,
    color: C.muted,
    gap: 6,
  });

  /* ---- 1. overview ---- */
  heading(ctx, 1, "Website Overview");
  row(ctx, "Website", result.url);
  if (result.finalUrl !== result.url) row(ctx, "Final address", result.finalUrl);
  row(ctx, "Audit date", dateText);
  row(ctx, "Analysis status", result.lighthouse.status === "complete" ? "Complete — mobile and desktop" : `Partial — ${result.lighthouse.reason ?? "some results are unavailable"}`);
  row(
    ctx,
    "Audit scope",
    `Home page. Google Lighthouse via PageSpeed Insights: ${scopeLabel(result)}. Direct page checks: ${result.onPage.status === "complete" ? "completed" : `not available (${result.onPage.reason ?? "the page could not be read"})`}.`,
  );

  /* ---- 2 & 3. Lighthouse results, one section per device ---- */
  const strategySection = (n: number, strategy: "mobile" | "desktop") => {
    const label = strategy === "mobile" ? "Mobile" : "Desktop";
    heading(ctx, n, `${label} Lighthouse Results`);
    const data = result.lighthouse[strategy];
    if (!data) {
      /* Never "n/a" rings for a run that didn't happen: say why. */
      text(ctx, `${label} results are not available for this audit.`, { size: 10, bold: true });
      text(ctx, `Reason: ${result.lighthouse.missing?.[strategy] ?? "the analysis did not complete."}`, { size: 9.5, color: C.muted, gap: 4 });
      return;
    }
    scoreRow(ctx, label, data);
    for (const cat of CATEGORIES) {
      const score = data.scores[cat.key];
      text(
        ctx,
        score === undefined
          ? `${cat.label}: not scored in this run.`
          : `${cat.label} ${score} — ${BAND_LABEL[band(score)]}. ${interpret(cat.key, score)}`,
        { size: 9, color: C.muted },
      );
    }
    ctx.y -= 4;
  };
  strategySection(2, "mobile");
  strategySection(3, "desktop");
  text(
    ctx,
    "Scores are from Google Lighthouse via PageSpeed Insights at the time of analysis, on a 0–100 scale (90+ good, 50–89 needs improvement, below 50 poor). Lab results vary slightly between runs.",
    { size: 8, color: C.muted },
  );

  const byCategory = (key: CategoryKey) => result.issues.filter((issue) => issue.category === key);

  /* ---- 4. performance metrics ---- */
  heading(ctx, 4, "Performance Metrics");
  for (const strategy of ["mobile", "desktop"] as const) {
    const data = result.lighthouse[strategy];
    const label = strategy === "mobile" ? "Mobile" : "Desktop";
    if (!data) {
      text(ctx, `${label}: not available — ${result.lighthouse.missing?.[strategy] ?? "the analysis did not complete."}`, { size: 9.5, color: C.muted, gap: 4 });
      continue;
    }
    text(ctx, `${label} loading metrics (lab)`, { size: 10, bold: true, gap: 2 });
    if (data.metrics.length) for (const metric of data.metrics) row(ctx, metric.label, metric.display);
    else text(ctx, "Lighthouse returned no loading metrics for this run.", { size: 9.5, color: C.muted });
    ctx.y -= 6;
    if (data.fieldData.length) {
      text(ctx, `Real-user data from the Chrome UX Report (${strategy})`, { size: 10, bold: true, gap: 2 });
      for (const field of data.fieldData) row(ctx, field.label, `${field.display} — ${field.rating}`);
      ctx.y -= 6;
    }
  }
  const perf = byCategory("performance");
  if (perf.length) {
    text(ctx, "Optimisation opportunities", { size: 10, bold: true });
    perf.slice(0, 8).forEach((issue) => issueBlock(ctx, issue));
  } else {
    text(ctx, "No significant performance opportunities were flagged.", { size: 9.5, color: C.muted });
  }

  /* ---- 5. SEO findings ---- */
  heading(ctx, 5, "SEO Findings");
  categorySection(ctx, result, "seo");
  const checks = result.onPage.checks;
  if (checks) {
    text(ctx, "Page checks", { size: 10, bold: true, gap: 2 });
    row(ctx, "Page title", checks.title ? `${checks.title} (${checks.title.length} characters)` : "Missing");
    row(ctx, "Meta description", checks.metaDescription ? `${checks.metaDescription} (${checks.metaDescription.length} characters)` : "Missing");
    row(ctx, "Canonical URL", checks.canonical ?? "Not declared");
    row(ctx, "Indexability", checks.noindex ? "Blocked — a noindex directive is present" : "No noindex directive found");
    row(ctx, "Mobile viewport", checks.viewport ? "Configured" : "Missing");
    if (checks.clientRendered) {
      row(ctx, "Page rendering", "Built in the browser by JavaScript — content checks come from Lighthouse, which renders the page.");
    }
    row(
      ctx,
      "Main heading (H1)",
      checks.h1Count === null
        ? "Not assessed from the HTML (content is rendered by JavaScript)"
        : checks.h1Count === 1
          ? "One H1"
          : `${checks.h1Count} H1 headings`,
    );
    const outline = checks.headings.slice(0, 6).map((h) => `H${h.level}: ${h.text}`).join("   ");
    if (outline) row(ctx, "Heading outline", outline);
    ctx.y -= 6;
  } else {
    text(ctx, `Direct page checks were not available: ${result.onPage.reason ?? "the page could not be read."}`, { size: 9.5, color: C.muted });
  }
  const seo = byCategory("seo");
  if (seo.length) seo.slice(0, 8).forEach((issue) => issueBlock(ctx, issue));
  else text(ctx, "No SEO issues were flagged.", { size: 9.5, color: C.muted });

  /* ---- 6. accessibility findings ---- */
  heading(ctx, 6, "Accessibility Findings");
  categorySection(ctx, result, "accessibility");
  if (checks) {
    row(
      ctx,
      "Images without alt text",
      checks.imagesMissingAlt === null
        ? "Not assessed from the HTML (content is rendered by JavaScript) — see the Lighthouse findings"
        : `${checks.imagesMissingAlt} of ${checks.imageCount} images in the page's HTML`,
    );
    row(ctx, "Page language", checks.lang ?? "Not declared");
    ctx.y -= 6;
  }
  const a11y = byCategory("accessibility");
  if (a11y.length) a11y.slice(0, 8).forEach((issue) => issueBlock(ctx, issue));
  else text(ctx, "No failing automated accessibility checks were flagged.", { size: 9.5, color: C.muted });
  text(ctx, "Automated checks catch only part of accessibility; a manual review is recommended for full coverage.", { size: 8, color: C.muted });

  /* ---- 7. best practices ---- */
  heading(ctx, 7, "Best Practices");
  categorySection(ctx, result, "best-practices");
  if (checks) {
    row(ctx, "HTTPS", checks.https ? "The page is served over HTTPS" : "The page is NOT served over HTTPS");
    ctx.y -= 6;
  }
  const bp = byCategory("best-practices");
  if (bp.length) bp.slice(0, 8).forEach((issue) => issueBlock(ctx, issue));
  else text(ctx, "No best-practice issues were flagged.", { size: 9.5, color: C.muted });

  /* ---- 8. priority recommendations ---- */
  heading(ctx, 8, "Priority Recommendations");
  const groups: [string, Issue[]][] = [
    ["Critical issues", result.issues.filter((i) => i.priority === "critical")],
    ["High-priority improvements", result.issues.filter((i) => i.priority === "high")],
    ["Additional optimisation opportunities", result.issues.filter((i) => i.priority === "medium").slice(0, 10)],
  ];
  for (const [title, list] of groups) {
    text(ctx, title, { size: 10.5, bold: true, gap: 2 });
    if (list.length === 0) {
      text(ctx, "None found in this audit.", { size: 9.5, color: C.muted, gap: 6 });
      continue;
    }
    for (const issue of list) text(ctx, `•  ${issue.title} — ${issue.suggestion}`, { size: 9.5, indent: 6, gap: 2 });
    ctx.y -= 6;
  }

  /* ---- 9. how MIDIS can help ---- */
  heading(ctx, 9, "How MIDIS Can Help");
  text(
    ctx,
    "MIDIS designs, builds and improves business websites — website development and redesign, Shopify and e-commerce, UI/UX design, and SEO. We can turn the findings in this report into a prioritised plan and fix them for you.",
    { size: 10, gap: 8 },
  );
  text(ctx, `Discuss your results or get a project estimate: ${meta.siteUrl}/#estimator`, { size: 10, bold: true, color: C.orangeInk });
  text(ctx, `Or email us at ${site.email}`, { size: 10, gap: 4 });

  return doc.save();
}
