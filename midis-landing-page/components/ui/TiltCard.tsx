"use client";

import { useCallback, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-responsive 3D tilt.
 *
 * All this component does is write two custom properties, `--mx` and `--my`,
 * in the range -0.5..0.5, and flip `data-tilting`. Every visual consequence —
 * the rotation, the lifted content, the cursor-following sheen — is CSS in
 * globals.css. That split matters: the transform runs on the compositor, and
 * React never re-renders while the pointer moves.
 *
 * WHY IT IS CHEAP
 * ---------------
 * - Listeners are on the ELEMENT, not the document, so an off-card pointer
 *   costs nothing at all.
 * - Moves are coalesced into one `requestAnimationFrame`, so a 1000Hz mouse
 *   still writes the properties at most once per frame.
 * - `getBoundingClientRect` is read once on enter and cached, not per move —
 *   reading it on every move would force layout on every frame, which is the
 *   usual reason tilt effects jank.
 * - No state, so no re-render: the properties are written straight to the
 *   node with `setProperty`.
 *
 * WHY IT IS SAFE
 * --------------
 * Touch devices never activate it. The CSS gates every transform behind
 * `(hover: hover) and (pointer: fine)`, and the handlers here are
 * `onPointerMove`, which only fires for a pressed touch anyway. Combined,
 * a tap can never leave a card frozen mid-rotation.
 *
 * `prefers-reduced-motion` is handled in CSS, which switches every transform
 * off — including ones already applied.
 */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Rendered inside the tilt plane, above the sheen. */
  innerClassName?: string;
}

export function TiltCard({
  children,
  className,
  as: Tag = "div",
  innerClassName,
}: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);

  const onEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    /* Cached here so the move handler never forces a layout. */
    rect.current = el.getBoundingClientRect();
    el.dataset.tilting = "true";
  }, []);

  const onMove = useCallback((event: React.PointerEvent) => {
    const el = ref.current;
    const box = rect.current;
    if (!el || !box || event.pointerType !== "mouse") return;

    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    /* One write per frame, however fast the pointer reports. */
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
    });
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    /* Clearing `data-tilting` restores the CSS transition, so the card eases
       back to flat instead of snapping. */
    el.dataset.tilting = "false";
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  }, []);

  return (
    <Tag
      ref={ref}
      data-tilting="false"
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("tilt-root", className)}
    >
      <div className={cn("tilt-inner h-full", innerClassName)}>{children}</div>
    </Tag>
  );
}

/**
 * The magnetic nudge, same mechanism at a quarter of the ambition.
 *
 * Used only on the page's two most important buttons. Displacement is capped
 * at 4px in CSS — far enough to feel responsive, nowhere near far enough for
 * the button to escape the cursor.
 */
export function Magnetic({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);

  const onEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    rect.current = el.getBoundingClientRect();
    el.dataset.magnet = "true";
  }, []);

  const onMove = useCallback((event: React.PointerEvent) => {
    const el = ref.current;
    const box = rect.current;
    if (!el || !box || event.pointerType !== "mouse") return;
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    });
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    el.dataset.magnet = "false";
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  }, []);

  return (
    <span
      ref={ref}
      data-magnet="false"
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("magnetic inline-flex", className)}
    >
      {children}
    </span>
  );
}
