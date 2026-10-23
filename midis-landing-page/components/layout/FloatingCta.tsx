import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappHref } from "@/content/site";

/**
 * THE FLOATING ACTIONS (MIDIS brief, 2026-10-23).
 *
 * Two solid circles stacked bottom-right on one vertical axis: orange
 * Project Estimate on top, green WhatsApp below, where it has always been.
 * (No Call circle — MIDIS declined it, 2026-10-23.)
 *
 *   - Estimate links to #estimator, like every other estimate CTA.
 *   - WhatsApp uses the verified WhatsApp-enabled line, unchanged.
 *
 * Solid fills only, white glyphs, one shared size, shadow, hover and focus
 * treatment (see "FLOATING ACTIONS" in globals.css). Always visible — no
 * scroll-driven hiding (MIDIS instruction, 2026-10-22); the popups layer
 * above them (z-70 vs z-30).
 *
 * Pointer devices get a small tooltip on hover / keyboard focus; touch is
 * icon-only and the aria-labels do the explaining.
 */
export function FloatingCta() {
  return (
    <div className="floating-cta">
      <a
        href="#estimator"
        aria-label="Get a Project Estimate"
        className="fab fab-estimate"
      >
        <span aria-hidden="true" className="fab-label">
          Get a Project Estimate
        </span>
        <EstimateGlyph />
      </a>
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
  );
}

/** A calculator: the estimator's "what will it cost" promise in one shape.
    Drawn on the same 24px grid and stroke weight as the WhatsApp glyph. */
function EstimateGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="2.75" width="14" height="18.5" rx="2.5" />
      <path d="M8.5 6.75h7" />
      <path d="M8.75 11.25h.01M12 11.25h.01M15.25 11.25h.01M8.75 14.5h.01M12 14.5h.01M15.25 14.5h.01M8.75 17.75h.01M12 17.75h3.25" strokeWidth="2.6" />
    </svg>
  );
}
