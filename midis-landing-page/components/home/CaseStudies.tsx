import { Arrow, Button } from "@/components/ui/Button";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { caseStudies, caseStudyFramework } from "@/content/sections";

/**
 * SECTION 7 — Case studies.
 *
 * THERE ARE NO TESTIMONIALS ON THIS PAGE, DELIBERATELY.
 *
 * MIDIS.pdf page 10 carries three quotes, each headed "Placeholder Only",
 * each attributed to "Demo Client Name" at "Demo Company", under a developer
 * note reading: "These testimonials are fictional examples for layout and
 * design testing. Do not publish them as genuine customer reviews." No
 * approved, attributed client review has been supplied to replace them. So
 * none is shown, and there is no testimonial component waiting to be filled
 * with something plausible.
 *
 * What replaces them is the PDF's own alternative: the case-study framing
 * from page 9, plus the four-part structure MIDIS works to. The structure is
 * presented as a METHOD — what MIDIS does on a project — not as a filled-in
 * case study with invented outcomes. "The Results" says outcomes are
 * published once verified, which is true and is also the honest reason this
 * section has no numbers in it.
 *
 * See docs/open-questions.md, items 1 and 3.
 */

export function CaseStudies() {
  return (
    <Section id="case-studies" tone="paper" labelledBy="case-studies-heading">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          {/* ---- framing ---- */}
          <div>
            <Reveal>
              <Eyebrow className="mb-5">Case studies</Eyebrow>
            </Reveal>
            <RevealText
              id="case-studies-heading"
              delay={60}
              className="text-[length:var(--text-display-md)] leading-[1.06]"
            >
              {caseStudies.headline}
            </RevealText>
            <Reveal delay={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                {caseStudies.subheadline}
              </p>
            </Reveal>

            {/* ---- case study preview (MIDIS.pdf p.9) ---- */}
            <Reveal variant="side-left" delay={100}>
              <div className="card-lift mt-9 rounded-[var(--radius-card-lg)] border border-line bg-surface p-6 hover:border-accent/35 hover:shadow-[0_24px_50px_-28px_rgba(20,21,24,0.35)] sm:p-8">
                <h3 className="text-[length:var(--text-display-sm)] leading-tight">
                  {caseStudies.preview.title}
                </h3>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                  {caseStudies.preview.body}
                </p>
                <Button
                  href={caseStudies.cta.href}
                  variant="secondary"
                  className="mt-7"
                >
                  {caseStudies.cta.label}
                  <Arrow />
                </Button>
              </div>
            </Reveal>
          </div>

          {/* ---- the four-part structure ---- */}
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                How we document a project
              </p>
            </Reveal>

            <ol className="mt-6 flex flex-col">
              {caseStudyFramework.map((stage, index) => (
                <Reveal
                  as="li"
                  key={stage.label}
                  variant="side-right"
                  delay={index * 80}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-t border-line py-6 first:border-t-0 first:pt-0"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-sm font-semibold tabular-nums text-accent-ink"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold leading-snug">
                      {stage.label}
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                      {stage.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ol>

            {/*
              Says plainly why there are no numbers here. A visitor who
              notices their absence gets a reason rather than an impression
              that the work has none.
            */}
            <Reveal delay={120}>
              <p className="mt-6 rounded-lg bg-accent-soft/60 p-4 text-sm leading-relaxed text-ink-soft">
                We publish outcomes only once they are measured and the client
                has approved them. Until then, the work itself is the
                evidence — every project above links to the site that is
                live today.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
