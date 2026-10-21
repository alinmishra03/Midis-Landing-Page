import Image from "next/image";
import { Arrow, Button } from "@/components/ui/Button";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { work } from "@/content/sections";
import { PORTFOLIO_PROJECT_COUNT, projects } from "@/content/work";
import { cn } from "@/lib/utils";

/**
 * SECTION 3 — Featured projects.
 *
 * LAYOUT. Editorial rows that alternate side, not a four-column card grid —
 * the brief rules that out, and a grid would shrink six website screenshots
 * to the point where none of them could be read. Each row gives the
 * screenshot roughly 58% of the width at `lg`, which is enough to make the
 * design legible, and the text column sits in the remaining space with the
 * project number setting the rhythm down the page.
 *
 * NO EXTERNAL LINKS (MIDIS lead-generation brief, 2026-10-21). This section
 * used to link every project to its live site — chosen over the PDF's "View
 * Case Study" CTA because no verified case study exists (the PDF's template
 * ends "Add verified metrics", and none were supplied). MIDIS has now
 * instructed that visitors must not leave the landing page while exploring
 * the work, so the outbound links are gone:
 *
 *   - The screenshot and the project name are no longer links at all —
 *     nothing here pretends to be clickable without doing anything.
 *   - Each row's action is "Discuss a Similar Project", to the on-page
 *     estimator.
 *   - The live DOMAIN still shows in each BrowserFrame's chrome bar, so
 *     the proof-of-reality the live links used to carry is still visible,
 *     just not navigable.
 *   - The portfolio gateway card became the section's conversion moment
 *     (the brief's own "Like what you see?" pattern), also to the
 *     estimator.
 *
 * There are still no case-study links, for the same reason as before: no
 * verified case study exists to link to.
 *
 * The copy says "work" and "projects" and never "clients" or "we delivered",
 * because MIDIS has not confirmed which of these were delivered engagements.
 * See content/work.ts for the full provenance note.
 */

function ProjectRow({
  project,
  index,
}: {
  project: (typeof projects)[number];
  index: number;
}) {
  /* Odd rows put the screenshot on the right. Below `lg` everything stacks
     image-first, so the reading order stays consistent on a phone. */
  const flipped = index % 2 === 1;

  return (
    <article className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      {/* ---- screenshot ----
          Its own reveal, using the clip wipe: the screenshot is uncovered
          rather than floated in, which suits a flat rectangle of UI far
          better than a fade-and-rise. The frame is also a tilt plane, so on
          a desktop pointer it turns very slightly toward the cursor. */}
      <Reveal
        variant="clip"
        className={cn(
          "lg:col-span-7",
          flipped ? "lg:order-2 lg:col-start-6" : "lg:order-1",
        )}
      >
        <TiltCard>
          {/* A plain block, not a link — the live site is deliberately not
              navigable (see the section note). The tilt, zoom and drift
              stay: they are presentation, not affordance; card-lift went
              with the link because a lift-on-hover says "clickable". */}
          <div className="block rounded-xl">
            <BrowserFrame
              src={project.preview}
              alt={`${project.name} website homepage`}
              host={project.host}
              sizes="(min-width: 1024px) 56vw, 92vw"
              zoomOnHover
              drift
            />
          </div>
        </TiltCard>
      </Reveal>

      {/* ---- text ----
          Enters from the side it occupies, so a row reads as two halves
          closing together rather than two things fading in place. */}
      <Reveal
        variant={flipped ? "side-left" : "side-right"}
        delay={120}
        className={cn(
          "lg:col-span-5",
          flipped ? "lg:order-1 lg:col-start-1 lg:row-start-1" : "lg:order-2",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="font-display text-sm font-semibold tabular-nums text-accent-ink"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-line"
          />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {project.category}
          </span>
        </div>

        {/* Plain text since 2026-10-21 — the name used to open the live
            site; the row's one action is now the estimator link below. */}
        <h3 className="mt-5 text-[length:var(--text-display-sm)] leading-tight">
          {project.name}
        </h3>

        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
          {project.summary}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {project.services.map((service) => (
            <li
              key={service}
              className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink"
            >
              {service}
            </li>
          ))}
        </ul>

        {/* The row's one action: on-page, to the estimator. The domain the
            old link displayed still shows in the BrowserFrame's chrome. */}
        <p className="mt-7">
          <a
            href="#estimator"
            className="group/btn inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fg transition-colors hover:text-accent-ink"
          >
            <span className="link-underline-accent">
              Discuss a Similar Project
            </span>
            <Arrow />
          </a>
        </p>
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

      <div className="container-wide mt-[var(--space-block)]">
        <div className="flex flex-col gap-16 md:gap-24">
          {projects.map((project, index) => (
            <ProjectRow key={project.slug} project={project} index={index} />
          ))}
        </div>

        {/* ---- the conversion card ----
            Until 2026-10-21 this card opened the external MIDIS portfolio.
            The lead-generation brief keeps visitors on this page, so the
            same dark card now carries the brief's own "Like what you see?"
            moment and lands on the estimator. The portfolio screenshot
            stays as the visual — it is real, and it says there is more work
            than the six rows above — and PORTFOLIO_PROJECT_COUNT keeps the
            "more to see" claim countable rather than invented. */}
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
                These six are a selection from {PORTFOLIO_PROJECT_COUNT}{" "}
                projects. Tell us what you&rsquo;re planning, and we&rsquo;ll
                help you understand the potential scope, timeline, and next
                steps.
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
