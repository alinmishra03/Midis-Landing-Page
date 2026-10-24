"use client";

import { useRef, useState } from "react";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Arrow, Button } from "@/components/ui/Button";
import {
  clientStories,
  testimonialsSection,
  type ClientStory,
} from "@/content/testimonials";
import { cn } from "@/lib/utils";

/**
 * SECTION — Words From Our Clients. CLIENT FEEDBACK, 2026-10-21; glass
 * card redesign 2026-10-24.
 *
 * NO LOGOS — removed on the user's instruction. The selector is a rail of
 * company-name pills; the featured glass card carries the quote mark, the
 * content, and a text attribution.
 *
 * WHAT RENDERS. One client at a time. If that client's feedback draft has
 * `approved: true` — the client has seen their exact words and okayed
 * publication — it renders as a real <blockquote> with quotation marks
 * under a "Client Feedback" label. Until then the card shows the factual
 * project spotlight as a plain paragraph under a "Project Spotlight"
 * label, because publishing words a client never said, under their name,
 * is a fabricated review no matter who wrote them. Flipping one flag per
 * client in content/testimonials.ts publishes their quote with no code
 * change.
 *
 * NO LAYOUT SHIFT. Every story is rendered into the same grid cell; only
 * the active one is visible, the rest are `invisible` and aria-hidden. The
 * card is therefore always as tall as the longest story, so switching
 * clients never moves the page beneath the visitor.
 *
 * NAVIGATION. The pill rail selects any client directly; previous/next
 * wrap around; a tabular "01 / 09" counter, a progress hairline and an
 * aria-live announcement track position. Arrow keys (Home/End too) work
 * anywhere inside the carousel, and a horizontal swipe on the card works
 * on touch screens. Nothing auto-advances.
 *
 * TRANSITIONS. The active story remounts (key=index) and slides in from
 * the side it was navigated towards (.t-slide, --dir), the attribution
 * follows (.t-attr), and the accent glow drifts per story (.t-wash). All
 * opacity/transform, all removed by reduced-motion in globals.css.
 */

function QuoteMark() {
  return (
    <svg
      viewBox="0 0 48 36"
      aria-hidden="true"
      className="h-11 w-auto text-accent/45 sm:h-14"
      fill="currentColor"
    >
      <path d="M0 36V21.6C0 15.3 1.4 10.2 4.2 6.4 7 2.6 11.2.4 16.8 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6h8.2V36H0Zm27.8 0V21.6c0-6.3 1.4-11.4 4.2-15.2C34.8 2.6 39 .4 44.6 0v6.9c-3 .5-5.2 1.8-6.6 3.9-1.1 1.6-1.7 3.6-1.8 6H44V36H27.8Z" />
    </svg>
  );
}

/**
 * One story's card content. `live` marks the visible one: it animates in
 * and owns the semantics. The others only reserve height.
 */
function StoryBody({ story, live }: { story: ClientStory; live: boolean }) {
  const approved = story.feedback.approved;
  const text = approved ? story.feedback.quote : story.spotlight;

  return (
    <div className={cn(live ? "t-slide" : "invisible")} aria-hidden={live ? undefined : true}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <QuoteMark />
        {/* The reader knows what they are reading BEFORE they read it: a
            client's words, or MIDIS's factual description. */}
        <span className="shrink-0 rounded-full border border-accent/25 bg-accent-soft/70 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent-ink">
          {approved
            ? testimonialsSection.testimonialLabel
            : testimonialsSection.spotlightLabel}
        </span>
      </div>

      {/* THE DISTINCTION, STRUCTURALLY: approved feedback is a blockquote
          with quotation marks; the fallback spotlight is a plain paragraph
          MIDIS wrote. */}
      {approved ? (
        <blockquote className="mt-6 max-w-[34ch] text-pretty font-display text-[1.25rem] font-medium leading-[1.42] tracking-[-0.015em] text-fg sm:mt-7 sm:text-[1.5rem] lg:text-[1.75rem] lg:leading-[1.38]">
          {"“"}
          {text}
          {"”"}
        </blockquote>
      ) : (
        <p className="mt-6 max-w-[48ch] text-pretty text-base leading-relaxed text-muted-strong sm:mt-7 sm:text-lg">
          {text}
        </p>
      )}

      {/* the attribution: company and industry, text only */}
      <div
        className={cn(
          "mt-8 flex items-center gap-4 border-t border-line/70 pt-6 sm:mt-9",
          live && "t-attr",
        )}
        style={live ? ({ "--wd": "140ms" } as React.CSSProperties) : undefined}
      >
        <span aria-hidden="true" className="h-0.5 w-10 shrink-0 rounded-full bg-accent" />
        <span className="min-w-0">
          <span className="block font-display text-base font-semibold leading-snug text-fg sm:text-lg">
            {story.name}
          </span>
          <span className="mt-0.5 block text-xs font-semibold uppercase leading-snug tracking-wider text-accent-ink">
            {story.industry}
          </span>
        </span>
      </div>

      {!approved && story.services ? (
        /* Only the three portfolio-documented engagements carry a services
           line — content/testimonials.ts explains why. */
        <ul
          className={cn("mt-5 flex flex-wrap gap-2", live && "t-attr")}
          style={live ? ({ "--wd": "220ms" } as React.CSSProperties) : undefined}
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
    </div>
  );
}

const arrowButton = cn(
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface/70 text-fg",
  "transition-[color,border-color,background-color,box-shadow] duration-300 ease-[var(--ease-out-quart)]",
  "hover:border-accent/60 hover:bg-accent-soft hover:text-accent-ink hover:shadow-[0_8px_20px_-12px_rgb(239_135_22/0.6)]",
  "active:scale-95 motion-reduce:active:scale-100",
);

export function Testimonials() {
  const [{ index, dir }, setState] = useState({ index: 0, dir: 1 });
  const count = clientStories.length;
  const story = clientStories[index];
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  /** Select a story; `direction` decides which side it slides in from. */
  const select = (next: number, direction?: number) => {
    const target = (next + count) % count;
    if (target === index) return;
    setState({ index: target, dir: direction ?? (target > index ? 1 : -1) });
  };
  /* Wrap around: the last story's "next" is the first. */
  const go = (delta: number) => select(index + delta, delta);

  const onKeyDown = (event: React.KeyboardEvent) => {
    let next: number | null = null;
    let direction = 1;
    if (event.key === "ArrowRight") next = index + 1;
    else if (event.key === "ArrowLeft") {
      next = index - 1;
      direction = -1;
    } else if (event.key === "Home") {
      next = 0;
      direction = -1;
    } else if (event.key === "End") next = count - 1;
    if (next === null) return;
    const onPill = pillRefs.current.includes(event.target as HTMLButtonElement);
    /* Home/End keep their page-scroll meaning outside the pill rail. */
    if ((event.key === "Home" || event.key === "End") && !onPill) return;
    event.preventDefault();
    const target = (next + count) % count;
    select(target, direction);
    /* Focus follows the selection when it started on a pill, so the rail
       behaves like a tab list for keyboard users. */
    if (onPill) pillRefs.current[target]?.focus();
  };

  /* Touch swipe on the card. touch-action: pan-y leaves vertical scrolling
     to the browser; a mostly-horizontal drag past 48px changes story. */
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
  };

  return (
    <Section id="testimonials" tone="surface" veil="soft" labelledBy="testimonials-heading">
      <div className="container-site">
        <div
          className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10 xl:gap-x-20"
          onKeyDown={onKeyDown}
        >
          {/* ---- 1. the header ---- */}
          <div className="min-w-0 lg:pt-4">
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

          {/* ---- 2. the glass card + the client rail ---- */}
          <Reveal delay={140} className="min-w-0 lg:row-span-2">
            <div
              role="region"
              aria-roledescription="carousel"
              aria-label="Client feedback — use the arrow keys or swipe to change client"
              tabIndex={0}
              className="t-card touch-pan-y p-6 sm:p-9 lg:p-11"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipeStart.current = null)}
            >
              {/* the accent glow that drifts as the stories change */}
              <div
                key={`wash-${index}`}
                aria-hidden="true"
                className="t-wash pointer-events-none absolute inset-0 -z-10"
                style={{
                  background: `radial-gradient(26rem 16rem at ${12 + (index % 4) * 25}% 0%, rgb(239 135 22 / 0.1), transparent 70%)`,
                }}
              />

              {/* Every story in one cell: the tallest sets the height. */}
              <div className="grid [&>*]:[grid-area:1/1]">
                {clientStories.map((s, i) =>
                  i === index ? (
                    <article
                      key={`live-${i}`}
                      aria-label={s.name}
                      style={{ "--dir": dir } as React.CSSProperties}
                    >
                      <StoryBody story={s} live />
                    </article>
                  ) : (
                    <StoryBody key={s.id} story={s} live={false} />
                  ),
                )}
              </div>
            </div>

            {/* the client rail: all nine, each directly selectable */}
            <ul
              className={cn(
                /* Phones/tablets: one native horizontal scroll strip, no
                   page overflow, faded at the edges. Desktop: wrap.
                   shrink-0 on the items is load-bearing — a flex item in
                   the strip may shrink to min-content and squash its label. */
                "t-rail -mx-1 mt-6 flex snap-x gap-2 overflow-x-auto px-1 py-1",
                "lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0",
              )}
              aria-label="Choose a client story"
            >
              {clientStories.map((s, i) => (
                <li key={s.id} className="shrink-0 snap-start">
                  <button
                    ref={(el) => {
                      pillRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => select(i)}
                    aria-label={`Show ${s.short} story`}
                    aria-current={i === index}
                    tabIndex={i === index ? 0 : -1}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.8125rem] font-semibold",
                      "transition-[color,border-color,background-color,box-shadow] duration-300 ease-[var(--ease-out-quart)]",
                      "active:scale-[0.97] motion-reduce:active:scale-100",
                      i === index
                        ? /* The glow only where the rail wraps: the phone
                             strip's overflow would clip it to a hard edge. */
                          "border-accent bg-accent text-on-accent lg:shadow-[0_8px_22px_-12px_rgb(239_135_22/0.75)]"
                        : "border-line bg-surface/60 text-muted hover:border-accent/50 hover:bg-accent-soft hover:text-accent-ink",
                    )}
                  >
                    {s.short}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ---- 3. sequential controls + the one internal CTA ---- */}
          <Reveal delay={220} className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-end">
            <div className="flex items-center gap-3 sm:gap-4">
              <button type="button" onClick={() => go(-1)} aria-label="Previous client" className={arrowButton}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next client" className={arrowButton}>
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
              <span aria-hidden="true" className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]"
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
