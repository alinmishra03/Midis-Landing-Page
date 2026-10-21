/**
 * CLIENT FEEDBACK — nine MIDIS client relationships.
 * ==========================================================================
 *
 * PROVENANCE OF THE QUOTES — READ BEFORE EDITING. The nine quotes below
 * were supplied verbatim on 2026-10-21, with the explicit confirmation —
 * given in answer to a direct question — that this is feedback the
 * clients actually gave MIDIS and that MIDIS confirms they are fine
 * being quoted. They are published on the strength of that attestation.
 * If that ever turns out not to hold for a client, set their
 * `approved: false` and the page falls back to the factual spotlight for
 * that client with no code change.
 *
 * `approved` still means what it always meant: the client's words, okayed
 * for publication under their name. Only `true` renders as a quote.
 * Nothing here carries an invented person name, job title, star rating
 * or metric — each quote is attributed to the company only.
 *
 * PROVENANCE OF THE FACTUAL MATERIAL (industries, spotlights) — verified
 * 2026-10-21: Country Kids / Gulf Connect / AlinKriti from content/work.ts
 * (MIDIS portfolio, live sites checked 2026-10-14); MBS from
 * mountingbackendservices.com; Sofisam from sofisam.com (SOFISAM FZCO,
 * DMCC Dubai); MTC from mobiletyrechampions.com; HQB from
 * hqbprosolutions.com (Edmonton); Mining Discovery from
 * miningdiscovery.com (also a client logo on midis.in's case-study page).
 * High Spirits could not be independently identified — several unrelated
 * companies share the name — so its entry claims no industry.
 */

export interface ClientFeedback {
  /** The client's feedback, verbatim as supplied. */
  readonly quote: string;
  /**
   * True only when this is feedback the client actually gave and MIDIS
   * confirms it may be published under the company's name. False drops
   * the quote from the page and shows the factual spotlight instead.
   */
  readonly approved: boolean;
}

export interface ClientStory {
  readonly id: string;
  /** The company's correct full name. */
  readonly name: string;
  /** Short label for the selector pills. */
  readonly short: string;
  /**
   * The business's industry, from its own site or the documented project
   * record. "Client Partner" for High Spirits ONLY, whose industry could
   * not be verified — a relationship descriptor, not an invented sector.
   */
  readonly industry: string;
  /** The client's feedback. Renders as a quote when `approved`. */
  readonly feedback: ClientFeedback;
  /** Factual fallback shown if a quote is ever withdrawn. */
  readonly spotlight: string;
  /** MIDIS services, ONLY where the portfolio documents them (work.ts). */
  readonly services?: readonly string[];
}

export const clientStories: readonly ClientStory[] = [
  {
    id: "country-kids",
    name: "Country Kids",
    short: "Country Kids",
    industry: "Early Childhood Education",
    feedback: {
      quote:
        "MIDIS created a beautiful, welcoming website that makes it easy for parents to find what they need.",
      approved: true,
    },
    spotlight:
      "A not-for-profit early learning centre rooted in Country, where every child belongs. Its digital experience presents the centre's educational philosophy, seven nature-named learning environments and clear pathways for families.",
    services: ["Website Strategy", "UI/UX Design", "Development"],
  },
  {
    id: "mbs",
    name: "Mounting Backend Services",
    short: "MBS",
    industry: "Business Operations Outsourcing",
    feedback: {
      quote:
        "Professional work, great attention to detail, and a website that represents our business perfectly.",
      approved: true,
    },
    spotlight:
      "MBS runs the back office so growing companies can focus on growth — people operations, payroll and compliance, recruitment, workforce management, accounting and IT services, delivered to clients across the US, APAC and EMEA regions.",
  },
  {
    id: "sofisam",
    name: "Sofisam",
    short: "Sofisam",
    industry: "Corporate Advisory",
    feedback: {
      quote:
        "MIDIS understood our vision and delivered a clean, modern, and professional website.",
      approved: true,
    },
    spotlight:
      "SOFISAM FZCO is a global corporate advisory platform headquartered in Dubai's DMCC district, offering confidential strategic consulting, executive advisory and structuring services built on decades of international business experience.",
  },
  {
    id: "gcc",
    name: "Gulf Connect Consultancy",
    short: "GCC",
    industry: "Capital Markets Communications",
    feedback: {
      quote:
        "A smooth experience from start to finish. The website reflects our brand and services beautifully.",
      approved: true,
    },
    spotlight:
      "A capital-markets communications consultancy connecting international companies with Gulf capital, partners and media. Its digital presence pairs an institutional palette with a three-part capability model and investor-focused pathways.",
    services: ["Website Strategy", "UI/UX Design", "Development"],
  },
  {
    id: "mtc",
    name: "Mobile Tyre Champions",
    short: "MTC",
    industry: "Mobile Tyre Fitting",
    feedback: {
      quote:
        "MIDIS made our website simple, professional, and easy for customers to navigate.",
      approved: true,
    },
    spotlight:
      "A 24/7 mobile tyre-fitting service covering London, Surrey, Hampshire and Berkshire — emergency callouts, premium tyre brands and IMI-certified technicians brought to the customer's driveway or roadside instead of a garage forecourt.",
  },
  {
    id: "high-spirits",
    name: "High Spirits",
    short: "High Spirits",
    /* NOT an industry: the business could not be independently verified,
       and claiming a sector would be inventing one. */
    industry: "Client Partner",
    feedback: {
      quote:
        "Creative ideas, excellent design, and great attention to our brand identity.",
      approved: true,
    },
    spotlight:
      "One of the client brands in the MIDIS portfolio. A full project spotlight is being confirmed with the client and will appear here once approved.",
  },
  {
    id: "alinkriti",
    name: "AlinKriti",
    short: "AlinKriti",
    industry: "Jewellery E-commerce",
    feedback: {
      quote:
        "MIDIS brought our jewellery collections to life with an elegant and seamless shopping experience.",
      approved: true,
    },
    spotlight:
      "Handcrafted jewellery inspired by heritage and refined for the modern woman. An e-commerce experience built around warm metallics, soft neutrals and story-led product presentation that gives every piece room to shine.",
    services: ["E-commerce", "UI/UX Design", "Development"],
  },
  {
    id: "hqb",
    name: "HQB Pro Solutions",
    short: "HQB",
    industry: "Accounting, Billing & IT Services",
    feedback: {
      quote:
        "A well-structured, professional website that communicates our services clearly.",
      approved: true,
    },
    spotlight:
      "An Edmonton-based professional services firm that pairs accounting and billing expertise with hands-on IT support, giving small and mid-sized businesses one partner for the systems their operations run on.",
  },
  {
    id: "mining-discovery",
    name: "Mining Discovery",
    short: "Mining Discovery",
    industry: "Mining News & Media",
    feedback: {
      quote:
        "MIDIS transformed our ideas into a modern, informative, and user-friendly website.",
      approved: true,
    },
    spotlight:
      "A global mining-industry news and media platform covering gold, silver, copper and the wider metals market — daily news and newsletters, a monthly digital magazine, and executive and company profiles for the international mining community.",
  },
];

/** True once at least one client's feedback is cleared for publication. */
export const hasApprovedFeedback = clientStories.some(
  (s) => s.feedback.approved,
);

/* ==========================================================================
   Section copy
   ========================================================================== */

export const testimonialsSection = {
  heading: "Words From Our Clients",
  subheading:
    "Nine businesses MIDIS has partnered with — from early learning and corporate advisory to e-commerce and mining media.",
  /** Visible label on a published quote. */
  testimonialLabel: "Client Feedback",
  /** Visible label on the factual fallback. */
  spotlightLabel: "Project Spotlight",
  cta: "Start Your Project",
} as const;
