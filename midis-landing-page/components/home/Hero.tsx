import Image from "next/image";
import { ButtonGroup } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { EstimateCta } from "./EstimateCta";
import { EstimatorForm } from "@/components/forms/EstimatorForm";
import { hero } from "@/content/sections";
import mockup from "@/public/images/hero/midis-website-growth-mockup.webp";

/**
 * SECTION 1 — Hero.
 *
 * THE 2026-10-27 DESKTOP REDESIGN (MIDIS reference brief). One grid, from
 * `lg` two columns and two rows:
 *
 *   row 1  LEFT  (~57% at lg, ~61.5% from xl)  the image, the original
 *               heading and description
 *          RIGHT (the rest)  the existing four-step estimator, in a white
 *               card — never over the image
 *   row 2  THE PROOF BLOCK (`col-span-full`)  the statistics, then the three
 *               benefits as three equal columns. Spanning both columns puts
 *               its left edge on the image's and its right edge on the
 *               form card's — the same container, the same gutters, no
 *               offsets. It starts one row gap below the taller column.
 *
 * Below `lg` it is one column in the brief's mobile order: image →
 * heading → description → statistics → CTA → benefits → form. That is
 * simply the DOM order (message, proof, form); the desktop placement is
 * explicit `col-start` / `row-start`, so nothing is reordered with `order`,
 * and keyboard and reading order match at every width.
 *
 * THE CTA is shown only while the layout is stacked. From `lg` the form it
 * scrolls to sits beside it, so it would be a button pointing at the
 * column next door. (FloatingCta watches `#hero` for the same reason.)
 *
 * THE IMAGE is MIDIS's own laptop-and-phone mockup, a real <img> (not a
 * CSS background) shown whole at its natural aspect ratio — its width and
 * height come from the static import, and `.hero-visual` (globals.css)
 * only ever sets its width: the full left column from `lg`, and below
 * that the column or whatever keeps it under ~460px tall.
 *
 * ONE FORM, ONE ANCHOR. The card carries `id="estimator"` — the anchor
 * every CTA on the page points at — so no link needed touching. The form
 * itself (fields, validation, autosave, submission) is untouched; the
 * card only frames it. Its field grids are container queries, so they
 * follow the card's width rather than the viewport's (EstimatorForm).
 *
 * MOTION. The image, heading, description and form use the CSS-only
 * `hero-rise` / `hero-settle` entrances, so the LCP never waits on
 * hydration. The proof block ALSO sits inside `Reveal` wrappers: on a
 * phone, where it is on screen at load, Reveal stays out of the way and
 * the hero-rise inside plays; on a desktop, where it starts below the
 * fold, Reveal holds it until it scrolls into view and then fades it up
 * (the benefits staggered 120ms apart). The two never fight over one
 * element — Reveal owns the wrapper, hero-rise the child. The numerals
 * count up from 0 when they enter the viewport (CountUp). Reduced motion
 * skips all of it, and Reveal's guards keep everything visible without
 * JavaScript.
 *
 * THE STATISTICS. "30+ Clients" and "20+ Live Projects" are MIDIS's own
 * instructed figures (2026-10-22), not counted from content/clients.ts or
 * content/work.ts — confirm before launch.
 *
 * ONE H1. The hero owns it; the form card's heading is an h2.
 */

export function Hero() {
  return (
    /* No bottom padding: the trust section's own top padding (48px on
       phones, ~82px on desktop) is the whole gap after the hero, where the
       two paddings used to stack to ~130px. */
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative pt-[calc(var(--header-h)+1.25rem)] lg:pt-[calc(var(--header-h)+1.5rem)]"
    >
      {/* Row gaps come from the children's own margins while stacked (each
          break has its own size); from lg the grid gaps take over. */}
      <div className="container-site grid items-start lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:gap-x-9">
        {/* ================= row 1, left: image + message ================= */}
        <div className="flex min-w-0 flex-col items-center text-center lg:col-start-1 lg:row-start-1 lg:items-start lg:text-left">
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
              className="block h-auto w-full object-contain"
            />
          </figure>

          {/*
            The page's only h1, in the original wording. "Into Customers."
            is the accent and never splits across lines (`whitespace-nowrap`);
            `text-wrap: balance` (globals.css) evens the lines around it at
            every width. The accent colour is `.hero-accent`: the brightest
            orange that clears the large-text contrast minimum on paper, and
            the brand orange itself in dark mode.
          */}
          <h1
            id="hero-heading"
            className="hero-rise mt-6 max-w-[62.5rem] text-[length:var(--text-hero)] leading-[1.05] tracking-[-0.03em] lg:mt-7"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            Websites That Turn Visitors{" "}
            <span className="hero-accent whitespace-nowrap">Into Customers.</span>
          </h1>

          <p
            className="hero-sub hero-rise mt-3 max-w-[40rem] text-base leading-relaxed text-muted sm:mt-4 sm:text-lg"
            style={{ "--d": "170ms" } as React.CSSProperties}
          >
            {hero.subheadline}
          </p>
        </div>

        {/* ================= row 2: the proof block ================= */}
        <div className="mt-5 flex min-w-0 flex-col items-center sm:mt-6 lg:col-span-full lg:row-start-2 lg:mt-0 lg:items-stretch">
          {/*
            The statistics: ONE horizontal strip — two equal cells split by
            a hairline, each a 40px icon tile, an accent numeral and its
            uppercase label, centred on one line. 500px wide at most, so on
            desktop it holds the left of the row and the benefits below run
            the full width.
          */}
          <Reveal className="hero-stats w-full max-w-[31.25rem]">
            <ul
              className="hero-rise grid grid-cols-2 divide-x divide-line rounded-2xl border border-line bg-surface"
              style={{ "--d": "250ms" } as React.CSSProperties}
            >
              {stats.map((stat) => (
                <li
                  key={stat.label}
                  className="flex min-w-0 items-center justify-center gap-2.5 px-3 py-3 sm:gap-3.5 sm:px-5 sm:py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink min-[400px]:flex"
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
                      className="hero-accent font-display text-[1.625rem] font-semibold leading-none tracking-[-0.02em] sm:text-[2rem]"
                    />
                    <span className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wider text-muted sm:text-xs">
                      {stat.label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/*
            ONE CTA, stacked layouts only — see THE CTA above. Scrolls to
            the form (EstimateCta). Full column width on phones
            (ButtonGroup), its natural width from `sm`.
          */}
          <ButtonGroup
            id="hero-cta"
            className="hero-rise mt-5 w-full justify-center sm:mt-6 sm:w-auto lg:hidden"
            style={{ "--d": "330ms" } as React.CSSProperties}
          >
            <EstimateCta className="min-h-12 text-[0.9375rem] sm:min-h-[3.25rem] sm:text-base" />
          </ButtonGroup>

          {/* ---- the MIDIS Advantage ----
              Three benefits (MIDIS brief, 2026-10-21; copy and icons
              unchanged) under one hairline. Phones: a left-aligned list.
              From `md`: three EQUAL columns (`repeat(3, minmax(0, 1fr))`)
              split by hairlines — icon over text and centred on a tablet,
              icon beside text and flush left from `lg`, where the row
              spans the full hero width. */}
          <ul className="hero-benefits mt-6 grid w-full gap-4 border-t border-line pt-6 text-left sm:mt-8 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-0 md:divide-x md:divide-line lg:mt-6">
            {advantages.map((item, index) => (
              <Reveal
                as="li"
                key={item.title}
                delay={index * 120}
                className="hero-benefit min-w-0 md:px-5 lg:px-8 lg:first:pl-0 lg:last:pr-0"
              >
                <div
                  className="hero-rise flex items-start gap-3 md:flex-col md:items-center md:text-center lg:flex-row lg:items-start lg:gap-3.5 lg:text-left"
                  style={{ "--d": `${420 + index * 120}ms` } as React.CSSProperties}
                >
                  <span
                    aria-hidden="true"
                    className="hero-benefit-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"
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
                      {item.icon}
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[0.9375rem] leading-snug sm:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-muted">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* ================= row 1, right: the estimator ================= */}
        {/*
          `id="estimator"` is on the card, so every `#estimator` link lands
          on the form (the html scroll-padding clears the fixed header).
          No fixed height: the card grows with each step's fields.
        */}
        <div
          id="estimator"
          className="hero-form-shell hero-settle mt-9 w-full p-5 sm:mt-10 sm:p-7 lg:col-start-2 lg:row-start-1 lg:mt-0 xl:p-8"
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

/**
 * SUPPORTING copy (MIDIS brief, 2026-10-21) — descriptions of how MIDIS
 * works, phrased like the approved service descriptions. Nothing here is a
 * measurable claim. Icons are inline line-work on `currentColor`, sized and
 * stroked to match the site's Arrow, so they read in both themes.
 */
const advantages = [
  {
    title: "Strategy-Led Design",
    body: "Built around your business goals.",
    /* A target: the goal, aimed at. */
    icon: (
      <>
        <circle cx="8" cy="8" r="6.25" />
        <circle cx="8" cy="8" r="2.75" />
      </>
    ),
  },
  {
    title: "Responsive Experiences",
    body: "Designed for every screen.",
    /* A monitor and a phone. */
    icon: (
      <>
        <rect x="1.25" y="2.75" width="9.5" height="6.5" rx="1" />
        <path d="M4.25 12.5h3.5M6 9.25v3.25" />
        <rect x="11.5" y="6.5" width="3.25" height="6.5" rx="0.9" />
      </>
    ),
  },
  {
    title: "Conversion-Focused Development",
    body: "Created to guide visitors toward action.",
    /* A rising line with an arrowhead. */
    icon: (
      <>
        <path d="M1.75 11.75 6 7.5l2.75 2.75 5.5-5.5" />
        <path d="M10.25 4.75h4v4" />
      </>
    ),
  },
] as const;
