import Image from "next/image";
import { CountUp } from "@/components/ui/CountUp";
import { ConsultationForm } from "@/components/forms/ConsultationForm";
import { hero } from "@/content/sections";
/* MIDIS's hero image (supplied 2026-10-28, replacing "Midis Website
   Product Hero Scene.png"; filename as given). */
import heroImage from "@/public/images/hero/MIDIS Website Workspace in Warm Cream.png";

/**
 * SECTION 1 — Hero.
 *
 * THE EDITORIAL HERO (MIDIS brief, 2026-10-28: "an entirely new homepage
 * hero ... not another modification of the old one"). The image-beside-a-
 * tall-form columns are gone. Three layers, read top to bottom, all in the
 * one shared container so every edge matches the navbar:
 *
 *   1. THE INTRODUCTION — an editorial split. The h1 is set large on the
 *      left (62% of the width from 1200px); the description and the two
 *      statistics sit grouped in the right 38%, centred on the headline
 *      (alignment passes, 2026-10-28). Below 1200px the headline runs full
 *      width and the description + statistics share a row beneath it
 *      (from 1024px) or stack (phones and tablets).
 *   2. THE SHOWCASE — MIDIS's product scene (the MIDIS site on a laptop
 *      and a phone, the MIDIS mug, on a cream wall and marble desk;
 *      supplied 2026-10-28) at
 *      the container's full width (edge to edge on phones) and its natural
 *      1672x941 ratio (nothing cropped, nothing stretched). No card: its
 *      margins fade into the hero's own background through a mask
 *      (`.hero-showcase`, globals.css), so it reads as part of the page.
 *      The panel below overlaps only its marble desk edge, never the
 *      devices or the logo.
 *   3. THE CONSULTATION — the shared ConsultationForm in its "wide" layout,
 *      a white panel that overlaps the bottom of the showcase (inset from
 *      its sides, over the desk, clear of the laptop and phone). From
 *      1280px the heading sits beside the fields, which run three per row:
 *      a two-row form instead of a tall column.
 *
 * Reading order = DOM order = the brief's sequence: headline, description,
 * statistics, visual, form. Normal flow throughout — the overlap is a
 * negative margin, not absolute positioning — and no fixed heights.
 *
 * ONE FORM, ONE ANCHOR. The panel carries `id="estimator"`, the anchor every
 * CTA points at; the form inside is the same component as the popup's.
 *
 * MOTION is CSS-only (globals.css) so nothing waits on hydration — the h1 is
 * the LCP element: the headline rises, the description and statistics
 * follow, the showcase settles in, the panel rises last; the numerals count
 * up once in view. All of it is off under prefers-reduced-motion.
 *
 * THE STATISTICS. "30+ Clients" and "20+ Live Projects" are MIDIS's own
 * instructed figures (2026-10-22) — confirm before launch.
 *
 * ONE H1. The hero owns it; the panel's heading is an h2.
 */

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="hero-stage relative isolate pt-[calc(var(--header-h)+1.5rem)] pb-12 sm:pt-[calc(var(--header-h)+1.75rem)] lg:pb-16"
    >
      <div className="container-site">
        {/* ================= 1. the introduction ================= */}
        {/* Two columns from 1200px: 62/38 (the 48px gap comes out of both
            in proportion), so the headline's longer line still fits at
            1200. `items-center` centres the headline and the description +
            statistics group on each other; with the 14–16px description
            the two blocks are within ~25px of the same height, so neither
            sits visibly higher. Stacked below 1200px. */}
        <div className="grid gap-y-5 sm:gap-y-6 min-[1200px]:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] min-[1200px]:items-center min-[1200px]:gap-x-12">
          {/*
            "Into Customers." never splits (`whitespace-nowrap`) and
            `text-wrap: balance` evens the lines around it, so no line is
            left holding a single word at any width.
          */}
          <h1
            id="hero-heading"
            className="hero-rise hero-title text-balance"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            Websites That Turn Visitors{" "}
            <span className="hero-accent whitespace-nowrap">
              Into Customers.
            </span>
          </h1>

          {/* One block: description, then the statistics 16px below. Beside
              each other at 1024–1199px only — a bounded range, so the rule
              never competes with the desktop layout above it. */}
          <div className="grid gap-y-4 lg:max-[1200px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:max-[1200px]:items-end lg:max-[1200px]:gap-x-8">
            <p
              className="hero-sub hero-rise max-w-[34rem] text-sm leading-[1.6] text-muted md:text-[0.9375rem] 2xl:text-base"
              style={{ "--d": "100ms" } as React.CSSProperties}
            >
              {hero.subheadline}
            </p>

            {/*
              Two figures under a hairline, split by a second hairline. The
              numerals render server-side at their final values; CountUp
              animates them once when they come into view.
            */}
            <ul
              className="hero-rise grid max-w-[26rem] grid-cols-2 border-t border-line pt-3.5 lg:max-[1200px]:max-w-none"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              {stats.map((stat, index) => (
                <li
                  key={stat.label}
                  className={
                    index === 0
                      ? "flex min-w-0 items-center gap-3 pr-4"
                      : "flex min-w-0 items-center gap-3 border-l border-line pl-4 sm:pl-6"
                  }
                >
                  <span aria-hidden="true" className="hero-stat-icon">
                    <svg
                      viewBox="0 0 16 16"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {stat.icon}
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-display text-[1.625rem] font-bold leading-none tracking-[-0.03em] sm:text-[1.875rem]">
                      <CountUp value={stat.value} delay={200} />
                      <span className="hero-accent">+</span>
                    </span>
                    <span className="mt-1.5 whitespace-nowrap text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted sm:text-xs">
                      {stat.label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================= 2. the showcase ================= */}
        <figure
          className="hero-showcase hero-reveal mt-2 sm:mt-4"
          style={{ "--d": "160ms" } as React.CSSProperties}
        >
          <Image
            src={heroImage}
            alt="A laptop and a smartphone showing the MIDIS website, “Websites That Turn Visitors Into Customers”, on a marble desk with an orange MIDIS mug"
            priority
            placeholder="blur"
            sizes="(min-width: 1830px) 1600px, (min-width: 640px) 93vw, 100vw"
            /* Size and the top crop: .hero-showcase img (globals.css). */
            className="block"
          />
        </figure>

        {/* ================= 3. the consultation ================= */}
        {/*
          `id="estimator"` is on the panel, so every `#estimator` link lands
          on the form (the html scroll-padding clears the fixed header). The
          negative top margin lifts it over the showcase's lower edge — the
          desk, below the devices — and the side margins inset it so the
          image frames it.
        */}
        <div
          id="estimator"
          className="hero-form-shell hero-panel hero-rise relative z-10 mt-1 p-4 sm:-mt-6 sm:mx-6 sm:p-5 md:p-7 lg:-mt-10 lg:mx-10 xl:-mt-14 xl:px-10 xl:py-9"
          style={{ "--d": "300ms" } as React.CSSProperties}
        >
          <ConsultationForm source="homepage" layout="wide" />
        </div>
      </div>
    </section>
  );
}

/** The hero's two MIDIS-instructed figures — see THE STATISTICS above. */
const stats = [
  {
    value: 30,
    label: "Clients",
    /* Two people. */
    icon: (
      <>
        <circle cx="6" cy="5.25" r="2.5" />
        <path d="M1.75 13.75c0-2.35 1.9-4.25 4.25-4.25s4.25 1.9 4.25 4.25" />
        <path d="M10.75 3a2.5 2.5 0 0 1 0 4.75M12.5 9.75a4.25 4.25 0 0 1 1.75 4" />
      </>
    ),
  },
  {
    value: 20,
    label: "Live Projects",
    /* A browser window. */
    icon: (
      <>
        <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" />
        <path d="M1.75 5.75h12.5M4 4.25h.01M5.75 4.25h.01" />
      </>
    ),
  },
] as const;
