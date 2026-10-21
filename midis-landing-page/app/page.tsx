import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Trust } from "@/components/home/Trust";
import { Work } from "@/components/home/Work";
import { Services } from "@/components/home/Services";
import { Estimator } from "@/components/home/Estimator";
import { Process } from "@/components/home/Process";
import { CaseStudies } from "@/components/home/CaseStudies";
import { Testimonials } from "@/components/home/Testimonials";
import { Pricing } from "@/components/home/Pricing";
import { Faqs } from "@/components/home/Faqs";
import { FinalCta } from "@/components/home/FinalCta";
import { FloatingCta } from "@/components/layout/FloatingCta";
import { LeadPopups } from "@/components/popups/LeadPopups";
import { buildJsonLd } from "@/lib/seo";
import { site } from "@/content/site";

/**
 * The MIDIS landing page.
 *
 * Section order follows MIDIS.pdf exactly, 1 through 10. The conversion
 * journey runs hero -> proof -> work -> services -> ENQUIRY -> process ->
 * method -> cost -> objections -> final CTA, so the estimator sits at the
 * point where a visitor has seen the work and the services but has not yet
 * had to read about process. Everything after it exists to catch the people
 * who were not ready at that moment, and each of those sections routes back
 * to the same form rather than introducing a competing action.
 *
 * TESTIMONIALS sit between the case studies and the cost section: social
 * proof lands best directly after the work that earned it, and just before
 * the visitor starts thinking about price. The section renders only when an
 * approved client quote exists, so the order holds either way.
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
      <Header />

      <main id="main">
        <Hero />
        <Trust />
        <Work />
        <Services />
        <Estimator />
        <Process />
        <CaseStudies />
        {/* The client showcase: nine named client businesses as factual
            project spotlights. Verified quotes, when they exist in
            content/testimonials.ts, render in place of the spotlights. */}
        <Testimonials />
        <Pricing />
        <Faqs />
        <FinalCta />
      </main>

      <Footer />

      {/* The floating WhatsApp + estimator actions and the managed lead
          popups — both fixed overlays, both landing-page-specific, so they
          mount here rather than in the root layout. */}
      <FloatingCta />
      <LeadPopups />

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
