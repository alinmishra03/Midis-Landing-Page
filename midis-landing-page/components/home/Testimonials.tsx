"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import {
  showingDemo,
  testimonialsSection,
  visibleTestimonials,
  type Testimonial,
} from "@/content/testimonials";
import { cn } from "@/lib/utils";

/**
 * SECTION — Words From Our Clients.
 *
 * RENDERS NOTHING UNTIL THERE IS SOMETHING REAL TO SHOW. MIDIS.pdf's three
 * quotes are each headed "Placeholder Only" under a note not to publish them
 * as genuine reviews, and no approved replacement has been supplied. So the
 * component returns `null` rather than showing an empty heading or an
 * invented quote — the page reads as complete without it, and the section
 * appears on its own the moment a quote with `approved: true` is added to
 * content/testimonials.ts.
 *
 * The demo quotes can be switched on for layout review with
 * NEXT_PUBLIC_SHOW_DEMO_TESTIMONIALS=true. When they are, the section wears
 * a banner and every card wears a badge, so a preview cannot be mistaken
 * for a live page.
 *
 * ONE CAROUSEL, NO GESTURE CODE. The track is a scroll-snap container, so
 * touch swiping, momentum, trackpads and keyboard scrolling are the
 * browser's own and behave natively on every device. The arrows call
 * `scrollTo`; the dots come from an IntersectionObserver over the slides.
 * That is the whole mechanism — no drag handlers, no transform maths, and
 * nothing that can desynchronise from the real scroll position.
 *
 * From `md` the same markup becomes a grid: the snap and overflow properties
 * stop applying, so one set of cards serves both layouts.
 *
 * WHY THE CARDS THEMSELVES DO NOT REVEAL. The entrance is on the track as a
 * whole, not per card. A per-card reveal starts at `opacity: 0` and clears
 * when the card intersects the VIEWPORT — but cards 2 and 3 sit outside the
 * viewport horizontally, so they would stay invisible until swiped to and
 * then animate in under the visitor's thumb, mid-gesture. One reveal for the
 * track means no card can ever be swiped to and found blank.
 */

function QuoteMark() {
  return (
    <svg
      viewBox="0 0 48 36"
      aria-hidden="true"
      className="h-8 w-auto text-accent/40"
      fill="currentColor"
    >
      <path d="M0 36V21.6C0 15.3 1.4 10.2 4.2 6.4 7 2.6 11.2.4 16.8 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6h8.2V36H0Zm27.8 0V21.6c0-6.3 1.4-11.4 4.2-15.2C34.8 2.6 39 .4 44.6 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6H44V36H27.8Z" />
    </svg>
  );
}

function Card({ t, demo }: { t: Testimonial; demo: boolean }) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-[var(--radius-card-lg)] border border-line bg-paper p-6 sm:p-8",
        "transition-[border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]",
        "hover:border-accent/35 md:hover:-translate-y-1",
        "motion-reduce:transition-none motion-reduce:md:hover:translate-y-0",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <QuoteMark />
        {demo ? (
          <span className="rounded-full bg-danger-soft px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-danger">
            Demo content
          </span>
        ) : null}
      </div>

      <blockquote className="mt-5 flex-1 text-[0.9375rem] leading-relaxed text-fg sm:text-base">
        {t.quote}
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
        {t.logo ? (
          <Image
            src={t.logo}
            alt=""
            aria-hidden="true"
            width={t.logoWidth ?? 120}
            height={t.logoHeight ?? 40}
            className="h-7 w-auto max-w-20 shrink-0 object-contain"
          />
        ) : (
          /* Initial, not a stock portrait. The brief forbids inventing
             customer photographs, and a generic avatar would imply one. */
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-sm font-semibold text-accent-ink"
          >
            {t.name.trim().charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-fg">
            {t.name}
          </span>
          <span className="block truncate text-xs text-muted">
            {t.role}
            {t.company ? ` · ${t.company}` : ""}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const items = visibleTestimonials;
  const trackRef = useRef<HTMLUListElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  /*
   * The dots follow the REAL scroll position rather than a counter we
   * increment, so a swipe, a flick, a trackpad and the arrows all keep them
   * honest. One observer rooted on the track — not a scroll listener.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === "undefined") return;

    const slides = slideRefs.current.filter(
      (slide): slide is HTMLLIElement => slide !== null,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slides.indexOf(entry.target as HTMLLIElement);
            if (index >= 0) setActive(index);
          }
        }
      },
      { root: track, threshold: 0.6 },
    );

    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) return;

    /* `scrollTo` on the track, not `scrollIntoView` on the slide — the
       latter also scrolls the PAGE vertically to centre the card, which
       yanks the section around under the visitor. */
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <Section id="testimonials" tone="surface" labelledBy="testimonials-heading">
      <SectionHeader
        eyebrow="Client feedback"
        heading={testimonialsSection.heading}
        headingId="testimonials-heading"
        sub={testimonialsSection.subheading}
      />

      {showingDemo ? (
        <div className="container-site mt-7">
          <p className="rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium leading-relaxed text-danger">
            Demo content — these are the placeholder quotes from MIDIS.pdf,
            shown for layout review only. They are not client feedback and do
            not appear in production.
          </p>
        </div>
      ) : null}

      <div className="container-wide mt-[var(--space-block)]">
        {/*
          Below `md` this scrolls and snaps, one card per view. From `md` the
          overflow and snapping stop applying and it lays out as a grid, so
          the same cards serve both without a second markup path.

          The negative margin plus matching padding lets the first and last
          cards sit on the container's own edges while the track still
          scrolls edge to edge — without it, a snapped card is inset by the
          gutter and the row reads as clipped rather than continuing.
        */}
        <Reveal>
          <ul
            ref={trackRef}
            className={cn(
              "-mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-1",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "md:mx-0 md:grid md:snap-none md:gap-6 md:overflow-visible md:px-0 md:pb-0",
              items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2",
            )}
          >
            {items.map((t, index) => (
              <li
                key={`${t.name}-${index}`}
                ref={(element) => {
                  slideRefs.current[index] = element;
                }}
                className="w-[85%] shrink-0 snap-center sm:w-[65%] md:w-auto"
              >
                <Card t={t} demo={showingDemo} />
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ---- carousel controls ----
            Mobile only, and only when there is more than one card to move
            between. From `md` the grid shows them all at once and a control
            that scrolls nothing would be a lie. */}
        {items.length > 1 ? (
          <Reveal
            delay={120}
            className="mt-6 flex items-center gap-3 md:hidden"
          >
            <button
              type="button"
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="Previous testimonial"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors duration-[var(--dur-fast)] hover:border-accent/60 hover:text-accent-ink disabled:opacity-40"
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 3 5 8l5 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => goTo(Math.min(items.length - 1, active + 1))}
              disabled={active === items.length - 1}
              aria-label="Next testimonial"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors duration-[var(--dur-fast)] hover:border-accent/60 hover:text-accent-ink disabled:opacity-40"
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Decorative: the buttons above already move between cards, and
                the live region below announces the position. */}
            <span
              aria-hidden="true"
              className="ml-auto flex items-center gap-1.5"
            >
              {items.map((t, index) => (
                <span
                  key={`${t.name}-dot-${index}`}
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-[var(--dur-base)] ease-[var(--ease-out-quart)]",
                    index === active ? "w-5 bg-accent" : "w-1.5 bg-fg/20",
                  )}
                />
              ))}
            </span>

            <span aria-live="polite" className="sr-only">
              {`Testimonial ${active + 1} of ${items.length}`}
            </span>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
