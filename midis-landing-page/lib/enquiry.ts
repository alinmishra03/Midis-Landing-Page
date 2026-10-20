import { z } from "zod";
import {
  AUDIT_SERVICES,
  BUDGETS,
  COUNTRIES,
  EXISTING_SITE,
  PROJECT_TYPES,
} from "@/content/forms";

/**
 * Enquiry validation and CMS mapping.
 *
 * Both forms post to the same route, discriminated on `kind`. The schemas are
 * the single source of truth: the client runs them to show inline errors, the
 * server runs them again because nothing a browser sends is trusted.
 */

/* ==========================================================================
   Shared field rules
   ========================================================================== */

const name = z
  .string()
  .trim()
  .min(2, "Please enter your name.")
  .max(80, "That name is longer than we can store.");

const email = z
  .string()
  .trim()
  .min(1, "Please enter your business email.")
  .max(160, "That email address is longer than we can store.")
  .pipe(z.email("Please enter a valid email address."));

/**
 * Company is OPTIONAL on both forms.
 *
 * It is useful context, not a reason to lose a lead — a sole trader or a
 * pre-incorporation founder has nothing to type here, and a required field
 * they cannot answer is where an enquiry gets abandoned. An empty string has
 * to pass, which `min(1)` would not allow, so the rule is a max-length check
 * with no floor.
 */
const optionalCompany = z
  .string()
  .trim()
  .max(120, "That company name is longer than we can store.");

/**
 * Phone is optional on both forms, so an empty string has to pass. Zod would
 * otherwise fail `min(6)` on "" and block a submission over a field the
 * visitor was told they could skip.
 */
const optionalPhone = z
  .string()
  .trim()
  .max(32, "That phone number is longer than we can store.")
  .refine((v) => v === "" || /^[+()\d\s-]{6,}$/.test(v), {
    message: "Please enter a valid phone number, including the country code.",
  });

/**
 * Website URL. The audit form's placeholder shows "https://yourwebsite.com",
 * but people type "yourwebsite.com" — so a bare host is accepted and
 * normalised rather than rejected. Being strict here loses leads over a
 * missing scheme.
 */
const websiteUrl = z
  .string()
  .trim()
  .min(1, "Please enter your website address.")
  .max(200, "That URL is longer than we can store.")
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.hostname.includes(".") && !u.hostname.endsWith(".");
    } catch {
      return false;
    }
  }, "Please enter a valid website address, for example yourcompany.com.");

/**
 * Honeypot. A real visitor never sees this field, so anything IN it is a bot.
 *
 * It must fail ONLY when the field carries a value — never when it is
 * absent. An earlier version used `z.literal("")`, which also failed on a
 * missing key; since the route treats a `website` error as spam and answers
 * with a silent success, any payload that omitted the field was dropped
 * while being told it had been received. That is the exact fake-success
 * failure this codebase is written to avoid, and it would have applied to
 * every submission if the field were ever lost in transit.
 *
 * So: missing defaults to empty and passes, and only a filled value fails.
 */
const honeypot = z
  .string()
  .optional()
  .default("")
  .refine((v) => v === "", "This field must be left blank.");

/* ==========================================================================
   Schemas
   ========================================================================== */

export const estimatorSchema = z.object({
  kind: z.literal("estimator"),
  projectType: z.enum(PROJECT_TYPES, {
    message: "Please choose what you need.",
  }),
  existingSite: z.enum(EXISTING_SITE, {
    message: "Please tell us about your current website.",
  }),
  budget: z.enum(BUDGETS, { message: "Please choose a budget range." }),
  name,
  email,
  /* Optional: a company name is useful context, not a reason to lose a
     lead. Same for the phone number below. */
  company: optionalCompany,
  phone: optionalPhone,
  website: honeypot,
});

export const auditSchema = z.object({
  kind: z.literal("audit"),
  firstName: name,
  lastName: name,
  email,
  company: optionalCompany,
  websiteUrl,
  country: z.enum(COUNTRIES, { message: "Please choose a country." }),
  service: z.enum(AUDIT_SERVICES, { message: "Please choose a service." }),
  budget: z.enum(BUDGETS, { message: "Please choose a budget range." }),
  phone: optionalPhone,
  /*
   * The required consent. `z.literal(true)` rather than `boolean()` — an
   * unticked box must fail, and it must fail with the sentence the visitor
   * needs to read rather than "Invalid literal value".
   */
  consent: z.literal(true, {
    message: "Please confirm this so we can reply to your request.",
  }),
  /* Optional and separate. Never pre-ticked. */
  marketingConsent: z.boolean(),
  website: honeypot,
});

/**
 * The lead-generation popups' concise form (MIDIS popup brief, 2026-10-20).
 *
 * Deliberately SHORTER than the estimator: a popup that demands the full
 * four-step questionnaire is an estimator with a worse entrance. `source`
 * records which trigger produced the lead — welcome, mid-page scroll or
 * exit — so the MIDIS team can see where enquiries originate. It is an
 * enum, not free text, because it reaches the CMS message verbatim.
 */
export const POPUP_SOURCES = [
  "initial_popup",
  "scroll_popup",
  "exit_popup",
] as const;

export const popupSchema = z.object({
  kind: z.literal("popup"),
  source: z.enum(POPUP_SOURCES),
  name,
  email,
  projectType: z.enum(PROJECT_TYPES, {
    message: "Please choose what you need.",
  }),
  phone: optionalPhone,
  /* Optional, so an empty string must pass — same shape as optionalCompany. */
  message: z
    .string()
    .trim()
    .max(1000, "Please keep the description under 1000 characters."),
  website: honeypot,
});

export const enquirySchema = z.discriminatedUnion("kind", [
  estimatorSchema,
  auditSchema,
  popupSchema,
]);

export type EstimatorInput = z.input<typeof estimatorSchema>;
export type AuditInput = z.input<typeof auditSchema>;
export type PopupInput = z.input<typeof popupSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ==========================================================================
   Strapi mapping
   --------------------------------------------------------------------------
   Leads land in the EXISTING MIDIS Strapi `enquiries` collection, so they
   reach the inbox the team already monitors rather than a new one nobody
   checks.

   That collection accepts exactly five fields —
       name, email, phoneNumber, services, message
   — and `services` is a strict enumeration. Both were confirmed against the
   live endpoint during the MIDIS site audit. Two things about the enum are
   easy to get wrong and both are load-bearing:

     1. Several values carry a TRAILING SPACE. It is part of the stored value
        and must be sent verbatim.
     2. The list ends with the EMPTY STRING, not with "Other". Sending
        "Other" is rejected, and Strapi rejects the WHOLE submission on an
        unknown enum value rather than ignoring the field.

   Everything this landing page collects that has no column — project type,
   page count, budget, timeline, country, goal, consent — is written into
   `message` as a structured block, so nothing the visitor typed is lost.
   ========================================================================== */

const STRAPI_SERVICES = [
  "Web development ",
  "Graphic designing ",
  "Digital Marketing",
  "Seo Optimisation",
  "Content Writing ",
  "Brand Identity",
  "",
] as const;

type StrapiService = (typeof STRAPI_SERVICES)[number];

/** The catch-all Strapi actually accepts for anything unmapped. */
const FALLBACK: StrapiService = "";

/** Maps this page's option labels onto values Strapi will accept. */
const SERVICE_MAP: Record<string, StrapiService> = {
  /* Audit form services */
  "Website audit": "Seo Optimisation",
  "New website development": "Web development ",
  "Website redesign": "Web development ",
  "E-commerce / Shopify": "Web development ",
  "SEO and conversion optimisation": "Seo Optimisation",
  /* Estimator project types */
  "New Website": "Web development ",
  Redesign: "Web development ",
  "E-commerce": "Web development ",
  "Landing Page": "Web development ",
  Other: FALLBACK,
};

function toStrapiService(value: string): StrapiService {
  const mapped = SERVICE_MAP[value];
  return mapped !== undefined && STRAPI_SERVICES.includes(mapped)
    ? mapped
    : FALLBACK;
}

export interface StrapiEnquiry {
  name: string;
  email: string;
  phoneNumber: string;
  services: StrapiService;
  message: string;
}

/** Renders a label/value block that stays readable in a plain-text inbox. */
function block(rows: [string, string][]): string {
  return rows
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

/** Human-readable labels for the popup `source` identifiers. */
const POPUP_SOURCE_LABELS: Record<(typeof POPUP_SOURCES)[number], string> = {
  initial_popup: "Welcome popup",
  scroll_popup: "Mid-page popup",
  exit_popup: "Exit popup",
};

export function toStrapi(input: EnquiryInput): StrapiEnquiry {
  if (input.kind === "popup") {
    return {
      name: input.name,
      email: input.email,
      phoneNumber: input.phone,
      services: toStrapiService(input.projectType),
      message: block([
        [
          "Source",
          `Landing page — ${POPUP_SOURCE_LABELS[input.source]} (${input.source})`,
        ],
        ["What they need", input.projectType],
        ["Project notes", input.message],
        ["Phone", input.phone],
      ]),
    };
  }

  if (input.kind === "estimator") {
    return {
      name: input.name,
      email: input.email,
      phoneNumber: input.phone,
      services: toStrapiService(input.projectType),
      message: block([
        ["Source", "Landing page — Website Project Estimator"],
        ["What they need", input.projectType],
        ["Existing website", input.existingSite],
        ["Estimated budget", `${input.budget} (USD)`],
        ["Company", input.company],
        ["Phone", input.phone],
      ]),
    };
  }

  return {
    name: `${input.firstName} ${input.lastName}`,
    email: input.email,
    phoneNumber: input.phone,
    services: toStrapiService(input.service),
    message: block([
      ["Source", "Landing page — Free Website Audit"],
      ["Website to audit", input.websiteUrl],
      ["Country", input.country],
      ["Service of interest", input.service],
      ["Estimated budget", `${input.budget} (USD)`],
      ["Company", input.company],
      ["Phone", input.phone],
      [
        "WhatsApp follow-up consent",
        input.consent ? "Yes (given on the form)" : "No",
      ],
      [
        "Marketing consent",
        input.marketingConsent ? "Yes (opted in)" : "No (not opted in)",
      ],
    ]),
  };
}
