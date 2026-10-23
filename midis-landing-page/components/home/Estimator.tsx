import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { estimator, hero } from "@/content/sections";
import { site } from "@/content/site";

/**
 * SECTION 5 — the estimator's supporting band.
 *
 * THE FORM ITSELF MOVED TO THE HERO on MIDIS's instruction of 2026-10-20,
 * and `#estimator` — the anchor every CTA on the page targets — moved with
 * it. Rendering the same four-step form twice would be worse than either
 * placement alone, so this section now carries the case for filling it in:
 * the approved headline and subheadline, the reassurance list, and one CTA
 * that routes to the hero form. Nothing approved was dropped — the
 * section's `supportingText` still renders inside the form's final step.
 *
 * The section keeps its position in the page journey (work -> services ->
 * ENQUIRY -> process), so a visitor who scrolled past the hero form while
 * it was above the fold still meets the ask at the moment the original
 * design chose for it.
 */

export function Estimator() {
  return (
    <Section id="estimator-overview" tone="paper" veil="soft" labelledBy="estimator-heading">
      <div className="container-site">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          {/* ---- the case for filling it in ---- */}
          <div>
            <Reveal>
              <Eyebrow className="mb-5">Project estimator</Eyebrow>
            </Reveal>
            <RevealText
              id="estimator-heading"
              delay={60}
              className="text-[length:var(--text-display-md)] leading-[1.06]"
            >
              {estimator.headline}
            </RevealText>
            <Reveal delay={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                {estimator.subheadline}
              </p>
              {/*
                The hero's approved supporting line lives here now (MIDIS
                compaction brief, 2026-10-20): in the mobile hero it was
                pure height between the CTA and the form, and this band is
                the same pitch the line was written for. It renders once on
                the page.
              */}
              <p className="mt-5 max-w-md border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-muted-strong">
                {hero.supportingLine}
              </p>
            </Reveal>

            <Reveal delay={220}>
              <ButtonGroup className="mt-8">
                {/* Routes to the working form in the hero — one form on the
                    page, one place every estimate CTA lands. */}
                <Button href="#estimator" size="lg">
                  {estimator.cta}
                  <Arrow />
                </Button>
              </ButtonGroup>
            </Reveal>
          </div>

          {/* ---- the reassurance ---- */}
          <Reveal delay={120}>
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <ul className="flex flex-col gap-4">
                {[
                  "Four short steps — about a minute.",
                  "No obligation, and no automated quote.",
                  "A member of the team reviews every enquiry.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-fg">
                    <svg
                      viewBox="0 0 16 16"
                      width="18"
                      height="18"
                      aria-hidden="true"
                      className="mt-px shrink-0 text-accent-ink"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M4.9 8.2l2.1 2.1 4.1-4.4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-t border-line pt-6 text-sm text-muted">
                Prefer to write to us?{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                >
                  {site.email}
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
