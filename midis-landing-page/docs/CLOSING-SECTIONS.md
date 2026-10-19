# MIDIS Landing Page — final CTA & footer

Date: 2026-10-19. Fifth pass. Scope was these two sections only; no other
section, form, route or integration was touched. All approved content is
unchanged.

---

## The dead-link discovery

Checking the footer's destinations rather than assuming them turned up a
launch blocker that predates this pass:

```
https://www.midis.in/            200
https://www.midis.in/about       404
https://www.midis.in/services    404
https://www.midis.in/work        404
https://www.midis.in/contact     404
https://www.midis.in/blogs       404
https://www.midis.in/case-study  404
https://www.midis.in/ai          404
```

**Every sub-path on midis.in 404s — including the ones its own
`/sitemap.xml` lists.** The live site is a client-rendered SPA whose host
has no catch-all rewrite, so a deep link fails on first load and only
resolves by navigating from the root. The footer had been pointing eight
links there, so every one of them led to a 404.

The same eight routes all return 200 on the Vercel deployment of the new
MIDIS site, so on your instruction the navigation now points there via a
single constant:

```ts
export const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://new-midis-ten.vercel.app";
```

Every footer nav link, both legal links and the audit form's Privacy Policy
link derive from it. **Changing that one line is the whole migration** once
midis.in serves its own routes or the new site moves onto the brand domain.
`site.url` deliberately stays `midis.in`, because that is the canonical
identity used for metadata, canonical URLs and the Organization schema —
which should remain the brand domain regardless of where marketing pages are
currently served.

### Link verification

All 23 links in the two sections were checked by request:

| Result | Count |
| --- | --- |
| Resolve (200 / valid protocol / existing anchor) | 23 |
| Placeholder `href="#"` | 0 |
| `target="_blank"` missing `rel="noopener"` | 0 |

One apparent failure was a false positive worth noting: the Facebook profile
returns **400 to an HTTP request** but **200 in a real browser**, with the
title "Midis | Facebook". It is bot-blocking, not a broken link — verified by
navigating to it rather than trusting the status code.

---

## Final CTA

- **Two-column composition at `lg`** instead of centred text in an empty
  band. Left carries eyebrow → headline → description → both CTAs; right
  carries the glass stack. Single column below `lg`, with the glass dropping
  below the buttons so the action comes first on a phone.
- **The glass visual is pure CSS** — three translucent panes in shared
  perspective at different Z depths, standing for the layers of an interface,
  which is what MIDIS actually builds. No image, no 3D dependency, nothing
  downloaded. Each pane floats on an 11s cycle with 8px of travel.
- **Background wordmark**, previously a 1px stroke at 5.5% white and very
  nearly invisible: now a 1.5px two-tone stroke warmed toward the brand
  orange with a soft inner shadow, drifting 6% across the scroll timeline.
  It sits behind everything and never crosses text.
- **Ambient lighting** — two warm pools, one rising behind the CTAs, one high
  right. Capped at 26% orange, behind the content, never under text.
- **Entrance sequence**: eyebrow → headline (line-by-line) → description →
  buttons → glass settling in, on the shared easing tokens.
- **Buttons**: primary orange with charcoal text (7.26:1) and the page's
  single 4px magnetic nudge; secondary a translucent outline with a backdrop
  blur. Equal heights, same press feedback, same focus ring.

## Footer

- **Continuous with the CTA** — same ground colour and a wash across the top
  edge that picks up the CTA's lighting, so there is no seam. Spacing between
  them was tightened from ~220px to ~130px.
- **Three link columns** — Explore, Company, Start a project — from the six
  links MIDIS.pdf lists plus this page's own two conversion routes and the
  verified WhatsApp line. "Company" holds two links because two exist; no
  column was padded with an invented page to make them even.
- **Oversized wordmark**, outlined at rest and wiping to a white→orange fill
  when the footer is reached. Measured at **96% of viewport width at every
  breakpoint** from 320px to 1920px, with no horizontal overflow — the
  wrapper clips, so the bleed is deliberate.
  - Sized from a **measured** glyph ratio: "MIDIS" in Inter Tight 600 at
    -0.05em renders ~2.37× its font-size, not the ~3.1× a glyph-count
    estimate suggests. The first attempt was built on the estimate and left
    the word ~1040px wide in a 1440px viewport, still reading as a centred
    heading.
  - The fill is clipped on a **child**, never on the element the
    IntersectionObserver watches — clipping the observed element to zero area
    stops it ever intersecting, which is how the project screenshots were
    once left permanently invisible.
- **No year in the copyright, deliberately.** `new Date()` is synchronous IO
  during prerender and Cache Components rejects it outright — it fails the
  build rather than degrading. The alternatives are a hardcoded year that
  goes stale or a client component that shifts layout after hydration. A
  copyright line is valid without a year. (Same reasoning as the omitted
  `lastModified` in `app/sitemap.ts`.)

---

## Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors, 0 warnings |
| `npm run build` | green, 7 content routes still prerender static |
| Responsive: 3 routes × 13 widths (320→1920) | **39/39 clean**, no horizontal scrolling |
| Wordmark fill vs viewport | 96% at 320 / 390 / 768 / 1280 / 1440 / 1920, 0 overflow |
| Links in CTA + footer | **23/23 resolve**, 0 placeholders, all `_blank` safe |
| Functional (nav, menu, accordion, both forms, keyboard) | **34/34 passing** |
| Effects (tilt, glass, scroll timeline, mobile, reduced motion) | **15/15 passing** |
| SEO/a11y static checks | all passing |

Mobile verified at 390px: single column, two-line headline with no awkward
wrap, full-width buttons, glass secondary beneath, footer stacked with
comfortable spacing and 24px-minimum tap targets throughout. Backdrop blur
and pointer tilt are both off below 1024px.

---

## Still outstanding

1. **midis.in sub-paths 404.** Not caused by this work, but it is a real
   pre-launch issue for the brand site. Once fixed, point `MAIN_SITE_URL`
   back at `https://www.midis.in`.
2. **No real submission has reached the CMS** — the success path is tested
   with the API intercepted so no test lead is written to production.
3. **`NEXT_PUBLIC_CALENDLY_URL` is unset**, so the thank-you pages show the
   email/WhatsApp fallback. Intended.
4. **No Lighthouse score taken.**
5. The eight content questions in `STATUS.md` §6 still stand.
