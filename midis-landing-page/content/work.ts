/**
 * FEATURED WORK — real projects, real screenshots, real live URLs.
 *
 * PROVENANCE
 * ----------
 * `name`, `summary` and `category` are the MIDIS portfolio's own words for
 * each project, read from midis-portfolio.vercel.app and carried over
 * unedited from the existing MIDIS website build, which recorded them on
 * 2026-10-14. `url` is the live site the portfolio links to; each returned a
 * rendered page with a matching title when checked on that date. `preview` is
 * a 1800x1125 screenshot of that page taken in the same pass — one size for
 * all six, which is why the showcase never crops one differently.
 *
 * WHAT THE COPY DELIBERATELY DOES NOT SAY
 * ---------------------------------------
 * The portfolio presents its entries as concepts ("CONCEPT ONE", "VIEW LIVE
 * CONCEPT"). MIDIS has not confirmed which of them were delivered client
 * engagements. So this page says "work" and "projects" and never "clients",
 * never "we delivered", and never attaches a result, a metric or an outcome
 * to a name. `relationship` exists so that claim has somewhere to live once
 * it is verified, rather than being written into the copy by hand; it is
 * unset on every entry today and nothing renders from it.
 *
 * There are no case studies here because no verified case study exists. The
 * "View Case Study" CTA that MIDIS.pdf specifies would have to link to a page
 * of invented outcomes, so each card used to link to the LIVE SITE instead —
 * real, checkable, and better proof than a page of numbers nobody can
 * source. See docs/open-questions.md, item 3.
 *
 * NO LONGER RENDERED AS LINKS (MIDIS lead-generation brief, 2026-10-21):
 * MIDIS instructed that visitors must not leave the landing page while
 * exploring the work, so Work.tsx no longer navigates to `url` anywhere.
 * `url` stays here as provenance (it is where each entry was verified), and
 * `host` still renders — as the domain in each screenshot's browser-frame
 * chrome, visible proof without navigation. Each row's action is now
 * "Discuss a Similar Project" → the on-page estimator.
 */

export const PORTFOLIO_URL = "https://midis-portfolio.vercel.app/";

/**
 * How many projects the portfolio holds in total, counted from its own
 * numbering ("01 / 08" through "08 / 08") on 2026-10-14. Lets the page say
 * there is more to see without guessing at a number.
 */
export const PORTFOLIO_PROJECT_COUNT = 8;

export interface Project {
  readonly slug: string;
  /** The project's own name, as the portfolio gives it. */
  readonly name: string;
  /** Short category line — the portfolio's tags, title-cased. */
  readonly category: string;
  /** The services this project involved. */
  readonly services: readonly string[];
  /** The portfolio's own description, unedited. */
  readonly summary: string;
  /** The live site. Verified to return a rendered page on 2026-10-14. */
  readonly url: string;
  /** Bare host, shown as the visible link label. */
  readonly host: string;
  readonly preview: string;
  /**
   * Set only once MIDIS confirms this was a delivered client engagement.
   * Unset everywhere today — see the note above.
   */
  readonly relationship?: "client";
}

export const PREVIEW_WIDTH = 1800;
export const PREVIEW_HEIGHT = 1125;

export const projects: readonly Project[] = [
  {
    slug: "country-kids",
    name: "Country Kids",
    category: "Early Learning",
    services: ["Website Strategy", "UI/UX Design", "Development"],
    summary:
      "A not-for-profit early learning centre rooted in Country, where every child belongs. Seven nature-named rooms, a curriculum shaped like the landscape and clear family pathways give the brand warmth and trust.",
    url: "https://www.countrykids.au/",
    host: "countrykids.au",
    /*
     * Re-captured 2026-10-19 on MIDIS's instruction.
     *
     * The site opens on a video intro, then a globe of cards carrying a
     * "Continue" control. This preview is the state AFTER that control is
     * pressed: the globe unfolds into the card wall and the full navigation
     * appears. The previous capture was the globe itself.
     *
     * Same 1800x1125 geometry as every other preview, so the showcase still
     * never has to crop one differently from another.
     */
    preview: "/images/work/country-kids.jpg",
  },
  {
    slug: "gulf-connect",
    name: "Gulf Connect",
    category: "Capital Markets",
    services: ["Website Strategy", "UI/UX Design", "Development"],
    summary:
      "A capital-markets communications consultancy connecting international companies with Gulf capital, partners and media. An institutional palette, a three-part capability model and investor-focused pathways build confidence.",
    url: "https://www.gulfconnectconsultancy.com/",
    host: "gulfconnectconsultancy.com",
    preview: "/images/work/gulf-connect.jpg",
  },
  {
    slug: "alinkriti",
    name: "AlinKriti",
    category: "Jewellery E-commerce",
    services: ["E-commerce", "UI/UX Design", "Development"],
    summary:
      "Handcrafted jewellery inspired by heritage and refined for the modern woman. Warm metallics, soft neutrals and story-led product presentation give every piece room to shine.",
    url: "https://alinkriti.com/",
    host: "alinkriti.com",
    preview: "/images/work/alinkriti.jpg",
  },
  {
    slug: "neocloudz",
    name: "NeoCloudz",
    category: "GPU Cloud Platform",
    services: ["Website Strategy", "UI/UX Design", "Development"],
    summary:
      "A GPU cloud presented as a live cluster terminal. Blackwell-class compute, workload-led solutions and developer tooling sit inside a dark, green-lit interface that feels operational from the first screen.",
    url: "https://www.neocloudz.com/",
    host: "neocloudz.com",
    preview: "/images/work/neocloudz.jpg",
  },
  {
    slug: "us-data-centers",
    name: "U.S. Data Centers",
    category: "AI Infrastructure",
    services: ["Website Strategy", "UI/UX Design", "Development"],
    summary:
      "Enterprise-scale AI infrastructure presented with technical clarity. Deployment speed, power, cooling and GPU-ready architecture lead a dark, data-rich interface built around high-density compute.",
    url: "https://www.usdatacenters.ai/",
    host: "usdatacenters.ai",
    preview: "/images/work/us-data-centers.jpg",
  },
  {
    slug: "digipowerx",
    name: "DigiPowerX",
    category: "Energy & Compute",
    services: ["Website Strategy", "UI/UX Design", "Development"],
    summary:
      "Energy, data centers and bare-metal GPU compute told as one vertically integrated story. A black-and-yellow industrial identity carries the journey from owned power to live AI infrastructure.",
    url: "https://www.digipowerx.com/",
    host: "digipowerx.com",
    preview: "/images/work/digipowerx.jpg",
  },
];

/** The three the hero's layered browser composition shows. */
export const heroShowcase = projects.filter((p) =>
  ["gulf-connect", "country-kids", "neocloudz"].includes(p.slug),
);
