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
 * No dark band (MIDIS, 2026-10-28): the section sits on the shared page
 * background like every other, so the page reads as one continuous
 * landing page. The featured package keeps MIDIS's charcoal as a card.
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
    <Section id="pricing" tone="paper" labelledBy="pricing-heading">
      <SectionHeader
        eyebrow="Investment"
        heading={pricing.headline}
        headingId="pricing-heading"
        sub={pricing.subheadline}
        aside={
          <Button href={pricing.cta.href} size="lg">
            {pricing.cta.label}
            <Arrow />
          </Button>
        }
      />

      {/* ================= the package grid ================= */}
      <div className="container-wide mt-[var(--space-block)]">
        <ul className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <Reveal
              as="li"
              key={tier.name}
              variant="card3d"
              delay={index * 90}
              className="h-full"
            >
              {/* On the shared page background (2026-10-28; the section was
                  a full-width charcoal band): the standard packages are
                  light cards, the featured one a charcoal card with an
                  orange edge — MIDIS's charcoal kept inside the component. */}
              <article
                className={cn(
                  "flex h-full flex-col rounded-[1.25rem] border p-6 sm:p-8",
                  "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]",
                  "lg:hover:-translate-y-1.5 lg:hover:shadow-[0_28px_60px_-34px_rgba(20,21,24,0.35)]",
                  "motion-reduce:transition-none motion-reduce:lg:hover:translate-y-0",
                  tier.featured
                    ? "on-dark border-accent/60 bg-ink text-white hover:border-accent"
                    : "border-line bg-surface hover:border-fg/20",
                )}
              >
                <h3 className={cn("text-xl font-semibold leading-snug", tier.featured ? "text-white" : "text-fg")}>
                  {tier.name}
                </h3>
                <p className={cn("mt-2.5 text-[0.9375rem] leading-relaxed", tier.featured ? "text-muted-dark" : "text-muted")}>
                  {tier.description}
                </p>

                {/* ---- the price slot ----
                    Where the reference shows a figure, this says plainly how
                    MIDIS prices — see the note at the top of this file. */}
                <div className={cn("mt-6 border-y py-5", tier.featured ? "border-white/10" : "border-line")}>
                  <p className={cn("font-display text-2xl font-semibold", tier.featured ? "text-white" : "text-fg")}>
                    {tier.priceLabel}
                  </p>
                  <p className={cn("mt-1 text-xs leading-relaxed", tier.featured ? "text-muted-dark" : "text-muted")}>
                    {tier.priceNote}
                  </p>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.scope.map((line) => (
                    <li
                      key={line}
                      className={cn(
                        "flex items-start gap-2.5 text-sm leading-relaxed",
                        tier.featured ? "text-white/85" : "text-fg/85",
                      )}
                    >
                      <Check />
                      {line}
                    </li>
                  ))}
                </ul>

                <Button
                  href={pricing.cta.href}
                  size="lg"
                  variant={tier.featured ? "primary" : "secondary"}
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
          <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-relaxed text-muted">
            {pricingTiersNote}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
