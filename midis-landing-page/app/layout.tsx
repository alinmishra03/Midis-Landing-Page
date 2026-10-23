import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { LeadPopups } from "@/components/popups/LeadPopups";

/**
 * Root layout.
 *
 * TYPOGRAPHY. Two cuts of one family: Inter Tight for display, Inter for
 * body. Inter Tight's tighter sidebearings are what let a large heading set
 * at -0.032em tracking without the letters colliding, while Inter proper
 * keeps body copy open enough to read at 15px. `display: "swap"` so text
 * paints in the fallback immediately rather than blocking the first render —
 * a web font should never be on the critical path for LCP.
 *
 * `preload` is left on for both because both appear above the fold: the
 * headline is Inter Tight and the subheadline is Inter.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  /* Only the weights the design system actually uses. */
  weight: ["500", "600", "700"],
});

/**
 * `metadataBase` resolves every relative Open Graph and canonical URL
 * against the production host, so a share card never points at localhost.
 *
 * Page-level metadata lives on each page rather than here, so the landing
 * page, the audit form and the two confirmations each carry their own title,
 * description and canonical. The brief asks explicitly for no duplicate
 * metadata across routes.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Website Design & Development Services | MIDIS",
    template: "%s | MIDIS",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/brand/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Pinch-zoom is never disabled: capping it is a WCAG 1.4.4 failure. */
  themeColor: "#f8f8f6",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <head>
        {/*
          THEME, APPLIED BEFORE FIRST PAINT.

          This runs synchronously in <head>, so `data-theme` is on <html>
          before the browser paints anything — which is the whole reason it
          is an inline string rather than a component. Deferring it to React
          would mean painting one theme first and correcting it after
          hydration, which is the flash this exists to prevent.

          LIGHT IS THE DEFAULT, on MIDIS's instruction of 2026-10-20: a
          first-time visitor sees the light theme regardless of their OS
          preference, and only an explicit stored "dark" choice (made with
          the toggle, remembered in localStorage) switches the page. The
          attribute is therefore ALWAYS written — "dark" for a stored dark
          choice, "light" otherwise — and globals.css no longer consults
          `prefers-color-scheme` at all.

          Wrapped in try/catch because reading localStorage throws outright
          in some privacy modes; the catch still pins the light default.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("midis-theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}',
          }}
        />
        {/*
          Without JavaScript, the IntersectionObserver in <Reveal> never
          runs. The component is written to render visible by default so
          this is belt-and-braces rather than the only guard — but a page
          whose content depends on a script executing is one script error
          away from being blank, and this costs nothing.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh">
        {/*
          Skip link. First focusable element on the page, visually hidden
          until it receives focus, so a keyboard user can get past the
          header and straight into the content.
        */}
        <a href="#main" className="sr-only-focusable">
          Skip to main content
        </a>
        {children}
        {/* The automatic lead popup. Mounted HERE, once, so its single
            timer and listener set survive client-side navigation instead of
            restarting per page; it decides itself which routes it may open
            on (see components/popups/LeadPopups.tsx). */}
        <LeadPopups />
      </body>
    </html>
  );
}
