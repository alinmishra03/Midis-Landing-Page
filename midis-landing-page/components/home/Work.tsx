import Image from "next/image";
import { Arrow, Button } from "@/components/ui/Button";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { work } from "@/content/sections";
import {
  PORTFOLIO_PROJECT_COUNT,
  PORTFOLIO_URL,
  projects,
} from "@/content/work";
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
 * WHERE THE CTA GOES, AND WHY IT IS NOT "VIEW CASE STUDY".
 * MIDIS.pdf specifies a "View Case Study" CTA. No verified case study exists
 * for any of these projects — the PDF's own case-study template ends with
 * "The Results: Add verified metrics", and no metric has been supplied. A
 * "View Case Study" link would therefore have to lead to a page of invented
 * outcomes, which the brief forbids. So each project links to its LIVE SITE
 * instead: real, checkable, and stronger proof than unsourced numbers. The
 * case-study structure itself is still presented, as a method, in Section 7.
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
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden="true"
            className="card-lift block rounded-xl hover:shadow-[0_34px_70px_-30px_rgba(20,21,24,0.55)]"
          >
            <BrowserFrame
              src={project.preview}
              alt={`${project.name} website homepage`}
              host={project.host}
              sizes="(min-width: 1024px) 56vw, 92vw"
              zoomOnHover
              drift
            />
          </a>
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

        <h3 className="mt-5 text-[length:var(--text-display-sm)] leading-tight">
          {/*
            The whole heading is the link, and it carries the accessible
            name for the row — which is why the image link above is
            aria-hidden and removed from the tab order. One stop per
            project, not two pointing at the same URL.
          */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-[var(--dur-fast)] hover:text-accent-ink"
          >
            {project.name}
            <span className="sr-only"> — opens {project.host} in a new tab</span>
          </a>
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

        <p className="mt-7">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-accent-ink"
          >
            <span className="link-underline-accent">Visit the live site</span>
            <span aria-hidden="true" className="text-muted">
              {project.host}
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
    <Section id="work" tone="paper" labelledBy="work-heading">
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

        {/* ---- gateway to the full portfolio ---- */}
        <Reveal className="mt-16 md:mt-24">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="card-lift group grid items-center gap-8 rounded-2xl bg-ink p-6 text-white ring-1 ring-ink/10 hover:bg-ink-raised hover:shadow-[0_28px_56px_-28px_rgba(20,21,24,0.6)] sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14"
          >
            <div>
              <p className="eyebrow text-accent">The full portfolio</p>
              <p className="mt-5 text-[length:var(--text-display-sm)] font-semibold leading-tight font-display">
                {PORTFOLIO_PROJECT_COUNT} projects, with their own
                walkthroughs.
              </p>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted-dark">
                The six above are a selection. The rest of the work — and a
                closer look at each build — lives on the MIDIS portfolio.
              </p>
              <span className="group/btn mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Open the portfolio
                <Arrow />
              </span>
            </div>

            <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src="/images/work/portfolio.jpg"
                alt="The MIDIS portfolio site, showing its project showcase"
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
