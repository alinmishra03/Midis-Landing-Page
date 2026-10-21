"use client";

import { useState } from "react";
import Image from "next/image";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import {
  showingSamples,
  testimonialsSection,
  visibleTestimonials,
} from "@/content/testimonials";

/**
 * SECTION — Words From Our Clients. CINEMATIC STORY, 2026-10-21.
 *
 * WHY THE CARD GRID WENT. MIDIS's feedback called the three-up quote cards
 * basic and predictable. This pass presents ONE story at a time, as a
 * featured editorial spread: section header and navigation on the left,
 * a large-type quotation with its attribution on the right. No star
 * graphics, no stock portraits, no sliding card carousel — typography,
 * spacing and a word-cascade reveal do the work. The motion language is
 * deliberately different from the Services stage next door: Services
 * demonstrates, Testimonials narrates.
 *
 * WHAT DID NOT CHANGE — THE AUTHENTICITY MACHINERY. The content still
 * comes from content/testimonials.ts exactly as before: approved quotes if
 * any exist, the labelled "Demo Client" samples otherwise, nothing at all
 * failing that. `showingSamples` still drives the Sample chip (now on the
 * attribution) and the section note, so placeholder copy can never appear
 * unmarked. As of 2026-10-21 the approved list is STILL EMPTY — what is on
 * the page is sample content, and real client quotes with written
 * permission remain required before launch.
 *
 * TRANSITIONS. Switching stories remounts the figure (key=index): the
 * quote re-reveals word by word (a cascade of per-word spans with
 * incremental delays), the attribution follows, and the soft accent wash
 * behind the quote drifts to a new position. Everything is opacity and
 * transform, capped under a second, removed entirely by reduced-motion
 * (globals.css). Nothing auto-advances; the story changes only when the
 * visitor asks.
 *
 * NAVIGATION. Previous/next buttons (real buttons — keyboard-operable by
 * nature), wrap-around, a tabular "01 / 06" counter, a thin progress bar,
 * and an aria-live line announcing the position. One set of controls,
 * placed after the quote in the DOM (phones read heading → story →
 * controls) and re-placed under the header from `lg` by the same
 * three-children grid trick the hero and Services use.
 */

/** First and last initial, e.g. "Priya Nair" -> "PN". */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function QuoteMark() {
  return (
    <svg
      viewBox="0 0 48 36"
      aria-hidden="true"
      className="h-10 w-auto text-accent/35 sm:h-12"
      fill="currentColor"
    >
      <path d="M0 36V21.6C0 15.3 1.4 10.2 4.2 6.4 7 2.6 11.2.4 16.8 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6h8.2V36H0Zm27.8 0V21.6c0-6.3 1.4-11.4 4.2-15.2C34.8 2.6 39 .4 44.6 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6H44V36H27.8Z" />
    </svg>
  );
}

export function Testimonials() {
  const items = visibleTestimonials;
  const [index, setIndex] = useState(0);
  const count = items.length;

  if (count === 0) return null;

  const t = items[index];
  /* Wrap around: the last story's "next" is the first — a reading loop,
     not a dead end. */
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  /* The attribution enters once the cascade has mostly landed. Capped so a
     long quote never makes the name feel late. */
  const words = t.quote.split(/\s+/);
  const attributionDelay = Math.min(words.length * 14 + 250, 720);

  return (
    <Section id="testimonials" tone="surface" labelledBy="testimonials-heading">
      <div className="container-site">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-x-20 lg:gap-y-12">
          {/* ---- 1. the header ---- */}
          <div className="min-w-0">
            <Reveal>
              <Eyebrow className="mb-5">Client feedback</Eyebrow>
            </Reveal>
            <RevealText
              as="h2"
              id="testimonials-heading"
              delay={60}
              className="text-[length:var(--text-display-md)] leading-[1.06]"
            >
              {testimonialsSection.heading}
            </RevealText>
            <Reveal delay={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                {testimonialsSection.subheading}
              </p>
            </Reveal>

            {showingSamples ? (
              <Reveal delay={220}>
                <p className="mt-5 flex max-w-md items-start gap-2.5 text-sm leading-relaxed text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {testimonialsSection.sampleNote}
                </p>
              </Reveal>
            ) : null}
          </div>

          {/* ---- 2. the featured story ---- */}
          <Reveal delay={140} className="min-w-0 lg:row-span-2">
            <figure key={index} className="relative">
              {/* the wash that drifts as the stories change */}
              <div
                aria-hidden="true"
                className="t-wash pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10"
                style={{
                  background: `radial-gradient(32rem 20rem at ${18 + (index % 3) * 28}% 14%, rgb(239 135 22 / 0.08), transparent 68%)`,
                }}
              />

              <QuoteMark />

              <blockquote className="mt-5 max-w-[34ch] font-display text-[1.375rem] font-medium leading-[1.4] tracking-[-0.015em] text-fg sm:text-[1.625rem] lg:mt-6 lg:text-[1.9rem] lg:leading-[1.38]">
                {/* the cascade: every word arrives on its own beat */}
                {words.map((word, wordIndex) => (
                  <span key={`${index}-${wordIndex}`}>
                    <span
                      className="t-word"
                      style={{ "--wd": `${Math.min(wordIndex * 14, 560)}ms` } as React.CSSProperties}
                    >
                      {word}
                    </span>{" "}
                  </span>
                ))}
              </blockquote>

              <figcaption
                className="t-attr mt-7 flex items-center gap-3.5 lg:mt-9"
                style={{ "--wd": `${attributionDelay}ms` } as React.CSSProperties}
              >
                <span aria-hidden="true" className="h-px w-8 bg-accent" />
                {t.logo ? (
                  <Image
                    src={t.logo}
                    alt=""
                    aria-hidden="true"
                    width={t.logoWidth ?? 120}
                    height={t.logoHeight ?? 40}
                    className="h-7 w-auto max-w-24 shrink-0 object-contain"
                  />
                ) : (
                  /* Initials, not a stock portrait — the brief forbids
                     implying customer photographs that do not exist. */
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-xs font-semibold tracking-wide text-accent-ink"
                  >
                    {initialsOf(t.name)}
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
                {showingSamples ? (
                  <span className="ml-auto shrink-0 rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                    Sample
                  </span>
                ) : null}
              </figcaption>
            </figure>
          </Reveal>

          {/* ---- 3. the controls ---- */}
          {count > 1 ? (
            <Reveal delay={220} className="min-w-0 lg:col-start-1 lg:row-start-2">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors duration-[var(--dur-fast)] hover:border-accent/60 hover:text-accent-ink"
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors duration-[var(--dur-fast)] hover:border-accent/60 hover:text-accent-ink"
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* 01 / 06 — the visitor always knows where they are */}
                <span className="font-display text-sm font-semibold tabular-nums" aria-hidden="true">
                  <span className="text-accent-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted"> / {String(count).padStart(2, "0")}</span>
                </span>

                {/* the reading-progress hairline */}
                <span aria-hidden="true" className="relative h-px flex-1 overflow-hidden bg-line">
                  <span
                    className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]"
                    style={{ width: `${((index + 1) / count) * 100}%` }}
                  />
                </span>
              </div>

              <span aria-live="polite" className="sr-only">
                {`Testimonial ${index + 1} of ${count}: ${t.name}, ${t.role}`}
              </span>
            </Reveal>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
