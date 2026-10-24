import { Logo } from "./Logo";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Button";
import {
  footerColumns,
  footerLegal,
  site,
  visibleSocials,
} from "@/content/site";

/**
 * Site footer — the second half of the closing composition.
 *
 * CONTINUOUS WITH THE CTA ABOVE IT. Same ground colour, and a soft wash at
 * the top edge picking up where the CTA's lighting leaves off, so there is
 * no visible seam between the two. They are designed as one band that
 * resolves, not as two stacked blocks.
 *
 * NAVIGATION — INTERNAL ONLY, on MIDIS's instruction of 2026-10-20. Two
 * menus: "Explore" scrolls to this page's own sections, "Get started" goes
 * to this page's two forms. Industries, Resources, About MIDIS and Contact
 * were removed — none has a section on this page — and nothing was added to
 * fill the space. The only links that still leave the page are the contact
 * actions (mailto:, tel:, socials) and the two legal pages, which
 * exist only on the main MIDIS site; see the notes in content/site.ts.
 *
 * THE WORDMARK. An oversized MIDIS across the full width, outlined at rest
 * and wiping to a fill when the footer is reached. The wrapper clips and the
 * type never wraps, so it bleeds off both edges by design and can never
 * produce a horizontal scrollbar.
 *
 * NO YEAR IN THE COPYRIGHT, DELIBERATELY. `new Date()` is synchronous IO
 * during prerender, which Cache Components rejects outright — it fails the
 * build rather than degrading. The alternatives are a hardcoded year that
 * silently goes stale, or a client component that shifts layout after
 * hydration. A copyright line is valid without a year, so it goes without
 * one. (Same reasoning as the omitted `lastModified` in app/sitemap.ts.)
 */

/** Brand colour per social name — static class strings so Tailwind can
    see them. Hovers brighten within the same brand hue. */
const SOCIAL_BRAND: Record<string, string> = {
  LinkedIn: "text-[#4596e3] hover:text-[#6db2f0]",
  Instagram: "text-[#f25c84] hover:text-[#ff7fa3]",
  Facebook: "text-[#3b8bf4] hover:text-[#6babf8]",
  Medium: "text-white hover:text-white/75",
};

/** The matching glyphs (standard brand marks, drawn inline like the
    WhatsApp icon — currentColor, so each inherits its brand colour). */
const SOCIAL_GLYPH: Record<string, string> = {
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  Instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  Facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  Medium:
    "M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75S24 8.83 24 12z",
};

function SocialGlyph({ name }: { name: string }) {
  const d = SOCIAL_GLYPH[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-current">
      <path d={d} />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="on-dark relative overflow-hidden bg-ink text-white">
      {/*
        The join gradient. Positioned at 50% 0% — the same horizontal centre
        as the CTA's downward glow — so the two ambient pools align and the
        warmth carries across the seam without a visible boundary. Slightly
        larger radius than before so it reaches up into the CTA spacer and
        visually bridges the two components.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-96"
        style={{
          background:
            "radial-gradient(56rem 22rem at 50% 0%, rgba(239,135,22,0.12), transparent 68%)",
        }}
      />

      <div className="container-site relative z-10">
        {/* ================= identity + navigation ================= */}
        <div className="grid gap-12 pt-10 md:pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-20">
          <Reveal>
            <Logo tone="dark" />
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-muted-dark">
              {site.description}
            </p>

            {/* ---- direct contact ---- */}
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={`mailto:${site.email}`}
                className="group/btn inline-flex w-fit items-center gap-2 text-base font-medium text-white transition-colors hover:text-accent"
              >
                <span className="link-underline-accent">{site.email}</span>
                <Arrow />
              </a>

              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {site.phones.map((phone) => (
                  <a
                    key={phone.e164}
                    href={`tel:${phone.e164}`}
                    className="link-underline inline-flex min-h-6 items-center text-sm text-muted-dark transition-colors hover:text-white"
                  >
                    <span className="sr-only">{phone.region} telephone: </span>
                    {phone.display}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ---- link columns ----
              Two menus, both internal. Two-up from 420px — the labels are
              short enough to pair on most phones — and a single column only
              below that, where two tracks would squeeze the longest label.
              Every row is `min-h-11` so the targets stay comfortably
              tappable. No target="_blank": these links stay on this site. */}
          <div className="grid grid-cols-1 gap-10 min-[420px]:grid-cols-2">
            {footerColumns.map((column, index) => (
              <Reveal key={column.heading} delay={80 + index * 80}>
                <nav aria-labelledby={`footer-col-${index}`}>
                  <h2 id={`footer-col-${index}`} className="eyebrow text-accent">
                    {column.heading}
                  </h2>
                  <ul className="mt-5 space-y-2 text-sm">
                    {column.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <a
                          href={link.href}
                          className="link-underline inline-flex min-h-11 items-center text-white/85 transition-colors hover:text-accent"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ================= strapline + socials ================= */}
        <Reveal delay={120}>
          <div className="hairline mt-14" />
        </Reveal>

        <Reveal delay={160}>
          <div className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-dark">{site.footerStrapline}</p>

            {/* visibleSocials: LinkedIn, Instagram, Facebook and Medium
                (profile confirmed 2026-10-21: medium.com/@officialmidis).

                EACH NAME WEARS ITS OWN BRAND COLOUR (MIDIS instruction,
                2026-10-21).
                LinkedIn/Facebook/Instagram hues are nudged LIGHTER than
                the official hex — the real values sit near 3:1 on this
                ink ground, failing AA for 14px text — while staying
                unmistakably that brand. Medium's wordmark on dark grounds
                is white, so white IS its brand colour here. Unlisted
                names fall back to the old neutral. */}
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
              {visibleSocials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`link-underline inline-flex min-h-6 items-center gap-1.5 text-sm font-medium transition-colors ${
                      SOCIAL_BRAND[social.name] ??
                      "text-white/85 hover:text-accent"
                    }`}
                  >
                    <SocialGlyph name={social.name} />
                    {social.name}
                  </a>
                </li>
              ))}
              {/* No WhatsApp link here (MIDIS instruction, 2026-10-24): the
                  floating WhatsApp button is the site's WhatsApp entry. */}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* ================= the oversized wordmark ================= */}
      {/*
        Full-bleed on purpose: outside `container-site`, so it spans the
        viewport rather than the content column. `wordmark-wrap` clips, so
        the overshoot at the edges is design rather than overflow.
      */}
      <Reveal
        variant="fade"
        className="wordmark-wrap relative z-10 mt-6 px-2 sm:px-4"
      >
        {/* Set twice. Only the outline is in the accessibility tree — the
            fill is the same word again, and announcing both would read
            "MIDIS MIDIS". */}
        <span className="wordmark-type wordmark-outline">MIDIS</span>
        <span aria-hidden="true" className="wordmark-type wordmark-fill">
          MIDIS
        </span>
      </Reveal>

      {/* ================= legal ================= */}
      {/* The physical address line was REMOVED from this strip on MIDIS's
          instruction (2026-10-21) — footer only; site.address still feeds
          the Organization schema in lib/seo.ts, which is a business record,
          not page furniture. The strip's bottom padding grew to carry the
          spacing the address paragraph used to provide. */}
      <div className="container-site relative z-10">
        <div className="hairline" />
        <div className="flex flex-col gap-4 pt-7 pb-10 text-sm text-muted-dark sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; MIDIS. All rights reserved.</p>

          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {footerLegal.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-6 items-center transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
