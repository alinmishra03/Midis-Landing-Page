"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up to its real value once, when it first scrolls
 * into view (immediately, if it is already in view on load).
 *
 * THE VALUE IS IN THE HTML. The server renders the FINAL figure, so the
 * statistic is correct before hydration, without JavaScript, for crawlers,
 * and in reader modes. The animation is pure decoration layered on top: the
 * effect rewinds to 0 and eases forward to exactly the value it was given —
 * never past it, never a different figure, and only once per page load.
 *
 * `prefers-reduced-motion` skips the animation entirely (the final value
 * simply stays put), matching how hero-rise/hero-settle behave in CSS. So
 * does a browser without IntersectionObserver.
 *
 * NO LAYOUT SHIFT while counting: the digits are tabular and the numeric
 * span reserves the width of the final value in `ch`, so a suffix like "+"
 * and the label below never move as 6 becomes 16 becomes 20. The suffix is
 * outside the animated span, so it is visible throughout.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1000,
  delay = 0,
  className,
}: {
  /** The approved figure. The animation ends at exactly this. */
  value: number;
  /** Rendered after the digits, outside the animated span (e.g. "+"). */
  suffix?: string;
  duration?: number;
  /** ms after the number enters the viewport before the count starts — to
      land with a surrounding entrance rather than before it. */
  delay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    let raf = 0;

    const run = () => {
      const start = performance.now() + delay;

      /* The rewind to 0 happens on the FIRST FRAME (t clamps to 0), not
         synchronously — the browser paints the server-rendered final value
         until the animation actually owns the number. */
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        /* ease-out cubic — fast through the small numbers, settling on the
           real one, so the figure reads as arriving rather than ticking. */
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * value));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    /* Once: the first time any of it is on screen, then stop watching. */
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      <span
        className="inline-block tabular-nums"
        style={{ minWidth: `${String(value).length}ch` }}
      >
        {display}
      </span>
      {suffix}
    </span>
  );
}
