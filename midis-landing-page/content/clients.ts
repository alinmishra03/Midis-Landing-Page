/**
 * CLIENT MARKS — the trust section's evidence.
 *
 * PROVENANCE
 * ----------
 * These are the 18 clients named in the MIDIS Client Portfolio & Delivery
 * Overview, supplied by MIDIS on 2026-10-12, carried over from the existing
 * MIDIS website build. Names are from that report. Every mark is the client's
 * authentic logo — either downloaded from the client's own website or
 * supplied by MIDIS on 2026-10-14. Colours are untouched; only size and
 * surrounding whitespace changed. No placeholder brand appears here.
 *
 * PERMISSION — FLAGGED. Displaying a client's mark normally needs their
 * written permission on file. These are published on MIDIS's instruction of
 * 2026-10-12, which is not the same thing. Worth confirming before launch.
 * See docs/open-questions.md, item 4.
 *
 * WHY `onDark` EXISTS
 * -------------------
 * Nine of these marks are light-on-transparent — drawn for a dark header.
 * On the paper background they would be invisible. They are given a dark
 * chip to sit on rather than being recoloured, because recolouring someone
 * else's logo is not ours to do. The other nine sit on a white chip. That is
 * the whole reason the rail is built from chips instead of bare images.
 */

export interface ClientMark {
  readonly name: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Light-on-transparent mark: give it a dark chip so it is visible. */
  readonly onDark: boolean;
}

export const clientMarks: readonly ClientMark[] = [
  { name: "Gulf Connect Consultancy", src: "/images/clients/gulf-connect-consultancy.webp", width: 480, height: 123, onDark: true },
  { name: "Country Kids", src: "/images/clients/country-kids.webp", width: 106, height: 67, onDark: true },
  { name: "Solar Spectrum", src: "/images/clients/solar-spectrum.webp", width: 520, height: 178, onDark: false },
  { name: "Alinkriti", src: "/images/clients/alinkriti.webp", width: 520, height: 180, onDark: true },
  { name: "Nexus Fundings", src: "/images/clients/nexus-fundings.webp", width: 155, height: 240, onDark: false },
  { name: "Aureus Hospitality", src: "/images/clients/aureus-hospitality.webp", width: 236, height: 240, onDark: true },
  { name: "High Spirits", src: "/images/clients/high-spirits.webp", width: 139, height: 240, onDark: false },
  { name: "HQB Pro Solutions", src: "/images/clients/hqb-pro-solutions.webp", width: 204, height: 122, onDark: false },
  { name: "The Menopause Relief Store", src: "/images/clients/menopause-relief-store.webp", width: 193, height: 103, onDark: false },
  { name: "SofiSam", src: "/images/clients/sofisam.webp", width: 520, height: 86, onDark: true },
  { name: "Mars Home Centre", src: "/images/clients/mars-home-centre.webp", width: 359, height: 181, onDark: true },
  { name: "Mobile Tyre Champions", src: "/images/clients/mobile-tyre-champions.webp", width: 149, height: 149, onDark: false },
  { name: "The Thali Tales", src: "/images/clients/the-thali-tales.webp", width: 240, height: 240, onDark: false },
  { name: "Cozy&Comfy", src: "/images/clients/cozy-and-comfy.webp", width: 182, height: 151, onDark: false },
  { name: "Yogshala", src: "/images/clients/yogshala.webp", width: 117, height: 139, onDark: false },
  { name: "Samrit", src: "/images/clients/samrit.webp", width: 248, height: 138, onDark: true },
  { name: "TIV", src: "/images/clients/tiv.webp", width: 180, height: 89, onDark: false },
  { name: "Mounting Backend Service", src: "/images/clients/mounting-backend-service.webp", width: 240, height: 56, onDark: false },
];

/**
 * Countable facts only.
 *
 * The previous MIDIS site claimed "15+ experts" while listing 8 people, and
 * "More than 25k Client Reviews". Neither was supportable. The two figures
 * below are counted from lists that exist: `clientMarks.length` and the six
 * projects in content/work.ts. Nothing else is asserted — no conversion
 * uplift, no ROI multiple, no years-in-business — because nothing else has
 * been verified. See docs/open-questions.md, item 5.
 */
export const verifiedCounts = {
  clientsNamed: clientMarks.length,
  projectsShown: 6,
} as const;
