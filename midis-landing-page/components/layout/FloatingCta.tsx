import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappHref } from "@/content/site";

/**
 * THE FLOATING CONTACT BUTTON.
 *
 * ONE circular WhatsApp action pinned bottom-right — WhatsApp's own green
 * (#25D366) with the white official glyph. The destination is the VERIFIED
 * WhatsApp-enabled line from content/site.ts — never written out here.
 *
 * ALWAYS VISIBLE (MIDIS instruction, 2026-10-22). The earlier smart
 * visibility — hiding over the hero on phones, over the footer, while a
 * form field had focus and while a lead popup was open — made the button
 * fade in and out during scrolling, which MIDIS asked to remove. It now
 * stays on screen at all times; popups still layer above it (z-70 vs
 * z-30), so an open dialog covers it rather than the other way round.
 *
 * Hovering or keyboard-focusing the button slides a compact label out to
 * the left (pointer devices only — on touch the aria-label does the work).
 */
export function FloatingCta() {
  return (
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
  );
}
