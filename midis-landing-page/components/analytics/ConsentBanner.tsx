"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { footerLegal } from "@/content/site";
import {
  OPEN_PREFERENCES_EVENT,
  readConsent,
  setConsent,
  subscribeConsent,
  type Consent,
} from "@/lib/analytics";

/**
 * THE COOKIE BANNER (MIDIS, 2026-10-29) — the consent gate for Google
 * Analytics and the Meta Pixel (lib/analytics.ts). Mounted once in the
 * root layout.
 *
 * Shown until the visitor answers, and again whenever the footer's
 * "Cookie preferences" link asks for it. Accept and Reject sit side by
 * side at the same size, so refusing is as easy as agreeing, and nothing
 * loads before an answer. It is a non-modal card at the bottom of the
 * screen: the page stays usable, and it never takes focus.
 *
 * Above the floating buttons (z 30) so its actions are always reachable;
 * below the lead popup (z 70).
 */

const serverConsent = (): Consent => "unset";

export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  /* `mounted` keeps the server render and the hydration pass identical:
     the banner only appears once storage has been read on the client. */
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted || (consent !== "unset" && !reopened)) return null;

  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    setReopened(false);
  };

  const privacy = footerLegal.find((item) => item.label === "Privacy Policy");

  return (
    <section
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:inset-x-auto sm:left-0 sm:p-5"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="hero-rise w-full rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_32px_-16px_rgba(20,21,24,0.35)] sm:w-[25rem] sm:p-5">
        <h2 id="cookie-banner-title" className="font-display text-base font-semibold">
          Cookies on this site
        </h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
          With your permission, we use Google Analytics and the Meta Pixel to understand how
          the site is used and measure our advertising. Nothing is set unless you accept.
          {privacy ? (
            <>
              {" "}
              <a
                href={privacy.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-fg underline underline-offset-2 hover:text-accent-ink"
              >
                Privacy Policy
              </a>
            </>
          ) : null}
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={() => choose("denied")}>
            Reject
          </Button>
          <Button type="button" size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </section>
  );
}

const noopSubscribe = () => () => {};

/** The footer's way back into the banner, to change or withdraw consent. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
      className={className}
    >
      Cookie preferences
    </button>
  );
}
