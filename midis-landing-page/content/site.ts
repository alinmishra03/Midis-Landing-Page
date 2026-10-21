/**
 * Verified MIDIS company facts.
 *
 * Nothing here is invented. Every value was either carried from the existing
 * MIDIS website build (where it is recorded as extracted from the live
 * midis.in site or supplied directly by MIDIS with a date) or taken from
 * MIDIS.pdf. A field that could not be verified is omitted rather than
 * guessed at.
 *
 * NOTE ON THE CANONICAL HOST. MIDIS.pdf writes the thank-you route as
 * `midis.com/thank-you/book-a-call`. The verified company domain is
 * `midis.in`; `midis.com` does not resolve to MIDIS. The PATH from the PDF is
 * honoured exactly — /thank-you/book-a-call — and the HOST is the verified
 * one. See docs/open-questions.md, item 2.
 */

/**
 * WHERE THE OUTBOUND NAVIGATION POINTS — AND WHY IT IS NOT midis.in.
 *
 * Checked on 2026-10-19: `https://www.midis.in/` returns 200, but EVERY
 * sub-path returns 404 — /about, /services, /work, /contact, /blogs,
 * /case-study, /ai — including the ones its own /sitemap.xml lists. The live
 * site is a client-rendered SPA whose host has no catch-all rewrite, so a
 * deep link 404s on first load and only resolves by navigating from the
 * root. Linking the footer there would send every visitor to a 404.
 *
 * The same routes all return 200 on the Vercel deployment of the new MIDIS
 * site, so that is where the navigation points for now.
 *
 * TO SWITCH IT BACK: change this one constant. Every footer link, both legal
 * links and nothing else is derived from it. Do that once either midis.in is
 * configured to serve its own routes, or the new site is live on the brand
 * domain.
 *
 * `site.url` below stays midis.in deliberately — it is the canonical
 * identity used for metadata, canonical URLs and the Organization schema,
 * and that should remain the brand domain regardless of where the marketing
 * pages are currently served from.
 */
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://new-midis-ten.vercel.app";

export const site = {
  name: "MIDIS",
  legalName: "MIDIS",
  url: "https://www.midis.in",

  /** From MIDIS.pdf, page 13 (footer description). Approved copy. */
  description:
    "MIDIS helps businesses build better digital experiences through website design, development, and digital optimisation.",

  /** From the thank-you page design, MIDIS.pdf page 17. */
  strapline: "Digital Growth Partner",
  /** From the thank-you page footer, MIDIS.pdf page 17. */
  footerStrapline: "Website Design, Development & Digital Growth",

  email: "hello@midis.in",

  /**
   * Published lines. Both were recorded in the existing MIDIS build; the US
   * number was supplied by MIDIS on 2026-10-12. `region` labels the dialling
   * code — it is not a claim about an office. The registered address below
   * is the only location MIDIS states.
   */
  /*
   * The US line was removed on MIDIS's instruction (2026-10-19). The Indian
   * line is now the only published number, and it is the same line the
   * WhatsApp entry points use — so the header's "Call" and "WhatsApp"
   * buttons both resolve to a number MIDIS has verified, rather than to two
   * different ones.
   *
   * Still an array rather than a single value: the Organization schema
   * builds a contactPoint per entry, and a second line can be added back
   * without touching anything that reads this.
   */
  phones: [
    { region: "IN", display: "+91 97793 20626", e164: "+919779320626" },
  ],

  /**
   * Recorded separately from `phones` on purpose: a line is never assumed to
   * be WhatsApp-enabled just because it is published. Only the Indian line is
   * confirmed.
   */
  whatsapp: "919779320626",
  whatsappMessage:
    "Hello MIDIS, I'd like to discuss a website project with your team.",

  address: {
    street: "Plot No. A-28(C, Phase 7, Industrial Area, Sector 73",
    locality: "Sahibzada Ajit Singh Nagar",
    region: "Punjab",
    postalCode: "160055",
    country: "IN",
    countryName: "India",
  },

  /*
   * YouTube was REMOVED on MIDIS's instruction (2026-10-21), to be replaced
   * by Medium. Note this list also feeds the Organization schema's `sameAs`
   * (lib/seo.ts), so the YouTube profile left both the footer and the
   * structured data together.
   */
  socials: [
    { name: "LinkedIn", url: "https://www.linkedin.com/company/midismarket/" },
    { name: "Instagram", url: "https://www.instagram.com/officialmidis/" },
    {
      name: "Facebook",
      url: "https://www.facebook.com/people/Midis/61579354660327/",
    },
  ],
} as const;

/**
 * MEDIUM — profile URL confirmed in chat on 2026-10-21: the user picked
 * medium.com/@officialmidis (matching the Instagram handle) when asked
 * directly. NEXT_PUBLIC_MEDIUM_URL still overrides it, so a rename never
 * needs a code change. With the URL set, the link renders in the footer
 * and joins the Organization schema's `sameAs` automatically.
 */
export const MEDIUM_URL =
  process.env.NEXT_PUBLIC_MEDIUM_URL ?? "https://medium.com/@officialmidis";

/** The socials the page should actually render (and the schema should
    assert): the confirmed list, plus Medium once its URL exists. */
export const visibleSocials: readonly { name: string; url: string }[] =
  MEDIUM_URL ? [...site.socials, { name: "Medium", url: MEDIUM_URL }] : site.socials;

/** `tel:` / `wa.me` helpers, so the formatting lives in one place. */
export const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
  site.whatsappMessage,
)}`;

/**
 * The line a "Call us" control dials.
 *
 * Read from `site.phones` rather than written out again, so there is exactly
 * one place a published number can be wrong. If the list is ever emptied,
 * this is `null` and the header simply renders no Call button — a dialler
 * that opens on nothing is worse than no button at all.
 */
export const primaryPhone = site.phones[0] ?? null;
export const callHref = primaryPhone ? `tel:${primaryPhone.e164}` : null;

/**
 * Footer navigation — INTERNAL TO THIS LANDING PAGE, on MIDIS's instruction
 * of 2026-10-20.
 *
 * The footer originally carried the MIDIS.pdf pp.13–14 list (Services, Our
 * Work, Industries, About MIDIS, Resources, Contact) pointing at the main
 * MIDIS site. MIDIS then asked for the footer to navigate within this page
 * only: Industries, Resources, About MIDIS and Contact were REMOVED — there
 * is no corresponding section on this page for any of them — and the two
 * remaining menus point at this page's own sections and forms. Nothing was
 * added to fill the space they left.
 *
 * EVERY HREF IS WRITTEN `/#id`, NOT `#id`. The footer also renders on
 * /free-website-audit, where a bare `#work` would scroll nowhere. With the
 * leading slash the same link is a plain same-document scroll on the home
 * page and a real navigation home from any other route, with the anchor,
 * smooth scrolling, the sticky-header offset (`scroll-padding-top` in
 * globals.css) and history behaviour all handled by the browser.
 *
 * The section ids are the ones the components actually render — the same
 * set the header's `sectionNav` below scrolls to. "Get a Free Consultation"
 * goes where the hero's identically-worded CTA goes: the estimator, which
 * is the consultation request form. It is not a second copy of anything.
 */
export const footerColumns = [
  {
    heading: "Explore",
    links: [
      { label: "Our Work", href: "/#work" },
      { label: "Services", href: "/#services" },
      { label: "Process", href: "/#process" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQs", href: "/#faqs" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Project Estimator", href: "/#estimator" },
      { label: "Free Website Audit", href: "/free-website-audit" },
      { label: "Get a Free Consultation", href: "/#estimator" },
    ],
  },
] as const;

/**
 * LEGAL LINKS — the one place the footer still leaves this project, and
 * deliberately so. No Privacy Policy or Terms page exists inside this
 * landing-page project, and inventing legal content is not an option, so
 * these point at MIDIS's own live legal pages on the deployed MIDIS site —
 * MIDIS's content, not an unrelated website. If MIDIS wants these routes
 * to live inside this project, the pages' approved text is the missing
 * dependency; once routes exist here, change these two hrefs.
 */
export const footerLegal = [
  { label: "Privacy Policy", href: `${MAIN_SITE_URL}/privacy` },
  { label: "Terms & Conditions", href: `${MAIN_SITE_URL}/terms` },
] as const;

/** In-page navigation for the header. Anchors only — all resolve on this page. */
export const sectionNav = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
] as const;
