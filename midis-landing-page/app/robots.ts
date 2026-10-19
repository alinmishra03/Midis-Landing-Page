import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * Robots directives.
 *
 * `/api/` is disallowed because the enquiry endpoint is a POST-only route
 * that answers 405 to anything else — there is nothing there to crawl, and
 * letting a bot hammer it wastes the rate limit on real visitors.
 *
 * `/thank-you/` is disallowed as a belt-and-braces pair with the `noindex`
 * on those pages themselves. The meta tag is what actually keeps them out of
 * the index (a disallowed page can still be indexed from external links);
 * this just stops the crawl happening in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/thank-you/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
