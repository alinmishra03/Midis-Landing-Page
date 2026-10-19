# MIDIS Landing Page — refinement pass

Date: 2026-10-19. Follows the initial build recorded in `STATUS.md`.

No section was rebuilt, no approved content changed, no section removed. The
brand identity, design system and content layer are the ones already in the
repository.

---

## How this pass was verified

The Chrome extension was not connected, so rather than eyeballing the markup
this pass drove a real Chromium through **Playwright** (installed in a
scratchpad, not in the project) and measured the page. Three suites:

| Suite | What it does |
| --- | --- |
| `responsive.mjs` | 3 routes × 13 widths (320→1920). Per width: document overflow, every element's bounding box against the viewport, `.container-site` left-edge agreement, reveal-trapped-invisible detection, tap-target heights, console errors. |
| `functional.mjs` | 34 assertions: link integrity, anchor nav vs. the sticky header, mobile menu, accordion, estimator steps, both forms' validation, success redirect, backend-failure handling, reduced motion, keyboard. |
| `faq.mjs` | Left-edge agreement of the FAQ label, heading, description, question and answer at 7 widths. |

**Final state: 39/39 viewport-route combinations clean, 34/34 functional
assertions passing, 0 lint errors, 0 type errors, production build green.**

---

## Three real bugs the measurement found

These were not visible in the markup and would not have been caught by
reading the code. Each is now fixed and re-tested.

### 1. The mobile menu was completely unusable

`backdrop-blur-md` on the header sets `backdrop-filter`, and a filtered
element becomes the **containing block for its fixed-position descendants**.
The menu panel lived inside `<header>`, so `top: 4.5rem; bottom: 0` resolved
against the header's own 72px box instead of the viewport.

Measured at 390px: the panel computed to **1px tall**, its links painted over
the hero at `top: 43`, and `document.elementFromPoint` at a link's centre
returned the hero `<section>`. **Every item in the mobile menu was
unclickable.**

Fixed by moving the panel out of the filtered subtree (`z-40`, sibling of the
header). All five mobile-menu assertions now pass.

### 2. Horizontal scrolling at 320px

`whitespace-nowrap` sat in the Button base classes. An unwrappable label gives
a button a min-content width equal to the whole label, and a grid track is
never sized below its items' min-content — so "Get My Free Website Audit"
forced the audit form's column to **328px inside a 288px container**, and the
page scrolled sideways on the narrowest phones.

Found by hiding subtrees until the computed track collapsed. Removed
`whitespace-nowrap`; long labels now wrap, with `text-center` keeping them
tidy. (`min-w-0` was also added to the `<select>`, whose min-content is its
widest option — a second, smaller contributor on the same page.)

### 3. Sub-minimum tap targets

Measured against WCAG 2.5.8's 24px floor, applying the standard's
inline-in-text exception. Below the floor: desktop nav links (20px), footer
nav and contact links (19–22px), consent checkboxes (18px), the header logo
link (28px, below the 44px comfort target). All raised; the audit now reports
none.

---

## Alignment

- **One container, one left edge.** Every section's content is inside
  `container-site`. Measured at all 13 widths: every `.container-site`
  element reports an identical `left`. The only deliberate exception is the
  full-bleed client logo rail.
- **The FAQ section was genuinely misaligned** (reported during this pass and
  confirmed by measurement): the header sat left-aligned in the container
  while the accordion used `mx-auto`, so on any wide screen the two resolved
  to different left edges. Both now share one centred column capped at
  **68rem (1088px)**, everything inside flush left. Verified: label, heading,
  description, first question and first answer all report the same `left` at
  360/390/768/1024/1280/1440/1920 — and the expand icons share one `right`.
- **Three sections were hand-rolling their own eyebrow and heading** at a
  different type scale from the five that used `SectionHeader`. Extracted an
  `Eyebrow` component and gave `SectionHeader` a documented two-size rule
  (`lg` for a full-width header, `md` when it shares its row). The seven-line
  eyebrow markup existed in five files and had already drifted.
- **Vertical rhythm** is `--space-section` and `--space-block` only. Three
  sections were using ad-hoc `mt-8`/`mt-9`/`mt-10` for the header-to-content
  gap; all now use the token.

---

## Animation

All motion is `opacity`, `transform` or `clip-path` — compositor properties.
There is no scroll event handler anywhere in the project; everything uses
`IntersectionObserver`. No animation library was added.

- **Reveal variants**: `up` (default), `fade`, `scale` (cards), `clip` (an
  image wipe, used on project screenshots — a flat rectangle of UI is better
  uncovered than floated in).
- **Line-by-line heading reveals** (`RevealText`). Words are measured, grouped
  by `offsetTop` into the lines the browser actually produced, and each line
  slides up from a mask. It re-splits on resize, so it follows the real wrap
  at every width. Measurement waits on `document.fonts.ready` — splitting
  against a fallback font would record breaks that stop existing. Verified:
  the heading splits, the text is preserved exactly, and the transform
  settles to `none`.
  - Safe for SEO and screen readers: the server renders plain text and the
    split only wraps existing words in spans — nothing added, removed or
    reordered. It declines to split any heading containing nested markup.
  - Cannot shift layout: the rebuilt lines hold exactly the words already on
    that line, so the wrapping is reproduced rather than recalculated.
- **Cards**: one `card-lift` utility (4px, `hover: hover` only), plus a 3.5%
  screenshot zoom anchored to the top edge.
- **Micro-interactions**: `link-underline` draws in from the left;
  `link-underline-accent` thickens a resting rule; the accordion icon rotates
  plus→minus; buttons take a 1px drop and 0.98 press.
- **The hero still animates from CSS alone**, deliberately — its headline is
  the LCP element and must not wait on hydration.

**Reduced motion** is verified, not assumed: under `reducedMotion: "reduce"`
no `[data-reveal]` element is below 0.9 opacity and the marquee's
`animationName` computes to `none`.

---

## Functional results

Every assertion below passed.

- No placeholder `href="#"` on any route; every `target="_blank"` carries
  `rel="noopener"`.
- All five section anchors scroll into view with the heading clear of the
  sticky header.
- Mobile menu: opens, locks background scroll, closes on Escape, restores
  scroll, closes after navigating.
- Accordion: starts collapsed, expands (0→73px), `aria-expanded` tracks
  state, Enter toggles, all seven answers remain in the DOM when closed.
- Estimator: blocks advancing on an empty required field, advances when
  valid, Back works and preserves the selection.
- Audit form: empty submit shows an error summary, consent is enforced, email
  format is validated, a valid submission redirects to
  `/thank-you/book-a-call`.
- **A 502 from the backend keeps the visitor on the form with an honest
  message** — it does not redirect and does not fake success.
- Skip link is the first tab stop and becomes visible on focus.

---

## SEO — unchanged and re-verified

One `<h1>` per route, no skipped heading levels, every `<img>` has `alt`, all
31 form controls labelled, titles/descriptions/canonicals distinct per route,
sitemap and robots correct, JSON-LD parses with no fabricated claim keys.
Build output is unchanged: all 7 content routes still prerender static.

---

## Still outstanding (unchanged from `STATUS.md`)

1. **No real submission has reached the CMS.** The success path was tested
   with the API intercepted, deliberately, so no test lead was written into
   MIDIS's production inbox. Send one real submission before treating the
   Strapi integration as working.
2. **`NEXT_PUBLIC_CALENDLY_URL` is not set.** While unset the thank-you pages
   show the email/WhatsApp fallback rather than a booking button. This is
   intended behaviour, not a defect.
3. **No Lighthouse score has been taken.** The build shape and LCP path are
   right, but no measurement exists.
4. The eight content questions for MIDIS in `STATUS.md` §6 still stand.
