import Image from "next/image";
import { CountUp } from "@/components/ui/CountUp";
import { Eyebrow } from "@/components/ui/Section";
import { EstimatorForm } from "@/components/forms/EstimatorForm";
import { hero } from "@/content/sections";
import mockup from "@/public/images/hero/midis-website-growth-mockup.webp";

/**
 * SECTION 1 — Hero.
 *
 * THE 2026-10-27 DESIGN, RESTORED WITH TIGHTER SPACING. One grid, from `lg`
 * two columns that both start on the same line under the navbar:
 *
 *   LEFT  (~57% at lg, ~61.5% from xl)  the laptop-and-phone mockup, the
 *         original heading and description, and the statistics strip — one
 *         continuous column, so there is no separate row and no gap waiting
 *         for the taller column
 *   RIGHT (the rest)  the existing four-step estimator in its white card
 *
 * Below `lg` it is one column in the brief's mobile order: image →
 * heading → description → statistics → form. That is simply
 * the DOM order, so keyboard and reading order match at every width.
 *
 * SPACING (desktop / phones): navbar → content 24px (the section's top
 * padding past --header-h, which already includes the bar); image →
 * heading 20/16px; heading → description 16/12px; description →
 * statistics 24/20px; section bottom 48/32px. No min-height and no fixed
 * heights: the section is exactly as tall as its content. (The three
 * feature blocks under the statistics were removed on MIDIS's
 * instruction, 2026-10-27.)
 *
 * THE IMAGE is MIDIS's own mockup, a real <img> at its natural aspect ratio
 * — width 100% of the column, height auto (`.hero-visual`, globals.css),
 * with subtle rounded corners and a hairline border.
 *
 * ONE FORM, ONE ANCHOR. The card carries `id="estimator"` — the anchor
 * every CTA on the page points at — so no link needed touching. The form
 * itself (fields, validation, autosave, submission) is untouched; the card
 * only frames it. Its field grids are container queries, so they follow
 * the card's width rather than the viewport's (EstimatorForm).
 *
 * MOTION: the CSS-only `hero-rise` / `hero-settle` entrances (reduced-
 * motion aware), so nothing waits on hydration and nothing starts hidden
 * for long; the numerals count up once when they enter the viewport
 * (CountUp). FloatingCta keeps its estimate pill hidden while `#hero` is on
 * screen.
 *
 * THE STATISTICS. "30+ Clients" and "20+ Live Projects" are MIDIS's own
 * instructed figures (2026-10-22), not counted from content/clients.ts or
 * content/work.ts — confirm before launch.
 *
 * ONE H1. The hero owns it; the form card's heading is an h2.
 */

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative pt-[calc(var(--header-h)+1.5rem)] pb-8 lg:pb-12"
    >
      <div className="container-site grid items-start lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-[clamp(20px,2.5vw,36px)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ================= left: image + message + proof ================= */}
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <figure
            className="hero-visual hero-rise"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <Image
              src={mockup}
              alt="A MIDIS-designed website on a laptop and a smartphone, with “More Enquiries” and “Grow Your Business” callouts and a rising growth arrow"
              priority
              placeholder="blur"
              sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, (min-width: 768px) 80vw, 100vw"
              className="block h-auto w-full"
            />
          </figure>

          {/*
            The page's only h1, in the original wording. "Into Customers."
            is the accent and never splits across lines (`whitespace-nowrap`);
            `text-wrap: balance` (globals.css) evens the lines around it, so
            no line is left holding a single word.
          */}
          <h1
            id="hero-heading"
            className="hero-rise mt-4 max-w-[62.5rem] text-[length:var(--text-hero)] font-bold leading-[1.06] tracking-[-0.035em] lg:mt-5"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            Websites That Turn Visitors{" "}
            <span className="hero-accent whitespace-nowrap">Into Customers.</span>
          </h1>

          <p
            className="hero-sub hero-rise mt-3 max-w-[40rem] text-base leading-relaxed text-muted sm:text-lg lg:mt-4"
            style={{ "--d": "170ms" } as React.CSSProperties}
          >
            {hero.subheadline}
          </p>

          {/*
            The statistics: ONE compact strip — two equal cells split by a
            hairline, each an icon tile, an accent numeral and its uppercase
            label on one line. The numerals render server-side at their final
            values; CountUp animates them once when they come into view.
          */}
          <ul
            className="hero-rise mt-5 grid w-full max-w-[30rem] grid-cols-2 divide-x divide-line rounded-xl border border-line bg-surface lg:mt-6"
            style={{ "--d": "250ms" } as React.CSSProperties}
          >
            {stats.map((stat) => (
              <li
                key={stat.label}
                className="flex min-w-0 items-center justify-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
              >
                <span
                  aria-hidden="true"
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink min-[400px]:flex"
                >
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
                <span className="flex min-w-0 flex-col items-start text-left">
                  <CountUp
                    value={stat.value}
                    suffix="+"
                    delay={250}
                    className="hero-accent font-display text-[1.5rem] font-semibold leading-none tracking-[-0.02em] sm:text-[1.75rem]"
                  />
                  <span className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wider text-muted sm:text-xs">
                    {stat.label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ================= right: the estimator ================= */}
        {/*
          `id="estimator"` is on the card, so every `#estimator` link lands
          on the form (the html scroll-padding clears the fixed header).
          No fixed height: the card grows with each step's fields.
        */}
        <div
          id="estimator"
          className="hero-form-shell hero-settle mt-8 w-full p-5 sm:mt-10 sm:p-7 lg:mt-0 xl:p-8"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          {/* Wording from MIDIS's hero-estimator brief of 2026-10-20. */}
          <Eyebrow className="mb-2.5">Start your project</Eyebrow>
          <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">
            Get Your Project Estimate
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
            Tell us a little about your project, and we&rsquo;ll help you
            plan the next steps.
          </p>

          <div className="mt-5 border-t border-line pt-5 sm:mt-6 sm:pt-6">
            <EstimatorForm variant="bare" />
          </div>
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
