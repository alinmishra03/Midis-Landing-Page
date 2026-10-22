import { ButtonGroup } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Eyebrow } from "@/components/ui/Section";
import { EstimateCta } from "./EstimateCta";
import { EstimatorForm } from "@/components/forms/EstimatorForm";
import { hero } from "@/content/sections";

/**
 * SECTION 1 — Hero.
 *
 * COMPOSITION — THE 2026-10-20 REVISIONS. The layered browser mockups are
 * gone, on MIDIS's instruction: the right column holds the WORKING Project
 * Estimator, so the hero's proof is the action itself. A second revision
 * the same day compacted the mobile hero so the estimator starts inside
 * the first phone screen: tighter rhythm below `xl`, the secondary CTA as
 * a text link on phones, and the statistics as a one-line trust strip.
 * Desktop keeps the two-button, two-column presentation.
 *
 * ONE FORM, ONE ANCHOR. The shell carries `id="estimator"` — the anchor
 * every CTA on the page already points at (nav, Work, Process, Pricing,
 * the final CTA, the footer) — so moving the form moved the destination
 * with it and no link needed touching. The old estimator section is now a
 * concise supporting band (see Estimator.tsx) that routes here too, so
 * the page never shows the same long form twice.
 *
 * THE 2026-10-21 REDESIGN (MIDIS hero brief of that date):
 *
 *   - ONE CTA. The hero's secondary "Get a Free Consultation" button is
 *     gone; the single primary is relabelled "Get a Free Project Estimate"
 *     (the brief's exact wording). The navbar consultation CTA and every
 *     other contact route on the page are untouched.
 *   - THE STATISTICS LEAD. From `sm` the two countable figures render as
 *     large accent numerals (44px) with a once-only count-up (CountUp —
 *     final values are server-rendered, reduced-motion skips the count).
 *     The phone presentation keeps the approved 2-cell bordered strip,
 *     byte-for-byte.
 *   - THE MIDIS ADVANTAGE. A compact three-benefit strip fills the area
 *     that used to sit empty under the statistics on desktop. Its copy
 *     describes the approach (no invented metrics); "Built Around Your
 *     Goals", the old third strip item, lives on as the first benefit's
 *     description. On phones the strip renders AFTER the estimator, so the
 *     approved first-screen form position is unchanged — see the grid
 *     placement notes inline.
 *
 * THE TRUST STRIP FIGURES. "20+ Clients" is MIDIS's own figure, instructed
 * on 2026-10-20 — it exceeds the 18 marks counted in content/clients.ts, so
 * it rests on MIDIS's say-so rather than on a list this repo can recount
 * (recorded in docs/open-questions.md style: confirm before launch).
 * "6 Live Projects" is counted from content/work.ts.
 *
 * THE SUPPORTING LINE ("From strategy and design…") moved to the
 * estimator's supporting band (Estimator.tsx): on a phone it was pure
 * height between the CTA and the form, and MIDIS asked for the estimator
 * to be reachable without scrolling past it. It renders once, there.
 *
 * THE SPLIT STARTS AT `xl`, NOT `lg` — measured in the previous pass: at
 * 1024 the text column came out 471px and the CTAs squashed to two-line
 * buttons. Below 1280 the hero stacks content first, form second, which
 * is exactly the client's required mobile order.
 *
 * GRID IS `items-start`, NOT `items-center`: the form's height changes
 * between steps, and centring would make the headline drift every time.
 *
 * HEIGHT. Still not `100vh` — a viewport-locked hero on a short laptop
 * pushes the CTAs and the form out of view entirely.
 */

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-paper pt-[calc(var(--header-h)+0.25rem)] pb-10 sm:pt-[calc(var(--header-h)+2rem)] sm:pb-16 lg:pt-[calc(var(--header-h)+4rem)] lg:pb-16"
    >
      {/*
        Background wash. A single very soft radial in the brand orange at 7%
        — enough to stop the paper reading as flat, nowhere near the "flashy
        gradient" the brief rules out. It sits behind the form column, which
        is also what gives the glass shell something real to blur.
      */}
      <div
        aria-hidden="true"
        className="hero-wash pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 78% 18%, rgba(239,135,22,0.07), transparent 65%)",
        }}
      />

      <div className="container-site">
        {/*
          DESKTOP PROPORTIONS (2026-10-21 refinement): 1.15fr/1fr with a
          40px gap — roughly 53.5% / 46.5% — instead of the old 1fr/0.86fr
          with a 64px gap, which left a wide hole between the copy and the
          estimator on large displays. The columns stay inside the shared
          container-site so the hero keeps the page's left and right edges.

          THREE GRID CHILDREN, TWO ORDERS (2026-10-21). The children are
          (1) the message, (2) the estimator, (3) the MIDIS Advantage strip.
          In the stacked flow below xl that DOM order IS the layout: the
          form stays directly after the trust strip, exactly where the
          approved mobile hero puts it, and the benefits follow the form
          instead of pushing it off the first screen. From xl the explicit
          placements below re-compose it: the form spans both rows of the
          right column, and the benefits land under the statistics in the
          left column — filling the area that used to sit empty.
        */}
        <div className="grid items-start gap-3.5 sm:gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:gap-x-10 xl:gap-y-8">
          {/* ================= left: the message ================= */}
          {/* max-w-none from xl: the grid column is the constraint there,
              and the heading needs the full column to hold its two lines. */}
          <div className="relative z-10 max-w-2xl xl:max-w-none">
            {/* Uses the shared Eyebrow for identical markup to every other
                section, wrapped in the hero's own CSS animation — the hero
                must not depend on the JS observer. */}
            <div className="hero-rise" style={{ "--d": "0ms" } as React.CSSProperties}>
              <Eyebrow>Website design &amp; development</Eyebrow>
            </div>

            {/*
              The page's only h1.

              The line break is controlled rather than left to chance: the
              brief calls out awkward single-word wraps, and "Customers."
              landing alone on line three is exactly that. `block` on the
              second span forces the break at a point that reads well, while
              `text-wrap: balance` (globals.css) evens the lines within each.

              DESKTOP SIZE (2026-10-21): from xl the heading leaves the
              shared --text-display-xl scale (which tops out at 100px and
              pushed the CTAs below the fold next to the estimator) for its
              own flatter clamp — ~51px at 1280 growing to 68px at 1920.
              Measured against the 53.5% column, "Visitors Into Customers."
              fits on one line at every width from 1280 up, so the heading
              holds exactly two balanced lines. Tracking tightens a touch at
              this size, as display type wants. Below xl nothing changes:
              the mobile and tablet heading keep the shared scale.
            */}
            <h1
              id="hero-heading"
              className="hero-rise mt-2 text-[length:var(--text-display-xl)] leading-[1.02] sm:mt-3 xl:mt-4 xl:text-[length:clamp(3.1rem,1.1rem+2.6vw,4.25rem)] xl:tracking-[-0.036em]"
              style={{ "--d": "90ms" } as React.CSSProperties}
            >
              Websites That Turn{" "}
              <span className="xl:block">
                Visitors Into{" "}
                {/*
                  The one accent in the headline. --color-accent-ink
                  (#AA5A0A), never --color-accent — the brand orange is
                  2.55:1 on paper and would fail as text at any size.
                */}
                <span className="text-accent-ink">Customers.</span>
              </span>
            </h1>

            {/* 15px/1.5 on a phone — compact without dropping a word of the
                approved description — opening to 18px from `sm`. From xl the
                measure widens to 42rem so the approved sentence sits in
                three balanced lines tight under the heading, flush with its
                left edge, instead of wrapping into four. */}
            <p
              className="hero-rise mt-2.5 max-w-xl text-[0.9375rem] leading-[1.45] text-muted sm:mt-5 sm:text-lg sm:leading-relaxed xl:mt-5 xl:max-w-[42rem]"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              {hero.subheadline}
            </p>

            {/*
              ONE CTA (MIDIS brief, 2026-10-21): the primary orange estimate
              action, which scrolls to the hero form and focuses its first
              question — see EstimateCta. The secondary consultation button
              was removed from the hero by the same brief (the navbar keeps
              its consultation CTA). Still rendered through ButtonGroup so
              the phone treatment — full column width at 48px — is the same
              shared layout every other CTA row uses.
            */}
            <ButtonGroup
              className="hero-rise mt-4 gap-2 sm:mt-7 sm:gap-3.5 xl:mt-7"
              style={{ "--d": "260ms" } as React.CSSProperties}
            >
              <EstimateCta className="min-h-12 text-[0.9375rem] sm:min-h-[3.25rem] sm:text-base" />
            </ButtonGroup>

            {/*
              The statistics: the page's two countable facts, promoted to a
              display element (MIDIS brief, 2026-10-21) — large accent
              numerals over small uppercase labels, split by one hairline.
              No cards, no shadows: the numbers themselves are the visual.

              ON A PHONE NOTHING CHANGES: the base classes are the approved
              2026-10-20 2-cell bordered strip, byte-for-byte — the same
              width as the CTA and the estimator card. From `sm` the
              container resets to a quiet open row and the numerals take
              the display scale. (The old third item, "Built Around Your
              Goals", moved into the MIDIS Advantage strip below.)

              The numerals render server-side at their FINAL values and
              CountUp animates them once on load — see CountUp for the
              reduced-motion and no-layout-shift reasoning.
            */}
            <ul
              className="hero-rise mt-3.5 grid grid-cols-2 items-stretch overflow-hidden rounded-xl border border-line bg-surface sm:mt-7 sm:flex sm:items-center sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent xl:mt-7"
              style={{ "--d": "340ms" } as React.CSSProperties}
            >
              <li className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-center sm:items-start sm:justify-start sm:gap-1.5 sm:p-0 sm:text-left">
                {/* MIDIS-instructed figure (raised 20+ → 30+ on MIDIS's
                    instruction of 2026-10-22), not derived from the
                    client list — see the trust-strip note above. */}
                <CountUp
                  value={30}
                  suffix="+"
                  delay={520}
                  className="font-display text-[1.375rem] font-semibold leading-none text-accent-ink sm:text-[2.75rem] sm:tracking-[-0.02em]"
                />
                {/* text-fg on the phone strip — the label is a surface the
                    charcoal has to read on; desktop keeps the quiet muted. */}
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fg sm:text-xs sm:text-muted">
                  Clients
                </span>
              </li>
              <li className="flex min-w-0 flex-col items-center justify-center gap-0.5 border-l border-line px-2 py-2.5 text-center sm:ml-10 sm:items-start sm:justify-start sm:gap-1.5 sm:p-0 sm:pl-10 sm:text-left">
                {/* MIDIS-instructed figure (2026-10-22; previously the
                    counted verifiedCounts.projectsShown, which remains
                    the portfolio's own countable fact). */}
                <CountUp
                  value={20}
                  suffix="+"
                  delay={520}
                  className="font-display text-[1.375rem] font-semibold leading-none text-accent-ink sm:text-[2.75rem] sm:tracking-[-0.02em]"
                />
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fg sm:text-xs sm:text-muted">
                  Live Projects
                </span>
              </li>
            </ul>
          </div>

          {/* ================= right: the estimator ================= */}
          {/*
            `id="estimator"` lives HERE — see the note at the top. The
            `hero-settle` entrance is CSS-only (rise + settle), so the form
            is visible and usable without waiting on hydration of anything
            but its own fields.

            Capped at 38rem and kept on the end of its column: the cap stops
            the fields stretching to 750px at 1920, and end-justification
            keeps the shell's right edge on the same line as the header and
            every other section. Under the tighter 1.15fr/1fr grid the
            column itself is barely wider than the cap until ~1700px, so the
            form reads as part of the composition rather than exiled right.
          */}
          <div
            id="estimator"
            className="hero-settle w-full xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:max-w-[38rem] xl:justify-self-end"
            style={{ "--d": "240ms" } as React.CSSProperties}
          >
            <div className="hero-form-shell p-4 sm:p-7">
              {/*
                The form header. Wording from MIDIS's hero-estimator brief
                of 2026-10-20 (SUPPORTING — it introduces the form; the
                questions inside remain the approved estimator content).
              */}
              <Eyebrow className="mb-2 xl:mb-3">Start your project</Eyebrow>
              <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">
                Get Your Project Estimate
              </h2>
              <p className="mt-1.5 text-sm leading-snug text-muted sm:leading-relaxed">
                Tell us a little about your project, and we&rsquo;ll help you
                plan the next steps.
              </p>

              <div className="mt-3.5 sm:mt-6">
                <EstimatorForm variant="bare" />
              </div>
            </div>
          </div>

          {/* ================= the MIDIS Advantage ================= */}
          {/*
            Three one-line benefits (MIDIS brief, 2026-10-21): statements of
            the APPROACH, drawn from the approved copy's own vocabulary —
            strategy-led, responsive, conversion-focused — never performance
            claims or invented metrics. "Built around your business goals"
            carries forward the old trust-strip positioning line.

            PLACEMENT — see the grid note at the top of the layout: third
            in the DOM so phones read content → form → benefits (the form
            keeps its approved first-screen position), re-placed under the
            statistics in the left column from xl, where it fills the area
            that used to end the column early.

            One hairline above, hairlines between from `sm`, no cards, no
            background, no shadows. Each item enters on the hero's own
            CSS-only rise, staggered after the statistics.
          */}
          <ul className="grid gap-y-4 border-t border-line pt-5 sm:grid-cols-3 sm:gap-y-0 sm:divide-x sm:divide-line xl:col-start-1 xl:row-start-2 xl:self-start">
            {advantages.map((item, index) => (
              <li
                key={item.title}
                className="hero-rise flex items-start gap-2.5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
                style={{ "--d": `${420 + index * 80}ms` } as React.CSSProperties}
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
                  aria-hidden="true"
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-ink"
                >
                  {item.icon}
                </svg>
                <div className="min-w-0">
                  <h3 className="text-sm leading-snug">{item.title}</h3>
                  <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

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
