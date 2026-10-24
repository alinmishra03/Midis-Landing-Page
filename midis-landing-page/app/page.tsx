import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Trust } from "@/components/home/Trust";
import { Work } from "@/components/home/Work";
import { Services } from "@/components/home/Services";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { Pricing } from "@/components/home/Pricing";
import { Faqs } from "@/components/home/Faqs";
import { FinalCta } from "@/components/home/FinalCta";
import { FloatingCta } from "@/components/layout/FloatingCta";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { buildJsonLd } from "@/lib/seo";
import { site } from "@/content/site";

/**
 * The MIDIS landing page.
 *
 * Section order follows MIDIS.pdf. The conversion journey runs hero (with
 * the estimator form) -> proof -> work -> services -> process -> clients ->
 * cost -> objections -> final CTA. Everything after the hero exists to catch
 * the people who were not ready at that moment, and each of those sections
 * routes back to the same form rather than introducing a competing action.
 *
 * The standalone estimator band and the "Purpose-driven work" case-study
 * section were removed on MIDIS's instruction of 2026-10-24; the form and
 * its `#estimator` anchor remain in the hero.
 *
 * TESTIMONIALS sit between the process and the cost section: social proof
 * lands best just before the visitor starts thinking about price.
 *
 * ONE H1. The hero owns it. Every section below is an h2, every card an h3.
 */

export const metadata: Metadata = {
  title: "Website Design & Development Services | MIDIS",
  description:
    "Build a high-performing business website with MIDIS. Explore professional website design, development, Shopify, UI/UX and SEO services.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Website Design & Development Services | MIDIS",
    description:
      "Build a high-performing business website with MIDIS. Explore professional website design, development, Shopify, UI/UX and SEO services.",
    url: site.url,
    images: [
      {
        url: "/images/work/portfolio.jpg",
        width: 1800,
        height: 1125,
        alt: "Website projects designed and developed by MIDIS",
      },
    ],
  },
  twitter: {
    title: "Website Design & Development Services | MIDIS",
    description:
      "Build a high-performing business website with MIDIS. Explore professional website design, development, Shopify, UI/UX and SEO services.",
    images: ["/images/work/portfolio.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      {/* One fixed photograph behind the whole page; `data-atmosphere` on
          <main> turns every section into a translucent veil over it (see
          SiteBackdrop and "SITE ATMOSPHERE" in globals.css). Scoped to this
          page: other routes keep their solid sections. */}
      <SiteBackdrop />

      <Header />

      <main id="main" data-atmosphere="">
        <Hero />
        <Trust />
        <Work />
        <Services />
        <Process />
        {/* The client showcase: nine named client businesses as factual
            project spotlights. Verified quotes, when they exist in
            content/testimonials.ts, render in place of the spotlights. */}
        <Testimonials />
        <Pricing />
        <Faqs />
        <FinalCta />
      </main>

      <Footer />

      {/* The floating WhatsApp + estimator actions — a landing-page-specific
          fixed overlay, so it mounts here rather than in the root layout.
          (The automatic lead popup lives in the root layout: one controller
          for the whole session, whatever route the visitor is on.) */}
      <FloatingCta />

      {/*
        Structured data. Rendered as a plain script tag rather than through a
        helper so what reaches the page is exactly what lib/seo.ts builds —
        no serialisation surprises. The content is generated at build time
        from verified facts only; see that file for what is deliberately
        absent.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />
    </>
  );
}
