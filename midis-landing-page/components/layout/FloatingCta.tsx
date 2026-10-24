"use client";

import { focusEstimatorAfterScroll } from "@/components/home/EstimateCta";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappHref } from "@/content/site";

/**
 * THE FLOATING ACTIONS (MIDIS briefs, 2026-10-23 / 2026-10-24).
 *
 *   - "Get a Free Project Estimate": a sticky orange pill at the bottom
 *     centre, in a light glass ring. It replaced the orange calculator
 *     circle on 2026-10-24. It links to #estimator, the hero's form, like
 *     every other estimate CTA, and moves focus to the form's first
 *     question once the scroll settles (see EstimateCta), so there is
 *     still exactly one estimator on the page.
 *   - WhatsApp: the green circle bottom-right, unchanged.
 *
 * Below `sm` the pill sits LEFT of the WhatsApp circle on the same row
 * (centres aligned) instead of dead centre, because a centred pill wide
 * enough to read would run under the circle. See "FLOATING ACTIONS" in
 * globals.css. Always visible — no scroll-driven hiding (MIDIS
 * instruction, 2026-10-22); the nav panel (z-40) and popups (z-70) layer
 * above both.
 */
export function FloatingCta() {
  return (
    <>
      <div className="sticky-cta">
        <a
          href="#estimator"
          className="sticky-cta-btn"
          onClick={focusEstimatorAfterScroll}
        >
          Get a Free Project Estimate
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            aria-hidden="true"
            className="sticky-cta-arrow"
          >
            <path
              d="M3 8h9.5M8.5 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <div className="floating-cta">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with MIDIS on WhatsApp"
          className="fab fab-whatsapp"
        >
          <span aria-hidden="true" className="fab-label">
            Chat on WhatsApp
          </span>
          <WhatsAppIcon className="size-[22px]" />
        </a>
      </div>
    </>
  );
}
