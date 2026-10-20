import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { trust } from "@/content/sections";
import { LogoBoard } from "./LogoBoard";

/**
 * SECTION 2 — Trust & credibility.
 *
 * WHAT IS HERE, AND WHAT IS NOT. Eighteen authentic client marks, each the
 * client's own logo. There are no partner badges, no certifications, no
 * award marks and no performance metrics, because none has been verified —
 * MIDIS.pdf's own developer note for this section reads "Do not publish
 * unverified claims", and the brief forbids placeholder brands outright.
 * The logos are the evidence; nothing is added to pad the section out.
 *
 * THE BLACK CHESSBOARD. A seamless grid of dark tiles in two alternating
 * charcoals — a checkerboard of position, not of content, so the pattern
 * is computed per layout in CSS and stays correct everywhere. From 768px
 * up every tile is visible at once in a static board. Below 768px the same
 * tiles flow into exactly three rows that scroll horizontally — native
 * swiping with a progress hint, not a carousel: nothing moves on its own,
 * nothing loops, nothing is duplicated. The board stays dark in BOTH
 * themes deliberately. See LogoBoard.tsx and "Client logo board" in
 * globals.css.
 *
 * NAMES, NOT JUST MARKS. Each tile carries the client's verified name from
 * clients.ts. On hover-capable devices it reveals from the tile's lower
 * edge over a dark gradient; on touch devices it is simply printed beneath
 * the logo, because a hover reveal a visitor cannot trigger is a name they
 * never see.
 */
export function Trust() {
  return (
    /*
      The bottom padding is halved (and Work halves its top to match), so
      the gap between the logo board and "Our Work" is ONE section-padding
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
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

        <LogoBoard />
      </div>
    </Section>
  );
}
