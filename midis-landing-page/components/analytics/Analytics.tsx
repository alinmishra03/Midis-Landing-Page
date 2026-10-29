"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import {
  GA_MEASUREMENT_ID,
  META_PIXEL_ID,
  TRACKED_CLICKS,
  readConsent,
  subscribeConsent,
  type Consent,
} from "@/lib/analytics";

/**
 * GOOGLE ANALYTICS 4 + META PIXEL — mounted once, in the root layout, so
 * both live for the whole session and survive client-side navigation.
 * Everything about consent, IDs and events is in lib/analytics.ts.
 *
 * The scripts render only once consent is "granted". The server (and the
 * hydration pass) always sees "unset", so nothing differs between server
 * and client HTML; consent is read from storage just after hydration.
 *
 * Each <Script> has an `id`, which is how next/script runs an inline script
 * once per page load however often this component re-renders or the
 * consent flips. `afterInteractive`: after hydration, never blocking the
 * first paint. The two inline bodies are the client's own embed code, with
 * one line added to the Pixel's: `autoConfig` off. Left on, the Pixel's
 * automatic configuration reads the consultation form's fields and sends
 * hashed name, email and phone with every event (plus its own automatic
 * button-click events) — measured on 2026-10-29. The brief allows no
 * personal form data to reach Meta.
 *
 * CLICK TRACKING is one delegated listener: any element with a
 * `data-track` attribute listed in TRACKED_CLICKS reports when clicked, so
 * visual components carry an attribute rather than tracking code.
 */

const serverConsent = (): Consent => "unset";

export function Analytics() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
      const name = target?.getAttribute("data-track");
      if (name) TRACKED_CLICKS[name]?.();
    };
    /* Capture, so it runs even if a handler below stops propagation. */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (consent !== "granted") return null;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        id="ga4-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>

      {/* Meta Pixel Code */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  );
}
