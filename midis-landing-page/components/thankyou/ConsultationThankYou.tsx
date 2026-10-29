import { Arrow, Button } from "@/components/ui/Button";
import { MEETING_URL, consultationForm } from "@/content/forms";

/**
 * THE CONSULTATION CONFIRMATION (MIDIS brief, 2026-10-29).
 *
 * Where every successful ConsultationForm submission lands — the homepage
 * hero, the lead popup and the audit page's in-place form. It replaced the
 * thank-you screen the form used to swap in where it stood. The wording is
 * `consultationForm.thankYou` in content/forms.ts, verbatim from the brief.
 *
 * ONE ACTION: the HubSpot meetings link, in a new tab (Button adds
 * target/rel for external URLs). Like the old screen it confirms the
 * REQUEST, never a meeting: only HubSpot can confirm that.
 *
 * The page reads nothing from the submission — no query string, no stored
 * form data — so it is fully static and a refresh renders it unchanged.
 *
 * LAYOUT. One centred column, 40rem at most, on the site's warm paper:
 * the check, the h1 and the confirmation, then the booking block on a
 * hairline-bordered surface (no shadow, no gradient), then the follow-up.
 * The booking button is full width on phones and sized to its label from
 * `sm` up.
 */

export function ConsultationThankYou() {
  const t = consultationForm.thankYou;

  return (
    <main
      id="main"
      className="bg-paper pt-[calc(var(--header-h)+2.5rem)] pb-14 sm:pt-[calc(var(--header-h)+4rem)] sm:pb-20 lg:pt-[calc(var(--header-h)+5rem)] lg:pb-24"
    >
      <div className="container-site">
        <div className="hero-rise mx-auto max-w-[40rem] text-center">
          <span aria-hidden="true" className="consult-success thank-you-check">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path
                d="M6.5 12.4l3.6 3.6 7.4-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h1 className="mt-5 font-display text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-balance sm:mt-6 sm:text-[2.25rem] lg:text-[2.625rem]">
            {t.heading}
          </h1>

          <div className="mx-auto mt-4 max-w-[32rem] space-y-2 text-[0.9375rem] leading-relaxed text-muted sm:mt-5 sm:text-base">
            {t.confirmation.map((line) => (
              <p key={line} className="text-pretty">
                {line}
              </p>
            ))}
          </div>

          {/* ---- booking ---- */}
          <section
            aria-labelledby="thank-you-booking"
            className="mt-8 rounded-2xl border border-line bg-surface px-4 py-7 sm:mt-10 sm:px-10 sm:py-9"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center text-accent-ink"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
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

            <h2
              id="thank-you-booking"
              className="mt-1 font-display text-[1.25rem] font-semibold leading-snug tracking-[-0.015em] sm:text-[1.5rem]"
            >
              {t.meetingHeading}
            </h2>
            <p className="mx-auto mt-2 max-w-[30rem] text-sm leading-relaxed text-muted text-pretty sm:text-[0.9375rem]">
              {t.meetingDescription}
            </p>

            <Button
              href={MEETING_URL}
              size="lg"
              /* Tighter on phones so the label keeps to one line from 360px. */
              className="consult-submit mt-6 w-full px-4 text-sm min-[400px]:text-[0.9375rem] sm:w-auto sm:px-8 sm:text-base"
            >
              {t.meetingCta}
              <Arrow />
              <span className="sr-only"> (opens in a new tab)</span>
            </Button>
          </section>

          {/* ---- follow-up ---- */}
          <div className="mx-auto mt-7 max-w-[32rem] space-y-1.5 text-sm leading-relaxed text-muted text-pretty sm:mt-8">
            {t.followUp.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
