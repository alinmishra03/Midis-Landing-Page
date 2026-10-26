import "server-only";
import { site } from "@/content/site";
import { CATEGORIES, PRIORITY_LABEL, scopeLabel, type AuditResult, type Issue } from "./types";

/**
 * Transactional email for the audit tool, via Resend's HTTP API.
 *
 *   RESEND_API_KEY     the Resend API key
 *   AUDIT_EMAIL_FROM   a sender on a domain verified in Resend,
 *                      e.g. "MIDIS <audit@midis.in>"
 *   LEAD_NOTIFY_EMAIL  where MIDIS's internal lead notifications go
 *
 * A message counts as "accepted" ONLY when Resend accepts it (HTTP 2xx with a
 * message id). Without credentials the status is "not_configured" — never
 * "accepted". Accepted means queued by the provider for delivery, NOT
 * confirmed in the inbox — confirming delivery needs a Resend webhook
 * ("email.delivered"), which this site does not have. No recipient address is ever invented: if LEAD_NOTIFY_EMAIL is
 * unset, no internal notification is attempted.
 */

export type DeliveryStatus = "accepted" | "failed" | "not_configured";

/** The outcome of one send, with Resend's message id when accepted. */
export interface Delivery {
  status: DeliveryStatus;
  id?: string;
}

/** Whether the visitor's report can be emailed at all — the form words
    its promises to match (no "we'll email it" when it can't). */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUDIT_EMAIL_FROM);
}

/* Overridable only to route through a proxy or a local test double. */
const RESEND_ENDPOINT = process.env.RESEND_ENDPOINT ?? "https://api.resend.com/emails";

interface Attachment {
  filename: string;
  content: Uint8Array;
}

async function send(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
  idempotencyKey: string;
}): Promise<Delivery> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AUDIT_EMAIL_FROM;
  if (!key || !from) {
    console.error("[audit] email not sent — RESEND_API_KEY and/or AUDIT_EMAIL_FROM are not set.");
    return { status: "not_configured" };
  }
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        /* Resend de-duplicates retries carrying the same key. */
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
        })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (response.ok && body.id) {
      console.info(`[audit] email accepted by Resend: ${message.idempotencyKey} → id ${body.id}`);
      return { status: "accepted", id: body.id };
    }
    console.error(`[audit] email rejected (${response.status}):`, body.message ?? "");
    return { status: "failed" };
  } catch (error) {
    console.error("[audit] email provider unreachable:", error);
    return { status: "failed" };
  }
}

/* ---- templates ---- */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreLine(result: AuditResult, strategy: "mobile" | "desktop"): string | null {
  const scores = result.lighthouse[strategy]?.scores;
  if (!scores) return null;
  return CATEGORIES.map((c) => `${c.label} ${scores[c.key] ?? "not scored"}`).join(" · ");
}

function summaryRows(result: AuditResult): [string, string][] {
  const rows: [string, string][] = [
    ["Website", result.finalUrl],
    ["Analysed", new Date(result.analyzedAt).toUTCString()],
    ["Scope", scopeLabel(result)],
  ];
  const m = scoreLine(result, "mobile");
  const d = scoreLine(result, "desktop");
  if (m) rows.push(["Mobile scores", m]);
  if (d) rows.push(["Desktop scores", d]);
  return rows;
}

function layout(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf9f6;font-family:Helvetica,Arial,sans-serif;color:#171717">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e3de;border-radius:16px">
<tr><td style="padding:28px 28px 8px"><span style="font-size:22px;font-weight:700;letter-spacing:-0.5px">midis</span>
<span style="float:right;font-size:11px;font-weight:700;letter-spacing:1.6px;color:#aa5a0a;padding-top:8px">FREE WEBSITE AUDIT</span></td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6">${inner}</td></tr>
</table>
<p style="font-size:12px;color:#666663;margin:16px 0 0">MIDIS · <a href="${site.url}" style="color:#666663">${esc(site.url.replace(/^https?:\/\//, ""))}</a> · ${esc(site.email)}</p>
</td></tr></table></body></html>`;
}

function table(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666663;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;vertical-align:top">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function issueList(issues: Issue[]): string {
  return `<ol style="padding-left:20px;margin:8px 0 16px">${issues
    .map(
      (i) =>
        `<li style="margin:0 0 10px"><strong>${esc(i.title)}</strong> <span style="font-size:12px;color:#aa5a0a">(${esc(PRIORITY_LABEL[i.priority])})</span><br><span style="color:#444">${esc(i.suggestion)}</span></li>`,
    )
    .join("")}</ol>`;
}

export function sendVisitorReport(opts: {
  to: string;
  /** This landing page's own origin, where the estimator lives. */
  siteUrl: string;
  firstName: string;
  result: AuditResult;
  top: Issue[];
  pdf: Uint8Array;
  reference: string;
}): Promise<Delivery> {
  const cta = `${opts.siteUrl}/#estimator`;
  const inner = `<h1 style="font-size:22px;line-height:1.25;margin:8px 0 16px">Your Free Website Audit Report</h1>
<p>Hi ${esc(opts.firstName)},</p>
<p>Thank you for requesting a free website audit from MIDIS.</p>
<p>We've analysed your website and prepared a report highlighting its performance, SEO, accessibility, and opportunities for improvement.</p>
${table(summaryRows(opts.result))}
${opts.top.length ? `<p style="margin-bottom:0"><strong>Your top improvement opportunities</strong></p>${issueList(opts.top)}` : ""}
<p>Your full website audit report is attached to this email as a PDF (reference ${esc(opts.reference)}).</p>
<p>We hope these insights help you take the next step toward a better-performing website.</p>
<p style="margin:24px 0"><a href="${cta}" style="background:#ef8716;color:#141518;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;display:inline-block">Get a free project estimate</a></p>
<p>Best regards,<br>Team MIDIS</p>`;
  const text = [
    `Hi ${opts.firstName},`,
    "",
    "Thank you for requesting a free website audit from MIDIS.",
    "",
    "We've analysed your website and prepared a report highlighting its performance, SEO, accessibility, and opportunities for improvement.",
    "",
    ...summaryRows(opts.result).map(([k, v]) => `${k}: ${v}`),
    "",
    ...(opts.top.length ? ["Your top improvement opportunities:", ...opts.top.map((i, n) => `${n + 1}. ${i.title} — ${i.suggestion}`), ""] : []),
    `Your full website audit report is attached as a PDF (reference ${opts.reference}).`,
    "",
    "We hope these insights help you take the next step toward a better-performing website.",
    "",
    `Get a free project estimate from MIDIS: ${cta}`,
    "",
    "Best regards,",
    "Team MIDIS",
  ].join("\n");

  return send({
    to: opts.to,
    subject: "Your Website Audit Report | MIDIS",
    html: layout(inner),
    text,
    replyTo: site.email,
    attachments: [{ filename: `MIDIS-Website-Audit-${opts.reference}.pdf`, content: opts.pdf }],
    idempotencyKey: `audit-visitor-${opts.reference}`,
  });
}

export function sendLeadNotification(opts: {
  lead: { name: string; email: string; phone: string; marketingConsent: boolean };
  result: AuditResult;
  pdf: Uint8Array | null;
  reference: string;
  visitorEmail: Delivery;
  submittedAt: string;
  leadStored: boolean;
}): Promise<Delivery> {
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!to) {
    console.error("[audit] MIDIS lead notification not sent — LEAD_NOTIFY_EMAIL is not set.");
    return Promise.resolve({ status: "not_configured" });
  }
  const rows: [string, string][] = [
    ["Audit ID", opts.result.auditId],
    ["Name", opts.lead.name],
    ["Email", opts.lead.email],
    ["Phone", opts.lead.phone],
    ...summaryRows(opts.result),
    ["Report reference", opts.reference],
    ["Report email to lead", opts.visitorEmail.status === "accepted" ? `accepted by Resend (message id ${opts.visitorEmail.id})` : opts.visitorEmail.status],
    ["Saved in Strapi", opts.leadStored ? "Yes" : "NO — this email is the only record of the lead"],
    ["Marketing consent", opts.lead.marketingConsent ? "Yes (opted in)" : "No"],
    ["Submitted", opts.submittedAt],
  ];
  const top = opts.result.issues.slice(0, 5);
  const inner = `<h1 style="font-size:20px;margin:8px 0 12px">New website audit lead</h1>${table(rows)}${
    top.length ? `<p style="margin-bottom:0"><strong>Top identified issues</strong></p>${issueList(top)}` : ""
  }<p style="font-size:13px;color:#666663">${opts.pdf ? "The lead's full report is attached." : "The report PDF could not be generated for this lead."}</p>`;
  return send({
    to,
    subject: "New Website Audit Lead — MIDIS",
    html: layout(inner),
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    replyTo: opts.lead.email,
    attachments: opts.pdf ? [{ filename: `MIDIS-Website-Audit-${opts.reference}.pdf`, content: opts.pdf }] : [],
    idempotencyKey: `audit-lead-${opts.reference}`,
  });
}
