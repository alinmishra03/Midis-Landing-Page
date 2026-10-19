import Link from "next/link";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import type { ThankYouContent } from "@/content/forms";
import { site, whatsappHref } from "@/content/site";

/**
 * PHASE 5 — the post-submission experience.
 *
 * Follows MIDIS.pdf page 17: a dark bar carrying the wordmark and the
 * "Digital Growth Partner" strapline, a confirmation mark, the heading, the
 * "What happens next?" panel on the warm tint, the booking block, and the
 * footer line.
 *
 * THE BOOKING INTEGRATION — READ THIS BEFORE CHANGING IT
 * -----------------------------------------------------
 * MIDIS.pdf's design says "Embed your Calendly booking calendar here" but
 * supplies no URL, so there is nothing to embed yet. The integration point
 * is `NEXT_PUBLIC_CALENDLY_URL`:
 *
 *   SET   — the approved "Choose a Meeting Time" button appears and opens
 *           the real scheduling page.
 *   UNSET — the button does NOT appear. A fallback offers email and
 *           WhatsApp instead.
 *
 * There is deliberately no disabled-looking button and no placeholder link,
 * because a button that goes nowhere reads as a broken site rather than an
 * unconfigured one.
 *
 * NOTHING HERE SAYS A MEETING IS BOOKED. The page confirms that the
 * REQUEST was received — which is true, because the API confirmed the CMS
 * stored it before this page was ever reached. Scheduling is presented as
 * the next action the visitor takes, and only Calendly can confirm it
 * happened.
 */

/**
 * Read once at module scope. `NEXT_PUBLIC_` values are inlined at build
 * time, so this is a constant in the bundle rather than a runtime lookup —
 * which also means the page stays fully static.
 */
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || null;

export function Confirmation({ content }: { content: ThankYouContent }) {
  return (
    <>
      {/* ---- bar (MIDIS.pdf p.17) ---- */}
      <header className="on-dark bg-ink text-white">
        <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link
            href="/"
            aria-label="MIDIS — home"
            className="flex min-h-11 shrink-0 items-center"
          >
            <Logo tone="dark" />
          </Link>
          <p className="text-sm font-medium text-muted-dark">
            {site.strapline}
          </p>
        </div>
      </header>

      <main id="main" className="bg-paper py-12 sm:py-20">
        <div className="container-site">
          <div className="mx-auto max-w-2xl">
            {/* ---- confirmation ---- */}
            <div className="text-center">
              <span
                aria-hidden="true"
                className="inline-flex size-14 items-center justify-center rounded-full bg-[#e8f5ec]"
              >
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#1a7f43"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M7.6 12.3l3 3 5.8-6.2"
                    stroke="#1a7f43"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <h1 className="mt-6 text-[length:var(--text-display-md)] leading-[1.08]">
                {content.heading}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
                {content.intro}
              </p>
            </div>

            {/* ---- what happens next ---- */}
            <div className="mt-10 rounded-2xl bg-accent-soft p-6 sm:p-8">
              <h2 className="text-lg font-semibold">
                {content.nextStepsHeading}
              </h2>

              <ol className="mt-5 flex flex-col gap-5">
                {content.steps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xs font-semibold text-on-accent"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-[0.9375rem] font-semibold leading-snug">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-fg/85">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* ---- booking ---- */}
            <div className="mt-12 text-center">
              <h2 className="text-[length:var(--text-display-sm)] leading-tight">
                {content.bookingHeading}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
                {content.bookingIntro}
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-accent-line bg-surface p-6 text-center sm:p-8">
              <span
                aria-hidden="true"
                className="inline-flex size-10 items-center justify-center text-accent-ink"
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M3 9.5h18M8 3v3.5M16 3v3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <circle cx="8.5" cy="14" r="1.2" fill="currentColor" />
                </svg>
              </span>

              <h3 className="mt-2 text-lg font-semibold">
                {content.bookingCardHeading}
              </h3>

              {CALENDLY_URL ? (
                <>
                  <Button href={CALENDLY_URL} size="lg" className="mt-5 w-full sm:w-auto">
                    {content.bookingCta}
                    <Arrow />
                  </Button>
                  <p className="mt-4 text-xs text-muted">{content.duration}</p>
                </>
              ) : (
                <>
                  {/*
                    Unconfigured. No button, because a scheduling button that
                    opens nothing is worse than none — and nothing here
                    suggests a meeting has been or can yet be booked.
                  */}
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                    Online booking is being set up. In the meantime, reply to
                    your confirmation email or reach us directly and we will
                    arrange a time that suits you.
                  </p>

                  <ButtonGroup align="center" className="mt-6">
                    <Button href={`mailto:${site.email}`} size="lg">
                      Email {site.email}
                      <Arrow />
                    </Button>
                    <Button href={whatsappHref} variant="secondary" size="lg">
                      Message on WhatsApp
                    </Button>
                  </ButtonGroup>

                  <p className="mt-4 text-xs text-muted">{content.duration}</p>
                </>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-muted">
              {content.fallback}
            </p>

            <p className="mt-10 text-center">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center text-sm font-medium text-fg transition-colors hover:text-accent-ink"
              >
                <span className="link-underline-accent">
                  Back to the MIDIS site
                </span>
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ---- footer line (MIDIS.pdf p.17) ---- */}
      <footer className="border-t border-line bg-paper py-6">
        <p className="container-site text-center text-sm text-muted">
          MIDIS · {site.footerStrapline}
        </p>
      </footer>
    </>
  );
}
