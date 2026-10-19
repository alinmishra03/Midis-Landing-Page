import { Arrow, Button } from "@/components/ui/Button";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Eyebrow } from "@/components/ui/Section";
import { Magnetic, TiltCard } from "@/components/ui/TiltCard";
import { hero } from "@/content/sections";
import { heroShowcase } from "@/content/work";
import { verifiedCounts } from "@/content/clients";

/**
 * SECTION 1 — Hero.
 *
 * COMPOSITION. An asymmetric split: a left column carrying the editorial
 * headline and both CTAs, and a right column holding three real project
 * screenshots in layered browser chrome. The layering is static depth — a
 * considered stack with real shadows — rather than a parallax effect, which
 * the brief rules out and which costs a scroll listener on the one part of
 * the page where jank is most visible.
 *
 * WHY THE HEADLINE STAYS THE FOCAL POINT. The showcase is capped at 46% of
 * the row and sits behind the headline in the stacking order on the widest
 * breakpoints, so the h1 is never the second thing the eye lands on.
 *
 * MOBILE. The stack is not the desktop composition squeezed down. Below
 * `lg` the showcase collapses to ONE screenshot at full width beneath the
 * CTAs — three overlapping frames at 360px would be mud — and the headline,
 * subheadline and primary CTA all sit above the fold.
 *
 * HEIGHT. Deliberately not `100vh`. The brief asks for a hero that is not
 * excessively tall, and a viewport-locked hero on a short laptop screen
 * pushes the subheadline and CTAs out of view entirely.
 */

export function Hero() {
  const [lead, ...rest] = heroShowcase;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-paper pt-[calc(var(--header-h)+2.5rem)] pb-16 sm:pb-20 lg:pt-[calc(var(--header-h)+5rem)] lg:pb-28"
    >
      {/*
        Background wash. A single very soft radial in the brand orange at 7%
        — enough to stop the paper reading as flat, nowhere near the "flashy
        gradient" the brief rules out. Decorative, so it is hidden from
        assistive technology and cannot be selected.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 78% 18%, rgba(239,135,22,0.07), transparent 65%)",
        }}
      />

      <div className="container-site">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)] lg:gap-14 xl:gap-20">
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
              className="hero-rise mt-5 text-[length:var(--text-display-xl)] leading-[1.02]"
              style={{ "--d": "90ms" } as React.CSSProperties}
            >
              Websites That Turn{" "}
              <span className="lg:block">
                Visitors Into{" "}
                {/*
                  The one accent in the headline. --color-accent-ink
                  (#AA5A0A), never --color-accent — the brand orange is
                  2.55:1 on paper and would fail as text at any size.
                */}
                <span className="text-accent-ink">Customers.</span>
              </span>
            </h1>

            <p
              className="hero-rise mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              {hero.subheadline}
            </p>

            <div
              className="hero-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ "--d": "260ms" } as React.CSSProperties}
            >
              <Magnetic>
                <Button href={hero.primaryCta.href} size="lg">
                  {hero.primaryCta.label}
                  <Arrow />
                </Button>
              </Magnetic>
              <Button
                href={hero.secondaryCta.href}
                variant="secondary"
                size="lg"
              >
                {hero.secondaryCta.label}
              </Button>
            </div>

            <p
              className="hero-rise mt-8 max-w-md border-l-2 border-accent/40 pl-4 text-sm leading-relaxed text-muted-strong"
              style={{ "--d": "340ms" } as React.CSSProperties}
            >
              {hero.supportingLine}
            </p>
          </div>

          {/* ================= right: the proof ================= */}
          <div className="relative">
            {/*
              Desktop: three frames, layered, on a shared tilt plane so the
              whole stack turns very slightly toward the pointer. That is
              what makes the composition read as depth rather than as three
              overlapping pictures.

              `aria-hidden` is NOT used — these are real projects and their
              alt text names them. But the two behind the lead frame are
              hidden below `lg`, where they would only produce clutter.
            */}
            <TiltCard
              className="hero-settle relative lg:pb-16 lg:pl-14"
              innerClassName="relative"
            >
              {/* back frame */}
              {rest[1] ? (
                <div className="absolute left-0 top-10 hidden w-[62%] lg:block">
                  <BrowserFrame
                    src={rest[1].preview}
                    alt={`${rest[1].name} website homepage`}
                    host={rest[1].host}
                    sizes="(min-width: 1280px) 22vw, 26vw"
                    compact
                    className="opacity-70 saturate-[0.9]"
                  />
                </div>
              ) : null}

              {/* middle frame */}
              {rest[0] ? (
                <div className="absolute bottom-0 left-16 hidden w-[58%] lg:block">
                  <BrowserFrame
                    src={rest[0].preview}
                    alt={`${rest[0].name} website homepage`}
                    host={rest[0].host}
                    sizes="(min-width: 1280px) 20vw, 24vw"
                    compact
                    className="opacity-90"
                  />
                </div>
              ) : null}

              {/* lead frame — the LCP image, so it loads eagerly.
                  `tilt-lift` pushes it forward of the two behind it, which
                  is what gives the stack real parallax as it turns. */}
              <div className="tilt-lift relative lg:ml-auto lg:w-[86%]">
                <BrowserFrame
                  src={lead.preview}
                  alt={`${lead.name} website homepage, built by MIDIS`}
                  host={lead.host}
                  priority
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 80vw, 92vw"
                />
              </div>
            </TiltCard>

            {/*
              A countable fact, not a performance claim.

              Both numbers come from lists that exist in the repository and
              can be recounted. No conversion uplift, no ROI multiple, no
              "15+ years" — nothing that has not been verified.
            */}
            <dl
              className="hero-rise mt-7 flex flex-wrap gap-x-8 gap-y-3 lg:mt-0 lg:pl-14"
              style={{ "--d": "460ms" } as React.CSSProperties}
            >
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Clients
                </dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold">
                  {verifiedCounts.clientsNamed}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Live projects shown
                </dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold">
                  {verifiedCounts.projectsShown}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
