import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { finalCta } from "@/content/sections";
import { site, whatsappHref } from "@/content/site";
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
 *
 * SEAMLESS JOIN WITH FOOTER. The section carries no bottom padding of its
 * own. Instead, a transparent spacer div at the end provides breathing room
 * while letting the ambient orange glow (positioned at 110% so it bleeds
 * past the section edge) carry into the footer visually. The footer's own
 * complementary gradient picks up the warmth at its top edge, completing
 * the continuous composition.
 */

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="on-dark relative overflow-hidden bg-ink pt-[var(--space-section)] text-white"
    >
      {/*
        Two coordinated ambient washes. The lower pool is positioned at
        110% Y so it bleeds past the section's bottom edge into the footer
        above, creating a continuous glow rather than a hard cutoff. The
        upper wash lifts the top from flat black. Both drift slowly under
        ambient animation; stopped under reduced motion.
      */}
      <div
        aria-hidden="true"
        className="ambient pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(52rem 34rem at 50% 112%, rgba(239,135,22,0.24), transparent 62%), radial-gradient(58rem 22rem at 50% -4%, rgba(255,255,255,0.04), transparent 68%)",
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
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-dark sm:text-lg">
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
                variant="onDark"
                size="lg"
              >
                {finalCta.secondaryCta.label}
              </Button>
            </ButtonGroup>
          </Reveal>

          {/* Contact line: flex-wrap so email + separator + WhatsApp stack
              naturally on very narrow screens without awkward mid-word breaks.
              The separator uses a centred dot (·) which reads better than a
              forward slash at small sizes and doesn't need aria-hidden tricks
              to disappear when the line wraps. */}
          <Reveal delay={460}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-muted-dark">
              <span>Or reach us directly —</span>
              <a
                href={`mailto:${site.email}`}
                className="link-underline-accent font-medium text-white transition-colors"
              >
                {site.email}
              </a>
              <span aria-hidden="true" className="text-white/30">·</span>
              {/* Brand green + glyph (MIDIS WhatsApp-branding brief,
                  2026-10-21); #25D366 on this ink band reads at ~8:1. */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline-accent inline-flex items-center gap-1.5 font-medium text-[#25D366] transition-colors hover:text-[#1EBE5D]"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
            </p>
          </Reveal>
        </div>
      </div>

      {/*
        Transparent spacer. This div has no background of its own — the
        section's overflow:hidden is the only boundary. It gives the orange
        glow (at 112% Y in the radial above) room to be visible before the
        footer starts, creating the seamless gradient join without any
        bottom padding on the section that would introduce a dark gap between
        the CTA's glow and the footer's matching gradient.
      */}
      <div aria-hidden="true" className="h-20 sm:h-24" />
    </section>
  );
}
