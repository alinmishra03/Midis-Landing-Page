import Image from "next/image";
import { CountUp } from "@/components/ui/CountUp";
import { ConsultationForm } from "@/components/forms/ConsultationForm";
import { hero } from "@/content/sections";
import mockup from "@/public/images/hero/midis-website-growth-mockup.webp";

/**
 * SECTION 1 — Hero.
 *
 * THE 2026-10-28 REDESIGN (MIDIS brief: "completely redesign the homepage
 * hero"). Same three elements — the laptop-and-phone visual, the message
 * with its proof, the four-step estimator — rebuilt as one composition:
 *
 *   - THE STAGE. The section carries its own warm wash: a soft orange glow
 *     behind the visual fading into the page colour (`.hero-stage`,
 *     globals.css). Gradients only, no blur filters, no shapes.
 *   - THE VISUAL sits in a framed "print" — a thin surface mat, a large
 *     radius and a layered shadow — over its own ambient glow, and reveals
 *     with a gentle scale-down. Shown whole at its natural 1692x930 ratio:
 *     nothing is cropped, nothing stretched.
 *   - THE MESSAGE. The original h1 and description, left-aligned at every
 *     width; "Into Customers." in orange over a short marker stroke that
 *     draws in once. The statistics sit under a hairline as two quiet
 *     figures — icon, charcoal numeral with an orange "+", small label —
 *     not boxed tiles.
 *   - THE CONSULTATION FORM in a white panel with an orange top edge; it
 *     slides in from the right.
 *
 * GRID: one CSS grid in the shared container, so both columns share the
 * navbar's edges. From 1200px two columns, 60/40 with a 40px gap, that
 * start on the same line. 60/40 rather than 58/42 keeps the form panel
 * under the estimator's 512px two-column switch, so its fields stay one
 * column and the panel ends level with the left column (within ~30px at
 * 1440/1920) instead of leaving a gap under either. Below 1200px it is one
 * column, at most 736px wide and centred — visual, heading, description,
 * statistics, form, which is also the DOM order, so reading and keyboard
 * order match. Two columns at 1024 would leave ~200px empty under the
 * statistics beside the taller form.
 * No min-height, no fixed heights: the section is as tall as its content.
 *
 * SPACING (desktop / phones): navbar -> content 28/24px; visual -> heading
 * 24/20px; heading -> description 16/12px; description -> statistics
 * 24/20px; statistics -> form (stacked) 32/28px; section bottom 56/40px.
 *
 * ONE FORM, ONE ANCHOR. The panel carries `id="estimator"`, the anchor every
 * CTA points at. Inside it is the shared single-step ConsultationForm
 * (2026-10-28; the same component as the lead popup). Its field pairs are
 * container queries, so they follow the panel's width.
 *
 * MOTION is CSS-only (`hero-reveal`, `hero-rise`, `hero-slide`, globals.css)
 * so nothing waits on hydration — the h1 is the LCP element — and all of it
 * is off under prefers-reduced-motion. FloatingCta keeps its estimate pill
 * hidden while `#hero` is on screen.
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
      className="hero-stage relative isolate pt-[calc(var(--header-h)+1.5rem)] pb-10 lg:pt-[calc(var(--header-h)+1.75rem)] lg:pb-14"
    >
      <div className="container-site grid items-start gap-y-7 sm:gap-y-8 min-[1200px]:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] min-[1200px]:gap-x-10">
        {/* ================= left: visual + message + proof ================= */}
        <div className="mx-auto flex w-full min-w-0 max-w-[46rem] flex-col min-[1200px]:max-w-none">
          <figure className="hero-visual hero-reveal">
            <span aria-hidden="true" className="hero-visual-glow" />
            <div className="hero-visual-frame">
              <Image
                src={mockup}
                alt="A MIDIS-designed website on a laptop and a smartphone, with “More Enquiries” and “Grow Your Business” callouts and a rising growth arrow"
                priority
                placeholder="blur"
                sizes="(min-width: 1440px) 840px, (min-width: 1200px) 58vw, (min-width: 768px) 736px, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </figure>

          {/*
            The page's only h1, in the original wording. "Into Customers."
            never splits (`whitespace-nowrap`), and `text-wrap: balance`
            evens the lines around it, so no line holds a single word.
          */}
          <h1
            id="hero-heading"
            className="hero-rise mt-5 max-w-[40rem] text-[length:var(--text-hero)] font-bold leading-[1.04] tracking-[-0.035em] text-balance lg:mt-6"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            Websites That Turn Visitors{" "}
            <span className="hero-accent hero-mark whitespace-nowrap">
              Into Customers.
            </span>
          </h1>

          <p
            className="hero-sub hero-rise mt-3 max-w-[36rem] text-base leading-relaxed text-muted sm:text-[1.0625rem] lg:mt-4 xl:text-lg"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            {hero.subheadline}
          </p>

          {/*
            The statistics: two equal figures under a hairline, split by a
            second hairline. The numerals render server-side at their final
            values; CountUp animates them once when they come into view.
          */}
          <ul
            className="hero-rise mt-5 grid max-w-[30rem] grid-cols-2 border-t border-line pt-5 lg:mt-6"
            style={{ "--d": "280ms" } as React.CSSProperties}
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
                  <span className="font-display text-[1.625rem] font-bold leading-none tracking-[-0.03em] sm:text-[1.875rem] lg:text-[2rem]">
                    <CountUp value={stat.value} delay={280} />
                    <span className="hero-accent">+</span>
                  </span>
                  <span className="mt-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted sm:text-xs">
                    {stat.label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ================= right: the consultation form ================= */}
        {/*
          `id="estimator"` is on the panel, so every `#estimator` link lands
          on the form (the html scroll-padding clears the fixed header). The
          id predates the 2026-10-28 single-step form and is kept so no
          link, the CTA focus helper or the popup's "form in progress"
          check needed changing. No fixed height: the panel fits the form
          and, after a submission, the thank-you screen.
        */}
        <div
          id="estimator"
          className="hero-form-shell hero-slide mx-auto w-full min-w-0 max-w-[46rem] p-5 sm:p-6 min-[1200px]:max-w-none"
          style={{ "--d": "220ms" } as React.CSSProperties}
        >
          <ConsultationForm source="homepage" />
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
