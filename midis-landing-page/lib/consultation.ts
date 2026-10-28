import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { CONSULTATION_SERVICES } from "@/content/forms";

/**
 * THE CONSULTATION FORM'S VALIDATION — one schema, run by the form (inline
 * errors — components/forms/ConsultationForm.tsx, used by the homepage
 * hero, the lead popup and the audit page) and again by the server route
 * (nothing a browser sends is trusted).
 *
 * WHERE IT GOES (2026-10-28): the unified Strapi collection
 * portfolio-inquiries, via /api/consultation. The field mapping, the
 * service enumeration values and the request live in
 * lib/portfolio-inquiry.ts (server-only).
 */

/** Which placement the form is rendered in. Used on the client only (the
    homepage form accepts the Services preselect); the collection has no
    field for it — every record carries sourceWebsite "midis-portfolio". */
export type ConsultationSource = "homepage" | "popup" | "audit";

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
  /** Spam trap: bots fill it, people never see it. */
  hp: z.string().optional().default(""),
});

export type ConsultationInput = z.input<typeof consultationSchema>;
export type Consultation = z.infer<typeof consultationSchema>;
