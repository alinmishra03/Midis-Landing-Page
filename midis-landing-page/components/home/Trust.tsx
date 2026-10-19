import Image from "next/image";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { trust } from "@/content/sections";
import { clientMarks } from "@/content/clients";
import { cn } from "@/lib/utils";

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
 * WHY CHIPS. Nine of these marks are light-on-transparent, drawn for a dark
 * header. On this white band they would be invisible. Each one therefore
 * sits on a chip whose background is chosen per mark — dark for a light
 * logo, white for a dark one — rather than being recoloured, filtered or
 * inverted. Recolouring someone else's logo is not ours to do, and a
 * `filter: invert()` would wreck any mark that is not monochrome.
 *
 * MOTION. A CSS marquee, paused on hover and on focus-within so a visitor
 * can actually look at a mark they recognise. Under `prefers-reduced-motion`
 * the animation is dropped and the track wraps into a static grid (see
 * globals.css) — the duplicate set hides itself so nothing reads twice.
 */

function LogoChip({ mark }: { mark: (typeof clientMarks)[number] }) {
  return (
    <div
      className={cn(
        "group/logo flex h-20 w-44 shrink-0 items-center justify-center rounded-xl px-6",
        "transition-[box-shadow] duration-[var(--dur-base)]",
        /*
          THE CHIP DOES NOT FOLLOW THE THEME, DELIBERATELY.

          `onDark` means the mark is light-on-transparent. Such a mark needs
          a dark chip in BOTH themes, and a dark mark needs a light chip in
          both — if the chip flipped with the page, half of these logos would
          disappear on one theme or the other. Recolouring or inverting
          someone else's logo to avoid that is not ours to do.

          The two chip classes are therefore fixed colours (globals.css), and
          only the hover shadow is shared.
        */
        mark.onDark
          ? "logo-chip-dark hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]"
          : "logo-chip-light hover:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.28)]",
      )}
    >
      <Image
        src={mark.src}
        alt={mark.name}
        width={mark.width}
        height={mark.height}
        loading="lazy"
        /*
          Every mark is normalised into the same optical box regardless of
          its native aspect ratio, so a tall logo and a wide one carry equal
          visual weight instead of one dominating the rail.
        */
        className="max-h-10 w-auto max-w-full object-contain opacity-90 transition-opacity duration-[var(--dur-base)] group-hover/logo:opacity-100"
      />
    </div>
  );
}

export function Trust() {
  /* Two identical tracks; the loop translates by exactly -50% of the pair. */
  const track = [...clientMarks];

  return (
    <Section id="trust" tone="surface" labelledBy="trust-heading">
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
      </div>

      {/*
        Full-bleed rail. It sits outside `container-site` on purpose: a
        marquee that stops at the container edge reads as a broken grid,
        whereas one that runs off both edges reads as continuing.
      */}
      <Reveal
        delay={140}
        className="marquee relative mt-[var(--space-block)] overflow-hidden"
      >
        {/* Fades the cut at both ends so logos enter and leave rather than
            being sliced. Pointer-events off so it never blocks a hover. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-surface to-transparent sm:w-28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-surface to-transparent sm:w-28"
        />

      {/*
        ONE track holding the set twice, translated by -50% — which is
        exactly one set, so the loop is seamless.

        The spacing is `pr-4` on each item rather than a flex `gap`. With a
        gap, the track's width is `2·set + (2n−1)·gap`, so half of it is
        half a gap short of one set and the loop jumps every cycle. Folding
        the spacing into the item makes each set exactly `n·(chip + 16px)`
        and -50% lands precisely on the seam.
      */}
        <ul
          className="marquee-track"
          style={{ "--marquee-duration": "72s" } as React.CSSProperties}
        >
          {track.map((mark) => (
            <li key={mark.name} className="pr-4">
              <LogoChip mark={mark} />
            </li>
          ))}
          {/* The duplicate half. Hidden from assistive tech so the client
              list is announced once, not twice. */}
          {track.map((mark) => (
            <li key={`${mark.name}-dup`} aria-hidden="true" className="pr-4">
              <LogoChip mark={mark} />
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
