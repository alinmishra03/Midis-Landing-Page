import { Logo } from "./Logo";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Button";
import {
  footerColumns,
  footerLegal,
  site,
  whatsappHref,
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
 * actions (mailto:, tel:, WhatsApp, socials) and the two legal pages, which
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

            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {site.socials.map((social) => (
                <li key={social.url}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline inline-flex min-h-6 items-center text-sm font-medium text-white/85 transition-colors hover:text-accent"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex min-h-6 items-center text-sm font-medium text-white/85 transition-colors hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>
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
      <div className="container-site relative z-10">
        <div className="hairline" />
        <div className="flex flex-col gap-4 py-7 text-sm text-muted-dark sm:flex-row sm:items-center sm:justify-between">
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

        <p className="pb-10 text-xs leading-relaxed text-muted-dark/75">
          {site.address.street}, {site.address.locality}, {site.address.region}{" "}
          {site.address.postalCode}, {site.address.countryName}
        </p>
      </div>
    </footer>
  );
}
