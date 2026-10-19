/**
 * CLIENT TESTIMONIALS
 * ==========================================================================
 *
 * THE SECTION IS CURRENTLY SHOWING SAMPLE CONTENT, ON PURPOSE.
 *
 * `testimonials` — the approved, attributable list — is still empty. No
 * client quote with permission to publish has been supplied yet. What the
 * page shows instead is `sampleTestimonials`: placeholder copy, under
 * placeholder names, so the section is visible and reviewable while real
 * quotes are being collected. This was switched on at the client's explicit
 * request on 2026-10-19.
 *
 * THEY ARE LABELLED, AND THAT PART IS NOT DECORATION. Every sample card
 * carries a "Sample" chip and the section carries a one-line note. The names
 * are "Demo Client …" at "Demo Company …" rather than plausible-looking
 * people at plausible-looking businesses, so nobody — visitor, client or
 * search engine — can mistake them for real reviews, and no real person or
 * company is impersonated. MIDIS.pdf's own note on these quotes says not to
 * publish them as genuine customer feedback; labelling them is what keeps
 * that promise while still showing the design.
 *
 * TO GO LIVE WITH REAL ONES
 * -------------------------
 * Add an entry to `testimonials` below with `approved: true`. Approved
 * quotes replace the samples automatically — the chips and the note
 * disappear with them, because they are driven by the same flag. Nothing
 * else has to change.
 *
 * TO HIDE THE SAMPLES AGAIN
 * -------------------------
 * Build with `NEXT_PUBLIC_SHOW_SAMPLE_TESTIMONIALS=false`. With no approved
 * quotes and no samples the section renders nothing at all, and the page
 * reads as complete without it.
 */

export interface Testimonial {
  /** The quote itself, in the client's own words. Never paraphrased. */
  readonly quote: string;
  /** Real name. Never a placeholder, never initials standing in for one. */
  readonly name: string;
  /** Their actual role at the time the quote was given. */
  readonly role: string;
  readonly company: string;
  /**
   * Optional path to the client's own mark in public/images/clients.
   * Displaying it needs the same permission the trust rail does.
   */
  readonly logo?: string;
  readonly logoWidth?: number;
  readonly logoHeight?: number;
  /** Optional slug from content/work.ts, to tie a quote to a real project. */
  readonly projectSlug?: string;
  /**
   * Written sign-off from the client to publish this quote, with their name
   * and company attached. Only `true` reaches the site.
   */
  readonly approved: boolean;
}

/** Requires: an attributed quote with written permission to publish it. */
export const testimonials: readonly Testimonial[] = [];

/** What the section renders when real quotes exist. Nothing unapproved can
    slip through, because `approved` is checked rather than assumed. */
export const approvedTestimonials = testimonials.filter((t) => t.approved);

export const hasTestimonials = approvedTestimonials.length > 0;

/* ==========================================================================
   Section copy
   ========================================================================== */

export const testimonialsSection = {
  heading: "Words From Our Clients",
  subheading: "Discover what our clients have to say about working with MIDIS.",
  /** Shown only while the samples are on the page. */
  sampleNote:
    "Sample content — placeholder quotes shown while client testimonials are being collected. These are not real reviews.",
} as const;

/* ==========================================================================
   SAMPLE CONTENT
   --------------------------------------------------------------------------
   Six placeholders: the three from MIDIS.pdf page 10, reproduced word for
   word, plus three more written in the same register so the layout can be
   judged with a full grid and the mobile carousel has enough cards to page
   through.

   Names and companies are deliberately unmistakable. "Demo Client Three" at
   "Demo Company" cannot be confused with a real customer, which is the
   whole point — a realistic-sounding fake name is what would turn a layout
   placeholder into a fabricated review.

   Nothing here claims a result, a metric or an outcome. The quotes describe
   working with a team, which is the one thing a placeholder can say without
   inventing a business achievement.
   ========================================================================== */

export const SHOW_SAMPLE_TESTIMONIALS =
  process.env.NEXT_PUBLIC_SHOW_SAMPLE_TESTIMONIALS !== "false";

export const sampleTestimonials: readonly Testimonial[] = [
  /* ---- the three from MIDIS.pdf, verbatim ---- */
  {
    quote:
      "Working with the team made our website project much easier. The process was organised, communication was clear, and the final design reflected what we wanted our brand to communicate.",
    name: "Demo Client One",
    role: "Marketing Manager",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "The new website gave us a clearer way to present our services and guide visitors towards getting in touch. The team was responsive and collaborative throughout the project.",
    name: "Demo Client Two",
    role: "Founder",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "We appreciated the team's focus on both design and functionality. The result was a more structured digital experience that gave us a strong foundation for future growth.",
    name: "Demo Client Three",
    role: "Business Owner",
    company: "Demo Company",
    approved: false,
  },
  /* ---- three more, so the grid fills and the carousel has range ---- */
  {
    quote:
      "The discovery stage was the part that stood out. Questions were asked about how the business actually works before anything was designed, and the site that came back reflected those answers.",
    name: "Demo Client Four",
    role: "Operations Director",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "Timelines were set out at the start and the updates arrived without having to be chased. Handover included a walkthrough of how to edit the pages ourselves, which we use regularly.",
    name: "Demo Client Five",
    role: "General Manager",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "We came with a long list of ideas and were given a clear view of which ones belonged in the first release and which could wait. That made the project far easier to plan around.",
    name: "Demo Client Six",
    role: "Head of Brand",
    company: "Demo Company",
    approved: false,
  },
];

/**
 * What the section should render, if anything.
 *
 * Approved quotes win. Samples fill in while there are none. With neither,
 * this is empty and the section does not render at all.
 */
export const visibleTestimonials: readonly Testimonial[] = hasTestimonials
  ? approvedTestimonials
  : SHOW_SAMPLE_TESTIMONIALS
    ? sampleTestimonials
    : [];

/** True when what is on screen is placeholder copy, not client feedback.
    Drives the chips and the note, so they can never be out of step with
    what is actually being shown. */
export const showingSamples =
  !hasTestimonials && visibleTestimonials.length > 0;
