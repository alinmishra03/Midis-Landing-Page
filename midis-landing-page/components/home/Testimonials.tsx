"use client";

import { useState } from "react";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Arrow, Button } from "@/components/ui/Button";
import { clientStories, testimonialsSection } from "@/content/testimonials";
import { cn } from "@/lib/utils";

/**
 * SECTION — Words From Our Clients. CLIENT FEEDBACK, 2026-10-21 (second
 * pass, same day).
 *
 * NO LOGOS — removed on the user's instruction. The selector is a rail of
 * company-name pills instead; the featured panel carries the quote mark,
 * the content, and a text attribution. (This also sidesteps the open
 * logo-permission question for this section entirely.)
 *
 * WHAT RENDERS. One client at a time. If that client's feedback draft has
 * `approved: true` — the client has seen their exact words and okayed
 * publication — it renders as a real <blockquote> with quotation marks
 * under a "Client Feedback" label. Until then the panel shows the factual
 * project spotlight as a plain paragraph under a "Project Spotlight"
 * label, because publishing words a client never said, under their name,
 * is a fabricated review no matter who wrote them. The drafts live in
 * content/testimonials.ts ready to be sent for sign-off; flipping one
 * flag per client publishes their quote with no code change.
 *
 * NAVIGATION. Every client is directly selectable from the pill rail,
 * plus previous/next with wrap-around, a tabular "01 / 09" counter, a
 * progress hairline and an aria-live announcement. Nothing auto-advances.
 *
 * TRANSITIONS. Switching clients remounts the panel (key=index): the text
 * re-reveals word by word (.t-word), the attribution follows (.t-attr),
 * and the accent wash drifts per story. All opacity/transform, all
 * removed by reduced-motion in globals.css.
 */

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
  const [index, setIndex] = useState(0);
  const count = clientStories.length;
  const story = clientStories[index];

  /* Wrap around: the last story's "next" is the first. */
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  const approved = story.feedback.approved;
  const text = approved ? story.feedback.quote : story.spotlight;
  const words = text.split(/\s+/);
  /* The attribution enters once the cascade has mostly landed, capped so
     a long quote never makes the name feel late. */
  const tailDelay = Math.min(words.length * 12 + 220, 680);

  return (
    <Section id="testimonials" tone="surface" veil="soft" labelledBy="testimonials-heading">
      <div className="container-site">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-x-16 lg:gap-y-12">
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
          </div>

          {/* ---- 2. the featured story + the client rail ---- */}
          <Reveal delay={140} className="min-w-0 lg:row-span-2">
            <article key={index} className="relative" aria-label={story.name}>
              {/* the accent wash that drifts as the stories change */}
              <div
                aria-hidden="true"
                className="t-wash pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10"
                style={{
                  background: `radial-gradient(32rem 20rem at ${14 + (index % 4) * 24}% 12%, rgb(239 135 22 / 0.08), transparent 68%)`,
                }}
              />

              <div
                className="t-attr flex flex-wrap items-center justify-between gap-4"
                style={{ "--wd": "0ms" } as React.CSSProperties}
              >
                <QuoteMark />
                {/* The reader knows what they are reading BEFORE they read
                    it: a client's words, or MIDIS's factual description. */}
                <span className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                  {approved
                    ? testimonialsSection.testimonialLabel
                    : testimonialsSection.spotlightLabel}
                </span>
              </div>

              {/* THE DISTINCTION, STRUCTURALLY: approved feedback is a
                  blockquote with quotation marks; the fallback spotlight
                  is a plain paragraph MIDIS wrote. */}
              {approved ? (
                <blockquote className="mt-6 max-w-[38ch] font-display text-[1.375rem] font-medium leading-[1.4] tracking-[-0.015em] text-fg sm:text-[1.625rem] lg:text-[1.8rem] lg:leading-[1.38]">
                  {"“"}
                  {words.map((word, wordIndex) => (
                    <span key={`${index}-${wordIndex}`}>
                      <span
                        className="t-word"
                        style={{ "--wd": `${Math.min(wordIndex * 12, 560)}ms` } as React.CSSProperties}
                      >
                        {word}
                      </span>
                      {wordIndex < words.length - 1 ? " " : ""}
                    </span>
                  ))}
                  {"”"}
                </blockquote>
              ) : (
                <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg">
                  {words.map((word, wordIndex) => (
                    <span key={`${index}-${wordIndex}`}>
                      <span
                        className="t-word"
                        style={{ "--wd": `${Math.min(wordIndex * 12, 560)}ms` } as React.CSSProperties}
                      >
                        {word}
                      </span>{" "}
                    </span>
                  ))}
                </p>
              )}

              {/* the attribution: company and industry, text only */}
              <div
                className="t-attr mt-7 flex items-center gap-3.5"
                style={{ "--wd": `${tailDelay}ms` } as React.CSSProperties}
              >
                <span aria-hidden="true" className="h-px w-8 bg-accent" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-semibold text-fg">
                    {story.name}
                  </span>
                  <span className="block truncate text-xs font-semibold uppercase tracking-wider text-accent-ink">
                    {story.industry}
                  </span>
                </span>
              </div>

              {!approved && story.services ? (
                /* Only the three portfolio-documented engagements carry a
                   services line — content/testimonials.ts explains why. */
                <ul
                  className="t-attr mt-6 flex flex-wrap gap-2"
                  style={{ "--wd": `${tailDelay + 90}ms` } as React.CSSProperties}
                  aria-label={`Services MIDIS provided for ${story.name}`}
                >
                  {story.services.map((service) => (
                    <li
                      key={service}
                      className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink"
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>

            {/* the client rail: all nine, each directly selectable.
                Name pills, no logos. */}
            <div className="mt-9 border-t border-line pt-6">
              <ul
                className={cn(
                  /* Phones: one native horizontal scroll strip, no page
                     overflow. Desktop: wrap. shrink-0 on the items is
                     load-bearing — a flex item in the strip may shrink
                     to min-content and squash its label. */
                  "-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1",
                  "lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0",
                )}
                aria-label="Choose a client story"
              >
                {clientStories.map((s, i) => (
                  <li key={s.id} className="shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show ${s.short} story`}
                      aria-current={i === index}
                      className={cn(
                        /* One selector-pill language, shared with the work
                           gallery's filter chips: solid accent when active,
                           soft accent wash + accent border on hover, a
                           gentle press. */
                        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold",
                        "transition-[color,border-color,background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)]",
                        "active:scale-[0.97] motion-reduce:active:scale-100",
                        i === index
                          ? "border-transparent bg-accent text-on-accent"
                          : "border-line text-muted hover:border-accent/60 hover:bg-accent-soft hover:text-accent-ink",
                      )}
                    >
                      {s.short}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* ---- 3. sequential controls + the one internal CTA ---- */}
          <Reveal delay={220} className="min-w-0 lg:col-start-1 lg:row-start-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous client"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-[color,border-color,background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] hover:scale-105 hover:border-accent/60 hover:bg-accent-soft/60 hover:text-accent-ink active:scale-95 motion-reduce:transform-none"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next client"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-[color,border-color,background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] hover:scale-105 hover:border-accent/60 hover:bg-accent-soft/60 hover:text-accent-ink active:scale-95 motion-reduce:transform-none"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* 01 / 09 — the visitor always knows where they are */}
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
              {`Client ${index + 1} of ${count}: ${story.name}, ${story.industry}`}
            </span>

            {/* ONE internal CTA, to the existing estimator — visitors stay
                on this page; no external links anywhere in the section. */}
            <div className="mt-8">
              <Button href="#estimator" size="lg">
                {testimonialsSection.cta}
                <Arrow />
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
