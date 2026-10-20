import Image from "next/image";
import { Arrow } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { services, servicesSection } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 4 — Core services. Cinematic bento, 2026-10-20 revision.
 *
 * WHAT CHANGED AND WHY. MIDIS flagged the previous treatment as too dark:
 * a flat 45% charcoal wash sat over every photograph on top of a heavy
 * gradient, so the imagery read as texture rather than pictures. The flat
 * wash is GONE. Readability now comes from geography instead of murk — a
 * bottom-weighted gradient puts the text block on near-solid charcoal
 * while the upper half of every photograph shows through at full strength,
 * and the number chip at the top carries its own small dark backing. The
 * same six approved services, descriptions, CTAs and live midis.in
 * destinations are untouched.
 *
 * CARD ANATOMY. Top: a numbered chip ("01"–"06"). Middle: the photograph,
 * clearly visible. Bottom: accent rule, heading, description, Explore link
 * — the hierarchy the brief specifies, built with flex column
 * justify-between so the image owns everything between chip and text.
 *
 * ENTRANCES, VARIED BUT COORDINATED. The card itself keeps the alternating
 * side entrance (left card from the left, right card from the right,
 * falling back to a rise below `lg`); the PHOTOGRAPH opens separately
 * through a soft clip window with a slight lag (see "Services bento" in
 * globals.css), so a card assembles — frame, then image, with the featured
 * card leading its row. All of it collapses to an instant swap under
 * reduced motion.
 *
 * HOVER CHOREOGRAPHY (pointer devices): image scales and brightens,
 * heading lifts 3px, the orange accent rule draws in, the Explore arrow
 * nudges (the whole card is group/btn), and the ring warms toward accent.
 * No hover shadow — the brief now rules out large shadows outright. The
 * existing TiltCard supplies the restrained 5° perspective tilt and the
 * cursor sheen.
 *
 * CONTRAST. White text sits only where the gradient has reached ≥ ~0.75
 * charcoal, so the floor holds across all six photographs without a flat
 * wash. The orange CTA is --color-accent, correct HERE because the surface
 * beneath it is near-charcoal (7.26:1), not paper.
 *
 * ALT TEXT. The photographs are decorative — each card already states its
 * service in text. They render with an empty alt and aria-hidden;
 * `imageSubject` stays in the content file so the choice is reviewable.
 */

/**
 * Bento spans and heights.
 *
 * Desktop: three row shapes — 7/5, 5/7, 6/6 — with the featured card
 * widest and tallest. Tablet (`sm`–`lg`): two columns, with the first and
 * last cards spanning both so six cards make four full rows and nothing
 * trails off ragged. Phone: one column, heights content-driven above a
 * 14rem floor so no card pads itself with empty photograph.
 */
const BENTO = [
  {
    span: "sm:col-span-2 lg:col-span-7",
    height: "min-h-[15rem] sm:min-h-[26rem]",
    featured: true,
  },
  { span: "lg:col-span-5", height: "min-h-[14rem] sm:min-h-[26rem]", featured: false },
  { span: "lg:col-span-5", height: "min-h-[14rem] sm:min-h-[22rem]", featured: false },
  { span: "lg:col-span-7", height: "min-h-[14rem] sm:min-h-[22rem]", featured: false },
  { span: "lg:col-span-6", height: "min-h-[14rem] sm:min-h-[21rem]", featured: false },
  {
    span: "sm:col-span-2 lg:col-span-6",
    height: "min-h-[14rem] sm:min-h-[21rem]",
    featured: false,
  },
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
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12">
          {services.map((service, index) => {
            const bento = BENTO[index];

            return (
              <Reveal
                as="li"
                key={service.slug}
                /*
                  Alternating entrance direction: the left card of each row
                  enters from the left, the right card from the right, so the
                  bento assembles rather than fading in as a block. Both fall
                  back to a vertical rise below `lg` (globals.css). The
                  featured card leads; its row-mate follows.
                */
                variant={index % 2 === 0 ? "side-left" : "side-right"}
                delay={index === 0 ? 0 : (index % 2) * 90 + 50}
                className={cn(bento.span, "service-reveal group")}
              >
                <TiltCard className="h-full">
                  <a
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "service-card group/btn relative flex h-full flex-col justify-between overflow-hidden",
                      "rounded-[var(--radius-card-lg)] p-5 sm:p-7",
                      "ring-1 transition-[--tw-ring-color] duration-[var(--dur-base)]",
                      /* The featured card wears a quiet orange ring at rest —
                         its distinctive treatment besides sheer size. */
                      bento.featured
                        ? "ring-accent/30 hover:ring-accent/60"
                        : "ring-fg/10 hover:ring-accent/45",
                      bento.height,
                      "text-white",
                    )}
                  >
                    {/* ---- photograph ----
                        The wrap is the reveal's soft clip window AND the
                        hover zoom surface; the drift animation owns the
                        img's own transform, so the two never fight. */}
                    <div aria-hidden="true" className="service-media-wrap absolute inset-0">
                      <Image
                        src={service.image}
                        alt=""
                        width={1600}
                        height={1000}
                        loading="lazy"
                        sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 92vw"
                        className="service-img media-drift absolute inset-0 size-full scale-[1.06] object-cover"
                      />
                      {/*
                        THE ONLY OVERLAY — bottom-weighted, nothing flat.
                        The top of the image is effectively untouched and
                        the charcoal only builds where the text sits. Two
                        curves live in globals.css: phones get a stronger
                        mid-zone because the text block fills more of the
                        compact card; from `sm` the lighter cinematic curve
                        takes over.
                      */}
                      <div className="service-scrim absolute inset-0" />
                    </div>

                    {/* Cursor-following highlight, above the image and below
                        the text. Desktop pointers only. */}
                    <span aria-hidden="true" className="tilt-sheen" />

                    {/* ---- top: the number chip ---- */}
                    <span className="relative z-10 inline-flex self-start items-center rounded-full border border-white/20 bg-[rgb(10_11_13/0.55)] px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-white/90">
                      0{index + 1}
                    </span>

                    {/* ---- bottom: the message ----
                        `tilt-lift` pushes it off the card face on the Z axis
                        so the tilt has real depth. */}
                    <div className="tilt-lift relative z-10 pt-10">
                      <span aria-hidden="true" className="service-accent" />
                      <h3
                        className={cn(
                          "font-semibold leading-snug",
                          bento.featured
                            ? "text-2xl sm:text-[2rem]"
                            : "text-xl sm:text-2xl",
                        )}
                      >
                        {service.name}
                      </h3>
                      <p className="mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-white/85">
                        {service.description}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
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
