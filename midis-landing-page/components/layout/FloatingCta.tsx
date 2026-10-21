"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { callHref, primaryPhone, whatsappHref } from "@/content/site";

/**
 * THE FLOATING CONTACT DOCK (MIDIS brief, 2026-10-21).
 *
 * Three circular actions stacked vertically in the bottom-right corner —
 * the page's ONE floating contact group (it replaces the 2026-10-20
 * WhatsApp-circle-plus-estimator-pill pair; nothing else floats):
 *
 *   01  WhatsApp   — WhatsApp's own green (#25D366), white official glyph
 *   02  Call       — charcoal, white handset, orange hover accent
 *   03  Estimate   — MIDIS orange, dark clipboard icon → #estimator
 *
 * Both destinations are the VERIFIED ones from content/site.ts — the
 * WhatsApp-enabled line and `primaryPhone` — never written out here. If the
 * phone list were emptied, the Call button simply does not render.
 *
 * Hovering or keyboard-focusing a button slides a compact label out to the
 * left (pointer devices only — on touch the aria-labels do the work). The
 * estimator button behaves exactly like the hero CTA: native anchor scroll
 * to the ONE form, then focus its first radio after the glide settles
 * (see EstimateCta for the full reasoning) — never a second form, never a
 * reset of anything the visitor has typed.
 *
 * ALL THREE BUTTONS ARE CONSTANT (MIDIS follow-up, 2026-10-21): the
 * estimator button no longer hides while the hero is on screen — the dock
 * always shows the same three actions. What remains is the DOCK-level
 * smart visibility, which is the brief's "must not overlap" list:
 *   1. Below 768px the whole dock waits until the hero has scrolled past —
 *      there the hero's form spans the full width, so even the circles
 *      would sit on its fields.
 *   2. While the FOOTER is on screen, the whole dock hides.
 *   3. While ANY form field has focus, the whole dock hides — which also
 *      keeps it clear of the mobile keyboard and every submit button.
 *   4. While a LEAD POPUP is open, the whole dock hides (CSS, keyed off the
 *      `data-popup-open` attribute LeadPopups keeps on <body>).
 *
 * All cheap: two IntersectionObservers, the bubbling focusin/focusout pair,
 * one attribute selector. Hidden states are opacity + transform +
 * pointer-events (never display), so transitions run and a hidden dock can
 * never swallow a tap. Hidden buttons also leave the tab order.
 */

export function FloatingCta() {
  /* Starts true: the page opens on the hero, where the dock may only show
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
      {/* 01 — WhatsApp */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with MIDIS on WhatsApp"
        className="fab fab-whatsapp"
        style={{ "--d": "500ms" } as React.CSSProperties}
        tabIndex={hidden ? -1 : 0}
      >
        <span aria-hidden="true" className="fab-label">
          Chat on WhatsApp
        </span>
        <WhatsAppIcon className="size-[22px]" />
      </a>

      {/* 02 — Call. Rendered only when a verified number exists. */}
      {callHref && primaryPhone ? (
        <a
          href={callHref}
          aria-label={`Call MIDIS on ${primaryPhone.display}`}
          className="fab fab-call"
          style={{ "--d": "580ms" } as React.CSSProperties}
          tabIndex={hidden ? -1 : 0}
        >
          <span aria-hidden="true" className="fab-label">
            Call MIDIS
          </span>
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6.3 3.5h2.4l1.5 3.7-1.8 1.3a11.3 11.3 0 0 0 5.1 5.1l1.3-1.8 3.7 1.5v2.4a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 4.3 5.7a2 2 0 0 1 2-2.2Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ) : null}

      {/* 03 — Get a Project Estimate → the ONE form on this page.
          Constant, like its two siblings (MIDIS follow-up, 2026-10-21). */}
      <a
        href="#estimator"
        aria-label="Get a Project Estimate"
        className="fab fab-estimate"
        tabIndex={hidden ? -1 : 0}
        style={{ "--d": "660ms" } as React.CSSProperties}
        onClick={() => {
          /* Same follow-up as the hero's EstimateCta: focus step one's
             first RADIO after the native smooth scroll settles —
             preventScroll so it cannot yank the page, a radio so the
             mobile keyboard never opens mid-glide. */
          window.setTimeout(() => {
            document
              .querySelector<HTMLInputElement>(
                "#estimator form input[type='radio']",
              )
              ?.focus({ preventScroll: true });
          }, 700);
        }}
      >
        <span aria-hidden="true" className="fab-label">
          Get a Project Estimate
        </span>
        {/* A clipboard with an estimate's line items — the document the
            button leads to, not a generic star or chat glyph. */}
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="4.5" width="14" height="17" rx="2" />
          <path d="M9 2.75h6v3.5H9z" />
          <path d="M8.75 11h6.5M8.75 14.5h6.5M8.75 18h3.5" />
        </svg>
      </a>
    </div>
  );
}
