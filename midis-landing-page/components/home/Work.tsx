import Image from "next/image";
import { Arrow, Button } from "@/components/ui/Button";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { work } from "@/content/sections";
import { caseStudies, industries, type CaseStudy } from "@/content/case-studies";
import { cn } from "@/lib/utils";

/**
 * SECTION 3 — Featured work. INDUSTRY CASE STUDIES, 2026-10-21 (full
 * redesign on MIDIS's brief).
 *
 * WHAT CHANGED. The alternating side-by-side rows are gone — MIDIS
 * rejected image-beside-text outright. Every project is now a vertical
 * editorial case study: ALL the project information first (number,
 * prominent industry badge, client name, project type on the left;
 * overview, "What we delivered", website features and the internal CTA
 * on the right), and below it ONE wide, clean browser preview spanning
 * the full content width. The same order holds on every device.
 *
 * INDUSTRY-FIRST. An "Industries we've worked with" strip sits between
 * the section header and the projects — one chip per case study, derived
 * from the same data so it cannot drift, each anchoring down to its
 * project. No carousel, no filtering that hides anything: all projects
 * render, always.
 *
 * WHO IS SHOWN, AND WHAT IS CLAIMED. Eight of the brief's nine clients;
 * High Spirits is reported out (unverifiable business — see
 * content/case-studies.ts, which also records the provenance rules:
 * deliverables only where supportable, features phrased as what the
 * LIVE SITE shows, screenshots all genuine captures, no metrics, no
 * invented outcomes).
 *
 * NO EXTERNAL LINKS, unchanged: screenshots and names are not links,
 * each study's action is "Discuss a Similar Project" → #estimator, and
 * the live domain appears only as text in the browser chrome.
 *
 * SCREENSHOTS carry no overlays and no dark filters in either theme —
 * the frame is theme-aware, the image is the image. The one phone
 * overlay (MTC) exists because the mobile experience IS that business's
 * story; it sits over the screenshot's quiet corner, and no other study
 * repeats the composition.
 */

/* ---- industry strip icons (lucide-style, drawn inline) ---- */

const INDUSTRY_ICONS: Record<string, React.JSX.Element> = {
  education: (
    <>
      <path d="m22 9.5-10-5-10 5 10 5 10-5Z" />
      <path d="M6 11.8V17c3.2 2.7 8.8 2.7 12 0v-5.2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.9 9.1-1.8 4.6-4.6 1.8 1.8-4.6z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z" />
    </>
  ),
  car: (
    <>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l4 6-10 13L2 9l4-6Z" />
      <path d="M2 9h20" />
      <path d="m11 3-2 6 3 13 3-13-2-6" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  news: (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9" />
      <path d="M10 6h8v4h-8z" />
      <path d="M10 14h8M10 18h5" />
    </>
  ),
};

function IndustryIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {INDUSTRY_ICONS[icon]}
    </svg>
  );
}

/* ---- one case study ---- */

function CaseStudyBlock({ study, index }: { study: CaseStudy; index: number }) {
  return (
    <article
      id={`work-${study.slug}`}
      className={cn(
        "scroll-mt-28",
        index > 0 && "border-t border-line pt-16 md:pt-24",
      )}
    >
      {/* ============ 1. the project information — ALWAYS first ============ */}
      <div className="grid gap-x-14 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---- identity: number / industry / client / type ---- */}
        <div className="min-w-0">
          <Reveal>
            <p className="flex flex-wrap items-center gap-3">
              <span
                aria-hidden="true"
                className="font-display text-xl font-semibold tabular-nums text-accent-ink sm:text-2xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden="true" className="h-px w-7 bg-accent" />
              <span className="inline-flex items-center rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">
                {study.industry}
              </span>
            </p>
          </Reveal>

          <RevealText
            as="h3"
            delay={70}
            className="mt-5 text-[length:var(--text-display-sm)] leading-[1.08] lg:text-[length:var(--text-display-md)]"
          >
            {study.client}
          </RevealText>

          <Reveal delay={150}>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-muted">
              {study.projectType}
            </p>
          </Reveal>
        </div>

        {/* ---- the story: overview, deliverables, features, CTA ---- */}
        <div className="min-w-0">
          <Reveal delay={120}>
            <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {study.overview}
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-6 grid gap-x-10 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fg">
                  What we delivered
                </p>
                <ul className="mt-3 space-y-2">
                  {study.delivered.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm font-medium text-fg"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft">
                        <svg
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                          className="size-3 text-accent-ink"
                        >
                          <path
                            d="m2.5 6.3 2.3 2.4 4.7-5.4"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fg">
                  On the website
                </p>
                <ul className="mt-3 space-y-2">
                  {study.features.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-snug text-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-accent"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-6">
              <a
                href="#estimator"
                className="group/btn inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink"
              >
                <span className="link-underline-accent">
                  Discuss a Similar Project
                </span>
                <Arrow />
              </a>
            </p>
          </Reveal>
        </div>
      </div>

      {/* ============ 2. the website — wide, clean, below ============ */}
      <Reveal variant="clip" delay={140} className="group mt-8 md:mt-10">
        <div
          className={cn(
            "relative transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]",
            "hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none",
          )}
        >
          <BrowserFrame
            src={study.preview}
            alt={`${study.client} website homepage`}
            host={study.host}
            sizes="(min-width: 1360px) 1280px, 94vw"
            zoomOnHover
          />
          {study.phone ? (
            /* A second REAL capture — the phone view, for the one client
               whose business happens on the roadside. Sits over the
               screenshot's quiet corner; no other study repeats this. */
            <div className="absolute -bottom-5 right-4 w-[17%] min-w-[88px] max-w-[150px] overflow-hidden rounded-[0.9rem] border-[3px] border-[#141518] bg-[#141518] shadow-[0_18px_36px_-18px_rgb(20_21_24/0.6)] sm:right-7">
              <Image
                src={study.phone}
                alt={`${study.client} website on a phone`}
                width={780}
                height={1688}
                loading="lazy"
                sizes="150px"
                className="block h-auto w-full"
              />
            </div>
          ) : null}
        </div>
      </Reveal>
    </article>
  );
}

export function Work() {
  return (
    /* Top padding halved to meet Trust's halved bottom — see the note
       there. */
    <Section
      id="work"
      tone="paper"
      labelledBy="work-heading"
      className="pt-[calc(var(--space-section)*0.5)]"
    >
      <SectionHeader
        eyebrow="Featured work"
        heading={work.headline}
        headingId="work-heading"
        sub={work.subheadline}
      />

      {/* ============ the industries strip ============ */}
      {/* Derived from the case studies themselves (content/case-studies),
          so the strip can never advertise an industry the section does
          not show. Chips anchor to their project — nothing is filtered,
          nothing hides. */}
      <div className="container-site mt-10">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Industries we&rsquo;ve worked with
          </p>
        </Reveal>
        <Reveal delay={90}>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {industries.map((industry) => (
              <li key={industry.slug}>
                <a
                  href={`#work-${industry.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-fg transition-colors duration-[var(--dur-fast)] hover:border-accent/60 hover:text-accent-ink"
                >
                  <IndustryIcon
                    icon={industry.icon}
                    className="size-4 shrink-0 text-accent-ink"
                  />
                  {industry.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* ============ the case studies ============ */}
      <div className="container-wide mt-[var(--space-block)]">
        <div className="flex flex-col gap-16 md:gap-24">
          {caseStudies.map((study, index) => (
            <CaseStudyBlock key={study.slug} study={study} index={index} />
          ))}
        </div>

        {/* ---- the conversion card ---- */}
        <Reveal className="mt-16 md:mt-24">
          <a
            href="#estimator"
            className="card-lift group grid items-center gap-8 rounded-2xl bg-ink p-6 text-white ring-1 ring-fg/10 hover:bg-ink-raised sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14"
          >
            <div>
              <p className="eyebrow text-accent">Like what you see?</p>
              <p className="mt-5 text-[length:var(--text-display-sm)] font-semibold leading-tight font-display">
                Let&rsquo;s build something similar for your business.
              </p>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted-dark">
                Eight industries, eight different problems to solve. Tell us
                what you&rsquo;re planning, and we&rsquo;ll help you understand
                the potential scope, timeline, and next steps.
              </p>
              <span className="group/btn mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Get a Project Estimate
                <Arrow />
              </span>
            </div>

            <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src="/images/work/portfolio.jpg"
                alt="The MIDIS portfolio, showing its project showcase"
                width={1800}
                height={1125}
                loading="lazy"
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="block h-auto w-full transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
              />
            </div>
          </a>
        </Reveal>

        {/* ---- section CTA (MIDIS.pdf p.3) ---- */}
        <Reveal className="mt-14 flex justify-center">
          <Button href={work.cta.href} size="lg">
            {work.cta.label}
            <Arrow />
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
