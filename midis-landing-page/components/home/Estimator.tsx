import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { EstimatorForm } from "@/components/forms/EstimatorForm";
import { estimator } from "@/content/sections";
import { site } from "@/content/site";

/**
 * SECTION 5 — Website project estimator.
 *
 * The form sits in the right-hand column with the reassurance in the left,
 * so the visitor reads why they should fill it in before they reach the
 * first field. On a phone the copy comes first for the same reason.
 *
 * The scroll target is this section, not the form, so landing here from a
 * CTA shows the heading rather than dropping straight onto step one with no
 * context.
 */

export function Estimator() {
  return (
    <Section id="estimator" tone="paper" labelledBy="estimator-heading">
      <div className="container-site">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          {/* ---- the case for filling it in ---- */}
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
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
            </Reveal>

            <Reveal delay={100}>
              <ul className="mt-8 flex flex-col gap-4 border-t border-line pt-8">
                {[
                  "Four short steps — about a minute.",
                  "No obligation, and no automated quote.",
                  "A member of the team reviews every enquiry.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-ink">
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

              <p className="mt-8 text-sm text-muted">
                Prefer to write to us?{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                >
                  {site.email}
                </a>
              </p>
            </Reveal>
          </div>

          {/* ---- the form ---- */}
          <Reveal delay={60}>
            <EstimatorForm />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
