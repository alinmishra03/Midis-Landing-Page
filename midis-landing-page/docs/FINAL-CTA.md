# MIDIS Landing Page — final CTA redesign

Date: 2026-10-19. Sixth pass. Scope: the "Ready to Build Something Better?"
section only. The footer was left as-is apart from the join between them; no
other section, route, form or integration was touched. All approved copy is
unchanged.

---

## Removed, as instructed

- The oversized `MIDIS` background lettering (`.cta-wordmark` and its
  scroll-drift keyframes — deleted from the stylesheet, not just unused).
- The glassmorphism card on the right (`.glass-stage`, `.glass-pane`,
  `pane-float` — also deleted).
- The browser-style illustration inside it.
- The two-column composition.
- The magnetic button displacement.

`glass-dark` / `glass-light` remain because the pricing grid uses them; only
the CTA's own stage and panes were removed.

## The new composition

A single centred column inside a 56rem measure, carried by type and light:

```
LET'S BEGIN                    ← orange eyebrow, centred rule
Ready to Build                 ← white
Something Better?              ← white→orange gradient
Let's discuss your goals…      ← description
[Start Your Project →] [Book a Consultation]
Or reach us directly — hello@midis.in / WhatsApp
———                            ← thin orange rule, draws from centre
```

- **Headline scale** is its own clamp — `clamp(2.5rem, 1.1rem + 6.1vw,
  6.5rem)` — rather than the shared display scale, because this is the
  largest type on the page and wants a steeper curve. Measured at 104px on a
  1440px screen and 40px at 390px, with "Something Better?" holding one line
  down to 360px.
- **The accent treatment** is a white→orange gradient clipped to the glyphs,
  drifting across on hover of the whole headline (a two-word hover target
  would be fussy to find). Both ends clear AA on charcoal — white at 15.8:1,
  `#EF8716` at 7.26:1 — so it never costs legibility. An `@supports` guard
  paints solid accent where `background-clip: text` is unavailable, rather
  than leaving transparent text on a transparent background.
- **Background** is deep charcoal with one soft orange pool low and centred,
  directly beneath the buttons so the light leads to the action, plus a
  faint white wash lifting the top edge. Both drift slowly; both stop under
  reduced motion. No lettering, no cards, no objects, no particles.
- **One decorative detail**: a 2px orange rule under the content that scales
  out from the centre over 1200ms and fades at both ends, closing the
  composition and carrying the eye into the footer.

### Entrance sequence

Eyebrow → headline line 1 → headline line 2 (110ms behind) → description →
buttons → contact line → accent rule, all on the shared easing tokens.

The two headline lines are **authored by hand** rather than measured by
`RevealText`. The automatic splitter only handles a single text node — it
refuses anything containing markup, because rebuilding would destroy it —
and this headline needs markup for the gradient. They use the same
`.reveal-line` mask mechanism, so the motion is identical to every other
heading on the page.

The whitespace between the two line spans is load-bearing: without it the
heading's `textContent` reads "Ready to BuildSomething Better?", which is
what a screen reader announces and a crawler indexes. Verified:
`textContent` is "Ready to Build Something Better?".

---

## A toolchain trap worth knowing about

The first build after appending to `globals.css` **silently served stale
CSS**. `npm run build` reported success in 1.1s, but none of the three new
utilities reached the output — the headline rendered at 16px, the gradient
was absent and the accent rule had no width. Braces and comments both
balanced; the source was correct.

It was the Turbopack cache. `rm -rf .next && npm run build` (6.3s) emitted
everything correctly.

**If a stylesheet change appears to have no effect, clear `.next` before
debugging the CSS.** Checking the built artefact rather than trusting the
build's success message is what surfaced it:

```
grep -o "cta-headline" <served .css> | wc -l   →  0   (stale)
                                               →  2   (after clean build)
```

---

## Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors, 0 warnings |
| `npm run build` (clean) | green, 7 content routes still prerender static |
| Responsive: 3 routes × 13 widths (320→1920) | **39/39 clean**, no horizontal scrolling |
| Functional (nav, menu, accordion, both forms, keyboard) | **34/34 passing** |
| Effects (tilt, glass, scroll timeline, mobile, reduced motion) | **15/15 passing** |
| Links in CTA + footer | 22/23 resolve; the 23rd is a false positive (below) |
| Headline `textContent` | "Ready to Build Something Better?" — space intact |
| Computed headline size | 104px @1440, 40px @390 |

**The Facebook link reports 400 to an HTTP request but 200 in a real
browser**, with the title "Midis | Facebook". It is bot-blocking, not a
broken link — confirmed by navigating to it rather than trusting a status
code.

### Mobile (390px)

Single column, centred, two-line headline with no awkward wrap, stacked
full-width buttons at equal width, compact vertical spacing, no fixed
viewport height, no background lettering, no cards, no horizontal overflow.
The section is shorter than the desktop version while keeping every piece of
content.

---

## Functionality preserved

| Control | Destination | Status |
| --- | --- | --- |
| Start Your Project | `#estimator` | anchor exists |
| Book a Consultation | `/free-website-audit` | 200 |
| Email | `mailto:hello@midis.in` | valid |
| WhatsApp | `wa.me/919779320626` | 200 |

---

## Still outstanding (unchanged)

1. **midis.in sub-paths 404** — footer nav points at `MAIN_SITE_URL`
   (the Vercel host) until that is fixed. One constant to change.
2. **No real submission has reached the CMS.**
3. **`NEXT_PUBLIC_CALENDLY_URL` is unset**, so the thank-you pages show the
   email/WhatsApp fallback.
4. **No Lighthouse score taken.**
5. The eight content questions in `STATUS.md` §6 still stand.
