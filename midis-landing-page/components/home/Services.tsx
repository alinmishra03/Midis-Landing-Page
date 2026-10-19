import Image from "next/image";
import { Arrow } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { services, servicesSection } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 4 — Core services.
 *
 * NOT SIX IDENTICAL CARDS. The brief rules that out explicitly, so the six
 * sit on a 12-column grid at three different widths — 7/5, 5/7, 6/6 — which
 * gives the block an editorial rhythm and lets the two development services
 * carry more weight than the rest without any of them being demoted to a
 * footnote.
 *
 * CONTRAST ON IMAGE-BACKED CARDS. Each card is a photograph under a dark
 * scrim, with white text. That is the one arrangement that holds its
 * contrast across twenty-three different photographs: the scrim is opaque
 * enough at the bottom (0.94) that the text is effectively sitting on
 * charcoal, and the photograph reads through the top half where no text
 * goes. Putting dark text on a light photograph would mean re-checking
 * contrast for every image individually, and failing on at least one.
 *
 * The orange CTA is --color-accent, which is correct HERE because the
 * surface beneath it is near-charcoal (7.26:1), not paper. The same colour
 * as text on the white section background would be 2.55:1.
 *
 * ALT TEXT. The photographs are decorative — each card already states its
 * service in text, so announcing "sketchpad of interface wireframes" before
 * the heading "UI/UX Design" is noise. They render with an empty alt and
 * aria-hidden. `imageSubject` is kept in the content file so the choice
 * stays reviewable in a diff.
 */

/**
 * Bento spans and heights.
 *
 * Three different row shapes — 7/5, 5/7, 6/6 — and two card heights, so the
 * grid reads as a composed bento rather than six identical tiles. The first
 * card is the featured one: widest row position and tallest box, which is
 * what makes Website Design & Development the entry point by layout rather
 * than by a label saying so.
 */
/*
 * HEIGHTS ARE A MOBILE FLOOR AND A DESKTOP SHAPE, NOT A FIXED SIZE.
 *
 * On a phone every card is one column, so its height should follow its
 * content — a tall fixed box just pads the card with empty photograph and
 * makes the page longer without saying more.
 *
 * The mobile floor is 14rem, not 17: at 17rem all six cards measured
 * identical 272px boxes with 13–65px of dead space, which means the floor
 * was setting every height and the content was setting none. At 14rem the
 * cards land between 224px and 260px — the floor only catches the shortest
 * card, and the longer descriptions actually grow their card.
 *
 * From `sm` the differing heights become the bento's shape, which is what
 * stops six cards looking like six identical tiles.
 */
const BENTO = [
  { span: "lg:col-span-7", height: "min-h-[14rem] sm:min-h-[26rem]", featured: true },
  { span: "lg:col-span-5", height: "min-h-[14rem] sm:min-h-[26rem]", featured: false },
  { span: "lg:col-span-5", height: "min-h-[14rem] sm:min-h-[22rem]", featured: false },
  { span: "lg:col-span-7", height: "min-h-[14rem] sm:min-h-[22rem]", featured: false },
  { span: "lg:col-span-6", height: "min-h-[14rem] sm:min-h-[21rem]", featured: false },
  { span: "lg:col-span-6", height: "min-h-[14rem] sm:min-h-[21rem]", featured: false },
] as const;

export function Services() {
  return (
    <Section id="services" tone="surface" labelledBy="services-heading">
      <SectionHeader
        eyebrow="What we do"
        heading={servicesSection.headline}
        headingId="services-heading"
        sub={servicesSection.subheadline}
      />

      {/* The grid sits in the WIDE container while the header above stays in
          the text measure — so the composition reads as expansive without
          the heading running the width of a 1920px display. */}
      <div className="container-wide mt-[var(--space-block)]">
        <ul className="grid gap-4 sm:gap-5 lg:grid-cols-12">
          {services.map((service, index) => {
            const bento = BENTO[index];

            return (
              <Reveal
                as="li"
                key={service.slug}
                /*
                  Alternating entrance direction: the left card of each row
                  enters from the left, the right card from the right, so the
                  bento assembles rather than fading in as a block.

                  Both variants fall back to a vertical rise below `lg`
                  (globals.css) — on a single-column phone layout there is no
                  "side" for a card to come from, and a horizontal translate
                  there would push past the viewport.
                */
                variant={index % 2 === 0 ? "side-left" : "side-right"}
                /* Staggered by position in the row, not absolute index, so
                   the two cards of a row arrive together-ish rather than the
                   sixth waiting half a second behind the first. */
                delay={(index % 2) * 90}
                className={cn(bento.span, "group")}
              >
                <TiltCard className="h-full">
                  <a
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "relative flex h-full flex-col justify-end overflow-hidden",
                      "rounded-[var(--radius-card-lg)] p-6 sm:p-8",
                      "ring-1 ring-fg/10 transition-[box-shadow,--tw-ring-color] duration-[var(--dur-base)]",
                      "hover:ring-accent/40 hover:shadow-[0_28px_60px_-28px_rgba(20,21,24,0.6)]",
                      bento.height,
                      "text-white",
                    )}
                  >
                    {/* ---- photograph ----
                        `media-drift` parallaxes it inside the card off the
                        scroll timeline (CSS only, no listener). The hover
                        zoom is a separate, faster response to intent. */}
                    <Image
                      src={service.image}
                      alt=""
                      aria-hidden="true"
                      width={1600}
                      height={1000}
                      loading="lazy"
                      sizes="(min-width: 1024px) 50vw, 92vw"
                      className="media-drift absolute inset-0 size-full scale-[1.06] object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.1]"
                    />

                    {/* ---- scrim ----
                        A flat wash guaranteeing a contrast floor across the
                        whole card, plus a bottom-weighted gradient that puts
                        the text on near-solid charcoal. This is why white
                        type holds up over six different photographs. */}
                    <div aria-hidden="true" className="absolute inset-0 bg-ink/45" />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(20,21,24,0.94) 0%, rgba(20,21,24,0.82) 32%, rgba(20,21,24,0.30) 70%, rgba(20,21,24,0.12) 100%)",
                      }}
                    />

                    {/* Cursor-following highlight, above the scrim and below
                        the text. Desktop pointers only. */}
                    <span aria-hidden="true" className="tilt-sheen" />

                    {/* ---- content ----
                        `tilt-lift` pushes it off the card face on the Z axis
                        so the tilt has real depth rather than looking like a
                        rotating photograph. */}
                    <div className="tilt-lift relative z-10">
                      <h3
                        className={cn(
                          "font-semibold leading-snug",
                          bento.featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
                        )}
                      >
                        {service.name}
                      </h3>
                      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-white/80">
                        {service.description}
                      </p>
                      <span className="group/btn mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                        <span className="link-underline">{service.cta}</span>
                        <Arrow />
                      </span>
                    </div>
                  </a>
                </TiltCard>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
