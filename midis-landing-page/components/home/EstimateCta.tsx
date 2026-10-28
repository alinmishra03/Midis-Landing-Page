"use client";

import { Arrow, Button } from "@/components/ui/Button";

/**
 * The hero's primary CTA: "Get a Free Project Estimate" — the exact label
 * from MIDIS's hero-redesign brief of 2026-10-21, which also removed the
 * hero's secondary consultation button so this is the hero's ONE action.
 * (The navbar consultation CTA and every other approved contact route are
 * untouched.) A client component for ONE reason — after the native anchor
 * scroll to `#estimator`, it also moves focus to the form's first question,
 * so the visitor lands ready to answer rather than merely near the form.
 *
 * The anchor's default behaviour is kept (no preventDefault): the browser
 * handles the smooth scroll and the `scroll-padding-top` header clearance
 * exactly as it does for every other estimator link. Focus follows after
 * the glide has settled, with `preventScroll` so it cannot yank the page.
 * The target is the consultation form's first field (Your Name; the
 * four-step estimator's first radio until 2026-10-28). It is a text field,
 * so focus moves only on fine-pointer devices: on touch, focusing it would
 * open the keyboard mid-scroll.
 */
export function focusEstimatorAfterScroll() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  window.setTimeout(() => {
    document
      .querySelector<HTMLInputElement>("#estimator form input:not([tabindex='-1'])")
      ?.focus({ preventScroll: true });
  }, 700);
}

export function EstimateCta({ className }: { className?: string }) {
  return (
    <Button
      href="#estimator"
      size="lg"
      className={className}
      onClick={focusEstimatorAfterScroll}
    >
      Get a Free Project Estimate
      <Arrow />
    </Button>
  );
}
