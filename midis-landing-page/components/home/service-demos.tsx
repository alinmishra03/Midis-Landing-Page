"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SIX SERVICE DEMONSTRATIONS — one signature visual per service (MIDIS
 * services-redesign brief, 2026-10-21).
 *
 * Each component is a self-contained miniature "product demo" that plays on
 * the Services stage when its service is selected. They share one visual
 * language — theme tokens only (paper/surface/line/fg/muted/accent), tiny
 * interface chrome, the site's easing — while each moves differently:
 *
 *   01 assembly      an interface builds itself, block by block
 *   02 comparison    wireframe → finished UI behind a draggable divider
 *   03 interaction   a product card with a working add-to-cart moment
 *   04 transformation a dated page wipes into its redesign
 *   05 sequence      a search types itself and results surface
 *   06 flow          an enquiry travels a connected workflow
 *
 * HONESTY RULES, inherited from the content brief: no fabricated metrics,
 * rankings, traffic numbers or client material anywhere in these demos. The
 * e-commerce card is labelled "Demo", the redesign comparison "Illustrative
 * example", the search results "Illustrative" — fictional interfaces are
 * marked as such, exactly like the sample testimonials are.
 *
 * ACCESSIBILITY. The artwork is decorative and aria-hidden; every REAL
 * control (the comparison slider, the size/add-to-cart buttons, the
 * before/after toggle) is a native element with its own accessible name.
 * All one-shot animations use fill-mode so the RESTING CSS state is the
 * finished frame — under prefers-reduced-motion the animations are simply
 * removed (globals.css) and every demo renders complete and legible.
 *
 * All animation is transform/opacity/clip-path (+ one dashoffset loop in
 * the SVG workflow), so the stage never causes layout work.
 */

/* A tinted rectangle — the demos' drawing primitive. */
function Block({ className, d }: { className?: string; d?: number }) {
  return (
    <div
      className={cn("demo-pop rounded", className)}
      style={{ "--d": `${d ?? 0}ms` } as React.CSSProperties}
    />
  );
}

/* ==========================================================================
   01 — WEBSITE DESIGN & DEVELOPMENT: the interface assembles itself.
   ========================================================================== */

export function DemoWebDev() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center p-4 sm:p-7">
      <div
        className="demo-pop flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-[0_14px_36px_-28px_rgb(20_21_24/0.5)]"
        style={{ "--d": "0ms" } as React.CSSProperties}
      >
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-fg/15" />
            <span className="size-2 rounded-full bg-fg/15" />
            <span className="size-2 rounded-full bg-fg/15" />
          </span>
          <span className="demo-pop mx-auto flex h-4.5 w-36 items-center justify-center rounded-full bg-surface-2 text-[9px] font-medium text-muted" style={{ "--d": "150ms" } as React.CSSProperties}>
            yourbusiness.com
          </span>
          <span className="w-8" />
        </div>

        {/* the page, assembling */}
        <div className="flex flex-col gap-2.5 p-4">
          {/* nav */}
          <div className="flex items-center gap-2">
            <Block className="size-3.5 rounded-full bg-accent" d={280} />
            <Block className="ml-auto h-2 w-8 bg-fg/15" d={340} />
            <Block className="h-2 w-8 bg-fg/15" d={400} />
            <Block className="h-2 w-8 bg-fg/15" d={460} />
          </div>
          {/* hero copy */}
          <Block className="demo-grow mt-2 h-3.5 w-3/4 bg-fg/80" d={560} />
          <Block className="demo-grow h-3.5 w-1/2 bg-fg/80" d={660} />
          <Block className="h-2 w-2/3 bg-fg/15" d={780} />
          <Block className="mt-1 h-6 w-24 rounded-full bg-accent" d={900} />
          {/* media band */}
          <Block
            className="mt-2 h-16 rounded-lg bg-[linear-gradient(120deg,rgb(239_135_22/0.18),rgb(239_135_22/0.05)_55%,rgb(20_21_24/0.06))]"
            d={1040}
          />
          {/* card row */}
          <div className="grid grid-cols-3 gap-2">
            {[1180, 1280, 1380].map((d) => (
              <div key={d} className="demo-pop rounded-lg border border-line bg-surface p-2" style={{ "--d": `${d}ms` } as React.CSSProperties}>
                <span className="block h-1.5 w-3/4 rounded bg-fg/60" />
                <span className="mt-1.5 block h-1 rounded bg-fg/12" />
                <span className="mt-1 block h-1 w-2/3 rounded bg-fg/12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   02 — UI/UX DESIGN: wireframe → finished interface, draggable divider.
   ========================================================================== */

/* One layout rendered twice: `wire` draws it as a dashed grey wireframe,
   otherwise as the finished UI. Identical geometry is what makes the
   comparison read as the same screen maturing. */
function UiuxBoard({ wire }: { wire: boolean }) {
  const box = wire ? "border border-dashed border-fg/30 bg-transparent" : "";
  return (
    <div className={cn("absolute inset-0 flex flex-col gap-2.5 p-4 sm:p-5", wire ? "bg-surface-2" : "bg-paper")}>
      <div className="flex items-center gap-2">
        <span className={cn("size-4 rounded-full", wire ? box : "bg-accent")} />
        <span className={cn("h-2 w-14 rounded", wire ? box : "bg-fg/70")} />
        <span className={cn("ml-auto h-5 w-14 rounded-full", wire ? box : "bg-accent")} />
      </div>
      <span className={cn("mt-2 h-3 w-2/3 rounded", wire ? box : "bg-fg/80")} />
      <span className={cn("h-2 w-1/2 rounded", wire ? box : "bg-fg/15")} />
      <div className="mt-2 grid flex-1 grid-cols-[1.3fr_1fr] gap-2.5">
        <span className={cn("rounded-lg", wire ? box : "bg-[linear-gradient(135deg,rgb(239_135_22/0.2),rgb(239_135_22/0.06))]")} />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("flex-1 rounded-lg", wire ? box : "border border-line bg-surface")} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DemoUiux() {
  const [pos, setPos] = useState(55);
  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-7">
      <div
        className="demo-compare relative aspect-[16/11] w-full max-w-md overflow-hidden rounded-xl border border-line shadow-[0_14px_36px_-28px_rgb(20_21_24/0.5)]"
        style={{ "--pos": `${pos}%` } as React.CSSProperties}
      >
        <div aria-hidden="true">
          <UiuxBoard wire />
          {/* The finished layer, clipped to the left of the divider. */}
          <div className="absolute inset-0" style={{ clipPath: "inset(0 calc(100% - var(--pos)) 0 0)" }}>
            <UiuxBoard wire={false} />
          </div>
          {/* labels + divider */}
          <span className="demo-chip absolute left-2.5 top-2.5">Final UI</span>
          <span className="demo-chip absolute right-2.5 top-2.5">Wireframe</span>
          <div className="demo-compare-divider" />
        </div>
        <input
          type="range"
          min={2}
          max={98}
          value={pos}
          onChange={(event) => setPos(Number(event.target.value))}
          aria-label="Compare the wireframe with the finished interface"
          className="demo-compare-input"
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   03 — E-COMMERCE & SHOPIFY: a product card with a working cart moment.
   ========================================================================== */

export function DemoEcommerce() {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function addToCart() {
    if (added) return;
    setAdded(true);
    setCount((c) => c + 1);
    timer.current = window.setTimeout(() => setAdded(false), 1700);
  }

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-7">
      <div className="demo-pop w-full max-w-72 rounded-xl border border-line bg-paper p-4 shadow-[0_14px_36px_-28px_rgb(20_21_24/0.5)]" style={{ "--d": "80ms" } as React.CSSProperties}>
        {/* store chrome: honest label + a live cart */}
        <div className="flex items-center justify-between">
          <span className="demo-chip">Demo store</span>
          <span className="relative inline-flex text-fg" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L17 7H6" />
              <circle cx="8.5" cy="16.5" r="1.1" />
              <circle cx="14.5" cy="16.5" r="1.1" />
            </svg>
            {count > 0 ? (
              <span key={count} className="demo-cart-badge">{count}</span>
            ) : null}
          </span>
        </div>

        {/* abstract product — a drawn object, not a stock photograph */}
        <div aria-hidden="true" className="mt-3 flex h-24 items-center justify-center rounded-lg bg-[linear-gradient(140deg,rgb(239_135_22/0.22),rgb(239_135_22/0.05)_60%,rgb(20_21_24/0.05))]">
          <span className="block h-14 w-10 rounded-[40%_40%_46%_46%/18%_18%_72%_72%] bg-[linear-gradient(160deg,var(--color-accent),rgb(170_90_10))] shadow-[inset_-4px_-6px_12px_rgb(0_0_0/0.18),0_8px_14px_-8px_rgb(239_135_22/0.7)]" />
        </div>

        <p className="mt-3 text-[0.8125rem] font-semibold text-fg">Studio Carafe — Amber</p>
        <p className="mt-0.5 text-xs text-muted">$48 · Free shipping</p>

        {/* size selection */}
        <div className="mt-2.5 flex gap-1.5" role="group" aria-label="Choose a size (demo)">
          {["S", "M", "L"].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-[var(--dur-fast)]",
                size === s
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line text-muted hover:border-fg/40 hover:text-fg",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={addToCart}
          className={cn(
            "mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full text-[0.8125rem] font-semibold transition-[background-color,color] duration-[var(--dur-fast)]",
            added ? "bg-fg text-paper" : "bg-accent text-on-accent hover:bg-accent-hover",
          )}
        >
          {added ? (
            <>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                <path d="m3 8.5 3.2 3L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Added to cart
            </>
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   04 — WEBSITE REDESIGN: before / after, one toggle, one wipe.
   ========================================================================== */

export function DemoRedesign() {
  const [after, setAfter] = useState(false);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-7">
      {/* the toggle — a real control */}
      <div className="flex rounded-full border border-line bg-paper p-1" role="group" aria-label="Compare the example before and after its redesign">
        {(["Before", "After"] as const).map((label) => {
          const selected = (label === "After") === after;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => setAfter(label === "After")}
              className={cn(
                "inline-flex min-h-8 items-center rounded-full px-4 text-xs font-semibold transition-colors duration-[var(--dur-fast)]",
                selected ? "bg-fg text-paper" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div aria-hidden="true" className="relative aspect-[16/10] w-full max-w-md overflow-hidden rounded-xl border border-line shadow-[0_14px_36px_-28px_rgb(20_21_24/0.5)]">
        {/* BEFORE — deliberately dated: system serif, beveled grey, link-blue */}
        <div className={cn("redesign-layer bg-[#dedad2] p-3.5", after && "redesign-layer-hidden")}>
          <div className="border-2 border-[#9a958a] bg-[#c9c4b8] px-2 py-1.5 text-center font-serif text-[11px] font-bold tracking-wide text-[#3b3a35]">
            WELCOME TO OUR COMPANY WEBSITE !!
          </div>
          <div className="mt-1.5 flex gap-2 border border-[#9a958a] bg-[#eceade] px-2 py-1 font-serif text-[9px] text-[#2222cc] underline">
            <span>Home</span><span>About Us</span><span>Products</span><span>Contact</span><span>Links</span>
          </div>
          <div className="mt-1.5 grid grid-cols-[1fr_2.2fr] gap-1.5">
            <div className="border border-[#9a958a] bg-[#eceade] p-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-1 h-1.5 bg-[#b5b0a4]" />
              ))}
            </div>
            <div className="border border-[#9a958a] bg-white p-2 font-serif text-[9px] leading-snug text-[#3b3a35]">
              <p className="font-bold underline">News Update:</p>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="mt-1 h-1.5 w-full bg-[#d8d4c8]" style={{ width: `${95 - i * 12}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* AFTER — the site's own visual language */}
        <div className={cn("redesign-layer bg-paper p-3.5", !after && "redesign-layer-hidden")}>
          <div className="flex items-center gap-2">
            <span className="size-3.5 rounded-full bg-accent" />
            <span className="h-1.5 w-10 rounded bg-fg/70" />
            <span className="ml-auto h-5 w-16 rounded-full bg-accent" />
          </div>
          <div className="mt-3 h-3 w-3/5 rounded bg-fg/85" />
          <div className="mt-1.5 h-3 w-2/5 rounded bg-fg/85" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-fg/15" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-2 h-14 rounded-lg bg-[linear-gradient(130deg,rgb(239_135_22/0.2),rgb(239_135_22/0.05))]" />
            <div className="flex flex-col gap-2">
              <span className="flex-1 rounded-lg border border-line bg-surface" />
              <span className="flex-1 rounded-lg border border-line bg-surface" />
            </div>
          </div>
        </div>

        <span className="demo-chip absolute bottom-2.5 right-2.5">Illustrative example</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   05 — SEO & ORGANIC GROWTH: a search types itself, results surface.
   ========================================================================== */

export function DemoSeo() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center p-4 sm:p-7">
      <div className="w-full max-w-md">
        {/* the search bar */}
        <div className="demo-pop flex items-center gap-2.5 rounded-full border border-line bg-paper px-4 py-2.5 shadow-[0_10px_28px_-22px_rgb(20_21_24/0.5)]" style={{ "--d": "60ms" } as React.CSSProperties}>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 text-muted">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <span className="seo-query text-[0.8125rem] font-medium text-fg">
            website design for my business
          </span>
          <span className="seo-caret" />
        </div>

        {/* results: two quiet rows, then the one that matters */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="demo-pop rounded-lg border border-line bg-surface px-3.5 py-2.5" style={{ "--d": "1500ms" } as React.CSSProperties}>
            <span className="block h-1.5 w-2/5 rounded bg-fg/25" />
            <span className="mt-1.5 block h-1 w-4/5 rounded bg-fg/12" />
          </div>
          <div className="demo-pop relative rounded-lg border border-accent/60 bg-paper px-3.5 py-3 ring-1 ring-accent/30" style={{ "--d": "1750ms" } as React.CSSProperties}>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
              <span className="inline-block size-3 rounded-full bg-accent" />
              yourbusiness.com
            </span>
            <span className="mt-1 block text-[0.8125rem] font-semibold text-accent-ink">
              Your Business — found by the people searching for it
            </span>
            <span className="mt-1.5 block h-1 w-11/12 rounded bg-fg/12" />
            <span className="mt-1 block h-1 w-3/5 rounded bg-fg/12" />
          </div>
          <div className="demo-pop rounded-lg border border-line bg-surface px-3.5 py-2.5" style={{ "--d": "2000ms" } as React.CSSProperties}>
            <span className="block h-1.5 w-1/3 rounded bg-fg/25" />
            <span className="mt-1.5 block h-1 w-3/4 rounded bg-fg/12" />
          </div>
        </div>

        <p className="demo-pop mt-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted" style={{ "--d": "2200ms" } as React.CSSProperties}>
          Illustrative results — no ranking is promised
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   06 — AUTOMATION & DIGITAL OPTIMISATION: an enquiry travels the workflow.
   ========================================================================== */

const FLOW_NODES = [
  { x: 14, y: 22, label: "Website Enquiry", d: "0.5s" },
  { x: 296, y: 22, label: "CRM Updated", d: "1.1s" },
  { x: 296, y: 204, label: "Team Notified", d: "1.7s" },
  { x: 14, y: 204, label: "Follow-up Sent", d: "2.3s" },
] as const;

export function DemoAutomation() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center p-4 sm:p-7">
      <svg viewBox="0 0 480 290" className="w-full max-w-md" role="presentation">
        {/* connectors: the enquiry's path through the workflow */}
        <path d="M184 54 H 296" className="flow-line" />
        <path d="M381 86 V 204" className="flow-line" />
        <path d="M296 236 H 184" className="flow-line" />
        {FLOW_NODES.map((node, index) => (
          <g key={node.label} className="demo-node" style={{ "--d": `${index * 0.55}s` } as React.CSSProperties}>
            <rect x={node.x} y={node.y} width="170" height="64" rx="14" fill="var(--color-paper)" stroke="var(--color-line)" />
            <circle cx={node.x + 30} cy={node.y + 32} r="11" fill="rgb(239 135 22 / 0.14)" />
            <text x={node.x + 30} y={node.y + 36} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-accent-ink)">
              {`0${index + 1}`}
            </text>
            <text x={node.x + 52} y={node.y + 37} fontSize="12.5" fontWeight="600" fill="var(--color-fg)">
              {node.label}
            </text>
            {/* the completion tick, arriving in sequence */}
            <g className="flow-check" style={{ "--d": node.d } as React.CSSProperties}>
              <circle cx={node.x + 170} cy={node.y} r="10" fill="var(--color-accent)" />
              <path
                d={`M${node.x + 165} ${node.y} l3.5 3.5 6-6.5`}
                fill="none"
                stroke="var(--color-on-accent, #141518)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
