import { z } from "zod";
import { PROJECT_TYPES, type ProjectType } from "@/content/forms";

/**
 * The "Before you go" consultation popup → MIDIS admin Strapi
 * (POST https://admins.midis.in/api/portfolio-consultations).
 *
 * One schema, run by the popup (inline errors) and again by the server
 * route (nothing a browser sends is trusted). Field names match the
 * popup's existing inputs; the server maps them onto the collection.
 *
 * THE COLLECTION, as verified against the live endpoint on 2026-10-23
 * (validation probes only — no record was created by them):
 *
 *   name, email, serviceNeeded, phone, projectDescription
 *   serviceNeeded is an ENUMERATION:
 *     "New Website" | "Redesign" | "E-commerce" | "Landing page" | "other"
 *   There is NO sourceWebsite field — sending one is rejected.
 *
 * The enum is not the dropdown's wording: "Landing Page" is stored as
 * "Landing page" and "Other" as "other". The visitor keeps seeing the
 * approved labels; SERVICE_VALUE translates.
 *
 * Strapi itself accepted an empty name and a malformed email in those
 * probes, so the rules below are the only guard — keep them.
 */

export const SERVICE_VALUE: Record<ProjectType, string> = {
  "New Website": "New Website",
  Redesign: "Redesign",
  "E-commerce": "E-commerce",
  "Landing Page": "Landing page",
  Other: "other",
};

export const consultationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is longer than we can store."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(160, "That email address is longer than we can store.")
    .pipe(z.email("Please enter a valid email address.")),
  projectType: z.enum(PROJECT_TYPES, { message: "Please choose what you need." }),
  /* Optional, and deliberately lenient: any international format with
     digits, spaces, +, (), dots or dashes. */
  phone: z
    .string()
    .trim()
    .max(32, "That phone number is longer than we can store.")
    .refine((v) => v === "" || (/^[+()\d\s.-]+$/.test(v) && v.replace(/\D/g, "").length >= 6), {
      message: "Please enter a valid phone number.",
    }),
  message: z
    .string()
    .trim()
    .max(2000, "Please keep the description under 2000 characters."),
  /** Spam trap: bots fill it, people never see it. */
  hp: z.string().optional().default(""),
});

export type ConsultationInput = z.input<typeof consultationSchema>;
export type Consultation = z.infer<typeof consultationSchema>;

/** The Strapi `data` object. Empty optional fields are omitted, not sent as "". */
export function toPortfolioConsultation(input: Consultation) {
  return {
    name: input.name,
    email: input.email,
    serviceNeeded: SERVICE_VALUE[input.projectType],
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.message ? { projectDescription: input.message } : {}),
  };
}
