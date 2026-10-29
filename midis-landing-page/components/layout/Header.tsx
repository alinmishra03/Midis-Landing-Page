"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { sectionNav } from "@/content/site";

/**
 * The floating site header.
 *
 * SHAPE. A translucent pill inside `container-site`, so its left and right
 * edges land on the same line as every section heading and card on the page.
 * The glass, the sizing tokens and the three-column grid live in
 * globals.css under "SITE HEADER"; this file owns only the behaviour.
 *
 * WHERE THE BREAKPOINTS COME FROM — they were measured, not picked.
 *
 *   The five links are centred with `1fr auto 1fr`, which only centres
 *   honestly while BOTH side columns fit inside their own track. The
 *   action cluster is the wide one, so the question is always "does twice
 *   the right-hand group, plus the links, fit the shell?"
 *
 *   - Below 1280 it does not: at 1024 the shell is ~932px and that sum is
 *     ~1124px. So `lg` uses `auto 1fr auto` instead — the links still sit
 *     in the middle of the space left over, nothing overlaps, and nothing
 *     is pushed off the shell.
 *   - From 1280 the sum is ~1124px against a ~1164px shell, so the grid
 *     becomes `1fr auto 1fr` and the links are centred against the shell
 *     itself.
 *   - The header carries no contact pills (WhatsApp was removed on MIDIS's
 *     instruction of 2026-10-23), so the right-hand group is now narrower
 *     than these measurements assumed — the breakpoints only got safer.
 *
 * ONE CONTROL HEIGHT. The toggle and the CTA are both
 * 44px: `size="sm"` on the Button, `size-11` on the toggle,
 * with `.nav-group-end a, .nav-group-end button { min-height }` in the CSS
 * as the bar's standing guarantee. Nothing in the bar sets its own height.
 *
 * THE PANEL LIVES OUTSIDE <header>, AND THAT IS LOAD-BEARING — see the note
 * above it.
 */

/** Trailing chevron on each row of the mobile panel. */
function Chevron() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  /* ---- the settled state, a few pixels into the scroll ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
   * ---- which section the visitor is actually in ----
   *
   * A narrow band across the viewport — everything above 32% and below 62%
   * is cropped away — so at most one section qualifies at a time and the
   * highlight changes once, cleanly, as a section crosses the middle of the
   * screen. A full-height root would have three sections "visible" at once
   * on a tall display and the active link would flicker between them.
   *
   * The hero is observed too, under a sentinel key: while it holds the band
   * the answer is "none", which is what keeps every link quiet at the top of
   * the page rather than lighting up Work before the visitor has reached it.
   *
   * When the band falls in a gap between sections nothing is reported, and
   * the previous answer stands — the alternative is the highlight blinking
   * off in the space between two sections.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const HERO = "\u0000hero";
    const targets: { key: string; el: Element }[] = [];

    const hero = document.querySelector("main > section:first-child");
    if (hero) targets.push({ key: HERO, el: hero });

    for (const item of sectionNav) {
      const el = document.getElementById(item.href.slice(1));
      if (el) targets.push({ key: item.href.slice(1), el });
    }
    if (targets.length === 0) return;

    const inBand = new Set<string>();
    const keyOf = (el: Element) => targets.find((t) => t.el === el)?.key;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = keyOf(entry.target);
          if (!key) continue;
          if (entry.isIntersecting) inBand.add(key);
          else inBand.delete(key);
        }

        /* Document order, so a section that overlaps the one below it still
           resolves to the higher of the two. */
        const first = targets.find((t) => inBand.has(t.key));
        if (!first) return;
        setActiveId(first.key === HERO ? null : first.key);
      },
      { rootMargin: "-32% 0px -62% 0px", threshold: 0 },
    );

    for (const target of targets) observer.observe(target.el);
    return () => observer.disconnect();
  }, []);

  /* ---- escape, scroll lock, and focus handling for the mobile panel ---- */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      /* Keep Tab inside the open panel. */
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Move focus into the panel so a keyboard user is not left behind it. */
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeAnd = () => setOpen(false);

  /* The section links are in-page anchors on the homepage; on any other
     route (the /thank-you page) they lead back to the homepage section. */
  const pathname = usePathname();
  const anchor = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  return (
    <>
      <header className="site-header" data-scrolled={scrolled || undefined}>
        <div className="container-site">
          <div className="nav-shell">
            <div className="nav-grid">
              {/* ================= left: the mark ================= */}
              <div className="nav-group-start">
                <Link
                  href="/"
                  aria-label="MIDIS — home"
                  className="flex min-h-11 shrink-0 items-center rounded-full px-2"
                  onClick={closeAnd}
                >
                  <Logo />
                </Link>
              </div>

              {/* ================= centre: the sections ================= */}
              <nav
                aria-label="Page sections"
                className="nav-group-center hidden lg:block"
              >
                <ul className="nav-links">
                  {sectionNav.map((item) => {
                    const active = activeId === item.href.slice(1);
                    return (
                      <li key={item.href}>
                        <a
                          href={anchor(item.href)}
                          className="nav-link"
                          data-active={active || undefined}
                          /* The observer will confirm this a moment later;
                             setting it on click means the highlight moves
                             with the visitor rather than after the scroll
                             has finished. */
                          onClick={() => setActiveId(item.href.slice(1))}
                          aria-current={active ? "true" : undefined}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* ================= right: the actions ================= */}
              <div className="nav-group-end">
                <Button href={anchor("#estimator")} size="sm" className="hidden sm:inline-flex">
                  Get a Free Consultation
                </Button>

                {/* ---- mobile trigger ---- */}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="inline-flex size-11 items-center justify-center rounded-full text-fg transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] hover:bg-fg/[0.07] active:scale-95 motion-reduce:transform-none lg:hidden"
                >
                  <span className="sr-only">
                    {open ? "Close menu" : "Open menu"}
                  </span>
                  {/* Two bars that cross, rather than an icon swap — an SVG
                      swap cannot be animated and reads as a flicker. */}
                  <span aria-hidden="true" className="nav-burger">
                    <span />
                    <span />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= mobile panel =================
          OUTSIDE the <header>, and that is load-bearing.

          The shell carries `backdrop-filter`, and a filtered element becomes
          the CONTAINING BLOCK for its fixed-position descendants. When this
          panel lived inside the header, `top: …; bottom: 0` resolved against
          the header's own box instead of the viewport: the panel computed to
          1px tall, its links painted over the hero, and `elementFromPoint` at
          a link's centre returned the hero section — every item in the mobile
          menu was unclickable. Measured with Playwright at 390px.

          It is also MOUNTED AT ALL TIMES, so it can animate out as well as
          in. `inert` is what keeps it out of the tab order and the
          accessibility tree while closed; `pointer-events: none` alone would
          leave every link tabbable behind the page. */}
      <div
        id={panelId}
        ref={panelRef}
        data-open={open || undefined}
        inert={!open}
        className="nav-panel lg:hidden"
      >
        <nav aria-label="Page sections" className="container-site">
          <ul>
            {sectionNav.map((item, index) => (
              <li
                key={item.href}
                className="nav-panel-item"
                style={{ "--i": index } as React.CSSProperties}
              >
                <a
                  href={anchor(item.href)}
                  onClick={closeAnd}
                  className="nav-panel-link"
                  data-active={activeId === item.href.slice(1) || undefined}
                  aria-current={
                    activeId === item.href.slice(1) ? "true" : undefined
                  }
                >
                  {item.label}
                  <Chevron />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* No WhatsApp in the header or this panel (MIDIS instruction,
            2026-10-23): the always-visible floating button is the site's one
            WhatsApp entry point. */}
        <div
          className="nav-panel-item container-site flex flex-col gap-3 pt-5"
          style={{ "--i": sectionNav.length } as React.CSSProperties}
        >
          <Button href={anchor("#estimator")} size="lg" onClick={closeAnd} className="w-full">
            Get a Free Consultation
          </Button>
          <Button
            href="/free-website-audit"
            variant="secondary"
            size="lg"
            onClick={closeAnd}
            className="w-full"
          >
            Get a Free Website Audit
          </Button>
        </div>
      </div>
    </>
  );
}
