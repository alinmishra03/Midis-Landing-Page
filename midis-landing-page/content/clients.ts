/**
 * CLIENTS — the trust section's evidence, with per-client provenance.
 *
 * WHERE THE NAMES COME FROM. The 18 clients named in the MIDIS Client
 * Portfolio & Delivery Overview (supplied 2026-10-12), plus Mining
 * Discovery (named in MIDIS's client-feedback brief of 2026-10-21) and
 * the additions from MIDIS's logo deliveries of 2026-10-22 (The Mining
 * Investment Event, US Data Centers, DigiPowerX, Noble Capital
 * Markets, Loyalist Exploration). Every mark is the client's authentic
 * logo — supplied by MIDIS (2026-10-14/21/22) or taken from the
 * client's own website where the supplied file never arrived. Colours
 * are only ever changed in clearly-marked THEME VARIANTS (below).
 *
 * WEBSITE AUDIT (2026-10-22, MIDIS instruction: show only clients whose
 * site is live). Every URL below was probed and its content checked for
 * the brand — a 200 alone did not count, and a single failed request
 * did not count as "offline" either:
 *  - `status: "live"` — site up, brand confirmed on the page.
 *  - `status: "not-live"` — reachable but NOT a functioning business
 *    site (Aureus Hospitality: a "Launching Soon" placeholder).
 *  - `status: "unverified"` — no official site could be identified
 *    with confidence. NOT confirmed offline; logo assets kept.
 *
 * `approved` is the single display switch. New logos MIDIS supplies
 * should be added with `approved: false` until verified, then flipped
 * on — never create a second logo section.
 *
 * PERMISSION — FLAGGED, unchanged: marks are published on MIDIS's
 * instruction of 2026-10-12, not on written client sign-off. See
 * docs/open-questions.md, item 4.
 *
 * THEME VARIANTS, NOT CHIPS (MIDIS instruction, 2026-10-22: every mark
 * sits directly on the section background — no boxes, no chips). Where
 * a mark could not read on one theme's ground, a RECOLOURED VARIANT
 * was generated from the original asset on MIDIS's instruction:
 *  - `logo` is the LIGHT-theme asset. For marks drawn white-on-
 *    transparent, this is a "-light" version with the white set to
 *    the site charcoal and every brand accent untouched; DigiPowerX's
 *    bright yellow is deepened to gold at the same hue.
 *  - `logoDark` is the DARK-theme asset, where one is needed: the
 *    original for light-drawn marks; hue-preserving lightened versions
 *    for dark saturated marks (MTC, MBS, Solar Spectrum, High
 *    Spirits); white for the all-black mark; a neutral luminance
 *    inversion for the Mining Investment Event badge; Loyalist's own
 *    published white version. Absent, the light asset serves both
 *    themes (Mining Discovery's gold).
 * Original supplied files are kept unmodified alongside the variants.
 */

export type WebsiteStatus = "live" | "not-live" | "unverified";

export interface Client {
  readonly name: string;
  /** The client's authentic mark (light-theme asset) — or null while
      MIDIS's supplied file has not reached this machine yet. An entry
      without a logo can never render, whatever its flags say. */
  readonly logo: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  } | null;
  /** The verified official website, or null when none is on file. */
  readonly website: string | null;
  /** Result of the 2026-10-22 audit — see the header note. */
  readonly status: WebsiteStatus;
  /** Shown in the showcase? See showcaseClients for the gate. */
  readonly approved: boolean;
  /** Verified industry, where one is on record (content/case-studies). */
  readonly industry?: string;
  /** Dark-theme asset, when the light one cannot read on a dark
      ground — see THEME VARIANTS in the header note. */
  readonly logoDark?: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
}

export const clients: readonly Client[] = [
  {
    name: "Country Kids",
    logo: { src: "/images/clients/country-kids-light.webp", width: 106, height: 67 },
    logoDark: { src: "/images/clients/country-kids.webp", width: 106, height: 67 },
    website: "https://www.countrykids.au/",
    status: "live",
    approved: true,
    industry: "Education & Childcare",
  },
  {
    name: "Gulf Connect Consultancy",
    logo: { src: "/images/clients/gulf-connect-consultancy-light.webp", width: 480, height: 123 },
    logoDark: { src: "/images/clients/gulf-connect-consultancy.webp", width: 480, height: 123 },
    website: "https://www.gulfconnectconsultancy.com/",
    status: "live",
    approved: true,
    industry: "Capital Markets Communications",
  },
  {
    name: "AlinKriti",
    logo: { src: "/images/clients/alinkriti-light.webp", width: 520, height: 180 },
    logoDark: { src: "/images/clients/alinkriti.webp", width: 520, height: 180 },
    website: "https://alinkriti.com/",
    status: "live",
    approved: true,
    industry: "Jewellery & E-commerce",
  },
  {
    name: "Sofisam",
    logo: { src: "/images/clients/sofisam-light.webp", width: 520, height: 86 },
    logoDark: { src: "/images/clients/sofisam.webp", width: 520, height: 86 },
    website: "https://www.sofisam.com/",
    status: "live",
    approved: true,
    industry: "Consulting & Advisory",
  },
  {
    /* Withdrawn from the showcase on MIDIS's instruction of 2026-10-22.
       Site still live; assets kept — flip approved to bring it back. */
    name: "HQB Pro Solutions",
    logo: { src: "/images/clients/hqb-pro-solutions.webp", width: 204, height: 122 },
    logoDark: { src: "/images/clients/hqb-pro-solutions-dark.webp", width: 204, height: 122 },
    website: "https://hqbprosolutions.com/",
    status: "live",
    approved: false,
    industry: "Professional Services",
  },
  {
    name: "Mobile Tyre Champions",
    logo: { src: "/images/clients/mobile-tyre-champions.webp", width: 149, height: 149 },
    logoDark: { src: "/images/clients/mobile-tyre-champions-dark.webp", width: 149, height: 149 },
    website: "https://www.mobiletyrechampions.com/",
    status: "live",
    approved: true,
    industry: "Automotive Services",
  },
  {
    name: "Mounting Backend Services",
    logo: { src: "/images/clients/mounting-backend-service.webp", width: 240, height: 56 },
    logoDark: { src: "/images/clients/mounting-backend-service-dark.webp", width: 240, height: 56 },
    website: "https://www.mountingbackendservices.com/",
    status: "live",
    approved: true,
    industry: "Business Services",
  },
  {
    name: "Mining Discovery",
    logo: { src: "/images/clients/mining-discovery.webp", width: 480, height: 212 },
    website: "https://miningdiscovery.com/",
    status: "live",
    approved: true,
    industry: "Mining News & Media",
  },
  {
    /* Withdrawn from the showcase on MIDIS's instruction of 2026-10-22
       (NeoCloudz took the slot). Site still live; assets kept — flip
       approved to bring it back. */
    name: "The Menopause Relief Store",
    logo: { src: "/images/clients/menopause-relief-store.webp", width: 193, height: 103 },
    logoDark: { src: "/images/clients/menopause-relief-store-dark.webp", width: 193, height: 103 },
    website: "https://themenopausereliefstore.com/",
    status: "live",
    approved: false,
  },
  {
    /* From MIDIS's 2026-10-22 logo delivery — the one of the twelve
       whose file actually arrived (Downloads/"Mining investment
       event.png", trimmed + converted; black-on-transparent). Site
       verified live the same day. */
    name: "The Mining Investment Event",
    logo: { src: "/images/clients/the-mining-investment-event.webp", width: 480, height: 480 },
    logoDark: { src: "/images/clients/the-mining-investment-event-dark.webp", width: 480, height: 480 },
    website: "https://www.themininginvestmentevent.com/",
    status: "live",
    approved: true,
  },
  {
    /* Approved 2026-10-22 (MIDIS "USDC"). The uploaded file never
       arrived, so the mark is the client's own header asset from
       usdatacenters.ai. White-on-transparent: the light asset is the
       white-to-charcoal variant. */
    name: "US Data Centers",
    logo: { src: "/images/clients/us-data-centers-light.webp", width: 213, height: 77 },
    logoDark: { src: "/images/clients/us-data-centers.webp", width: 213, height: 77 },
    website: "https://www.usdatacenters.ai/",
    status: "live",
    approved: true,
  },
  {
    /* Approved 2026-10-22. Mark from digipowerx.com (its own "new
       color logo" asset): bright brand yellow, unreadable on a light
       ground — the light asset keeps the hue at a deeper gold; the
       dark asset is the original yellow. */
    name: "DigiPowerX",
    logo: { src: "/images/clients/digipowerx-light.webp", width: 480, height: 89 },
    logoDark: { src: "/images/clients/digipowerx.webp", width: 480, height: 89 },
    website: "https://www.digipowerx.com/",
    status: "live",
    approved: true,
  },
  {
    /* Approved into the showcase on MIDIS's instruction of 2026-10-22
       (taking The Menopause Relief Store's slot). The uploaded file
       never arrived, so the mark was taken from the client's own
       site (neocloudz.com, its header logo) — the same provenance as
       Mining Discovery's. White-and-green, drawn for dark grounds:
       the light asset is the white-to-charcoal variant, green kept. */
    name: "NeoCloudz",
    logo: { src: "/images/clients/neocloudz-light.webp", width: 480, height: 98 },
    logoDark: { src: "/images/clients/neocloudz.webp", width: 480, height: 98 },
    website: "https://www.neocloudz.com/",
    status: "live",
    approved: true,
  },
  {
    /* Approved 2026-10-22. MIDIS's verification URL is the Noble
       mining-investment conference site, whose nav carries this exact
       "Noble Capital Markets" mark (a separate asset from The Mining
       Investment Event's circle badge); noblecapitalmarkets.com is
       also live. White-on-transparent: light asset is the charcoal
       variant. */
    name: "Noble Capital Markets",
    logo: { src: "/images/clients/noble-capital-markets-light.webp", width: 480, height: 151 },
    logoDark: { src: "/images/clients/noble-capital-markets.webp", width: 480, height: 151 },
    website: "https://www.thenoblemininginvestmentconference.com/",
    status: "live",
    approved: true,
  },
  {
    /* Approved 2026-10-22, identified by MIDIS's URL as Loyalist
       Exploration. Marks are the client's own published pair from
       loyalistexploration.com — the standard version for light, its
       official white version for dark. No recolouring needed. */
    name: "Loyalist Exploration",
    logo: { src: "/images/clients/loyalist.webp", width: 480, height: 92 },
    logoDark: { src: "/images/clients/loyalist-dark.webp", width: 480, height: 92 },
    website: "https://loyalistexploration.com/",
    status: "live",
    approved: true,
  },
  {
    /* Approved 2026-10-22: MIDIS supplied the site (solarspectrum.com.au,
       verified live + brand match). The mark is MIDIS's supplied asset
       of 2026-10-14; the dark variant is a hue-preserving lightened
       version of it. */
    name: "Solar Spectrum",
    logo: { src: "/images/clients/solar-spectrum.webp", width: 520, height: 178 },
    logoDark: { src: "/images/clients/solar-spectrum-dark.webp", width: 520, height: 178 },
    website: "https://www.solarspectrum.com.au/",
    status: "live",
    approved: true,
  },
  {
    /* Shown on MIDIS's EXPLICIT instruction of 2026-10-22, which
       overrides the live-website gate for this one client: the
       business behind the mark still could not be independently
       identified and no site is on file (see content/testimonials.ts,
       2026-10-21). The mark itself was supplied by MIDIS on
       2026-10-14; the dark asset is a hue-preserving lightened
       variant of it. */
    name: "High Spirits",
    logo: { src: "/images/clients/high-spirits.webp", width: 139, height: 240 },
    logoDark: { src: "/images/clients/high-spirits-dark.webp", width: 139, height: 240 },
    website: null,
    status: "unverified",
    approved: true,
  },

  /* ---- not live (checked 2026-10-22) ---- */
  {
    name: "Aureus Hospitality",
    logo: { src: "/images/clients/aureus-hospitality.webp", width: 236, height: 240 },
    website: "https://aureushospitality.com/",
    /* Reachable, but a "Launching Soon" site-builder placeholder — not a
       functioning business website. Re-check before flipping on. */
    status: "not-live",
    approved: false,
  },

  /* ---- no official site identified — need a URL from MIDIS ---- */
  {
    name: "Nexus Fundings",
    logo: { src: "/images/clients/nexus-fundings.webp", width: 155, height: 240 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "Mars Home Centre",
    logo: { src: "/images/clients/mars-home-centre.webp", width: 359, height: 181 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "The Thali Tales",
    logo: { src: "/images/clients/the-thali-tales.webp", width: 240, height: 240 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "Cozy&Comfy",
    logo: { src: "/images/clients/cozy-and-comfy.webp", width: 182, height: 151 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "Yogshala",
    logo: { src: "/images/clients/yogshala.webp", width: 117, height: 139 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "Samrit",
    logo: { src: "/images/clients/samrit.webp", width: 248, height: 138 },
    website: null,
    status: "unverified",
    approved: false,
  },
  {
    name: "TIV",
    logo: { src: "/images/clients/tiv.webp", width: 180, height: 89 },
    website: null,
    status: "unverified",
    approved: false,
  },
];

/** The showcase's display order (MIDIS instruction, 2026-10-23) — read
    in threes, the rows of the mobile grid. Clients not named in either
    list sit between the two in their list order (Array.prototype.sort is
    stable); SHOWCASE_LAST closes the wall. Order only: who appears is
    still decided by the filter in showcaseClients. */
const SHOWCASE_ORDER = [
  "The Mining Investment Event",
  "Gulf Connect Consultancy",
  "Mobile Tyre Champions",
  "Sofisam",
  "Mining Discovery",
  "US Data Centers",
  "AlinKriti",
  "DigiPowerX",
  "NeoCloudz",
  "Country Kids",
  "Noble Capital Markets",
];
const SHOWCASE_LAST = ["Mounting Backend Services"];

function showcaseRank(name: string): number {
  const first = SHOWCASE_ORDER.indexOf(name);
  if (first !== -1) return first;
  const last = SHOWCASE_LAST.indexOf(name);
  return last === -1 ? SHOWCASE_ORDER.length : SHOWCASE_ORDER.length + 1 + last;
}

/** What the trust section actually shows: approved entries with the
    client's own mark on disk, excluding any site CONFIRMED not live.
    (approved on an "unverified" site is MIDIS explicitly overriding
    the live-site gate — High Spirits, 2026-10-22 — recorded on the
    entry itself; a "not-live" site can never be overridden here.) */
export const showcaseClients = clients
  .filter(
    (client): client is Client & { logo: NonNullable<Client["logo"]> } =>
      client.approved && client.status !== "not-live" && client.logo !== null,
  )
  .sort((a, b) => showcaseRank(a.name) - showcaseRank(b.name));

/**
 * Countable facts only — counted from lists that exist (this file and
 * content/work.ts). Nothing else is asserted, because nothing else has
 * been verified. See docs/open-questions.md, item 5.
 */
export const verifiedCounts = {
  clientsNamed: clients.length,
  projectsShown: 6,
} as const;
