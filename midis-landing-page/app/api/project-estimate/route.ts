import { NextResponse } from "next/server";
import { z } from "zod";
import { readLead, signLead } from "@/lib/lead-token";
import { STAGE_SCHEMAS, toPortfolioProjectEstimate, type Stage } from "@/lib/project-estimate";
import { clientIp, makeLimiter } from "@/lib/audit/limits";

/**
 * The four-step "Get Your Project Estimate" form → MIDIS admin Strapi,
 * saved STEP BY STEP into ONE record (lib/project-estimate.ts).
 *
 *   { stage, values, leadToken?, formId, website }
 *
 *   - no leadToken: the first save CREATES the record; the response carries
 *     a signed leadToken naming it (lib/lead-token.ts);
 *   - with a leadToken: every later save UPDATES that same record;
 *   - formId (random per form) makes a repeated first save — a retry, or
 *     two saves racing — reuse the record being created instead of making
 *     a second one.
 *
 * A save is reported only when Strapi confirms it (2xx with the record),
 * never because a request was merely sent. The record's progress never
 * goes backwards, and a submitted ("completed") lead is never rewritten.
 * Input is validated here, a spam trap and a rate limit apply, and the
 * API token stays on the server. Personal data is never logged.
 *
 *   MIDIS_ADMIN_API_URL   base URL of the admin Strapi (optional;
 *                         defaults to https://admins.midis.in)
 *   MIDIS_ADMIN_API_TOKEN a Strapi API token with create + update on this
 *                         collection, so the Public role needs no access
 *   LEAD_TOKEN_SECRET     signs lead tokens (AUDIT_TOKEN_SECRET is used
 *                         when this is not set)
 */

const BASE = (process.env.MIDIS_ADMIN_API_URL ?? "https://admins.midis.in").replace(/\/$/, "");
const ENDPOINT = `${BASE}/api/portfolio-project-estimates`;
const FALLBACK_EMAIL = "hello@midis.in";

/* Auto-save and four steps: generous enough for one visitor, not a flood. */
const limited = makeLimiter(40, 60_000);

const requestSchema = z.object({
  stage: z.union([z.literal("draft"), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  values: z.record(z.string(), z.unknown()),
  leadToken: z.string().max(400).optional(),
  formId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  /* The spam trap ("website", a field people never see). */
  website: z.string().optional().default(""),
});

/* First saves in flight, by formId, so a racing or retried first save
   joins the record being created. Per server instance, like the limiter. */
const creating = new Map<string, Promise<string | null>>();

type StrapiResult = { ok: true; id: string } | { ok: false; status: number; unknownKey?: string };

/*
 * THE PROGRESS FIELDS MAY NOT EXIST YET. leadStatus / lastCompletedStep
 * have to be added to the collection in the Strapi admin; until they are,
 * Strapi rejects ANY record that carries them ("Invalid key leadStatus",
 * 400) — which is exactly how every save failed on 2026-10-26. So when
 * Strapi names one of them as an unknown key, the same save is retried
 * without them: the lead is still stored, and its progress still reads
 * from the record itself (projectType set = got past Step 2,
 * existingWebsite = Step 3, budgetRange = submitted — only the final save
 * writes it). The fields are tried again every 10 minutes, so adding them
 * in Strapi turns the statuses on with no code change.
 */
const PROGRESS_KEYS = new Set(["leadStatus", "lastCompletedStep"]);
let progressFieldsMissingAt = 0;

function withoutProgress(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !PROGRESS_KEYS.has(key)));
}

async function strapi(method: "POST" | "PUT", url: string, data: Record<string, unknown>): Promise<StrapiResult> {
  if (Date.now() - progressFieldsMissingAt < 10 * 60_000) return send(method, url, withoutProgress(data));
  const result = await send(method, url, data);
  if (!result.ok && result.unknownKey && PROGRESS_KEYS.has(result.unknownKey)) {
    console.warn(
      "[project-estimate] Strapi has no leadStatus / lastCompletedStep fields yet — saving without them. Add them to Portfolio Project Estimate to record progress.",
    );
    progressFieldsMissingAt = Date.now();
    return send(method, url, withoutProgress(data));
  }
  return result;
}

async function send(method: "POST" | "PUT", url: string, data: unknown): Promise<StrapiResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MIDIS_ADMIN_API_TOKEN ? { Authorization: `Bearer ${process.env.MIDIS_ADMIN_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[project-estimate] Strapi unreachable (${method}):`, (error as Error).name);
    return { ok: false, status: 0 };
  }
  const body = (await response.json().catch(() => ({}))) as {
    data?: { documentId?: string } | null;
    error?: { name?: string; message?: string; details?: { key?: string } };
  };
  if (response.ok && body.data?.documentId) return { ok: true, id: body.data.documentId };
  const unknownKey = response.status === 400 ? body.error?.details?.key : undefined;
  if (unknownKey && PROGRESS_KEYS.has(unknownKey)) return { ok: false, status: 400, unknownKey };
  /* Strapi's error name/message describe the schema, not the visitor. */
  if (!(method === "PUT" && response.status === 404)) {
    console.error(
      `[project-estimate] Strapi rejected the ${method} (${response.status}): ${body.error?.name ?? ""} ${body.error?.message ?? ""}`.trim(),
    );
  }
  return { ok: false, status: response.status };
}

function failure(status: number) {
  return NextResponse.json(
    {
      ok: false,
      message:
        status === 401 || status === 403
          ? `We couldn't save your details just now. Please email us at ${FALLBACK_EMAIL}.`
          : `We couldn't save your details just now. Please try again, or email us at ${FALLBACK_EMAIL}.`,
    },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: `Too many requests from this connection. Please wait a minute and try again, or email us at ${FALLBACK_EMAIL}.` },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We could not read that submission. Please try again." }, { status: 400 });
  }
  const parsedRequest = requestSchema.safeParse(raw);
  if (!parsedRequest.success) {
    return NextResponse.json({ ok: false, message: "That request was incomplete. Please refresh the page and try again." }, { status: 400 });
  }
  const { stage, leadToken, formId, website } = parsedRequest.data;
  if (website !== "") {
    console.warn("[project-estimate] spam trap triggered");
    return NextResponse.json({ ok: false, message: "We could not process that submission. Please refresh and try again." }, { status: 400 });
  }

  const parsed = STAGE_SCHEMAS[stage as Stage].safeParse(parsedRequest.data.values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, message: "Please check the highlighted fields and try again.", fieldErrors }, { status: 422 });
  }

  let lead: { id: string; step: number } | null;
  try {
    /* Signing is checked BEFORE anything is written: a record created
       without a token to hand back would be duplicated by the retry. */
    signLead({ id: "check", step: 0 });
    lead = leadToken ? readLead(leadToken) : null;
  } catch (error) {
    /* No signing secret in production: a configuration gap, logged loudly. */
    console.error("[project-estimate]", (error as Error).message);
    return failure(500);
  }
  if (leadToken && !lead) {
    /* Forged, damaged or expired (24 h): start a fresh record rather than
       touch one this browser can't prove is its own. */
    console.warn("[project-estimate] lead token rejected — starting a new record");
  }

  const reached = stage === "draft" ? 0 : stage;
  const step = Math.max(lead?.step ?? 0, reached);

  /* Submitted is final: a repeated final click (or a late auto-save) gets
     the same answer and changes nothing. */
  if (lead && lead.step >= 4) {
    return NextResponse.json({ ok: true, leadToken: signLead(lead), step: lead.step });
  }

  const data = toPortfolioProjectEstimate(stage as Stage, parsed.data, step);

  let id: string | null = null;
  if (lead) {
    const updated = await strapi("PUT", `${ENDPOINT}/${encodeURIComponent(lead.id)}`, data);
    if (updated.ok) id = updated.id;
    else if (updated.status !== 404) return failure(updated.status);
    /* 404: the record was deleted in the admin — fall through and create. */
  }
  if (!id) {
    /* The same form's first save is (or was just) creating the record:
       join it, then write this save's newer answers onto it. A first save
       that FAILED is not joined — this one creates afresh. */
    const pending = lead ? undefined : creating.get(formId);
    const joined = pending ? await pending : null;
    if (joined) {
      const updated = await strapi("PUT", `${ENDPOINT}/${encodeURIComponent(joined)}`, data);
      if (!updated.ok) return failure(updated.status);
      id = updated.id;
    } else {
      const work = strapi("POST", ENDPOINT, data).then((result) => (result.ok ? result.id : null));
      creating.set(formId, work);
      try {
        id = await work;
      } finally {
        /* Kept briefly so a retry of a save whose response was lost still
           finds the record it made. */
        setTimeout(() => creating.delete(formId), 10 * 60_000).unref?.();
      }
      if (!id) return failure(502);
    }
  }

  return NextResponse.json({ ok: true, leadToken: signLead({ id, step }), step });
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "POST" } });
}
