"use client";

import { useEffect, useState } from "react";
import { Arrow } from "@/components/ui/Button";
import { whatsappHref } from "@/content/site";

/**
 * THE FLOATING CTA GROUP (MIDIS brief, 2026-10-20).
 *
 * Two actions pinned to the bottom-right: WhatsApp (circular, with the
 * official glyph and a hover tooltip) and the estimator pill (orange,
 * routes to the hero form's `#estimator` anchor — never a second form).
 * The WhatsApp destination is `whatsappHref` from content/site.ts, the one
 * verified MIDIS line; no number is written here.
 *
 * SMART VISIBILITY, four independent signals:
 *   1. While the HERO is on screen, the estimator pill hides — the hero
 *      now carries its own "Get a Project Estimate" primary CTA and the
 *      form itself, so a floating copy there is pure noise (MIDIS brief,
 *      2026-10-20). It enters once the visitor scrolls past the hero.
 *      WhatsApp stays.
 *   2. While the FOOTER is on screen, the whole group hides, so it never
 *      sits on top of footer links.
 *   3. While ANY form field has focus, the whole group hides — which is
 *      also what keeps it clear of the mobile keyboard and guarantees it
 *      can never cover a form's submit button mid-entry.
 *   4. While a LEAD POPUP is open, the whole group hides — pure CSS, keyed
 *      off the `data-popup-open` attribute LeadPopups keeps on <body>.
 *
 * All cheap: two IntersectionObservers, the bubbling focusin/focusout
 * pair, and one attribute selector. No scroll listener.
 *
 * Hidden state is opacity + transform + pointer-events (never display),
 * so the transitions run and a hidden group can never swallow a tap.
 */

export function FloatingCta() {
  /* Starts true: the page opens on the hero, so on first paint the pill is
     legitimately redundant — and this also serves as the "appear once the
     visitor scrolls past the hero" entrance. `groupHidden` starts true for
     the same reason on phones; the effect corrects it immediately where
     the group may show. */
  const [heroInView, setHeroInView] = useState(true);
  const [groupHidden, setGroupHidden] = useState(true);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    let footerVisible = false;
    let typing = false;
    let heroVisible = true;
    /* Below 768px the hero's form spans the full width, so even the
       WhatsApp circle would sit ON the form — there the whole group waits
       until the hero has been scrolled past ("keep the WhatsApp button
       available IF it does not overlap content"). From 768 up the form
       column never reaches the corner and WhatsApp may stay. */
    const wide = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setHeroInView(heroVisible);
      setGroupHidden(footerVisible || typing || (heroVisible && !wide.matches));
    };
    wide.addEventListener("change", apply);

    /* The HERO, not just the estimator shell: the hero contains both the
       form and its own estimate CTA, so any part of it on screen makes the
       floating copy redundant. */
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

  return (
    /*
      ORDER: pill first, WhatsApp second — so WhatsApp OWNS the corner. The
      hidden pill keeps its layout box (hidden by opacity, so the show/hide
      can animate), and if WhatsApp sat to its right of nothing it would
      drift ~200px out of the corner every time the pill hid.
    */
    <div className="floating-cta" data-hidden={groupHidden || undefined}>
      <a
        href="#estimator"
        className="floating-pill group/btn"
        data-hidden={heroInView || undefined}
        aria-label="Get a project estimate"
        /* When hidden it also leaves the tab order — a keyboard user should
           not land on an invisible control. */
        tabIndex={heroInView ? -1 : 0}
      >
        <span className="hidden sm:inline">Get a Project Estimate</span>
        <span className="sm:hidden">Get Estimate</span>
        <Arrow />
      </a>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MIDIS on WhatsApp"
        className="floating-whatsapp"
      >
        {/* Tooltip for pointer users; the aria-label carries the same text
            for everyone else. Hidden where hover does not exist. */}
        <span aria-hidden="true" className="fab-tip">
          Chat with MIDIS
        </span>
        <WhatsAppGlyph />
      </a>
    </div>
  );
}

/** The official WhatsApp speech-bubble glyph (simplified single path). */
function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.39a9.87 9.87 0 0 0 4.69 1.19h.01c5.45 0 9.89-4.44 9.89-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
