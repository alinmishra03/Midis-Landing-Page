import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { work } from "@/content/sections";
import { WorkGallery } from "./WorkGallery";

/**
 * SECTION 3 — Featured work. COMPACT PORTFOLIO GALLERY, 2026-10-22
 * (full redesign on MIDIS's brief; replaces the long editorial
 * case-study layout of 2026-10-21).
 *
 * WHAT CHANGED. The brief: visitors scrolled too much text before
 * seeing the work. The vertical case studies — overview, deliverables,
 * features and a full-width browser frame per client — are gone from
 * the page flow. In their place: the same compact header, one row of
 * industry filter chips, and an image-led three-column card grid, six
 * cards first (three on a phone) with "Explore More Projects" revealing
 * the rest. Every word of the verified case-study content survives in
 * each card's internal detail view. All of that lives in
 * WorkGallery.tsx (client — it filters, expands and opens the dialog);
 * this file stays a server component owning the section shell.
 *
 * STILL TRUE, from the 2026-10-21 provenance rules
 * (content/case-studies.ts): verified industries only, supportable
 * deliverables only, genuine screenshots, no metrics, no invented
 * outcomes, and NO EXTERNAL LINKS anywhere in the section — the one
 * conversion path is #estimator.
 *
 * COMPACTNESS. The big ink conversion card that closed the old section
 * is gone too (the brief: no oversized decorative blocks, keep it
 * short); the section ends on its one CTA button. Top padding stays
 * halved to meet Trust's halved bottom — see the note there.
 */

export function Work() {
  return (
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

      {/* Deliberately mt-9, not --space-block: the brief asks that the
          introduction give way to the work quickly. */}
      <div className="container-site mt-9">
        <Reveal>
          <WorkGallery />
        </Reveal>

        {/* ---- section CTA (MIDIS.pdf p.3) ----
            The label is responsive, the destination is not: the full line
            wants ~346px, which would wrap into a two-line, 74px-tall pill
            inside a 320px viewport. Each tier is sized to hold ONE line at
            its narrowest width (compact ≤359px, short 360–639px, full from
            sm) — `whitespace-nowrap` then guarantees the single line, and
            the three spans are display-toggled so a screen reader only
            ever announces the one that is visible. */}
        <Reveal className="mt-12 flex justify-center">
          <Button href={work.cta.href} size="lg" className="whitespace-nowrap">
            <span className="hidden sm:inline">{work.cta.label}</span>
            <span className="hidden min-[360px]:inline sm:hidden">
              {work.cta.labelShort}
            </span>
            <span className="min-[360px]:hidden">{work.cta.labelCompact}</span>
            <Arrow />
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
