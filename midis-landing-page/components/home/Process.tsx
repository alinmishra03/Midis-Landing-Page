"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Arrow, Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { process, processSteps } from "@/content/sections";

/**
 * SECTION 6 — How it works. THE PROCESS RIBBON (MIDIS brief, 2026-10-23;
 * replaces the thin-line milestone roadmap of 2026-10-21).
 *
 * ONE THICK, CONTINUOUS RIBBON winds through the five stages, after the
 * classic serpentine process chart: straight runs joined by rounded
 * U-turns, the step number and title riding INSIDE the ribbon, each
 * description set just beneath its own run.
 *
 *   >= lg   three runs — 01 → 02, a U-turn down the right, 03 ← 04 back
 *           across (03 first: the ribbon now travels right-to-left), a
 *           U-turn down the left, and 05 → to the arrowhead, its
 *           description beside it.
 *   <  lg   one stage per run, alternating direction, U-turns down
 *           alternate sides — the same ribbon, turned into a vertical
 *           journey a phone can read at full size.
 *
 * LAYOUT IS CSS, GEOMETRY IS MEASURED. The grid ("PROCESS RIBBON" in
 * globals.css) places every label and description; a ResizeObserver then
 * reads where the labels actually landed and builds the ribbon's centre
 * line through them — straight runs at the labels' centres, U-turns sized
 * to the real gap between runs, inside the turn columns the grid reserves.
 * No hand-placed offsets: any viewport, any wrap, the ribbon fits.
 *
 * THE PROGRESS is the same path again, in orange, revealed by scroll
 * (stroke-dashoffset on a pathLength of 1), so it follows the ribbon
 * exactly — runs, turns and all. Scroll work is one rAF-coalesced passive
 * listener that writes to the DOM directly: no React state per frame. A
 * stage counts as reached when the fill passes the middle of its run; its
 * label then flips to charcoal-on-orange. Reduced motion: the ribbon is
 * shown complete, every stage reached, nothing moves.
 *
 * BEFORE MEASUREMENT (server render, no JS) each label carries its own
 * charcoal pill, so all five stages read in order without the SVG.
 *
 * ORDER FOR MACHINES: one <ol>, stages 01–05 in DOM order — the serpentine
 * is grid placement only. Each label is a button (aria-pressed) that
 * highlights its stage in place; the SVG is aria-hidden decoration.
 */

/* ---- geometry ---- */

interface Run {
  /** Centre line of this run. */
  y: number;
  /** Where the run starts and ends, in the direction of travel. */
  from: number;
  to: number;
}

interface Geometry {
  w: number;
  h: number;
  /** Ribbon thickness (= the band row height). */
  band: number;
  /** The whole centre line. */
  d: string;
  /** Straight segment of each stage, for hover/selection highlights. */
  stageSegments: { x1: number; x2: number; y: number }[];
  /** Fraction of the path at the middle of each stage's segment. */
  stageMid: number[];
  /** Chevron joints between stages: position and direction (+1 → right). */
  joints: { x: number; y: number; dir: 1 | -1 }[];
  /** The closing arrowhead. */
  arrow: { x: number; y: number; dir: 1 | -1 };
  start: { x: number; y: number };
}

/**
 * Build the centre line from the measured runs. Between consecutive runs
 * the ribbon makes a U-turn on the side the first run was heading toward:
 * a quarter circle, a straight drop if the gap is taller than the turn,
 * and a quarter circle back. The turn radius is capped by the reserved
 * turn column, so the ribbon's outer edge never leaves the board.
 */
function buildPath(runs: Run[], turnRoom: number, band: number) {
  let d = `M ${runs[0].from} ${runs[0].y}`;
  let length = 0;
  /** Cumulative length at the start of each run. */
  const runStart: number[] = [];

  runs.forEach((run, index) => {
    runStart.push(length);
    d += ` L ${run.to} ${run.y}`;
    length += Math.abs(run.to - run.from);

    const next = runs[index + 1];
    if (!next) return;
    const dir = run.to > run.from ? 1 : -1;
    const drop = next.y - run.y;
    const radius = Math.max(8, Math.min(drop / 2, turnRoom - band / 2 - 2));
    const straight = drop - radius * 2;
    const sweep = dir === 1 ? 1 : 0;
    const x = run.to;
    d += ` A ${radius} ${radius} 0 0 ${sweep} ${x + dir * radius} ${run.y + radius}`;
    if (straight > 0.5) d += ` L ${x + dir * radius} ${next.y - radius}`;
    d += ` A ${radius} ${radius} 0 0 ${sweep} ${x} ${next.y}`;
    length += Math.PI * radius + Math.max(0, straight);
    /* The next run starts where the turn lands. */
    if (Math.abs(next.from - x) > 0.5) {
      d += ` L ${next.from} ${next.y}`;
      length += Math.abs(next.from - x);
    }
  });

  return { d, length, runStart };
}

function measure(board: HTMLElement, wide: boolean): Geometry | null {
  const box = board.getBoundingClientRect();
  const labels = [...board.querySelectorAll<HTMLElement>("[data-pr-label]")];
  if (labels.length !== 5 || box.width === 0) return null;
  const r = labels.map((el) => {
    const b = el.getBoundingClientRect();
    return {
      left: b.left - box.left,
      right: b.right - box.left,
      cy: b.top - box.top + b.height / 2,
      height: b.height,
    };
  });
  const band = r[0].height;
  const w = box.width;
  const h = box.height;
  /* The turn columns' width, read off the grid: the first label's cell
     starts exactly one turn column in. */
  const turn = r[0].left;
  const startX = Math.max(band / 2, turn * 0.3);

  let runs: Run[];
  let stageRanges: { run: number; x1: number; x2: number }[];
  let joints: Geometry["joints"];

  if (wide) {
    const right = r[1].right;
    const left = r[3].left;
    const mid12 = (r[0].right + r[1].left) / 2;
    const mid34 = (r[3].right + r[2].left) / 2;
    runs = [
      { y: r[0].cy, from: startX, to: right },
      { y: r[2].cy, from: right, to: left },
      { y: r[4].cy, from: left, to: r[4].right },
    ];
    stageRanges = [
      { run: 0, x1: startX, x2: mid12 },
      { run: 0, x1: mid12, x2: right },
      { run: 1, x1: right, x2: mid34 },
      { run: 1, x1: mid34, x2: left },
      { run: 2, x1: left, x2: r[4].right },
    ];
    joints = [
      { x: mid12, y: r[0].cy, dir: 1 },
      /* Joints after a turn sit where the turn lands, clear of the label. */
      { x: right - band * 0.12, y: r[2].cy, dir: -1 },
      { x: mid34, y: r[2].cy, dir: -1 },
      { x: left + band * 0.12, y: r[4].cy, dir: 1 },
    ];
  } else {
    const left = r[0].left;
    const right = r[0].right;
    runs = r.map((cell, index) =>
      index % 2 === 0
        ? { y: cell.cy, from: index === 0 ? startX : left, to: right }
        : { y: cell.cy, from: right, to: left },
    );
    stageRanges = runs.map((run, index) => ({ run: index, x1: run.from, x2: run.to }));
    joints = runs.slice(1).map((run, index) => {
      const dir: 1 | -1 = (index + 1) % 2 === 0 ? 1 : -1;
      return { x: run.from + dir * band * 0.12, y: run.y, dir };
    });
  }

  const { d, length, runStart } = buildPath(runs, turn, band);
  const last = runs[runs.length - 1];
  const lastDir: 1 | -1 = last.to > last.from ? 1 : -1;
  /* Fractions of the stroked path (the arrowhead is drawn separately and
     lights when the fill completes). */
  const stageMid = stageRanges.map((range) => {
    const run = runs[range.run];
    const offset = (Math.abs(range.x1 - run.from) + Math.abs(range.x2 - run.from)) / 2;
    return (runStart[range.run] + offset) / length;
  });

  return {
    w,
    h,
    band,
    d,
    stageSegments: stageRanges.map((range) => ({
      x1: Math.min(range.x1, range.x2),
      x2: Math.max(range.x1, range.x2),
      y: runs[range.run].y,
    })),
    stageMid,
    joints,
    arrow: { x: last.to, y: last.y, dir: lastDir },
    start: { x: startX, y: runs[0].y },
  };
}

/* ---- the component ---- */

export function Process() {
  const boardRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const arrowFillRef = useRef<SVGPathElement>(null);
  const capFillRef = useRef<SVGCircleElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  /* useId output contains ":" / "«»", which break url(#…) references. */
  const idBase = `pr${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  /* Measure on mount and whenever the board or the breakpoint changes. */
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const wideQuery = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setGeo(measure(board, wideQuery.matches)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(board);
    wideQuery.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      wideQuery.removeEventListener("change", update);
    };
  }, []);

  /* Scroll-linked progress — written straight to the DOM. */
  useEffect(() => {
    const board = boardRef.current;
    if (!board || !geo) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stages = [...board.querySelectorAll<HTMLElement>("[data-pr-stage]")];
    let frame = 0;
    let last = -1;

    const apply = (p: number) => {
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      fillRef.current?.style.setProperty("stroke-dashoffset", String(1 - p));
      capFillRef.current?.setAttribute("opacity", p > 0.001 ? "1" : "0");
      arrowFillRef.current?.setAttribute("opacity", p >= 0.995 ? "1" : "0");
      board.style.setProperty("--pr-progress", p.toFixed(4));
      stages.forEach((stage, index) => {
        const reached = p >= geo.stageMid[index];
        if ((stage.dataset.reached === "true") !== reached) {
          stage.dataset.reached = reached ? "true" : "false";
        }
      });
    };

    if (reduce) {
      apply(1);
      return;
    }

    const tick = () => {
      frame = 0;
      const box = board.getBoundingClientRect();
      const line = window.innerHeight * 0.62;
      /* 0 when the board's top reaches the reading line, 1 when its
         bottom does — so the fill keeps pace with the reader. */
      const p = Math.min(1, Math.max(0, (line - box.top) / Math.max(1, box.height)));
      apply(p);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [geo]);

  const focus = hover ?? selected;

  return (
    <Section id="process" tone="surface" veil="rich" labelledBy="process-heading">
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
        <div ref={boardRef} className="pr-board" data-ready={geo ? "" : undefined}>
          {geo ? (
            <svg
              aria-hidden="true"
              className="pr-svg"
              viewBox={`0 0 ${geo.w} ${geo.h}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`${idBase}-fill`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2={geo.w}
                  y2={geo.h}
                >
                  <stop offset="0" stopColor="#F68B13" />
                  <stop offset="1" stopColor="#E9780A" />
                </linearGradient>
              </defs>

              {/* the ribbon: start cap, body, arrowhead */}
              <g className="pr-base">
                <circle cx={geo.start.x} cy={geo.start.y} r={geo.band / 2} />
                <path d={geo.d} strokeWidth={geo.band} fill="none" />
                <ArrowHead geo={geo} />
              </g>

              {/* the progress: the same path, in orange */}
              <g className="pr-fill" style={{ stroke: `url(#${idBase}-fill)`, fill: `url(#${idBase}-fill)` }}>
                <circle
                  ref={capFillRef}
                  cx={geo.start.x}
                  cy={geo.start.y}
                  r={geo.band / 2}
                  opacity="0"
                  stroke="none"
                />
                <path
                  ref={fillRef}
                  d={geo.d}
                  pathLength={1}
                  strokeWidth={geo.band}
                  fill="none"
                  strokeDasharray="1 1"
                  strokeDashoffset="1"
                />
                <ArrowHead geo={geo} ref={arrowFillRef} hidden />
              </g>

              {/* hover / selection: the stage's own run, lit — above the fill, so
                  reached stages light up too */}
              {focus !== null ? (
                <line
                  className="pr-lit"
                  x1={geo.stageSegments[focus].x1}
                  x2={geo.stageSegments[focus].x2}
                  y1={geo.stageSegments[focus].y}
                  y2={geo.stageSegments[focus].y}
                  strokeWidth={geo.band}
                />
              ) : null}

              {/* chevron joints — notches cut through base and fill alike */}
              {geo.joints.map((joint, index) => {
                const a = geo.band * 0.16;
                const half = geo.band / 2;
                return (
                  <polyline
                    key={index}
                    className="pr-joint"
                    points={`${joint.x - joint.dir * a},${joint.y - half} ${joint.x + joint.dir * a},${joint.y} ${joint.x - joint.dir * a},${joint.y + half}`}
                  />
                );
              })}
            </svg>
          ) : null}

          <ol className="pr-grid">
            {processSteps.map((step, index) => {
              const descId = `${idBase}-d${index}`;
              const active = focus === index;
              return (
                <li
                  key={step.number}
                  data-pr-stage=""
                  data-reached="false"
                  data-active={active || undefined}
                  className="pr-stage"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                >
                  <button
                    type="button"
                    data-pr-label=""
                    className="pr-label"
                    aria-pressed={selected === index}
                    aria-describedby={descId}
                    onClick={() => setSelected((value) => (value === index ? null : index))}
                    onFocus={() => setHover(index)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="pr-num">{step.number}</span>
                    <span className="pr-name">{step.title}</span>
                  </button>
                  <p id={descId} className="pr-desc">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
}

/** The closing arrowhead: a triangle as tall as the ribbon plus a lip. */
function ArrowHead({
  geo,
  hidden,
  ref,
}: {
  geo: Geometry;
  hidden?: boolean;
  ref?: React.Ref<SVGPathElement>;
}) {
  const { x, y, dir } = geo.arrow;
  const half = geo.band / 2 + geo.band * 0.16;
  const len = geo.band * 0.6;
  /* Starts a hair behind the run's end so there is no hairline seam. */
  const x0 = x - dir * 1;
  return (
    <path
      ref={ref}
      d={`M ${x0} ${y - half} L ${x + dir * len} ${y} L ${x0} ${y + half} Z`}
      stroke="none"
      opacity={hidden ? 0 : undefined}
    />
  );
}
