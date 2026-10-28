import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { finalCta } from "@/content/sections";
import { whatsappHref } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

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
 * DESCENDER FIX (2026-10-20). `.reveal-line` uses `overflow: hidden` with
 * `padding-bottom: 0.12em` for the standard page scale. At cta-headline's
 * larger font-size (clamp 2.5–6.5rem) and tight line-height (1.02), the
 * bottom of "g" and "?" in "Something Better?" falls below the 0.12em
 * clearance and is visibly clipped. The second reveal-line carries the class
 * `cta-headline-line` which overrides padding-bottom to 0.28em on that line
 * only — enough room for all descenders at every viewport width — while
 * margin-bottom mirrors the override to keep the heading block height
 * identical.
 *
 * CONTRAST. Charcoal on the page is 17:1. Since 2026-10-28 the section sits
 * on the shared page background (it was a full-width charcoal band), so the
 * accent gradient runs charcoal into the readable orange (#D26E0A) — an
 * `@supports` fallback paints solid orange where `background-clip: text`
 * is unavailable.
 *
 * TWO CTAs, BOTH REAL. "Start Your Project" goes to the estimator;
 * "Book a Consultation" goes to the audit form, which is the route that
 * ends at the booking page. No magnetic displacement on either — the brief
 * rules it out, and a button that moves under the cursor is a liability
 * before it is a flourish.
 *
 * ONE CONTINUOUS PAGE (MIDIS, 2026-10-28). No band, no glow, no spacer:
 * the section shares the page background with the FAQs above it, so the
 * FAQs flow straight into it, and it keeps its prominence through type
 * and the orange accent alone.
 */

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      data-tone="paper"
      className="relative py-[var(--space-section)] text-fg"
    >
      <div className="container-site">
        {/* A controlled measure: wide enough for the headline to read as
            display type, narrow enough that the description never runs long
            lines across a 1920px screen. */}
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <Eyebrow align="center">
              Let&apos;s begin
            </Eyebrow>
          </Reveal>

          {/*
            DESCENDER FIX: The second reveal-line carries `cta-headline-line`
            which increases padding-bottom from 0.12em to 0.28em so that
            deep descenders ("g", "?") in "Something Better?" are never
            clipped by the overflow:hidden mask at any viewport width.
          */}
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
            <span className="reveal-line cta-headline-line">
              <span
                className="reveal-line-inner cta-accent-text"
                style={{ "--line-delay": "110ms" } as React.CSSProperties}
              >
                Something Better?
              </span>
            </span>
          </Reveal>

          <Reveal delay={280}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {finalCta.subheadline}
            </p>
          </Reveal>

          <Reveal delay={370}>
            {/* `ButtonGroup` handles the stacking and the equal widths, so
                the per-button `w-full sm:w-auto` overrides are gone. */}
            <ButtonGroup align="center" className="mt-11">
              <Button href={finalCta.primaryCta.href} size="lg">
                {finalCta.primaryCta.label}
                <Arrow />
              </Button>

              <Button
                href={finalCta.secondaryCta.href}
                variant="secondary"
                size="lg"
              >
                {finalCta.secondaryCta.label}
              </Button>
            </ButtonGroup>
          </Reveal>

          {/* Contact line: flex-wrap so the lead-in and WhatsApp stack
              naturally on very narrow screens. The email address lives in
              the footer only (MIDIS instruction, 2026-10-24). */}
          <Reveal delay={460}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-muted">
              <span>Or reach us directly —</span>
              {/* Brand-green glyph (MIDIS WhatsApp-branding brief,
                  2026-10-21) with charcoal text: #25D366 as TEXT is only
                  ~1.9:1 on the light page, so the green stays on the icon. */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-accent inline-flex items-center gap-1.5 font-medium text-fg transition-colors hover:text-accent-ink"
              >
                <WhatsAppIcon className="size-4 text-[#25D366]" />
                WhatsApp
              </a>
            </p>
          </Reveal>
        </div>
      </div>

    </section>
  );
}
