# MIDIS Landing Page — full-width layout & mobile pass

Date: 2026-10-19. Fourth pass, after `STATUS.md`, `REFINEMENT.md` and
`VISUAL-SYSTEM.md`. No content, section, form or integration changed.

---

## Container widths were measured, not guessed

The brief named <https://new-midis-ten.vercel.app/> as the reference for
page structure, so I loaded it in a real browser and measured it instead of
estimating "full-width":

| viewport | reference gutter | reference content |
| --- | --- | --- |
| 390px | 20px | 350px |
| 768px | 35px | 699px |
| 1280px | 58px | 1165px |
| 1440px | 65px | 1310px |
| 1920px | 102px | 1715px |

That is a ~4.5vw gutter against a **118rem (1888px)** ceiling. This page was
capped at 84rem, so at 1920px it rendered 1344px of content inside 288px
margins — visibly narrower and more boxed-in than the main site.

After the change, measured the same way:

| viewport | this page | reference |
| --- | --- | --- |
| 390px | 350 / 20 | 350 / 20 |
| 768px | 698 / 35 | 699 / 35 |
| 1280px | 1164 / 58 | 1165 / 58 |
| 1440px | 1310 / 65 | 1310 / 65 |
| 1920px | **1716 / 102** | **1715 / 102** |

### One container width, not two

An earlier version of this pass used 100rem for text sections and 118rem for
visual ones. That reintroduces exactly the defect reported on the FAQ:
**above 1600px the two caps resolve to different left edges**, so a section
heading in one container and the grid beneath it in the other would start
144px apart at 1920px.

So every container is 118rem and shares one left edge at every width.
Expansiveness comes from the container; readability comes from `max-w-*` on
the text block itself. A container should not be doing both jobs — that is
what made them disagree in the first place.

`container-wide` is kept as a named alias at the same width, so those call
sites still read as "this is a wide visual band".

---

## Two bugs found by measurement

### 1. Line-split headings were losing their spaces

`RevealText` rebuilds a heading as one block span per rendered line. With no
whitespace between those spans, the heading's `textContent` concatenated
them:

```
rendered:     "Our Work"
              "Speaks for Itself"
textContent:  "Our WorkSpeaks for Itself"
```

That is what a screen reader announces, what a copy-paste yields, and what a
crawler reads from the rendered DOM. It appeared on **every viewport where a
heading wrapped** — so it was invisible at 1280px (one line) and wrong on
every phone. Six of the ten section headings were affected.

Fixed by appending a whitespace text node between lines. `.reveal-line` is
`display: block`, so it collapses and never renders; it exists purely so the
accessible text survives the split. Verified: headings now read "Our Work
Speaks for Itself", "Digital Solutions Built Around Your Business Goals",
"Answers Before You Ask".

### 2. Service cards were sized by their floor, not their content

At a 17rem mobile minimum, all six cards measured an identical 272px with
13–65px of dead space — the floor was setting every height and the content
none, which is the "unnecessarily tall card" the brief rules out.

Lowered to 14rem. Measured after: 224 / 224 / 232 / 232 / 243 / 260px, with
0–17px of slack. The floor now only catches the shortest card and the longer
descriptions genuinely grow theirs.

---

## Mobile

Audited at 390px with touch emulation:

- **Section order** is exactly the required flow: hero → trust → work →
  services → estimator → process → case studies → pricing → FAQs → final
  CTA → footer.
- **Every grid is single-column** — no multi-column grid survives to mobile.
- **Cards are full-width** (350px in a 390px viewport) and content-sized.
- **First CTA is above the fold** (y = 0 at load).
- **Page is 16,403px — about 19 screens** of real content. The length comes
  from stacked sections and full descriptions, not padding: section padding
  is a uniform 56px top and bottom, and the hero is natural-height rather
  than locked to `100vh`.
- **Headings scale with `clamp()`** — 41px for the h1 at 390px, 29–35px for
  section headings, none breaking to one word per line.
- **No 3D tilt and no backdrop blur** on touch devices; both are gated and
  verified off.
- **Alternating card entrances** on the service bento fall back to a
  vertical rise below `lg`, because a horizontal translate on a
  single-column layout pushes past the viewport — the cause of a 12px
  overflow earlier in this project.
- **The hero screenshot stack is hidden below 768px**, and only there. The
  `hidden md:block` is on the `TiltCard` — the mockup's own container — so
  the whole stack (frames, chrome bars, dots, URLs) leaves the layout and
  occupies no height. Hiding the images alone, or using `visibility`/
  `opacity`, would keep the box and leave a gap under the CTAs. It is
  deliberately **not** on the grid column: the client counts below it stay
  visible, and the stats then take `mt-0 md:mt-7 xl:mt-0` so no orphaned
  space is left behind. Measured at 360/390/430: the text column sits 48px
  above the counts, which is exactly the grid row-gap.
- **The portfolio previews are never hidden.** Every project row below the
  hero keeps its screenshot at every width, Country Kids included —
  verified at 360/390/430/768/1440. The hero mockup and the portfolio
  previews are separate things; only the hero one is a mobile concern.

---

## Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors, 0 warnings |
| `npm run build` | green, 7 content routes still prerender static |
| Responsive: 3 routes × 13 widths (320→1920) | **39/39 clean**, no horizontal scrolling anywhere |
| Container alignment | one shared left edge at every width |
| FAQ alignment | label, heading, description, question, answer identical left at 7 widths |
| Functional (nav, menu, accordion, both forms, keyboard) | **34/34 passing** |
| Effects (tilt, glass, scroll timeline, mobile, reduced motion) | **15/15 passing** |
| SEO/a11y static checks | all passing |

---

## Still outstanding (unchanged)

1. **No real submission has reached the CMS** — the success path is tested
   with the API intercepted so no test lead lands in MIDIS's production
   inbox. Send one real submission before trusting the integration.
2. **`NEXT_PUBLIC_CALENDLY_URL` is unset**, so the thank-you pages show the
   email/WhatsApp fallback. Intended, not a defect.
3. **No Lighthouse score taken.**
4. The eight content questions for MIDIS in `STATUS.md` §6 still stand.
