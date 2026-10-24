"use client";

import { useId, useState } from "react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { faqSection, faqs } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 9 — FAQs.
 *
 * All seven questions from MIDIS.pdf page 12, with the answers verbatim.
 * The source answers are deliberately qualified — "should be planned",
 * "can be discussed", "should be discussed according to the service packages
 * MIDIS offers" — and that hedging is preserved exactly. Tightening it into
 * "your site will be fully responsive" would turn a careful statement into a
 * guarantee MIDIS has not made.
 *
 * ACCESSIBILITY
 * -------------
 * - The trigger is a real `<button>` inside the `<h3>`, so the question is
 *   both a heading (navigable by heading in a screen reader) and a control.
 * - `aria-expanded` on the button and `aria-controls` pointing at the panel;
 *   the panel is `role="region"` labelled by the button, so jumping into it
 *   announces which question it belongs to.
 * - The panel is NOT removed from the DOM when closed. It is collapsed to
 *   zero height with `grid-template-rows` and marked `hidden` only when the
 *   animation is irrelevant — which keeps the answers crawlable, since
 *   search engines read the markup, and means Ctrl+F finds them.
 *
 * WHY grid-template-rows AND NOT max-height. A max-height transition needs a
 * guessed ceiling: too low clips the long SEO answer, too high makes every
 * short answer ease out over an invisible gap, so the timing looks wrong on
 * exactly the ones that should feel snappiest. `0fr -> 1fr` animates to the
 * content's real height, whatever it is.
 *
 * NO FAQPage STRUCTURED DATA. See lib/seo.ts for the reasoning.
 */

export function Faqs() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const baseId = useId();

  function toggle(index: number) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <Section id="faqs" tone="paper" veil="clean" labelledBy="faqs-heading">
      {/*
        LAYOUT (MIDIS, 2026-10-24). Both halves sit inside the one
        `container-site`, so they share the page's left AND right edges —
        the old 68rem column ended ~240px short of the right edge at 1440,
        aligned with nothing.

          below lg  stacked: label, heading, description, then the
                    questions, all full width.
          from lg   two columns, like the testimonials section: the label,
                    heading and description (still stacked, description
                    directly under the heading) on the left, pinned below
                    the nav while the questions scroll; the questions on
                    the right, their icons on the container's right edge.
                    The heading steps down to the display-md size there,
                    so it holds two lines in the narrower column.

        `bare` tells SectionHeader to skip its own container so it inherits
        this one rather than nesting a second.
      */}
      <div className="container-site">
        <div className="grid gap-y-[var(--space-block)] lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-x-14 xl:gap-x-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <SectionHeader
              bare
              eyebrow="Questions"
              heading={faqSection.headline}
              headingId="faqs-heading"
              sub={faqSection.subheadline}
              className="lg:[&_h2]:text-[length:var(--text-display-md)]"
            />
          </div>

          <div>
            {faqs.map((faq, index) => {
            const isOpen = open.has(index);
            const buttonId = `${baseId}-q-${index}`;
            const panelId = `${baseId}-a-${index}`;

            return (
              <Reveal
                key={faq.question}
                delay={index * 40}
                className="border-b border-line first:border-t"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    /* `group/faq` so the icon can react to a hover anywhere
                       on the row, not only on itself. The row is the target
                       — full width, comfortable height, question flush left
                       and icon flush right via `justify-between`. */
                    className={cn(
                      "group/faq flex w-full items-start justify-between gap-4 py-5 text-left text-base font-semibold leading-snug sm:gap-6 sm:py-6 sm:text-lg",
                      "transition-colors duration-[var(--dur-fast)]",
                      isOpen ? "text-accent-ink" : "text-fg hover:text-accent-ink",
                    )}
                  >
                    <span className="min-w-0 text-pretty">{faq.question}</span>

                    {/*
                      A plus that rotates into a minus. Decorative — the
                      state is already carried by aria-expanded, so
                      announcing "plus" here would be noise.
                    */}
                    {/* A box exactly one line of the question tall
                        (leading-snug = 1.375em of the button's size), the
                        circle centred in it: dead centre on the first line
                        for one-line and wrapped questions alike. */}
                    <span aria-hidden="true" className="flex h-[1.375em] shrink-0 items-center">
                    <span
                      className={cn(
                        /* `shrink-0` keeps it hard right and stops a long
                           question squeezing it. */
                        "relative grid size-7 shrink-0 place-items-center rounded-full border",
                        "transition-[background-color,border-color,color] duration-[var(--dur-fast)]",
                        isOpen
                          ? "border-accent bg-accent text-on-accent"
                          : "border-fg/20 text-fg group-hover/faq:border-accent/70",
                      )}
                    >
                      <span className="absolute h-px w-2.5 bg-current" />
                      <span
                        className={cn(
                          "absolute h-px w-2.5 bg-current transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
                          isOpen ? "rotate-0" : "rotate-90",
                        )}
                      />
                    </span>
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  data-open={isOpen}
                  className="accordion-panel"
                >
                  <div>
                    {/* No left padding: the answer starts on the same line
                        as its question. The right padding keeps it clear of
                        the icon column (28px icon + the row's gap);
                        `max-w-[46rem]` holds a readable measure when the
                        list runs full width on tablets. */}
                    <p className="max-w-[46rem] pb-6 pr-11 text-[0.9375rem] leading-relaxed text-muted sm:pr-[3.25rem]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
