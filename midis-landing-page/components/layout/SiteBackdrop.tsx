import Image from "next/image";

/**
 * THE SITE BACKDROP (MIDIS full-site background brief, 2026-10-23).
 *
 * One photograph behind the whole homepage — the hero's designer's desk —
 * on a single FIXED layer, so it is downloaded once, decoded once and
 * composited once, however long the page is. Every section above it is a
 * translucent veil of the page colour (see "SITE ATMOSPHERE" in
 * globals.css); the veils' strength varies by section, the photo never
 * moves, and that is what makes the page read as one continuous surface.
 *
 * WHY A FIXED ELEMENT, NOT `background-attachment: fixed`: the latter is
 * ignored or janky on mobile Safari and forces a full repaint on every
 * scroll frame everywhere else. A fixed, promoted layer is the cheap,
 * universally supported way to get the same result.
 *
 * It sits at z-index -1 in the root stacking context: above the canvas,
 * below everything — the header (50), the floating buttons (30), the
 * popups (70) and every section's content are untouched.
 *
 * Photo: Domenico Loia on Unsplash (unsplash.com/photos/hGV2TfOh0ns),
 * Unsplash License. Decorative, so alt="" and aria-hidden.
 */
export function SiteBackdrop() {
  return (
    <div aria-hidden="true" className="site-backdrop">
      <Image
        src="/images/hero/designer-desk.webp"
        alt=""
        fill
        sizes="(max-width: 639px) 150vw, 100vw"
        loading="eager"
        fetchPriority="high"
        className="site-backdrop-img"
      />
    </div>
  );
}
