import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * XML sitemap.
 *
 * Only the two indexable routes. The confirmation pages carry
 * `robots: { index: false }` and are deliberately absent — listing a page in
 * a sitemap while telling robots not to index it is a contradictory signal,
 * and Search Console reports it as one.
 *
 * NO `lastModified`. Calling `new Date()` here would be a synchronous IO
 * call during prerender, which `cacheComponents` rejects outright — and the
 * value would be meaningless anyway, since it would record the build time
 * rather than when the content actually changed. Google ignores an
 * unreliable `lastModified`, so omitting it is both correct and honest.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/free-website-audit`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
