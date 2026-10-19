import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { process, processSteps } from "@/content/sections";

/**
 * SECTION 6 — How it works.
 *
 * ONE COMPONENT, TWO COMPOSITIONS, NO DUPLICATED CONTENT. The steps are
 * written once and the grid does the rest: below `lg` they stack as a
 * vertical timeline with the connector running down the left; at `lg` the
 * same list becomes five columns with the connector running across the top.
 * Rendering the markup twice and hiding one copy would double the DOM and
 * make the numbers read twice to a screen reader.
 *
 * The connector is a pseudo-free plain element with `aria-hidden`, and it is
 * drawn per item rather than as one long rule, so the last step does not
 * trail a line off the end of the section.
 *
 * `<ol>` because the order is the point — these are sequential stages, not
 * an unordered set of services.
 */

export function Process() {
  return (
    <Section id="process" tone="surface" labelledBy="process-heading">
      <SectionHeader
        eyebrow="How it works"
        heading={process.headline}
        headingId="process-heading"
        sub={process.subheadline}
        aside={
          <Button href={process.cta.href} size="lg" variant="secondary">
            {process.cta.label}
            <Arrow />
          </Button>
        }
      />

      <div className="container-site mt-[var(--space-block)]">
        <ol className="grid gap-y-8 lg:grid-cols-5 lg:gap-x-6">
          {processSteps.map((step, index) => {
            const isLast = index === processSteps.length - 1;

            return (
              <Reveal
                as="li"
                key={step.number}
                variant="deal"
                delay={index * 90}
                className="group/step relative flex gap-5 lg:flex-col lg:gap-0"
              >
                {/* ---- marker rail (mobile: vertical) ----
                    The connector draws itself downward as the section
                    scrolls, off the CSS scroll timeline. */}
                <div className="flex flex-col items-center lg:hidden">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-semibold text-accent-ink ring-1 ring-accent/25">
                    {step.number}
                  </span>
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className="line-draw-y mt-2 w-px flex-1 bg-linear-to-b from-accent/60 to-line"
                    />
                  ) : null}
                </div>

                {/* ---- marker rail (desktop: horizontal) ---- */}
                <div className="hidden items-center lg:flex">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-semibold text-accent-ink ring-1 ring-accent/25 transition-transform duration-[var(--dur-base)] group-hover/step:scale-110">
                    {step.number}
                  </span>
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className="line-draw ml-3 h-px flex-1 bg-linear-to-r from-accent/60 to-line"
                    />
                  ) : null}
                </div>

                <div className="pb-2 lg:pb-0 lg:pr-6 lg:pt-6">
                  <h3 className="text-lg font-semibold leading-snug transition-colors duration-[var(--dur-base)] group-hover/step:text-accent-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
