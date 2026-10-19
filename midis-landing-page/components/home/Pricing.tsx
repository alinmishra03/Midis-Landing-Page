import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { pricing, pricingFactors } from "@/content/sections";

/**
 * SECTION 8 — Pricing and project scope.
 *
 * NO PRICES, AND NOT BECAUSE THE SECTION IS UNFINISHED.
 *
 * MIDIS has no published, confirmed rate card. The brief forbids inventing
 * package prices, and MIDIS's own position — in the FAQ immediately below
 * this section — is that cost "depends on the size and complexity of your
 * project". A tier table with invented numbers would contradict the answer
 * sitting 200 pixels further down the page.
 *
 * So the section does the useful version of the job: it names the five
 * things that actually move the number, which is what lets a visitor
 * self-qualify before they enquire, and routes them to the estimator. The
 * five factors are the PDF's own subheadline, broken out.
 *
 * The dark band is deliberate. It separates this section from the FAQ
 * accordion directly beneath it, which is otherwise a lot of uninterrupted
 * light grey, and it gives the final CTA something to build on rather than
 * arriving as the page's only dark moment.
 */

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

      {/*
        Glass earns its place HERE specifically. These cards sit on the dark
        band over the accent wash below, so there is genuinely something
        behind them to blur — unlike a card on flat paper, where
        backdrop-filter costs a compositor layer and renders as a plain
        translucent rectangle.
      */}
      <div className="container-wide relative z-10 mt-[var(--space-block)]">
        {/*
          `factor-grid` carries the shared perspective the card entrances
          rotate around, and the `lg`-only stagger. Mobile gap is 14px —
          close enough to read as one stack, open enough that two cards are
          never mistaken for one.
        */}
        <ol className="factor-grid grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {pricingFactors.map((factor) => (
            <Reveal
              as="li"
              key={factor.number}
              variant="card3d"
              /*
                No per-card delay. Each card has its own observer, so on a
                phone it animates when IT arrives — which is the one-by-one
                reveal. The stagger is reapplied from `lg` in CSS, where
                several cards enter together.
              */
              className="group/card"
            >
              <div className="factor-card glass-dark h-full rounded-[1.25rem] p-5 sm:p-7">
                <span
                  aria-hidden="true"
                  className="factor-number font-display text-sm font-semibold tabular-nums text-accent"
                >
                  {factor.number}
                </span>
                <h3 className="mt-3.5 text-lg font-semibold leading-snug text-white">
                  {factor.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-dark">
                  {factor.body}
                </p>
              </div>
            </Reveal>
          ))}

          {/*
            The sixth cell completes the 3x2 grid rather than leaving a hole,
            and it carries the honest statement the section is built on.
          */}
          <Reveal as="li" variant="card3d">
            <div className="factor-card glass-dark flex h-full flex-col justify-center rounded-[1.25rem] border-accent/25 bg-accent/[0.07] p-5 sm:p-7">
              <p className="text-[0.9375rem] leading-relaxed text-white/90">
                We scope a project before quoting it, and the proposal breaks
                down what drives the number — so you can adjust the scope
                rather than guess at the price.
              </p>
              <a
                href={pricing.cta.href}
                className="group/btn mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
              >
                <span className="link-underline">Start with the estimator</span>
                <Arrow />
              </a>
            </div>
          </Reveal>
        </ol>
      </div>
    </Section>
  );
}
