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
 * LOGOS ARE NOT LINKS, deliberately: the section builds trust, it does
 * not send visitors away.
 */

/** Display height CAP from the mark's own proportions. Max constraints
    only, with both dimensions auto — the browser then always resolves a
    replaced element aspect-preserving, so a wide mark in a narrow phone
    slot scales down instead of squashing against the width limit. */
function logoHeight(logo: NonNullable<Client["logo"]>) {
  const ratio = logo.width / logo.height;
  if (ratio >= 3.2) return "max-h-7 sm:max-h-8"; // wide wordmarks
  if (ratio >= 1.6) return "max-h-10 sm:max-h-12"; // landscape marks
  return "max-h-14 sm:max-h-16"; // square-ish emblems
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow className="mb-5">Trusted by</Eyebrow>
            </Reveal>
            <RevealText
              id="trust-heading"
              delay={60}
              className="text-[length:var(--text-display-md)] leading-[1.06]"
            >
              {trust.headline}
            </RevealText>
          </div>

          <Reveal delay={120}>
            <p className="text-base leading-relaxed text-muted sm:text-lg lg:pt-2">
              {trust.content}
            </p>
          </Reveal>
        </div>

        {/* ---- the labelled divider ---- */}
        <Reveal className="mt-10 sm:mt-12">
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">
              Selected clients
            </p>
            <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-line" />
            <p
              className="font-display text-sm font-semibold tabular-nums text-muted"
              aria-label={`${showcaseClients.length} clients shown`}
            >
              {String(showcaseClients.length).padStart(2, "0")}
            </p>
          </div>
        </Reveal>

        {/* ---- the showcase: an open wall, marks straight on the ground ----
            flex + justify-center rather than a grid, so ANY roster count
            centres its last row instead of leaving it ragged. Slot widths
            are (track − its share of the gaps): 2 per row on phones,
            3 from sm, 5 from lg. */}
        <ul
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-10 sm:mt-10 sm:gap-x-10 sm:gap-y-12"
          aria-label="Client logos"
        >
          {showcaseClients.map((client, index) => (
            <Reveal
              key={client.name}
              as="li"
              delay={60 + index * 55}
              className={cn(
                "group flex items-center justify-center",
                "w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.667rem)] lg:w-[calc(20%-2rem)]",
              )}
            >
              <Image
                src={client.logo.src}
                alt={`${client.name} logo`}
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
                  alt={`${client.name} logo`}
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
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
