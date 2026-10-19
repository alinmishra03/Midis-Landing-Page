import { services } from "@/content/sections";
import { site } from "@/content/site";

/**
 * Structured data.
 *
 * WHAT IS HERE
 * ------------
 * Organization, WebSite, WebPage and a Service list. Every property is
 * populated from content/site.ts, which carries only verified facts, so the
 * markup and the visible page can never disagree.
 *
 * WHAT IS DELIBERATELY ABSENT, AND WHY
 * ------------------------------------
 * - `aggregateRating` / `review`. There is no verified rating and no
 *   attributed review. Inventing either is both forbidden by the brief and a
 *   structured-data policy violation that risks a manual action.
 * - `award`, `hasCredential`, `memberOf`. Nothing verified.
 * - `offers` / `priceRange`. MIDIS has no confirmed rate card, and the
 *   pricing section deliberately publishes no figure. Handing Google a
 *   machine-readable price that the page itself does not state is a
 *   different and worse kind of claim than simply omitting it.
 * - `FAQPage`. The questions ARE marked up as real headings and text, but no
 *   FAQPage entity is emitted. Google restricted FAQ rich results to
 *   government and health sites, so for an agency page the markup earns
 *   nothing — and the brief says not to assume those results are available.
 *   The content is crawlable either way.
 *
 * `@id` values are stable URIs so the entities reference each other properly
 * rather than being four disconnected islands in one graph.
 */

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;
const PAGE_ID = `${site.url}/#webpage`;

export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: site.name,
        legalName: site.legalName,
        url: site.url,
        description: site.description,
        email: site.email,
        logo: {
          "@type": "ImageObject",
          url: `${site.url}/brand/midis-logo-horizontal.png`,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.locality,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        contactPoint: site.phones.map((phone) => ({
          "@type": "ContactPoint",
          telephone: phone.e164,
          contactType: "sales",
          areaServed: phone.region,
          availableLanguage: "English",
        })),
        sameAs: site.socials.map((social) => social.url),
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: site.url,
        name: site.name,
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebPage",
        "@id": PAGE_ID,
        url: site.url,
        name: "Website Design & Development Services | MIDIS",
        description:
          "Build a high-performing business website with MIDIS. Explore professional website design, development, Shopify, UI/UX and SEO services.",
        isPartOf: { "@id": SITE_ID },
        about: { "@id": ORG_ID },
        inLanguage: "en",
      },
      /*
       * One Service node per service actually described on the page. Each
       * `description` is the same approved sentence the card shows — the
       * markup never asserts a capability the page does not state.
       */
      ...services.map((service) => ({
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: { "@id": ORG_ID },
        serviceType: service.name,
        areaServed: ["IN", "US", "GB", "AU"],
      })),
    ],
  };
}
