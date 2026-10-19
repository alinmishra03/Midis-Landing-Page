/**
 * CLIENT TESTIMONIALS
 * ==========================================================================
 *
 * `approvedTestimonials` IS EMPTY, AND THAT IS THE POINT.
 *
 * MIDIS.pdf page 10 carries three quotes. Every one is headed "Demo
 * Testimonial — Placeholder Only", attributed to "Demo Client Name" at
 * "Demo Company", under a developer note reading:
 *
 *   "These testimonials are fictional examples for layout and design
 *    testing. Do not publish them as genuine customer reviews. Replace them
 *    with approved testimonials and real names, roles, and companies."
 *
 * No approved, attributed testimonial has been supplied to replace them. So
 * none is published: the section renders only when this array has an entry,
 * and the page reads as complete without it rather than showing an empty
 * heading or an invented quote.
 *
 * TO PUBLISH ONE
 * --------------
 * Add an object below with `approved: true`. The section appears on its own
 * — no component change, no layout work. Each entry needs a real name, a
 * real role and a real company; `logo` and `projectSlug` are optional and
 * render only when present.
 *
 * `approved` is explicit rather than implied by presence in the array, so a
 * quote can be staged here while it is still being confirmed with the
 * client without that confirmation being assumed by the code.
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

/** What the section actually renders. Nothing unapproved can slip through. */
export const approvedTestimonials = testimonials.filter((t) => t.approved);

export const hasTestimonials = approvedTestimonials.length > 0;

/* ==========================================================================
   Section copy
   ========================================================================== */

export const testimonialsSection = {
  heading: "Words From Our Clients",
  subheading: "Discover what our clients have to say about working with MIDIS.",
} as const;

/* ==========================================================================
   DEVELOPMENT PREVIEW ONLY
   --------------------------------------------------------------------------
   The PDF's three placeholder quotes, so the layout can be reviewed before
   real testimonials exist. They are gated behind an environment variable
   that is unset in production, and every one of them renders with a visible
   "Demo content" badge plus a banner across the section — so a preview can
   never be mistaken for a live page, and a screenshot of one can never be
   mistaken for genuine client feedback.

   Names and companies are the PDF's own placeholders. Nothing here invents
   a person or a business that might exist.
   ========================================================================== */

export const SHOW_DEMO_TESTIMONIALS =
  process.env.NEXT_PUBLIC_SHOW_DEMO_TESTIMONIALS === "true";

export const demoTestimonials: readonly Testimonial[] = [
  {
    quote:
      "Working with the team made our website project much easier. The process was organised, communication was clear, and the final design reflected what we wanted our brand to communicate.",
    name: "Demo Client Name",
    role: "Marketing Manager",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "The new website gave us a clearer way to present our services and guide visitors towards getting in touch. The team was responsive and collaborative throughout the project.",
    name: "Demo Client Name",
    role: "Founder",
    company: "Demo Company",
    approved: false,
  },
  {
    quote:
      "We appreciated the team's focus on both design and functionality. The result was a more structured digital experience that gave us a strong foundation for future growth.",
    name: "Demo Client Name",
    role: "Business Owner",
    company: "Demo Company",
    approved: false,
  },
];

/**
 * What the section should render, if anything.
 *
 * Approved quotes win. Demo quotes appear only with the flag on. With
 * neither, this is empty and the section does not render at all.
 */
export const visibleTestimonials: readonly Testimonial[] = hasTestimonials
  ? approvedTestimonials
  : SHOW_DEMO_TESTIMONIALS
    ? demoTestimonials
    : [];

/** True when what is on screen is placeholder content, not client feedback. */
export const showingDemo = !hasTestimonials && visibleTestimonials.length > 0;
