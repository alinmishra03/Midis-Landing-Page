import "server-only";
import { CATEGORIES, scopeLabel, type AuditResult } from "./types";
import type { DeliveryStatus } from "./email";

/**
 * Stores an audit lead in the EXISTING MIDIS Strapi `enquiries` collection
 * — the same inbox every other form on the site feeds, configured by the
 * same STRAPI_URL / STRAPI_API_TOKEN (see app/api/enquiry/route.ts). No
 * second lead database.
 *
 * That collection has five fields (name, email, phoneNumber, services,
 * message) and `services` is a strict enum, so — exactly like the other
 * forms — everything else (website, scores, top issues, report reference,
 * email delivery status, marketing consent) goes into `message` as a
 * readable block. "Seo Optimisation" is one of the enum's verified values.
 */

const STRAPI_BASE = process.env.STRAPI_URL ?? "https://jubilant-sparkle-2f7bfe100e.strapiapp.com";
const ENDPOINT = `${STRAPI_BASE.replace(/\/$/, "")}/api/enquiries`;

export async function storeLead(opts: {
  lead: { name: string; email: string; phone: string; marketingConsent: boolean };
  result: AuditResult;
  reference: string;
  /** "sending" when saved before delivery (the normal order). */
  visitorEmail: DeliveryStatus | "sending";
  submittedAt: string;
}): Promise<boolean> {
  const { result } = opts;
  const scores = (strategy: "mobile" | "desktop") => {
    const s = result.lighthouse[strategy]?.scores;
    return s ? CATEGORIES.map((c) => `${c.label} ${s[c.key] ?? "not scored"}`).join(", ") : "";
  };
  const lines: [string, string][] = [
    ["Source", "Landing page — Free Website Audit tool"],
    ["Audit ID", result.auditId],
    ["Website audited", result.finalUrl],
    ["Audit date", result.analyzedAt],
    ["Audit status", result.lighthouse.status === "complete" && result.onPage.status === "complete" ? "Complete" : "Partial"],
    ["Scope", scopeLabel(result)],
    ["Mobile scores", scores("mobile")],
    ["Desktop scores", scores("desktop")],
    ["Top issues", result.issues.slice(0, 5).map((i) => i.title).join("; ")],
    ["Report reference", opts.reference],
    [
      "Report email status",
      opts.visitorEmail === "sending"
        ? "Being sent (the MIDIS notification email confirms the result)"
        : opts.visitorEmail === "not_configured"
          ? "Not emailed — email isn't set up yet; the visitor downloaded the report on screen"
          : opts.visitorEmail,
    ],
    ["Marketing consent", opts.lead.marketingConsent ? "Yes (opted in)" : "No (not opted in)"],
    ["Submitted", opts.submittedAt],
  ];
  const record = {
    name: opts.lead.name,
    email: opts.lead.email,
    phoneNumber: opts.lead.phone,
    services: "Seo Optimisation",
    message: lines
      .filter(([, v]) => v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  };
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: record }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      console.error(`[audit] CMS rejected lead (${response.status}):`, (await response.text().catch(() => "")).slice(0, 400));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[audit] CMS unreachable:", error);
    return false;
  }
}
