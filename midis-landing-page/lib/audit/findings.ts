import type { Issue, OnPageChecks, Priority } from "./types";

/**
 * Turns the two evidence sources into ONE prioritised list of findings.
 *
 *   - Lighthouse issues seen on both mobile and desktop are merged into one
 *     finding marked "both" (the worse priority, the larger saving).
 *   - On-page checks add findings only where Lighthouse has no say.
 *     Lighthouse inspects the RENDERED page, so whenever it ran it is
 *     authoritative for what it checks (title, meta description, viewport,
 *     lang, alt text, noindex, HTTPS) — pass or fail. The raw-HTML checks
 *     cover those only when Lighthouse is unavailable, and always cover
 *     what Lighthouse has no audit for: canonical, H1 structure.
 */

const RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2 };

/** On-page check id → the Lighthouse audit that already covers it. */
const COVERED_BY: Record<string, string> = {
  "page-title": "document-title",
  "page-meta-description": "meta-description",
  "page-viewport": "viewport",
  "page-lang": "html-has-lang",
  "page-image-alt": "image-alt",
  "page-noindex": "is-crawlable",
  "page-https": "is-on-https",
};

export function onPageIssues(checks: OnPageChecks): Issue[] {
  const out: Issue[] = [];
  const add = (issue: Omit<Issue, "source">) => out.push({ ...issue, source: "page" });

  if (!checks.https) {
    add({
      id: "page-https",
      category: "best-practices",
      priority: "critical",
      title: "Website is not served over HTTPS",
      detail: `The page loaded at ${checks.finalUrl}, which is not a secure (HTTPS) address.`,
      suggestion: "Install an SSL certificate and redirect every page to HTTPS.",
    });
  }
  if (checks.noindex) {
    add({
      id: "page-noindex",
      category: "seo",
      priority: "critical",
      title: "Page is blocked from search results (noindex)",
      detail: "A robots noindex directive tells search engines not to index this page.",
      suggestion: "Remove the noindex directive if this page should appear in search results.",
    });
  }
  if (!checks.title) {
    add({
      id: "page-title",
      category: "seo",
      priority: "critical",
      title: "Page title is missing",
      detail: "The page has no <title>, which search engines use as the headline of your result.",
      suggestion: "Add a unique, descriptive title of around 50–60 characters.",
    });
  } else if (checks.title.length > 65 || checks.title.length < 15) {
    add({
      id: "page-title-length",
      category: "seo",
      priority: "medium",
      title: checks.title.length > 65 ? "Page title is long" : "Page title is very short",
      detail: `The title is ${checks.title.length} characters: “${checks.title.slice(0, 90)}”.`,
      suggestion: "Aim for a descriptive title of around 50–60 characters so it isn't cut off in search results.",
    });
  }
  if (!checks.metaDescription) {
    add({
      id: "page-meta-description",
      category: "seo",
      priority: "high",
      title: "Meta description is missing",
      detail: "Without a meta description, search engines choose their own snippet for your result.",
      suggestion: "Add a meta description that summarises the page in 150–160 characters.",
    });
  }
  if (!checks.canonical) {
    add({
      id: "page-canonical",
      category: "seo",
      priority: "medium",
      title: "No canonical URL is declared",
      detail: "The page doesn't declare a canonical address, which helps search engines handle duplicate URLs.",
      suggestion: "Add a <link rel=\"canonical\"> pointing to the preferred address of the page.",
    });
  }
  if (!checks.viewport) {
    add({
      id: "page-viewport",
      category: "seo",
      priority: "high",
      title: "Mobile viewport is not configured",
      detail: "The page has no viewport meta tag, so phones may display it as a shrunken desktop page.",
      suggestion: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    });
  }
  if (!checks.lang) {
    add({
      id: "page-lang",
      category: "accessibility",
      priority: "medium",
      title: "Page language is not declared",
      detail: "The <html> element has no lang attribute, which screen readers use to pronounce content.",
      suggestion: "Add a lang attribute, for example <html lang=\"en\">.",
    });
  }
  if (checks.h1Count === 0) {
    add({
      id: "page-h1-missing",
      category: "seo",
      priority: "high",
      title: "No main heading (H1) on the page",
      detail: "The page has no H1, the heading that tells visitors and search engines what the page is about.",
      suggestion: "Add one clear H1 that describes the page.",
    });
  } else if (checks.h1Count !== null && checks.h1Count > 1) {
    add({
      id: "page-h1-multiple",
      category: "seo",
      priority: "medium",
      title: "Multiple main headings (H1)",
      detail: `The page has ${checks.h1Count} H1 headings, which blurs which topic is the main one.`,
      suggestion: "Keep one H1 per page and use H2/H3 for sections.",
    });
  }
  if (checks.imagesMissingAlt !== null && checks.imagesMissingAlt > 0) {
    add({
      id: "page-image-alt",
      category: "accessibility",
      priority: "high",
      title: "Images without alternative text",
      detail: `${checks.imagesMissingAlt} of ${checks.imageCount} images in the page's HTML have no alt attribute.`,
      suggestion: "Add descriptive alt text to meaningful images, and alt=\"\" to purely decorative ones.",
    });
  }
  return out;
}

export function combineIssues(lighthouse: Issue[], page: Issue[], lighthouseRan: boolean): Issue[] {
  /* Merge the same Lighthouse audit across mobile and desktop. */
  const byId = new Map<string, Issue>();
  for (const issue of lighthouse) {
    const existing = byId.get(issue.id);
    if (!existing) {
      byId.set(issue.id, { ...issue });
      continue;
    }
    existing.source = "both";
    if (RANK[issue.priority] < RANK[existing.priority]) existing.priority = issue.priority;
    if ((issue.savingsMs ?? 0) > (existing.savingsMs ?? 0)) {
      existing.savingsMs = issue.savingsMs;
      existing.detail = issue.detail;
    }
  }
  for (const issue of page) {
    const covering = COVERED_BY[issue.id];
    if (covering && (lighthouseRan || byId.has(covering))) continue;
    byId.set(issue.id, issue);
  }
  return [...byId.values()].sort(
    (a, b) =>
      RANK[a.priority] - RANK[b.priority] ||
      (b.savingsMs ?? 0) - (a.savingsMs ?? 0) ||
      (b.source === "both" ? 1 : 0) - (a.source === "both" ? 1 : 0),
  );
}

/**
 * The top three for the on-screen summary. Importance comes first: each
 * slot goes to the most important remaining finding. Variety only breaks
 * ties — among findings of that same priority, one from a category not yet
 * shown is preferred — so a minor note can never displace a high-priority
 * fix just because it is in a different category.
 */
export function topThree(issues: Issue[]): Issue[] {
  const remaining = [...issues];
  const picked: Issue[] = [];
  const seen = new Set<string>();
  while (picked.length < 3 && remaining.length > 0) {
    const best = RANK[remaining[0].priority];
    const varied = remaining.findIndex((i) => RANK[i.priority] === best && !seen.has(i.category));
    const [chosen] = remaining.splice(varied >= 0 ? varied : 0, 1);
    picked.push(chosen);
    seen.add(chosen.category);
  }
  return picked;
}
