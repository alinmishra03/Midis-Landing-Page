/**
 * ANALYTICS — Google Analytics 4 and the Meta Pixel (MIDIS brief, 2026-10-29).
 *
 * The one place that knows the two IDs, the visitor's consent, and how an
 * event reaches each provider. The scripts themselves are mounted once, in
 * the root layout, by components/analytics/Analytics.tsx; the banner that
 * asks is components/analytics/ConsentBanner.tsx.
 *
 * CONSENT FIRST. Neither script is loaded until the visitor accepts in the
 * cookie banner — no tag, no cookie, no request before that. The choice is
 * kept in localStorage (per browser, until changed) and can be revisited
 * from the footer's "Cookie preferences" link. Withdrawing sets Google's
 * documented opt-out flag, revokes the Pixel's consent and clears both
 * providers' first-party cookies; on the next page load neither script is
 * loaded at all.
 *
 * PAGE VIEWS are left to each provider's own single-page-app support, so
 * nothing here sends one by hand (doing both would double-count):
 *   - GA4: the config call sends the first page_view; later client-side
 *     navigations are counted by Enhanced Measurement's "Page changes based
 *     on browser history events" (on by default in the GA4 property).
 *   - Meta: the snippet's own `fbq('track','PageView')` for the first view;
 *     the Pixel then tracks history.pushState navigations itself.
 *
 * NO PERSONAL DATA. Events carry the event name and, for a lead, which form
 * it came from ("homepage" / "popup" / "audit"). Never a name, email, phone
 * number or URL the visitor typed.
 */

export const GA_MEASUREMENT_ID = "G-EPDDCR21K0";
export const META_PIXEL_ID = "1731274227883408";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/* ========================================================================== */
/* Consent                                                                     */
/* ========================================================================== */

/** "unset" until the visitor answers the banner. */
export type Consent = "granted" | "denied" | "unset";

const KEY = "midis-consent";
/** Fired on every change, so each subscriber re-reads. */
const CHANGE_EVENT = "midis:consent-change";
/** Fired by the footer link to reopen the banner. */
export const OPEN_PREFERENCES_EVENT = "midis:open-cookie-preferences";

export function readConsent(): Consent {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    /* Storage blocked: ask again rather than assume. */
    return "unset";
  }
}

export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  /* Another tab changing its mind counts too. */
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* Private mode: the choice holds for this page only. */
  }

  /* Google's opt-out flag is read on every hit, so it also stops a tag that
     is already running. */
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] =
    value !== "granted";

  if (value === "granted") {
    window.fbq?.("consent", "grant");
  } else {
    window.fbq?.("consent", "revoke");
    clearTrackingCookies();
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** GA4's `_ga` / `_ga_<id>` and Meta's `_fbp` / `_fbc`, on this host and its
    parent domain (gtag sets them on the widest domain it can). */
function clearTrackingCookies() {
  const names = document.cookie
    .split(";")
    .map((pair) => pair.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_fbp" || name === "_fbc");
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

/* ========================================================================== */
/* Events                                                                      */
/* ========================================================================== */

/**
 * A consultation request the server has CONFIRMED it stored. Called from
 * ConsultationForm's success branch only — never on open, on a validation
 * error, on a failed request, or on a visit to /thank-you. The form's own
 * in-flight guard means it runs once per submission. The redirect that
 * follows is client-side, so the page is never unloaded mid-send.
 */
export function trackLead(source: "homepage" | "popup" | "audit") {
  if (readConsent() !== "granted") return;
  window.gtag?.("event", "generate_lead", { form_location: source });
  window.fbq?.("track", "Lead");
}

/**
 * A click on the /thank-you page's HubSpot booking button. Interest only:
 * whether a meeting was actually booked is HubSpot's to report. Wired by a
 * `data-track` attribute (see Analytics.tsx), so the page stays a server
 * component.
 */
export function trackBookingClick() {
  if (readConsent() !== "granted") return;
  window.gtag?.("event", "book_consultation_click");
  window.fbq?.("trackCustom", "BookConsultationClick");
}

/** `data-track` values → the function that reports them. */
export const TRACKED_CLICKS: Record<string, () => void> = {
  "book-consultation": trackBookingClick,
};
