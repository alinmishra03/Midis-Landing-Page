import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import {
  pricing,
  pricingTiers,
  pricingTiersNote,
} from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 8 — Pricing and project scope.
 *
 * THE PACKAGE GRID, FROM MIDIS.pdf PAGE 11. The PDF's visual reference
 * for this section is a pricing-package page: a prominent multi-column
 * composition with a clear plan hierarchy. That STRUCTURE is reproduced here — three columns on
 * desktop, the middle one emphasised, a stacked single column on a phone
 * (the reference's own mobile treatment is one card per view; squeezing
 * three columns into 360px is ruled out).
 *
 * WITHOUT PRICES, AND NOT BECAUSE THE SECTION IS UNFINISHED. MIDIS has no
 * published, confirmed rate card, the brief forbids inventing one, and
 * MIDIS's own FAQ directly below says cost "depends on the size and
 * complexity of your project". So the price slot carries "Tailored
 * estimate" and each card routes to the estimator — the PDF's approved
 * CTA for this section. The tiers are the PDF's own project types, not
 * invented package brands; see content/sections.ts for provenance.
 *
 * The "What moves the number" cost-factor cards that sat beneath the grid
 * were removed on MIDIS's instruction, 2026-10-28.
 *
 * The dark band is deliberate. It separates this section from the FAQ
 * accordion directly beneath it, and it gives the final CTA something to
 * build on rather than arriving as the page's only dark moment.
 */

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="15"
      height="15"
      aria-hidden="true"
      className="mt-1 shrink-0 text-accent"
    >
      <path
        d="M3.4 8.4l3 3 6.2-6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pricing() {
  return (
    <Section
      id="pricing"
      tone="ink"
      labelledBy="pricing-heading"
      className="overflow-hidden"
    >
      {/* The wash the glass cards blur against. Two very soft orange pools,
          drifting slowly. Decorative, so it is hidden from assistive tech
          and stops entirely under reduced motion. */}
      <div
        aria-hidden="true"
        className="ambient pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(48rem 32rem at 12% 8%, rgba(239,135,22,0.16), transparent 60%), radial-gradient(42rem 30rem at 88% 92%, rgba(239,135,22,0.10), transparent 62%)",
        }}
      />
      <SectionHeader
        className="relative z-10"
        eyebrow="Investment"
        heading={pricing.headline}
        headingId="pricing-heading"
        sub={pricing.subheadline}
        tone="ink"
        aside={
          <Button href={pricing.cta.href} size="lg">
            {pricing.cta.label}
            <Arrow />
          </Button>
        }
      />

      {/* ================= the package grid ================= */}
      <div className="container-wide relative z-10 mt-[var(--space-block)]">
        <ul className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <Reveal
              as="li"
              key={tier.name}
              variant="card3d"
              delay={index * 90}
              className="h-full"
            >
              <article
                className={cn(
                  "glass-dark flex h-full flex-col rounded-[1.25rem] p-6 sm:p-8",
                  "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]",
                  "lg:hover:-translate-y-1.5 lg:hover:shadow-[0_32px_70px_-32px_rgba(0,0,0,0.65)]",
                  "motion-reduce:transition-none motion-reduce:lg:hover:translate-y-0",
                  tier.featured
                    ? "border-accent/45 bg-accent/[0.07] hover:border-accent/70"
                    : "hover:border-white/25",
                )}
              >
                <h3 className="text-xl font-semibold leading-snug text-white">
                  {tier.name}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-dark">
                  {tier.description}
                </p>

                {/* ---- the price slot ----
                    Where the reference shows a figure, this says plainly how
                    MIDIS prices — see the note at the top of this file. */}
                <div className="mt-6 border-y border-white/10 py-5">
                  <p className="font-display text-2xl font-semibold text-white">
                    {tier.priceLabel}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-dark">
                    {tier.priceNote}
                  </p>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.scope.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-white/85"
                    >
                      <Check />
                      {line}
                    </li>
                  ))}
                </ul>

                <Button
                  href={pricing.cta.href}
                  size="lg"
                  variant={tier.featured ? "primary" : "onDark"}
                  className="mt-8 w-full"
                >
                  {pricing.cta.label}
                  <Arrow />
                </Button>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* The policy the grid stands on, stated rather than implied. */}
        <Reveal delay={120}>
          <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-relaxed text-muted-dark">
            {pricingTiersNote}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
