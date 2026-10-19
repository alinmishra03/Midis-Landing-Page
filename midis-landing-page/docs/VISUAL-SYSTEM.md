# MIDIS Landing Page — 3D, glass and cinematic motion

Date: 2026-10-19. Third pass, after `STATUS.md` (build) and `REFINEMENT.md`
(alignment + motion). Nothing was rebuilt; no approved content, section, form
or integration changed.

---

## Results

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors, 0 warnings |
| `npm run build` | green, all 7 content routes still prerender static |
| Responsive: 3 routes × 13 widths | **39/39 clean** |
| Functional: nav, menu, accordion, both forms, keyboard | **34/34 passing** |
| Effects: tilt, glass, scroll-timeline, mobile, reduced motion | **15/15 passing** |
| FAQ alignment: 7 widths | identical left edge at every width |
| SEO/a11y static checks | all passing |

---

## Three bugs found by measurement

### 1. The glassmorphism was doing nothing — in every Chromium browser

The glass utilities declared both `backdrop-filter` and
`-webkit-backdrop-filter` with identical values. Lightning CSS deduplicated
the pair and kept **only the prefixed one**. Chrome does not recognise it:

```
CSS.supports("backdrop-filter",         "blur(4px)")  -> true
CSS.supports("-webkit-backdrop-filter", "blur(4px)")  -> false
```

So the headline feature of this pass rendered as a flat translucent
rectangle everywhere, while `getComputedStyle().backdropFilter` reported
`none`. Fixed by declaring **only the standard property** and letting
Lightning CSS prefix from its browser targets. Verified: the blur now
computes to `blur(14px) saturate(1.2)` on desktop and `none` below 1024px.

> Hand-writing a vendor prefix next to the standard property is what caused
> this. The toolchain already does it, and does it correctly.

### 2. The project screenshots were invisible — a self-defeating reveal

The `clip` reveal variant applied `clip-path: inset(0 0 100% 0)` to the very
element its `IntersectionObserver` was watching. An element clipped to zero
height has no intersection area, so `isIntersecting` never became true, the
state never advanced past `pending`, and **every project screenshot in the
Work section stayed permanently hidden**. Measured: `revealState: "pending"`,
`clipPath: "inset(0px 0px 100%)"`, image loaded and `complete: true` behind
it.

Fixed by clipping a *child* instead, so the observed box keeps its full size.

**How it hid from the QA suite:** the element's `opacity` stays `1`
throughout, and the layout audit only tested opacity. The audit now also
tests the rendered `clip-path`, so this class of failure cannot pass again.

### 3. Horizontal entrance animations caused mobile overflow

The new `side-left` / `side-right` variants translate a pending element
±28px. On phones that pushed content past the viewport (measured: column at
left 44 = 16 container + 28 translate, giving exactly 12px of overflow at
every width ≤430px). `overflow-x: clip` on `<body>` does **not** stop
`<html>` reporting the wider scroll width.

Fixed twice over: the side variants fall back to a vertical rise below
`lg` — which is also correct design, since there is no "side" in a
single-column layout — and `<html>` now carries `overflow-x: clip` as well.
`clip` rather than `hidden`, because `hidden` would make it a scroll
container and silently break `position: sticky` on descendants.

---

## What was added

### Layout

- **Two container widths**: `container-site` (84rem) for the text measure,
  `container-wide` (96rem) for visual compositions. Headings and paragraphs
  never run the width of a 1920px display; showcases and bento grids do get
  the extra room. Section backgrounds remain edge-to-edge.

### Glass — used selectively, and for a reason

`backdrop-filter` blurs what is *behind* an element. Over flat paper there
is nothing to blur, so it costs a compositor layer and renders as a plain
translucent rectangle. Glass is therefore applied **only** where something
sits behind it — the pricing grid over its accent wash, and the dark
sections. The typography-led sections stay clean, which is also what keeps
the glass sections feeling special.

Below 1024px the blur is dropped entirely and the surface becomes plainly
translucent: same design language, a fraction of the GPU cost.

> A warning kept in the CSS: an element with `backdrop-filter` becomes the
> containing block for its fixed-position descendants. That is not trivia —
> it already collapsed this site's mobile menu to 1px once.

### 3D tilt

`TiltCard` writes two custom properties (`--mx`, `--my`) and a
`data-tilting` flag. Every visual consequence is CSS.

- Rotation capped at **5°** — premium, not playful.
- Pointer listeners are on the **element**, never the document.
- Moves are coalesced into one `requestAnimationFrame`.
- `getBoundingClientRect` is read **once on enter** and cached, not per
  move — reading it every frame is the usual reason tilt effects jank.
- No React state, so no re-render while the pointer moves.
- Gated behind `(hover: hover) and (pointer: fine)`, so a tap can never
  leave a card frozen mid-rotation.

Applied to the service bento cards, the project frames and the hero stack.
Content sits on `tilt-lift` (translateZ) so the rotation has real depth
rather than looking like a turning photograph.

### Motion identity per section

Each major section has a distinct entrance, all sharing the same easing and
duration tokens so they read as one system:

| Section | Motion |
| --- | --- |
| Hero | CSS-only staggered rise (never waits on hydration — it holds the LCP element), plus pointer-responsive depth on the project stack |
| Trust | logo chips settle and illuminate on hover; logos are never recoloured |
| Work | clip wipe on imagery, text entering from the side it occupies, scroll-linked drift inside each frame |
| Services | staggered scale-in across a bento grid, 3D tilt, cursor-following sheen |
| Process | connector draws itself on the scroll timeline; steps deal in with a slight rotation |
| Case studies | editorial side reveals |
| Pricing | glass cards scaling in over a slow ambient wash |
| FAQ | deliberately restrained — smooth accordion, no 3D |
| Final CTA | warm accent light rising behind the headline, magnetic primary button |

**Scroll-driven motion uses `animation-timeline: view()`** — the browser
drives it on the compositor. There is no scroll event listener anywhere in
the project. Wrapped in `@supports`, so a browser without it simply gets the
static layout.

### Micro-interactions

Animated link underlines, a 4px magnetic nudge on the two primary CTAs only,
icon transitions, card illumination, process-step highlighting. Every one is
`transform`, `opacity` or colour — nothing that triggers layout.

---

## Accessibility and performance

- **Reduced motion is verified, not assumed**: ambient drift stops, tilt is
  suppressed, scroll-driven drift unbinds, the marquee halts, and no
  `[data-reveal]` element sits below 0.9 opacity.
- **Touch devices** get no tilt and no backdrop blur — confirmed by test at
  390px with `hasTouch`.
- **Keyboard**: skip link is still the first tab stop and visible on focus;
  accordion, both forms and the mobile menu all pass.
- **SEO untouched**: one `<h1>` per route, no skipped levels, every image
  has `alt`, all form controls labelled, distinct metadata per route,
  JSON-LD valid with no fabricated claims.
- **No new runtime dependencies.** The entire 3D and glass system is CSS plus
  one ~90-line component.

---

## Still outstanding (unchanged)

1. **No real submission has reached the CMS.** The success path is tested
   with the API intercepted so no test lead is written into MIDIS's
   production inbox. Send one real submission before trusting the
   integration.
2. **`NEXT_PUBLIC_CALENDLY_URL` is unset**, so the thank-you pages show the
   email/WhatsApp fallback. Intended behaviour, not a defect.
3. **No Lighthouse score taken.** Worth running once deployed — the ambient
   washes and backdrop blur are the two things to watch on a low-end phone,
   and both are already disabled below 1024px.
4. The eight content questions for MIDIS in `STATUS.md` §6 still stand.
