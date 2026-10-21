"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { process, processSteps } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 6 — How it works. THE PROJECT JOURNEY ROADMAP, 2026-10-21
 * (second pass, same day: ONE design on every device).
 *
 * MIDIS's follow-up: the phone must show the SAME winding roadmap as the
 * desktop, not a separate vertical timeline. So there is now exactly one
 * composition — numbered milestone badges on a continuous S-path — and
 * what responds is the grid underneath it:
 *
 *   < md   two columns, serpentine: 01 → 02, a right turn down,
 *          04 ← 03 back across, a left turn down, into 05 centred on
 *          the final row — the destination.
 *   >= lg  three columns: 01 → 02 → 03, the turn down the right edge,
 *          05 ← 04 across the second row.
 *
 * THE PATH IS MEASURED, NEVER AUTHORED. After every layout change a
 * ResizeObserver reads the five badge centres and the five description
 * boxes, then generates the legs: a gentle alternating wave between
 * same-row badges, and for each row change a rounded side-turn whose
 * vertical run is placed PAST the measured text (plus the board's own
 * side padding below lg), so the path cannot cross a word at any
 * viewport. The turn's side follows the direction of travel — right
 * after a left-to-right row, left after a right-to-left one. Arrowheads
 * are sampled from the rendered legs (getPointAtLength), so they sit on
 * the curve, angled along it.
 *
 * THE ANIMATION now plays on every device: milestone, leg draws on,
 * next milestone, one pulse on Launch & Grow. Same guards as Reveal —
 * the server renders everything visible (data-anim="static"); "pending"
 * only exists client-side when motion is allowed and the board is still
 * below the viewport; reduced-motion CSS force-finishes the lot; the
 * board returns to "static" after one play so reflows never replay it.
 *
 * ORDER FOR MACHINES. One <ol>, steps 1–5 in DOM order; the S is grid
 * placement only. The SVG is aria-hidden — the list already says
 * everything the path draws.
 */

/* ---- the five milestone icons (lucide-style strokes, drawn inline) ---- */

const ICON_PATHS: Record<string, React.JSX.Element> = {
  "01": (
    /* Discover — a compass */
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.9 9.1-1.8 4.6-4.6 1.8 1.8-4.6z" />
    </>
  ),
  "02": (
    /* Strategise & Design — a pen */
    <>
      <path d="M17.2 2.8a2.6 2.6 0 1 1 3.7 3.7L7.6 19.8 2 21.7l1.9-5.6Z" />
      <path d="m14.5 5.5 3.7 3.7" />
    </>
  ),
  "03": (
    /* Develop — code */
    <>
      <path d="m8 7-5 5 5 5" />
      <path d="m16 7 5 5-5 5" />
    </>
  ),
  "04": (
    /* Test & Refine — a check in a circle */
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.6 2.6L16 9.6" />
    </>
  ),
  "05": (
    /* Launch & Grow — a rocket */
    <>
      <path d="m12 15-3-3a21 21 0 0 1 2-3.9A12.5 12.5 0 0 1 21.5 2.5c0 2.6-.8 7.2-5.8 10.6a21 21 0 0 1-3.7 1.9z" />
      <path d="M9 12H4.5S5 9.2 6.4 8.3C7.9 7.3 11 8.3 11 8.3" />
      <path d="M12 15v4.5s2.8-.5 3.7-1.9c1-1.5 0-4.6 0-4.6" />
    </>
  ),
};

function StepIcon({ number, className }: { number: string; className?: string }) {
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
      {ICON_PATHS[number]}
    </svg>
  );
}

/* ---- roadmap geometry ---- */

interface Point {
  x: number;
  y: number;
}

interface ArrowMark {
  x: number;
  y: number;
  angle: number;
  /** Which leg the arrow belongs to — it fades in with it. */
  leg: number;
}

/** Grid placement. Phones: a 2-column serpentine ending on a centred
    final row. From md: the 3-column S. DOM order stays 1–5 throughout. */
const GRID_AREA = [
  "col-start-1 row-start-1 lg:col-start-1 lg:row-start-1",
  "col-start-2 row-start-1 lg:col-start-2 lg:row-start-1",
  "col-start-2 row-start-2 lg:col-start-3 lg:row-start-1",
  "col-start-1 row-start-2 lg:col-start-3 lg:row-start-2",
  "col-span-2 row-start-3 lg:col-span-1 lg:col-start-1 lg:row-start-2",
];

/** A gentle wave for a same-row run; bows alternate so the path breathes. */
function waveLeg(a: Point, b: Point, bow: number): string {
  const dx = (b.x - a.x) * 0.38;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y + bow}, ${b.x - dx} ${b.y - bow}, ${b.x} ${b.y}`;
}

/** A row change: out to `safeX` (measured past the text), two rounded
    corners, back in. Works on either side — `safeX` may be left or right
    of both badges. */
function turnLeg(a: Point, b: Point, safeX: number): string {
  const side = safeX >= a.x ? 1 : -1;
  const r = Math.min(
    48,
    Math.abs(b.y - a.y) / 4,
    Math.abs(safeX - a.x) / 2,
    Math.abs(safeX - b.x) / 2,
  );
  return [
    `M ${a.x} ${a.y}`,
    `H ${safeX - side * r}`,
    `Q ${safeX} ${a.y} ${safeX} ${a.y + r}`,
    `V ${b.y - r}`,
    `Q ${safeX} ${b.y} ${safeX - side * r} ${b.y}`,
    `H ${b.x}`,
  ].join(" ");
}

const PLAY_TOTAL_MS = 4 * 680 + 1900;

export function Process() {
  const boardRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const legRefs = useRef<(SVGPathElement | null)[]>([]);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [legs, setLegs] = useState<string[]>([]);
  const [arrows, setArrows] = useState<ArrowMark[]>([]);
  /* "static": everything visible (the SSR state and the resting state).
     "pending": hidden, waiting for the viewport. "play": the sequence. */
  const [anim, setAnim] = useState<"static" | "pending" | "play">("static");
  const [hotLeg, setHotLeg] = useState<number | null>(null);

  /* Measure badges and text, then rebuild the four legs through them. */
  const build = useCallback(() => {
    const board = boardRef.current;
    if (!board || board.offsetWidth === 0) return;

    const boardRect = board.getBoundingClientRect();
    const points: Point[] = [];
    for (const badge of badgeRefs.current) {
      if (!badge) return;
      const r = badge.getBoundingClientRect();
      points.push({
        x: r.left - boardRect.left + r.width / 2,
        y: r.top - boardRect.top + r.height / 2,
      });
    }
    if (points.length !== 5) return;

    const paras = Array.from(board.querySelectorAll(".pr-stone p")).map(
      (p) => {
        const r = p.getBoundingClientRect();
        return {
          left: r.left - boardRect.left,
          right: r.right - boardRect.left,
        };
      },
    );
    if (paras.length !== 5) return;

    const next: string[] = [];
    let bowSign = 1;
    for (let i = 0; i < 4; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (Math.abs(a.y - b.y) < 12) {
        next.push(waveLeg(a, b, 16 * bowSign));
        bowSign = -bowSign;
      } else {
        /* The turn continues the row's direction of travel outward. */
        const dir = i > 0 && points[i].x < points[i - 1].x ? -1 : 1;
        const clear = 26;
        const safeX =
          dir === 1
            ? Math.min(
                boardRect.width - 3,
                Math.max(
                  Math.max(paras[i].right, paras[i + 1].right) + clear,
                  Math.max(a.x, b.x) + 44,
                ),
              )
            : Math.max(
                3,
                Math.min(
                  Math.min(paras[i].left, paras[i + 1].left) - clear,
                  Math.min(a.x, b.x) - 44,
                ),
              );
        next.push(turnLeg(a, b, safeX));
      }
    }

    setSize({ w: boardRect.width, h: boardRect.height });
    setLegs(next);
  }, []);

  /* Rebuild whenever the grid reflows — text wrap, zoom, breakpoint.
     The first build waits a frame so the measurement-driven setState
     never lands synchronously inside the effect. */
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const raf = requestAnimationFrame(build);
    const observer = new ResizeObserver(build);
    observer.observe(board);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [build]);

  /* Arrowheads: sample each RENDERED leg mid-length so they sit on the
     curve exactly, angled along its tangent. */
  useEffect(() => {
    if (legs.length !== 4) return;
    const raf = requestAnimationFrame(() => {
      const marks: ArrowMark[] = [];
      legRefs.current.forEach((path, index) => {
        if (!path) return;
        let total = 0;
        try {
          total = path.getTotalLength();
        } catch {
          return;
        }
        if (!total) return;
        const stops = index === 3 ? [0.35, 0.68] : [0.52];
        for (const stop of stops) {
          const p = path.getPointAtLength(total * stop);
          const q = path.getPointAtLength(Math.min(total, total * stop + 2));
          marks.push({
            x: p.x,
            y: p.y,
            angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI,
            leg: index,
          });
        }
      });
      setArrows(marks);
    });
    return () => cancelAnimationFrame(raf);
  }, [legs]);

  /* The entrance, with Reveal's guards: visible unless we KNOW we can
     animate; back to static once the sequence has finished. */
  useEffect(() => {
    const board = boardRef.current;
    if (!board || board.offsetWidth === 0) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    if (board.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    const raf = requestAnimationFrame(() => setAnim("pending"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setAnim("play");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.05 },
    );
    observer.observe(board);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (anim !== "play") return;
    const timer = window.setTimeout(() => setAnim("static"), PLAY_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, [anim]);

  return (
    <Section id="process" tone="surface" labelledBy="process-heading">
      <SectionHeader
        eyebrow="How it works"
        heading={process.headline}
        headingId="process-heading"
        sub={process.subheadline}
        aside={
          <Button href={process.cta.href} size="lg" variant="secondary">
            {process.cta.label}
            <Arrow />
          </Button>
        }
      />

      <div className="container-site mt-[var(--space-block)]">
        {/* ============ the roadmap board ============ */}
        {/* The side padding below md is the gutter the side-turns run in. */}
        <div
          ref={boardRef}
          data-anim={anim}
          className="pr-board relative px-4 sm:px-7 lg:px-0"
        >
          {/* the path — decoration; the <ol> carries the content */}
          {legs.length === 4 && size.w > 0 ? (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${size.w} ${size.h}`}
              preserveAspectRatio="none"
            >
              {legs.map((d, index) => (
                <path key={`base-${index}`} d={d} className="pr-leg-base" />
              ))}
              {legs.map((d, index) => (
                <path
                  key={`ink-${index}`}
                  ref={(el) => {
                    legRefs.current[index] = el;
                  }}
                  d={d}
                  pathLength={1}
                  className={cn("pr-leg-ink", hotLeg === index && "pr-leg-hot")}
                  style={{ "--leg": index } as React.CSSProperties}
                />
              ))}
              {arrows.map((mark, index) => (
                <path
                  key={`arrow-${index}`}
                  d="M -5 -4.5 L 2 0 L -5 4.5"
                  className="pr-arrowhead"
                  style={{ "--leg": mark.leg } as React.CSSProperties}
                  transform={`translate(${mark.x} ${mark.y}) rotate(${mark.angle})`}
                />
              ))}
            </svg>
          ) : null}

          <ol className="grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-8 md:gap-y-20 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-28">
            {processSteps.map((step, index) => {
              const isLast = index === processSteps.length - 1;
              return (
                <li
                  key={step.number}
                  data-last={isLast || undefined}
                  className={cn("pr-stone relative text-center", GRID_AREA[index])}
                  style={{ "--stone": index } as React.CSSProperties}
                  onMouseEnter={() => setHotLeg(index === 0 ? null : index - 1)}
                  onMouseLeave={() => setHotLeg(null)}
                >
                  {/* ---- the milestone badge: the path runs through its
                          centre, so it doubles as the join cover ---- */}
                  <span
                    ref={(el) => {
                      badgeRefs.current[index] = el;
                    }}
                    className={cn(
                      "pr-badge relative z-[1] mx-auto grid size-11 place-items-center rounded-full border md:size-12 lg:size-14",
                      isLast
                        ? "border-accent bg-accent text-on-accent"
                        : "border-accent/35 bg-paper text-accent-ink",
                    )}
                  >
                    <StepIcon
                      number={step.number}
                      className="size-[1.1rem] md:size-5 lg:size-6"
                    />
                    <span
                      className={cn(
                        "absolute -right-1.5 -top-1.5 grid min-w-[1.1rem] place-items-center rounded-full px-1 font-display text-[0.55rem] font-bold leading-[1.1rem] md:min-w-5 md:text-[0.625rem] md:leading-5",
                        isLast ? "bg-fg text-paper" : "bg-accent text-on-accent",
                      )}
                    >
                      {step.number}
                    </span>
                  </span>

                  <div
                    className={cn(
                      "mx-auto mt-3 min-w-0 lg:mt-4",
                      /* The step 05 island is centred on its own row below
                         md; cap its width so the line length stays right.
                         The md right-hand column leaves room for the turn:
                         its text is a touch narrower than the others. */
                      isLast && "max-w-[30ch]",
                      index === 2 || index === 3
                        ? "md:max-w-[28ch] lg:max-w-[24ch]"
                        : "md:max-w-[30ch] lg:max-w-[30ch]",
                    )}
                  >
                    <h3 className="pr-title text-[0.9375rem] font-semibold leading-snug md:text-base lg:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted md:mt-2 md:text-sm lg:text-[0.9375rem]">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
}
