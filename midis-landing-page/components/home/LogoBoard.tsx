"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { clientMarks } from "@/content/clients";
import { cn } from "@/lib/utils";

/**
 * The client logo chessboard, split out of Trust.tsx because the mobile
 * scroll-progress indicator needs a ref to the scroller — Trust itself
 * stays a server component.
 *
 * ONE GRID, TWO FLOWS. Above 768px this is the static board: every tile
 * visible, row-major, 3 or 6 columns. Below 768px the SAME list flows
 * column-major into exactly three rows and scrolls horizontally — native
 * touch scrolling with gentle snap, no carousel library, no duplicated
 * tiles, no autoplay. The layout switch is entirely CSS (see "Client logo
 * board" in globals.css); this component only drives the progress bar.
 *
 * THE PROGRESS BAR IS WRITTEN, NOT RENDERED. Scroll position updates the
 * bar's transform directly through a ref inside a passive listener — no
 * setState per frame, no re-render while the visitor swipes. React state
 * exists only for the "is there anything to scroll" visibility bit, which
 * changes on resize, not on scroll.
 */

/**
 * Marks that are unreadable directly on a dark tile, and therefore sit on a
 * small white plate behind the artwork — the tile itself stays dark.
 *
 * DECIDED BY LOOKING, NOT BY FLAG. Each of the eleven light-background
 * marks was composited onto the actual tile charcoal (#202023) and judged:
 * the colourful and badge-style marks (Nexus Fundings, High Spirits,
 * Mobile Tyre Champions, The Thali Tales, Yogshala, Mounting Backend
 * Service) read clearly and keep their brand colours untouched; these five
 * — navy, near-black or faint line-art — do not. A plate behind the
 * artwork is the one treatment that fixes them without recolouring or
 * inverting somebody else's logo, which is not ours to do.
 */
const PLATED = new Set([
  "Solar Spectrum",
  "HQB Pro Solutions",
  "The Menopause Relief Store",
  "Cozy&Comfy",
  "TIV",
]);

export function LogoBoard() {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /*
   * Starts true: below 768px the six columns always overflow (each column
   * is at least 8.5rem), so the server-rendered indicator is correct
   * before hydration. Above 768px CSS hides the indicator regardless, so
   * this bit only matters for odd in-between cases ResizeObserver catches.
   */
  const [scrollable, setScrollable] = useState(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const bar = barRef.current;
    if (!scroller || !bar) return;

    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      setScrollable(max > 1);
      if (max > 1) {
        const p = Math.min(1, Math.max(0, scroller.scrollLeft / max));
        bar.style.transform = `scaleX(${p})`;
      }
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    /*
      The <Reveal> fades the whole board while the tiles run their own
      short stagger keyed off its data-reveal attribute — see globals.css.
      Every logo is on screen within roughly a second of the section
      arriving, and a reduced-motion visitor skips the entrance entirely.
    */
    <Reveal variant="fade" delay={120} className="logo-board mt-[var(--space-block)]">
      <ul ref={scrollerRef} className="logo-wall" aria-label="MIDIS clients">
        {clientMarks.map((mark, index) => (
          <li
            key={mark.name}
            className="logo-cell"
            style={{ "--cell-i": index } as React.CSSProperties}
          >
            <div className="logo-cell-media">
              <span
                className={cn(
                  "logo-frame",
                  PLATED.has(mark.name) && "logo-plate",
                )}
              >
                <Image
                  src={mark.src}
                  /* Empty on purpose: the visible .logo-name below is the
                     accessible name. An alt here would announce every
                     client twice. */
                  alt=""
                  width={mark.width}
                  height={mark.height}
                  /*
                    Eager, NOT the Next default lazy: in the mobile
                    scroller most columns start outside the horizontal
                    scrollport, and lazy images there stay blank until the
                    visitor has already swiped to them. Eighteen optimised
                    marks total well under 300KB — cheaper than 18 blank
                    tiles.
                  */
                  loading="eager"
                  /*
                    Two optical size classes, not one. A wide wordmark and
                    a tall emblem capped at the same max-height carry
                    wildly different visual weight — a 155×240 mark at
                    44px tall is a 28px-wide speck. Tall and square marks
                    (aspect < 1.2) get a taller cap so everything reads
                    optically equal.
                  */
                  className={cn(
                    "logo-img",
                    mark.width / mark.height < 1.2 && "logo-img-tall",
                  )}
                />
              </span>
            </div>
            <span className="logo-name">{mark.name}</span>
          </li>
        ))}
      </ul>

      {/*
        The swipe affordance: a thin track whose orange fill mirrors the
        scroll position, plus a label. Decorative — the full client list is
        already in the DOM for assistive tech, so the hint is aria-hidden.
        CSS hides it from 768px up, where nothing scrolls.
      */}
      <div
        aria-hidden="true"
        className={cn("logo-scroll-hint", !scrollable && "logo-scroll-hint-off")}
      >
        <span className="logo-scroll-track">
          <span ref={barRef} className="logo-scroll-bar" />
        </span>
        <span className="logo-scroll-label">
          Swipe to explore
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 6h9M7 2.5 10.5 6 7 9.5" />
          </svg>
        </span>
      </div>
    </Reveal>
  );
}
