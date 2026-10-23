import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendLeadNotification, sendVisitorReport, type Delivery } from "@/lib/audit/email";
import { topThree } from "@/lib/audit/findings";
import { storeLead } from "@/lib/audit/lead";
import { clientIp, makeLimiter } from "@/lib/audit/limits";
import { buildReportPdf } from "@/lib/audit/pdf";
import { unseal } from "@/lib/audit/seal";
import type { AuditResult } from "@/lib/audit/types";

/**
 * STEP 2 of the Free Website Audit: contact details in, report out.
 *
 *   1. validate the contact details (the same rules the form shows);
 *   2. open the sealed audit from step 1 (tamper-proof, see seal.ts);
 *   3. SAVE THE LEAD in the existing Strapi inbox, first — nothing that
 *      follows can lose it;
 *   4. build the branded PDF from the audit;
 *   5. email it to the visitor — "accepted" only when Resend accepted it
 *      (its message id is kept and passed to MIDIS);
 *   6. notify MIDIS, including the delivery result.
 * A failure in 4–6 still returns the results, with an accurate status and
 * a retry that re-sends the email only.
 *
 * DUPLICATES: the form sends a requestId it keeps for the session; a
 * repeat of a request already handled here returns the first answer
 * without sending or storing again. `mode: "retry-email"` resends ONLY
 * the visitor's report (after a failed delivery) and never re-stores the
 * lead. (The cache is per server instance; Resend's own idempotency key
 * on the report reference covers a retry that lands elsewhere.)
 *
 * The response carries the short report for step 3 and the PDF itself, so
 * a visitor whose email could not be delivered still gets their report.
 */

export const maxDuration = 45;

const limited = makeLimiter(6, 60_000);

const phone = z
  .string()
  .trim()
  .min(1, "Please enter your phone number.")
  .max(32, "That phone number is longer than we can store.")
  .refine((v) => /^\+[\d\s().-]+$/.test(v), "Please include your country code, starting with +.")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 8 && digits <= 15;
  }, "Please enter a valid international phone number.");

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "That name is longer than we can store."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(160, "That email address is longer than we can store.")
    .pipe(z.email("Please enter a valid email address.")),
  phone,
  marketingConsent: z.boolean().default(false),
});

const requestSchema = z.object({
  token: z.string().min(40).max(200_000),
  requestId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  mode: z.enum(["submit", "retry-email"]).default("submit"),
  /* The spam trap (a hidden field only bots fill). */
  hp: z.string().optional().default(""),
  contact: z.unknown(),
});

/* Two separate operations, two separate statuses: the visitor's report
   email and MIDIS's notification never share a field. */
interface Outcome {
  reference: string;
  email: Delivery;
  leadStored: boolean;
  notification: Delivery;
}

const handled = new Map<string, { at: number; outcome: Outcome }>();

function remember(id: string, outcome: Outcome) {
  const now = Date.now();
  handled.set(id, { at: now, outcome });
  if (handled.size > 500) for (const [key, value] of handled) if (now - value.at > 3_600_000) handled.delete(key);
}

async function makePdf(result: AuditResult, reference: string, preparedFor: string, siteUrl: string): Promise<Uint8Array | null> {
  try {
    return await buildReportPdf(result, { reference, preparedFor, siteUrl });
  } catch (error) {
    console.error(`[audit] PDF build failed for ${reference}:`, error);
    return null;
  }
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: "Too many requests from this connection. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We couldn't read that request. Please refresh the page and try again." }, { status: 400 });
  }
  const parsedRequest = requestSchema.safeParse(raw);
  if (!parsedRequest.success) {
    console.warn("[audit] malformed report request:", parsedRequest.error.issues.map((i) => i.path.join(".")).join(", "));
    return NextResponse.json({ ok: false, message: "That request was incomplete. Please refresh the page and try again." }, { status: 400 });
  }
  const { token, requestId, mode, hp } = parsedRequest.data;
  if (hp !== "") {
    console.warn(`[audit] spam trap triggered on /api/audit/report (ip ${clientIp(request)})`);
    return NextResponse.json(
      { ok: false, message: "We couldn't process that request. Please refresh the page and try again." },
      { status: 400 },
    );
  }

  const contact = contactSchema.safeParse(parsedRequest.data.contact);
  if (!contact.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of contact.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, message: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const result = unseal(token);
  if (!result) {
    return NextResponse.json(
      { ok: false, expired: true, message: "Your audit session has expired. Please run the audit again — it only takes a moment." },
      { status: 410 },
    );
  }

  const lead = contact.data;
  /* Links in the report and email point back at THIS deployment's
     estimator, on whatever domain the request arrived on. */
  const siteUrl = new URL(request.url).origin;
  const firstName = lead.name.split(/\s+/)[0];
  const top = topThree(result.issues);
  const previous = handled.get(requestId)?.outcome;

  /* The reference is fixed per request, so a retry re-uses it. */
  const reference =
    previous?.reference ??
    `MA-${result.analyzedAt.slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;

  let outcome: Outcome;
  let pdf: Uint8Array | null;

  if (previous && mode === "submit") {
    /* A duplicate submit: answer as before; nothing is stored or sent again. */
    outcome = previous;
    pdf = await makePdf(result, reference, lead.name, siteUrl);
  } else if (mode === "retry-email") {
    /* Email only — the lead was saved by the original submit, and is
       never re-stored (no duplicate records). */
    pdf = await makePdf(result, reference, lead.name, siteUrl);
    const base: Outcome = previous ?? { reference, email: { status: "failed" }, leadStored: true, notification: { status: "accepted" } };
    /* Never send the same report twice: an accepted email is final. */
    const email: Delivery =
      base.email.status === "accepted"
        ? base.email
        : pdf
          ? await sendVisitorReport({ to: lead.email, siteUrl, firstName, result, top, pdf, reference })
          : { status: "failed" };
    console.info(`[audit] ${reference} retry: visitor email ${email.status}`);
    outcome = { ...base, email };
    remember(requestId, outcome);
  } else {
    /* THE SUBMIT, in the order that protects the lead:
         1. save the lead (before anything that can fail on its own);
         2. build the report from the sealed audit;
         3. email it to the visitor;
         4. notify MIDIS, with the delivery result.
       A failure in 2–4 never discards the saved lead; the visitor still
       gets their results and an accurate status. */
    const submittedAt = new Date().toISOString();
    const leadStored = await storeLead({ lead, result, reference, visitorEmail: "sending", submittedAt });
    pdf = await makePdf(result, reference, lead.name, siteUrl);
    const email: Delivery = pdf
      ? await sendVisitorReport({ to: lead.email, siteUrl, firstName, result, top, pdf, reference })
      : { status: "failed" };
    /* Independent of the visitor email: sent whatever happened above. */
    const notification = await sendLeadNotification({ lead, result, pdf, reference, visitorEmail: email, submittedAt, leadStored });
    console.info(
      `[audit] ${reference} lead saved=${leadStored} pdf=${pdf ? "ok" : "failed"} visitor email=${email.status}${email.id ? " (" + email.id + ")" : ""} notification=${notification.status}`,
    );
    if (!leadStored && notification.status !== "accepted") {
      console.error(`[audit] LEAD NOT CAPTURED — ${reference} ${lead.email} ${result.finalUrl}`);
    }
    outcome = { reference, email, leadStored, notification };
    remember(requestId, outcome);
  }

  return NextResponse.json({
    ok: true,
    reference: outcome.reference,
    lead: { saved: outcome.leadStored || outcome.notification.status === "accepted" },
    email: { status: outcome.email.status, address: lead.email },
    result,
    top,
    pdf: pdf ? Buffer.from(pdf).toString("base64") : null,
  });
}

export function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
