import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { CONSULTATION_SERVICES, type ConsultationService } from "@/content/forms";

/**
 * THE CONSULTATION FORM → MIDIS admin Strapi
 * (POST https://admins.midis.in/api/portfolio-consultations).
 *
 * One schema, run by the form (inline errors — components/forms/
 * ConsultationForm.tsx, used by the homepage hero AND the lead popup) and
 * again by the server route (nothing a browser sends is trusted).
 *
 * THE COLLECTION, as verified against the live endpoint on 2026-10-23
 * (validation probes only — no record was created by them):
 *
 *   name, email, serviceNeeded, phone, projectDescription
 *   serviceNeeded is an ENUMERATION:
 *     "New Website" | "Redesign" | "E-commerce" | "Landing page" | "other"
 *   Strapi rejects the whole record for any unknown key, so there is no
 *   field for the website URL, the source or a timestamp.
 *
 * THE 2026-10-28 MAPPING (single-step form, client-approved brief):
 *   - the five approved service labels map onto the existing enum
 *     (SERVICE_VALUE) — "Not Sure Yet" is stored as "other";
 *   - nothing is discarded: projectDescription carries the website URL (if
 *     given), the exact service label, the source (Homepage / Popup /
 *     Free Website Audit page) and the server's submission timestamp, one
 *     per line, so the record holds everything the brief asks to keep.
 *     (Strapi also stamps createdAt itself.)
 *
 * Strapi itself accepted an empty name and a malformed email in those
 * probes, so the rules below are the only guard — keep them.
 */

export const SERVICE_VALUE: Record<ConsultationService, string> = {
  "New Website Development": "New Website",
  "Website Redesign": "Redesign",
  "E-commerce Website": "E-commerce",
  "Landing Page Development": "Landing page",
  "Not Sure Yet": "other",
};

export const CONSULTATION_SOURCES = ["homepage", "popup", "audit"] as const;
export type ConsultationSource = (typeof CONSULTATION_SOURCES)[number];

const SOURCE_LABEL: Record<ConsultationSource, string> = {
  homepage: "Homepage",
  popup: "Popup",
  audit: "Free Website Audit page",
};

/**
 * "example.com", "www.example.com/page" and "https://example.com" are all
 * accepted (people rarely type the scheme); stored with https:// added when
 * it was left off. A hostname needs a dot and a 2+ letter ending.
 */
export function normaliseWebsite(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname)) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const consultationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is longer than we can store."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your business email.")
    .max(160, "That email address is longer than we can store.")
    .pipe(z.email("Please enter a valid email address, like name@company.com.")),
  /* E.164 from the international phone field ("+919876543210"), checked
     against the dialled country's own numbering plan. */
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .max(32, "That phone number is longer than we can store.")
    .refine((v) => isValidPhoneNumber(v), {
      message: "Please enter a valid phone number for the selected country.",
    }),
  website: z
    .string()
    .trim()
    .max(300, "That address is longer than we can store.")
    .refine((v) => normaliseWebsite(v) !== null, {
      message: "Please enter a valid website address, like example.com.",
    })
    .transform((v) => normaliseWebsite(v) ?? ""),
  service: z.enum(CONSULTATION_SERVICES, {
    message: "Please choose what you need help with.",
  }),
  source: z.enum(CONSULTATION_SOURCES),
  /** Spam trap: bots fill it, people never see it. */
  hp: z.string().optional().default(""),
});

export type ConsultationInput = z.input<typeof consultationSchema>;
export type Consultation = z.infer<typeof consultationSchema>;

/** The Strapi `data` object. See THE 2026-10-28 MAPPING above. */
export function toPortfolioConsultation(input: Consultation, submittedAt: Date) {
  const details = [
    input.website ? `Website: ${input.website}` : "Website: (not provided)",
    `Needs help with: ${input.service}`,
    `Source: ${SOURCE_LABEL[input.source]}`,
    `Submitted: ${submittedAt.toISOString()}`,
  ];
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    serviceNeeded: SERVICE_VALUE[input.service],
    projectDescription: details.join("\n"),
  };
}
