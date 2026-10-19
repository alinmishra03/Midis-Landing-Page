import { Arrow, Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { finalCta } from "@/content/sections";
import { site, whatsappHref } from "@/content/site";

/**
 * SECTION 10 — Final conversion CTA.
 *
 * A centred editorial composition carried entirely by typography, spacing
 * and light. There is deliberately NO card, no mockup, no illustration, no
 * background lettering and no second column — the headline is the whole
 * visual, and everything else exists to point at the two buttons.
 *
 * WHY THE HEADLINE IS WRITTEN AS TWO EXPLICIT LINES. `RevealText` measures a
 * heading and splits it on the browser's own wrap, but it only does that for
 * a single text node — it refuses anything containing markup, because
 * rebuilding would destroy it. This headline needs markup: the second line
 * carries the gradient treatment. So the two lines are authored here and
 * masked with the same `.reveal-line` mechanism the automatic splitter uses,
 * which keeps the motion identical to every other heading on the page.
 *
 * The whitespace between the two line spans is load-bearing: without it the
 * heading's `textContent` reads "Ready to BuildSomething Better?", which is
 * what a screen reader announces and a crawler indexes. `.reveal-line` is
 * `display: block`, so it collapses and never renders.
 *
 * CONTRAST. White on #141518 is 15.8:1. The accent gradient runs white to
 * #EF8716, which is 7.26:1 at its orange end, so the treatment never costs
 * legibility — and an `@supports` fallback paints solid accent rather than
 * transparent text where `background-clip: text` is unavailable.
 *
 * TWO CTAs, BOTH REAL. "Start Your Project" goes to the estimator;
 * "Book a Consultation" goes to the audit form, which is the route that
 * ends at the booking page. No magnetic displacement on either — the brief
 * rules it out, and a button that moves under the cursor is a liability
 * before it is a flourish.
 */

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="on-dark relative overflow-hidden bg-ink pb-14 pt-[var(--space-section)] text-white sm:pb-16"
    >
      {/*
        Atmosphere, not decoration: one soft orange pool low and centred,
        sitting directly beneath the buttons so the light leads the eye to
        the action. A second, fainter wash lifts the upper edge away from
        flat black. Both drift slowly and stop under reduced motion.
      */}
      <div
        aria-hidden="true"
        className="ambient pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(42rem 24rem at 50% 102%, rgba(239,135,22,0.28), transparent 68%), radial-gradient(52rem 20rem at 50% -6%, rgba(255,255,255,0.045), transparent 70%)",
        }}
      />

      <div className="container-site relative z-10">
        {/* A controlled measure: wide enough for the headline to read as
            display type, narrow enough that the description never runs long
            lines across a 1920px screen. */}
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <Eyebrow tone="ink" align="center">
              Let&apos;s begin
            </Eyebrow>
          </Reveal>

          <Reveal
            as="h2"
            id="final-cta-heading"
            variant="lines"
            delay={80}
            className="cta-headline mt-7 font-display font-semibold"
          >
            <span className="reveal-line">
              <span className="reveal-line-inner">Ready to Build</span>
            </span>{" "}
            <span className="reveal-line">
              <span
                className="reveal-line-inner cta-accent-text"
                style={{ "--line-delay": "110ms" } as React.CSSProperties}
              >
                Something Better?
              </span>
            </span>
          </Reveal>

          <Reveal delay={280}>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-dark sm:text-lg">
              {finalCta.subheadline}
            </p>
          </Reveal>

          <Reveal delay={370}>
            {/* Equal widths on a phone so the stack reads as one block;
                natural widths side by side from `sm`. */}
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                href={finalCta.primaryCta.href}
                size="lg"
                className="w-full sm:w-auto"
              >
                {finalCta.primaryCta.label}
                <Arrow />
              </Button>

              <Button
                href={finalCta.secondaryCta.href}
                variant="onDark"
                size="lg"
                className="w-full sm:w-auto"
              >
                {finalCta.secondaryCta.label}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={460}>
            <p className="mt-9 text-sm text-muted-dark">
              Or reach us directly —{" "}
              <a
                href={`mailto:${site.email}`}
                className="link-underline-accent font-medium text-white transition-colors"
              >
                {site.email}
              </a>{" "}
              <span aria-hidden="true" className="px-1 text-white/25">
                /
              </span>{" "}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-accent font-medium text-white transition-colors"
              >
                WhatsApp
              </a>
            </p>
          </Reveal>

          {/* The single decorative detail — a thin orange rule drawing out
              from the centre, closing the composition and carrying the eye
              into the footer. */}
          <Reveal delay={520} variant="fade">
            <div aria-hidden="true" className="accent-rule mt-12" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
