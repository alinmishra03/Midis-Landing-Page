import Image from "next/image";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { trust } from "@/content/sections";
import { showcaseClients, type Client } from "@/content/clients";
import { cn } from "@/lib/utils";

/**
 * SECTION 2 — Trust & credibility. PREMIUM CLIENT SHOWCASE, 2026-10-22
 * (full redesign on MIDIS's brief; replaces the black chessboard
 * LogoBoard of 2026-10-14).
 *
 * WHAT CHANGED. The dark checkerboard is gone. In its place: the same
 * editorial header (heading left, approved paragraph right), then a
 * fine labelled divider and a light hairline grid of client marks —
 * separators drawn by 1px gaps over the line colour, each logo centred
 * in its own quiet cell. The logos are the focus; nothing competes.
 *
 * WHO APPEARS. Only clients whose official website was verified LIVE in
 * the 2026-10-22 audit and whose entry is approved — nine today. The
 * full list, the audit results and the display switch live in
 * content/clients.ts; clients whose sites could not be verified are
 * flagged there, not guessed at, and their assets are kept for when
 * MIDIS confirms. Adding future logos means adding entries there —
 * this component renders whatever that list approves.
 *
 * VISUAL WEIGHT, NOT UNIFORM WIDTH. Each mark's display height comes
 * from its own aspect ratio (wide wordmarks sit shorter than square
 * emblems), so no logo dominates and none is stretched — aspect ratios
 * are always the asset's own.
 *
 * NO BOXES, NO CHIPS (MIDIS instruction, 2026-10-22). Every mark sits
 * directly on the section background in an open, centred wall — no
 * cell borders, no backgrounds, no shadows. Visibility across themes
 * comes from per-theme ASSETS instead: each client renders its light
 * asset and, where one exists, its dark asset, and one line of CSS
 * shows the right one for the active theme (see content/clients.ts,
 * THEME VARIANTS, for exactly how each variant was derived — brand
 * accents kept, no CSS filters anywhere).
 *
 * MOBILE (MIDIS brief, 2026-10-23). Below `md` the wall is a compact
 * three-column grid with smaller marks, 11px names and tighter spacing,
 * every logo visible (no "View All" cut — MIDIS declined it). Every phone
 * value is a base class with the previous value kept at `md:` — so from
 * 768px up the section is unchanged.
 *
 * LOGOS ARE NOT LINKS, deliberately: the section builds trust, it does
 * not send visitors away.
 */

/** Display height CAP from the mark's own proportions. Max constraints
    only, with both dimensions auto — the browser then always resolves a
    replaced element aspect-preserving, so a wide mark in a narrow phone
    slot scales down instead of squashing against the width limit. */
function logoHeight(logo: NonNullable<Client["logo"]>) {
  const ratio = logo.width / logo.height;
  if (ratio >= 3.2) return "max-h-5 md:max-h-8"; // wide wordmarks
  if (ratio >= 1.6) return "max-h-8 md:max-h-12"; // landscape marks
  return "max-h-11 md:max-h-16"; // square-ish emblems
}

export function Trust() {
  return (
    /*
      The bottom padding is halved (and Work halves its top to match), so
      the gap between the showcase and "Our Work" is ONE section-padding
      instead of two stacked ones — MIDIS flagged the doubled gap as
      excessive (2026-10-20).
    */
    <Section
      id="trust"
      tone="surface"
      labelledBy="trust-heading"
      className="pb-[calc(var(--space-section)*0.5)]"
    >
      <div className="container-site">
        {/* Heading and description stacked at every width, the description
            directly under the heading on the same left edge (MIDIS,
            2026-10-24 — it used to sit in a right-hand column from lg).
            Spacing and measure match SectionHeader's sub. */}
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow className="mb-3 md:mb-5">Trusted by</Eyebrow>
          </Reveal>
          <RevealText
            id="trust-heading"
            delay={60}
            className="text-[length:var(--text-display-md)] leading-[1.06]"
          >
            {trust.headline}
          </RevealText>

          <Reveal delay={120}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {trust.content}
            </p>
          </Reveal>
        </div>

        {/* ---- the labelled divider (no counter, MIDIS 2026-10-22) ---- */}
        <Reveal className="mt-7 md:mt-12">
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">
              Brands we&rsquo;ve worked with
            </p>
            <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-line" />
          </div>
        </Reveal>

        {/* ---- the showcase: an open wall, marks straight on the ground ----
            flex + justify-center rather than a grid, so ANY roster count
            centres its last row instead of leaving it ragged. Slot widths
            are (track − its share of the gaps): 3 from md, 5 from lg.
            Phones get a plain three-column grid instead (15 marks fill it
            exactly).

            LOGO, THEN NAME (MIDIS 2026-10-22). Every slot is a column: a
            FIXED-height logo area (the mark centred in it at its own
            aspect), then the client's name. Because the logo area is the
            same height everywhere, every name in a row starts at the same
            line whatever the mark's shape. The visible name labels the
            mark, so the images carry empty alt text — a screen reader
            hears the name once, not "X logo, X". */}
        <ul
          className={cn(
            "mt-5 grid grid-cols-3 gap-x-2.5 gap-y-5",
            "md:mt-10 md:flex md:flex-wrap md:items-start md:justify-center md:gap-x-10 md:gap-y-11",
          )}
          aria-label="Clients"
        >
          {showcaseClients.map((client, index) => (
            <Reveal
              key={client.name}
              as="li"
              delay={60 + index * 55}
              className={cn(
                "group flex min-w-0 flex-col items-center",
                "md:w-[calc(33.333%-1.667rem)] lg:w-[calc(20%-2rem)]",
              )}
            >
              <span className="flex h-12 w-full items-center justify-center md:h-[5.25rem]">
                <Image
                  src={client.logo.src}
                  alt=""
                  width={client.logo.width}
                  height={client.logo.height}
                  loading="lazy"
                  sizes="200px"
                  className={cn(
                    "h-auto w-auto max-w-full",
                    "transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                    "group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none",
                    logoHeight(client.logo),
                    client.logoDark && "theme-logo-light",
                  )}
                />
                {client.logoDark ? (
                  <Image
                    src={client.logoDark.src}
                    alt=""
                    width={client.logoDark.width}
                    height={client.logoDark.height}
                    loading="lazy"
                    sizes="200px"
                    className={cn(
                      "theme-logo-dark h-auto w-auto max-w-full",
                      "transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                      "group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none",
                      logoHeight(client.logoDark),
                    )}
                  />
                ) : null}
              </span>
              <span className="mt-1.5 text-balance text-center text-[0.6875rem] font-medium leading-[1.3] text-muted transition-colors duration-[var(--dur-fast)] group-hover:text-accent-ink md:mt-3.5 md:text-[0.8125rem] md:leading-[1.4] md:text-fg">
                {client.name}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
