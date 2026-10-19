"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";
import { sectionNav } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Sticky site header.
 *
 * Two behaviours, both small and both deliberate:
 *
 *   - It is transparent over the top of the hero and gains a solid paper
 *     background plus a hairline once the page scrolls, so the hero reads as
 *     full-bleed without the nav ever sitting unreadably over an image.
 *   - The mobile panel traps focus while open, closes on Escape, closes on
 *     any navigation, and locks background scroll. A menu that can be tabbed
 *     out of behind its own overlay is worse than no menu.
 */

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  /* ---- solid background after the first fold of scroll ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[var(--header-h)]",
        "transition-[background-color,border-color,box-shadow] duration-[var(--dur-base)]",
        scrolled || open
          ? "border-b border-line bg-paper/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-site flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="MIDIS — home"
          className="flex min-h-11 shrink-0 items-center rounded-sm"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        {/* ---- desktop nav ---- */}
        <nav
          aria-label="Page sections"
          className="hidden items-center gap-8 lg:flex"
        >
          {sectionNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              /* `min-h-11` gives each nav item a 44px tap target. Without
                 it the link box is only as tall as its 14px text (20px),
                 which fails WCAG 2.5.8's 24px minimum. */
              className="flex min-h-11 items-center text-sm font-medium text-fg/75 transition-colors duration-[var(--dur-fast)] hover:text-fg"
            >
              <span className="link-underline">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button
            href="#estimator"
            size="md"
            className="hidden sm:inline-flex"
          >
            Get a Free Consultation
          </Button>

          {/* ---- mobile trigger ---- */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-fg lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3.5 7.5h17M3.5 16.5h17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

    </header>

      {/* ================= mobile panel =================
          OUTSIDE the <header>, and that is load-bearing.

          While open, the header carries `backdrop-blur-md`
          (backdrop-filter: blur(12px)). A filtered element becomes the
          CONTAINING BLOCK for its fixed-position descendants, so when this
          panel lived inside the header, `top: 4.5rem; bottom: 0` resolved
          against the header's own 72px box instead of the viewport. The
          panel computed to 1px tall, its links painted over the hero, and
          `elementFromPoint` at a link's centre returned the hero section —
          every item in the mobile menu was unclickable.

          Measured with Playwright at 390px. Moving the panel out of the
          filtered subtree restores the viewport as its containing block.
          z-40 keeps it beneath the header bar so the close button stays on
          top. */}
      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className="fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto border-t border-line bg-paper lg:hidden"
        >
          <nav
            aria-label="Page sections"
            className="container-site flex flex-col py-4"
          >
            {sectionNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-xl font-medium text-fg"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="container-site flex flex-col gap-3 pb-10 pt-4">
            <Button
              href="#estimator"
              size="lg"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Get a Free Consultation
            </Button>
            <Button
              href="/free-website-audit"
              variant="secondary"
              size="lg"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Get a Free Website Audit
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
