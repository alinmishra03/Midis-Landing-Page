import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { BUDGETS, EXISTING_SITE, PROJECT_TYPES } from "@/content/forms";
import { estimatorSchema } from "@/lib/enquiry";

/**
 * The four-step "Get Your Project Estimate" form → MIDIS admin Strapi
 * (POST https://admins.midis.in/api/portfolio-project-estimates).
 *
 * Validation is the estimator's own schema (lib/enquiry.ts) — the form
 * already runs it step by step — with ONE change: phone is required here,
 * on the server too, exactly as the form's step 1 requires it.
 *
 * THE COLLECTION, as verified against the live endpoint on 2026-10-23
 * (validation probes only — every probe was rejected, none stored):
 *
 *   fullName, email, phoneNumber, companyName,
 *   projectType, existingWebsite, budgetRange
 *
 *   projectType     "new-website" | "redesign" | "e-commerce" |
 *                   "landing-page" | "other"
 *   existingWebsite "keep-existing" | "replace-existing" | "first-website"
 *   budgetRange     "budget_1000_3000" | "budget_3000_5000" |
 *                   "budget_5000_10000" | "budget_not_sure"
 *
 *   There is NO sourceWebsite field (nor source / message) — sending an
 *   unknown key makes Strapi reject the whole record. Strapi requires no
 *   field and accepted a malformed email in those probes, so the rules
 *   here are the only guard — keep them.
 *
 * The visitor keeps seeing the approved labels; the maps below translate
 * them to the stored values. Each map is keyed by the label list itself,
 * so adding an option without a stored value is a type error.
 */

export const PROJECT_TYPE_VALUE: Record<(typeof PROJECT_TYPES)[number], string> = {
  "New Website": "new-website",
  Redesign: "redesign",
  "E-commerce": "e-commerce",
  "Landing Page": "landing-page",
  Other: "other",
};

export const EXISTING_WEBSITE_VALUE: Record<(typeof EXISTING_SITE)[number], string> = {
  "Yes, and I want to keep it": "keep-existing",
  "Yes, and I want to replace it": "replace-existing",
  "No, this would be our first site": "first-website",
};

export const BUDGET_RANGE_VALUE: Record<(typeof BUDGETS)[number], string> = {
  "$1,000–$3,000": "budget_1000_3000",
  "$3,000–$5,000": "budget_3000_5000",
  "$5,000–$10,000": "budget_5000_10000",
  "Not sure yet": "budget_not_sure",
};

/**
 * THE PHONE RULE (international field, 2026-10-24). The form's phone input
 * (components/forms/PhoneField.tsx) reports E.164 — "+919876543210" — and
 * this checks it against the dialled country's own numbering plan with
 * libphonenumber-js's full ("max") metadata: lengths and digit patterns
 * differ per country, so there is no universal digit count. Strapi's
 * phoneNumber stays a plain string; E.164 is simply a stricter shape of
 * what it already accepted, so the API contract is unchanged.
 */
export const projectEstimateSchema = estimatorSchema.extend({
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .max(32, "That phone number is longer than we can store.")
    .refine((v) => isValidPhoneNumber(v), {
      message: "Please enter a valid phone number for the selected country.",
    }),
});

export type ProjectEstimate = z.infer<typeof projectEstimateSchema>;

/** The Strapi `data` object. An empty company is omitted, not sent as "". */
export function toPortfolioProjectEstimate(input: ProjectEstimate) {
  return {
    fullName: input.name,
    email: input.email,
    phoneNumber: input.phone,
    ...(input.company ? { companyName: input.company } : {}),
    projectType: PROJECT_TYPE_VALUE[input.projectType],
    existingWebsite: EXISTING_WEBSITE_VALUE[input.existingSite],
    budgetRange: BUDGET_RANGE_VALUE[input.budget],
  };
}
