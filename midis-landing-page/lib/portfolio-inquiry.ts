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
 *   MIDIS_ADMIN_API_URL    base URL (optional; default https://admins.midis.in)
 *   MIDIS_ADMIN_API_TOKEN  a Strapi API token with create on Portfolio
 *                          Inquiry — needed unless the Public role is given
 *                          that permission (as of 2026-10-28 it is not: an
 *                          anonymous POST returns 403)
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
 */
export function toPortfolioInquiry(input: Consultation) {
  const phone = parsePhoneNumberFromString(input.phone);
  return {
    name: input.name,
    businessEmail: input.email,
    phoneCountryCode: phone ? `+${phone.countryCallingCode}` : "",
    phoneNumber: phone ? String(phone.nationalNumber) : input.phone.replace(/\D/g, ""),
    ...(input.website ? { websiteUrl: input.website } : {}),
    serviceNeeded: SERVICE_VALUE[input.service],
    sourceWebsite: SOURCE_WEBSITE,
  };
}

export type PortfolioInquiryResult =
  | { ok: true; documentId?: string }
  | { ok: false; reason: "unreachable" | "forbidden" | "rejected"; status?: number };

/**
 * Creates one Portfolio Inquiry. Success ONLY when Strapi answers 2xx with
 * the created record — never because a request was merely sent. Personal
 * data is never logged: only statuses and Strapi's error names.
 */
export async function submitPortfolioInquiry(input: Consultation): Promise<PortfolioInquiryResult> {
  let response: Response;
  try {
    response = await fetch(PORTFOLIO_INQUIRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MIDIS_ADMIN_API_TOKEN
          ? { Authorization: `Bearer ${process.env.MIDIS_ADMIN_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ data: toPortfolioInquiry(input) }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[portfolio-inquiry] Strapi unreachable:", (error as Error).name);
    return { ok: false, reason: "unreachable" };
  }

  const body = (await response.json().catch(() => ({}))) as {
    data?: { id?: number | string; documentId?: string } | null;
    error?: { name?: string; message?: string };
  };

  if (response.ok && body.data && (body.data.id !== undefined || body.data.documentId)) {
    return { ok: true, documentId: body.data.documentId };
  }

  /* Strapi's error name/message describe the schema, not the visitor. */
  console.error(
    `[portfolio-inquiry] Strapi rejected the submission (${response.status}): ${body.error?.name ?? ""} ${body.error?.message ?? ""}`.trim(),
  );
  return {
    ok: false,
    reason: response.status === 401 || response.status === 403 ? "forbidden" : "rejected",
    status: response.status,
  };
}
