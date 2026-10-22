"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsappHref } from "@/content/site";

/**
 * THE FLOATING CONTACT BUTTON (MIDIS follow-up, 2026-10-22).
 *
 * ONE circular WhatsApp action pinned bottom-right — WhatsApp's own green
 * (#25D366) with the white official glyph. The Call and Estimate circles of
 * the 2026-10-21 dock were REMOVED on MIDIS's instruction of 2026-10-22;
 * WhatsApp is the only thing that floats.
 *
 * The destination is the VERIFIED WhatsApp-enabled line from
 * content/site.ts — never written out here.
 *
 * Hovering or keyboard-focusing the button slides a compact label out to
 * the left (pointer devices only — on touch the aria-label does the work).
 *
 * SMART VISIBILITY — the brief's "must not overlap" list, unchanged:
 *   1. Below 768px the button waits until the hero has scrolled past —
 *      there the hero's form spans the full width, so even a circle would
 *      sit on its fields.
 *   2. While the FOOTER is on screen, it hides.
 *   3. While ANY form field has focus, it hides — which also keeps it clear
 *      of the mobile keyboard and every submit button.
 *   4. While a LEAD POPUP is open, it hides (CSS, keyed off the
 *      `data-popup-open` attribute LeadPopups keeps on <body>).
 *
 * All cheap: two IntersectionObservers, the bubbling focusin/focusout pair,
 * one attribute selector. Hidden states are opacity + transform +
 * pointer-events (never display), so transitions run and a hidden button
 * can never swallow a tap. Hidden, it also leaves the tab order.
 */

export function FloatingCta() {
  /* Starts true: the page opens on the hero, where the button may only show
     from 768px up; the effect corrects it immediately where it may. */
  const [groupHidden, setGroupHidden] = useState(true);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    let footerVisible = false;
    let typing = false;
    let heroVisible = true;
    const wide = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setGroupHidden(footerVisible || typing || (heroVisible && !wide.matches));
    };
    wide.addEventListener("change", apply);

    const heroSection = document.querySelector(
      "section[aria-labelledby='hero-heading']",
    );
    if (heroSection) {
      const observer = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        apply();
      });
      observer.observe(heroSection);
      observers.push(observer);
    } else {
      heroVisible = false;
      apply();
    }

    const footer = document.querySelector("footer");
    if (footer) {
      const observer = new IntersectionObserver(([entry]) => {
        footerVisible = entry.isIntersecting;
        apply();
      });
      observer.observe(footer);
      observers.push(observer);
    }

    const isField = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT");
    const onFocusIn = (event: FocusEvent) => {
      if (isField(event.target)) {
        typing = true;
        apply();
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (isField(event.target)) {
        typing = false;
        apply();
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      wide.removeEventListener("change", apply);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const hidden = groupHidden;

  return (
    <div className="floating-cta" data-hidden={hidden || undefined}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MIDIS on WhatsApp"
        className="fab fab-whatsapp"
        tabIndex={hidden ? -1 : 0}
      >
        <span aria-hidden="true" className="fab-label">
          Chat on WhatsApp
        </span>
        <WhatsAppIcon className="size-[22px]" />
      </a>
    </div>
  );
}
