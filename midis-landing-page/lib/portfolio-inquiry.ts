import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { ConsultationService } from "@/content/forms";
import type { Consultation } from "@/lib/consultation";

/**
 * THE UNIFIED PORTFOLIO INQUIRY API (MIDIS, 2026-10-28)
 * POST https://admins.midis.in/api/portfolio-inquiries — Strapi v5.
 *
 * Every consultation form on the site (the homepage hero, the lead popup
 * and the audit page's in-place form — one component, ConsultationForm)
 * reaches it through ONE server route, /api/consultation, which validates
 * the input and calls `submitPortfolioInquiry` below. Server-side on
 * purpose: an API token (if the collection is ever token-gated) never
 * reaches the browser, the route's rate limit and spam trap apply, and
 * CORS is not involved.
 *
 * THE COLLECTION (fields as specified by MIDIS; the frontend sends only
 * these, never hubspotContactId / hubspotSyncStatus, which the backend
 * owns):
 *
 *   name               text, required
 *   businessEmail      email, required
 *   phoneCountryCode   text, required   "+91"
 *   phoneNumber        text, required   "9876543210" (national digits)
 *   websiteUrl         text, optional   omitted when empty
 *   serviceNeeded      enum, required   see SERVICE_VALUE
 *   sourceWebsite      text, required   always "midis-portfolio"
 *
 * THE DEPLOYED COLLECTION (probed 2026-10-28, requests built to be
 * rejected): the Public role can create; the service enum matches
 * SERVICE_VALUE exactly; but there is NO phoneCountryCode field — Strapi
 * rejects the whole record with "Invalid key phoneCountryCode", which is
 * what made /api/consultation answer 502 on Vercel. submitPortfolioInquiry
 * therefore falls back, once, to the full international number in
 * phoneNumber; once the field is added in Strapi the first request
 * succeeds and the fallback never runs. Strapi does NOT enforce the
 * "required" flags (an empty object was accepted), so the route's own
 * validation (lib/consultation.ts) is the only guard — keep it.
 *
 *   MIDIS_ADMIN_API_URL    base URL (optional; default https://admins.midis.in)
 *   MIDIS_ADMIN_API_TOKEN  a Strapi API token with create on Portfolio
 *                          Inquiry — only needed if the Public role's create
 *                          permission is removed (recommended: then nobody
 *                          on the internet can write to the collection
 *                          directly, bypassing this validation)
 */

const BASE = (process.env.MIDIS_ADMIN_API_URL ?? "https://admins.midis.in").replace(/\/$/, "");
export const PORTFOLIO_INQUIRY_ENDPOINT = `${BASE}/api/portfolio-inquiries`;

/** The approved dropdown labels → the collection's enumeration values. */
export const SERVICE_VALUE: Record<ConsultationService, string> = {
  "New Website Development": "new-website-development",
  "Website Redesign": "website-redesign",
  "E-commerce Website": "e-commerce-website",
  "Landing Page Development": "landing-page-development",
  "Not Sure Yet": "not-sure-yet",
};

const SOURCE_WEBSITE = "midis-portfolio";

/**
 * The Strapi `data` object. The form reports the phone in E.164
 * ("+919876543210"), already validated against the dialled country's
 * numbering plan; it is split here into the calling code and the national
 * number, so the code is never duplicated inside phoneNumber.
 *
 * `withCountryCode: false` is the fallback for a collection WITHOUT the
 * phoneCountryCode field (the deployed one, as of 2026-10-28 — Strapi
 * answers "Invalid key phoneCountryCode"): the code is then kept inside
 * phoneNumber, in international format ("+91 98765 43210"), so nothing the
 * visitor typed is lost.
 */
export function toPortfolioInquiry(input: Consultation, withCountryCode = true) {
  const phone = parsePhoneNumberFromString(input.phone);
  const digits = input.phone.replace(/[^\d+]/g, "");
  return {
    name: input.name,
    businessEmail: input.email,
    ...(withCountryCode
      ? {
          phoneCountryCode: phone ? `+${phone.countryCallingCode}` : "",
          phoneNumber: phone ? String(phone.nationalNumber) : digits.replace(/\D/g, ""),
        }
      : { phoneNumber: phone ? phone.formatInternational() : digits }),
    ...(input.website ? { websiteUrl: input.website } : {}),
    serviceNeeded: SERVICE_VALUE[input.service],
    sourceWebsite: SOURCE_WEBSITE,
  };
}

/** The form's field for each collection field, to put Strapi's own
    validation messages back on the right input. */
const FORM_FIELD: Record<string, "name" | "email" | "phone" | "website" | "service"> = {
  name: "name",
  businessEmail: "email",
  phoneCountryCode: "phone",
  phoneNumber: "phone",
  websiteUrl: "website",
  serviceNeeded: "service",
};

export type PortfolioInquiryResult =
  | { ok: true; documentId?: string }
  | {
      ok: false;
      /* unreachable: network error or timeout · forbidden: 401/403 (token or
         Public permission missing) · invalid: Strapi rejected a field the
         visitor can fix · rejected: anything else (schema or server) */
      reason: "unreachable" | "forbidden" | "invalid" | "rejected";
      status?: number;
      fieldErrors?: Partial<Record<"name" | "email" | "phone" | "website" | "service", string>>;
    };

interface StrapiBody {
  data?: { id?: number | string; documentId?: string } | null;
  error?: {
    name?: string;
    message?: string;
    details?: { key?: string; errors?: { path?: (string | number)[]; message?: string }[] };
  };
}

async function post(data: ReturnType<typeof toPortfolioInquiry>) {
  const response = await fetch(PORTFOLIO_INQUIRY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.MIDIS_ADMIN_API_TOKEN
        ? { Authorization: `Bearer ${process.env.MIDIS_ADMIN_API_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ data }),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as StrapiBody;
  return { response, body };
}

/**
 * Creates one Portfolio Inquiry. Success ONLY when Strapi answers 2xx with
 * the created record — never because a request was merely sent. Personal
 * data is never logged: only statuses and Strapi's error names/messages,
 * which describe the schema, not the visitor.
 */
export async function submitPortfolioInquiry(input: Consultation): Promise<PortfolioInquiryResult> {
  let result: Awaited<ReturnType<typeof post>>;
  try {
    result = await post(toPortfolioInquiry(input));
    /* The collection has no phoneCountryCode field: Strapi rejects the
       whole request (400, nothing stored). Send it once more with the code
       kept inside phoneNumber. */
    if (result.response.status === 400 && result.body.error?.details?.key === "phoneCountryCode") {
      console.warn("[portfolio-inquiry] collection has no phoneCountryCode field; sending the international number in phoneNumber");
      result = await post(toPortfolioInquiry(input, false));
    }
  } catch (error) {
    console.error("[portfolio-inquiry] Strapi unreachable:", (error as Error).name);
    return { ok: false, reason: "unreachable" };
  }

  const { response, body } = result;
  if (response.ok && body.data && (body.data.id !== undefined || body.data.documentId)) {
    /* The record's id only — no personal data — so a submission can be
       found in Content Manager from the server logs. */
    console.info(`[portfolio-inquiry] created ${body.data.documentId ?? body.data.id}`);
    return { ok: true, documentId: body.data.documentId };
  }

  console.error(
    `[portfolio-inquiry] Strapi rejected the submission (${response.status}): ${body.error?.name ?? ""} ${body.error?.message ?? ""}`.trim(),
  );

  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: "forbidden", status: response.status };
  }

  /* A validation error on a field the visitor can fix goes back to that
     field; an unknown key or anything else is a configuration problem. */
  if (response.status === 400) {
    const fieldErrors: NonNullable<Extract<PortfolioInquiryResult, { ok: false }>["fieldErrors"]> = {};
    for (const issue of body.error?.details?.errors ?? []) {
      const field = FORM_FIELD[String(issue.path?.[0] ?? "")];
      if (field && !fieldErrors[field]) fieldErrors[field] = "Please check this field and try again.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, reason: "invalid", status: 400, fieldErrors };
    }
  }

  return { ok: false, reason: "rejected", status: response.status };
}
