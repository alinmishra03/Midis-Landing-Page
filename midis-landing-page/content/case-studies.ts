/**
 * FEATURED WORK — industry-based case studies (MIDIS brief, 2026-10-21).
 *
 * WHO IS HERE, AND WHY. The brief names nine clients for this section.
 * Eight appear below; HIGH SPIRITS does not, because the business could
 * not be independently identified (several unrelated companies share the
 * name) and the brief says to report an unverifiable website rather than
 * substitute one. See the session report of 2026-10-21.
 *
 * PROVENANCE, PER FIELD:
 *  - `industry` and `overview`: verified against each client's live site
 *    on 2026-10-21 (and, for Country Kids / Gulf Connect / AlinKriti,
 *    the project records carried over in content/work.ts).
 *  - `delivered`: ONLY what is supportable. For Country Kids, Gulf
 *    Connect and AlinKriti these are the portfolio's own service tags
 *    (content/work.ts). For the other five they read "Website Design &
 *    Development" on the strength of each client's published feedback
 *    (content/testimonials.ts, supplied and attested 2026-10-21), which
 *    speaks to MIDIS delivering their website. Nothing finer-grained is
 *    claimed for them.
 *  - `features`: things VISIBLE on the live website, phrased as website
 *    features — deliberately not presented as MIDIS deliverables.
 *  - `preview`: a genuine screenshot. Country Kids / Gulf Connect /
 *    AlinKriti reuse the existing 1800×1125 captures from 2026-10-14/19;
 *    the other five were captured fresh from the live sites on
 *    2026-10-21 at 1800×1125 (cookie banners and newsletter modals
 *    dismissed, no overlays, no filters), optimised with sharp/mozjpeg.
 *  - `phone`: an additional genuine mobile capture (390×844 @2x), used
 *    only where the mobile experience IS the story — MTC today.
 *  - NO metrics, NO invented outcomes, NO external links anywhere.
 */

export interface CaseStudy {
  readonly slug: string;
  /** The client's name, as verified. */
  readonly client: string;
  /** Prominent industry label, verified against the client's own site. */
  readonly industry: string;
  /** Short label for the industries strip. */
  readonly industryShort: string;
  /** Icon key for the industries strip (drawn in Work.tsx). */
  readonly icon: string;
  /** What kind of engagement this was. */
  readonly projectType: string;
  /** Project overview — business context plus the digital solution. */
  readonly overview: string;
  /** What MIDIS delivered. See the provenance note. */
  readonly delivered: readonly string[];
  /** Features visible on the live website (not claimed deliverables). */
  readonly features: readonly string[];
  /** Local, optimised, genuine screenshot (1800×1125). */
  readonly preview: string;
  /** The live host, shown as text in the browser chrome — not a link. */
  readonly host: string;
  /** Optional genuine mobile capture (780×1688). */
  readonly phone?: string;
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "country-kids",
    client: "Country Kids",
    industry: "Education & Childcare",
    industryShort: "Education",
    icon: "education",
    projectType: "Website Design & Development",
    overview:
      "A not-for-profit early learning centre in Ravenhall, Victoria, rooted in Country. Its digital experience introduces families to the centre's philosophy and learning environments with the warmth of the place itself.",
    delivered: ["Website Strategy", "UI/UX Design", "Development"],
    features: [
      "Seven nature-named learning rooms",
      "Curriculum and philosophy pathways",
      "Family enquiry and enrolment routes",
    ],
    preview: "/images/work/country-kids.jpg",
    host: "countrykids.au",
  },
  {
    slug: "mounting-backend-services",
    client: "Mounting Backend Services",
    industry: "Business Services",
    industryShort: "Business Services",
    icon: "briefcase",
    projectType: "Website Design & Development",
    overview:
      "MBS runs back-office operations — people operations, payroll, compliance and IT — for clients across the US, APAC and EMEA. Its website turns that breadth into clear service pathways a prospect can navigate in one visit.",
    delivered: ["Website Design & Development"],
    features: [
      "Service-by-service breakdown",
      "Leadership team and credentials",
      "Multi-region client focus",
    ],
    preview: "/images/work/mounting-backend-services.jpg",
    host: "mountingbackendservices.com",
  },
  {
    slug: "sofisam",
    client: "Sofisam",
    industry: "Consulting & Advisory",
    industryShort: "Consulting",
    icon: "compass",
    projectType: "Website Design & Development",
    overview:
      "SOFISAM FZCO advises international businesses from Dubai's DMCC district. The site is deliberately restrained — strategic consulting, advisory and structuring presented with the discretion the work itself demands.",
    delivered: ["Website Design & Development"],
    features: [
      "Three-pillar advisory structure",
      "Insights editorial",
      "Direct, low-friction contact",
    ],
    preview: "/images/work/sofisam.jpg",
    host: "sofisam.com",
  },
  {
    slug: "gulf-connect",
    client: "Gulf Connect Consultancy",
    industry: "Capital Markets Communications",
    industryShort: "Capital Markets",
    icon: "globe",
    projectType: "Website Design & Development",
    overview:
      "A capital-markets communications consultancy connecting international companies with Gulf capital, partners and media. An institutional palette and investor-focused pathways carry the confidence the sector expects.",
    delivered: ["Website Strategy", "UI/UX Design", "Development"],
    features: [
      "Investor and company pathways",
      "Three-part capability model",
      "English / Arabic navigation",
    ],
    preview: "/images/work/gulf-connect.jpg",
    host: "gulfconnectconsultancy.com",
  },
  {
    slug: "mobile-tyre-champions",
    client: "Mobile Tyre Champions",
    industry: "Automotive Services",
    industryShort: "Automotive",
    icon: "car",
    projectType: "Website Design & Development",
    overview:
      "A 24/7 mobile tyre-fitting service across Surrey, Hampshire and Berkshire. The website is built for the roadside moment: find a fitter, check availability and reach the team in seconds — above all on a phone.",
    delivered: ["Website Design & Development"],
    features: [
      "Postcode availability checker",
      "One-tap call and WhatsApp",
      "Emergency-first mobile layout",
    ],
    preview: "/images/work/mobile-tyre-champions.jpg",
    host: "mobiletyrechampions.com",
    phone: "/images/work/mobile-tyre-champions-phone.jpg",
  },
  {
    slug: "alinkriti",
    client: "AlinKriti",
    industry: "Jewellery & E-commerce",
    industryShort: "E-commerce",
    icon: "gem",
    projectType: "E-commerce Development",
    overview:
      "Handcrafted jewellery inspired by heritage and refined for the modern woman. The store gives every piece room to shine — warm metallics, soft neutrals and story-led product presentation from discovery to checkout.",
    delivered: ["E-commerce", "UI/UX Design", "Development"],
    features: [
      "Story-led product presentation",
      "Collections and gifting pathways",
      "Full online shopping experience",
    ],
    preview: "/images/work/alinkriti.jpg",
    host: "alinkriti.com",
  },
  {
    slug: "hqb-pro-solutions",
    client: "HQB Pro Solutions",
    industry: "Professional Services",
    industryShort: "Professional Services",
    icon: "shield",
    projectType: "Website Design & Development",
    overview:
      "An Edmonton-based firm pairing accounting and billing expertise with hands-on IT support. The site leads with its three service pillars and the straightforward confidence of a firm that runs other businesses' operations.",
    delivered: ["Website Design & Development"],
    features: [
      "Three service pillars up front",
      "Partner and director profiles",
      "Client onboarding pathways",
    ],
    preview: "/images/work/hqb-pro-solutions.jpg",
    host: "hqbprosolutions.com",
  },
  {
    slug: "mining-discovery",
    client: "Mining Discovery",
    industry: "Mining News & Media",
    industryShort: "News & Media",
    icon: "news",
    projectType: "Website Design & Development",
    overview:
      "A global mining-industry news platform: daily coverage of gold, silver, copper and the wider metals market, digital magazine editions and company profiles, serving an international readership at news-room pace.",
    delivered: ["Website Design & Development"],
    features: [
      "Live metals price ticker",
      "Digital magazine editions",
      "Daily and weekly newsletters",
    ],
    preview: "/images/work/mining-discovery.jpg",
    host: "miningdiscovery.com",
  },
];

/** The industries strip above the projects — one entry per case study,
    each anchoring to its project below. Derived, so it can never drift
    from what the section actually shows. */
export const industries = caseStudies.map((study) => ({
  label: study.industryShort,
  icon: study.icon,
  slug: study.slug,
}));
