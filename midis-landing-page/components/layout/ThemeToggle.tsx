"use client";

import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Light / dark toggle.
 *
 * WHY THERE IS NO `next-themes` HERE. The whole job is: read a stored
 * choice, set one attribute, write it back. That is this file, with no new
 * dependency to ship or keep current. The no-flash half of the problem is
 * solved by the inline script in app/layout.tsx, which has already set the
 * attribute before this component mounts.
 *
 * WHY `useSyncExternalStore`. The current theme lives in a place React does
 * not own — the `data-theme` attribute — so it is an external store, and
 * this is the hook built for subscribing to one. It also solves hydration
 * for free: `getServerSnapshot` returns `null`, so the server and the first
 * client render agree, and the real value arrives on the commit that
 * follows.
 *
 * LIGHT IS THE DEFAULT (MIDIS instruction, 2026-10-20). The OS preference
 * is no longer consulted anywhere: the inline script always writes the
 * attribute ("dark" only for a stored dark choice), so this component reads
 * the attribute alone and falls back to light if it is somehow absent.
 *
 * The ICONS are not derived from this value. Both are always rendered and
 * CSS shows one, so the correct icon is painted before any script runs. Only
 * the accessible label depends on the hook, because a label has to name the
 * real current state and that genuinely cannot be known on the server.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "midis-theme";
const CHANGE_EVENT = "midis-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** The theme actually in force: the attribute, else the light default. */
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/** Unknowable on the server, so say so rather than guessing. */
function getServerSnapshot(): null {
  return null;
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next: Theme =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    /*
     * Colour transitions are enabled only for the length of the switch. A
     * permanent transition on every element would fight every hover state on
     * the page and cost a repaint on each one.
     */
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private mode, or storage blocked. The switch still applies for this
         session; it just will not be remembered. Not worth throwing over. */
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
    window.setTimeout(() => root.classList.remove("theme-switching"), 320);
  }, []);

  const label =
    theme === null
      ? "Switch colour theme"
      : theme === "dark"
        ? "Switch to light theme"
        : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full",
        "text-fg transition-colors duration-[var(--dur-fast)]",
        "hover:bg-fg/[0.07] hover:text-accent-ink",
        className,
      )}
    >
      {/* Both icons render; CSS shows one. They cross-fade and rotate rather
          than swapping, and `motion-reduce` drops the rotation while keeping
          the swap. */}
      <span aria-hidden="true" className="relative block size-5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="theme-icon-sun absolute inset-0 size-5"
        >
          <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.6v2.1M12 19.3v2.1M21.4 12h-2.1M4.7 12H2.6M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5M18.6 18.6l-1.5-1.5M6.9 6.9 5.4 5.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="theme-icon-moon absolute inset-0 size-5"
        >
          <path
            d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
