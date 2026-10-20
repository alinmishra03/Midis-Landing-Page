"use client";

import { Arrow, Button } from "@/components/ui/Button";

/**
 * The hero's primary CTA: "Get a Project Estimate" (MIDIS brief,
 * 2026-10-20). A client component for ONE reason — after the native anchor
 * scroll to `#estimator`, it also moves focus to the form's first question,
 * so the visitor lands ready to answer rather than merely near the form.
 *
 * The anchor's default behaviour is kept (no preventDefault): the browser
 * handles the smooth scroll and the `scroll-padding-top` header clearance
 * exactly as it does for every other estimator link. Focus follows after
 * the glide has settled, with `preventScroll` so it cannot yank the page.
 * The target is step one's first RADIO, deliberately: focusing a radio
 * never opens the mobile keyboard mid-scroll, where a text field would.
 */
export function EstimateCta({ className }: { className?: string }) {
  return (
    <Button
      href="#estimator"
      size="lg"
      className={className}
      onClick={() => {
        window.setTimeout(() => {
          document
            .querySelector<HTMLInputElement>(
              "#estimator form input[type='radio']",
            )
            ?.focus({ preventScroll: true });
        }, 700);
      }}
    >
      Get a Project Estimate
      <Arrow />
    </Button>
  );
}
