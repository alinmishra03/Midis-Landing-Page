import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Section";
import { EstimateCta } from "./EstimateCta";
import { EstimatorForm } from "@/components/forms/EstimatorForm";
import { hero } from "@/content/sections";
import { verifiedCounts } from "@/content/clients";

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
 * THE TRUST STRIP. "20+ Clients" is MIDIS's own figure, instructed on
 * 2026-10-20 — it exceeds the 18 marks counted in content/clients.ts, so
 * it rests on MIDIS's say-so rather than on a list this repo can recount
 * (recorded in docs/open-questions.md style: confirm before launch).
 * "6 Live Projects" is counted from content/work.ts. "Built Around Your
 * Goals" is a positioning line, not a numeric claim. The third item hides
 * below `sm`, where three items crowd the line.
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
      className="relative overflow-hidden bg-paper pt-[calc(var(--header-h)+0.25rem)] pb-10 sm:pt-[calc(var(--header-h)+2rem)] sm:pb-16 lg:pt-[calc(var(--header-h)+4rem)] lg:pb-24"
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
        <div className="grid items-start gap-3.5 sm:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)] xl:gap-16">
          {/* ================= left: the message ================= */}
          <div className="relative z-10 max-w-2xl">
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
            */}
            <h1
              id="hero-heading"
              className="hero-rise mt-2 text-[length:var(--text-display-xl)] leading-[1.02] sm:mt-3 xl:mt-5"
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
                approved description — opening to 18px from `sm`. */}
            <p
              className="hero-rise mt-2.5 max-w-xl text-[0.9375rem] leading-[1.45] text-muted sm:mt-5 sm:text-lg sm:leading-relaxed xl:mt-6"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              {hero.subheadline}
            </p>

            {/*
              CTAs — two actions, one hierarchy: the ESTIMATE is the primary
              orange action (it scrolls to the hero form and focuses its
              first question — see EstimateCta), the CONSULTATION keeps its
              existing action as the outlined secondary. The "Explore Our
              Work" link was removed from the hero on MIDIS's instruction
              (2026-10-20); the Work section keeps its header nav entry.

              On a phone both stack full width at 48px with an 8px gap;
              from `sm` they sit in a row at 52px.
            */}
            <ButtonGroup
              className="hero-rise mt-4 gap-2 sm:mt-7 sm:gap-3.5 xl:mt-9"
              style={{ "--d": "260ms" } as React.CSSProperties}
            >
              <EstimateCta className="min-h-12 text-[0.9375rem] sm:min-h-[3.25rem] sm:text-base" />
              <Button
                href={hero.primaryCta.href}
                variant="secondary"
                size="lg"
                className="min-h-12 text-[0.9375rem] sm:min-h-[3.25rem] sm:text-base"
              >
                {hero.primaryCta.label}
                <Arrow />
              </Button>
            </ButtonGroup>

            {/*
              The trust strip: countable facts plus one positioning line —
              not a block of statistic cards. On a phone it is ONE bordered
              surface holding two EQUAL, CENTRED cells split by a hairline
              exactly in the middle (MIDIS trust-strip redesign,
              2026-10-20) — the same width as the CTAs and the estimator
              card, so the column reads as one grid. From `sm` every
              container style resets and it returns to the quiet inline
              baseline row, where the third item also has room.
            */}
            <ul
              className="hero-rise mt-3.5 grid grid-cols-2 items-stretch overflow-hidden rounded-xl border border-line bg-surface sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-y-2 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent xl:mt-8"
              style={{ "--d": "340ms" } as React.CSSProperties}
            >
              <li className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-center sm:flex-row sm:items-baseline sm:justify-start sm:gap-1.5 sm:p-0 sm:text-left">
                {/* MIDIS-instructed figure (2026-10-20), not derived from
                    clientMarks.length — see the trust-strip note above. */}
                <span className="font-display text-[1.375rem] font-semibold leading-none text-accent-ink sm:text-xl sm:leading-normal">
                  20+
                </span>
                {/* text-fg on the phone strip — the label is a surface the
                    charcoal has to read on; desktop keeps the quiet muted. */}
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fg sm:text-muted">
                  Clients
                </span>
              </li>
              <li className="flex min-w-0 flex-col items-center justify-center gap-0.5 border-l border-line px-2 py-2.5 text-center sm:ml-4 sm:flex-row sm:items-baseline sm:justify-start sm:gap-1.5 sm:p-0 sm:pl-4 sm:text-left">
                <span className="font-display text-[1.375rem] font-semibold leading-none text-accent-ink sm:text-xl sm:leading-normal">
                  {verifiedCounts.projectsShown}
                </span>
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fg sm:text-muted">
                  Live Projects
                </span>
              </li>
              <li className="hidden items-baseline border-l border-line pl-4 sm:ml-4 sm:flex">
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-fg">
                  Built Around Your Goals
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

            Capped at 36rem and pulled to the end of its column so the form
            keeps a comfortable measure at 1920px instead of stretching to
            750px-wide fields.
          */}
          <div
            id="estimator"
            className="hero-settle w-full xl:max-w-[36rem] xl:justify-self-end"
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
        </div>
      </div>
    </section>
  );
}
