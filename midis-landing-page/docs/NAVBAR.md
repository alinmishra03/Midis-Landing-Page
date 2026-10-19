# The floating navbar

A translucent pill that floats clear of the viewport edges. What it does,
and — more usefully — why each breakpoint sits where it does, because every
one of them was measured rather than chosen.

Structure lives in `components/layout/Header.tsx`; the glass, sizing tokens
and grid live in `app/globals.css` under "SITE HEADER".

---

## 1. It shares the page's edges

The shell sits inside `container-site`, so its left and right edges land on
exactly the same line as every section heading, every card and the footer.
Measured at all twelve widths: the shell's left edge matches the page's
content edge to within 1px.

A floating bar with its own arbitrary inset would be the one element on the
page that agrees with nothing else, and at 1920 the mismatch would be ~86px.

---

## 2. One control height

`--nav-control-h` (44px) sizes the theme toggle, both contact controls and
the consultation CTA. Nothing in the bar carries its own height:

- `Button size="sm"` — added to the button system for this bar, documented
  in `BUTTONS.md`
- `ContactActions size="sm"` — the matching pill
- `ThemeToggle` — already `size-11`
- `.nav-group-end a, .nav-group-end button { min-height: var(--nav-control-h) }`
  as the bar's standing guarantee

44px is the WCAG 2.5.8 floor, and it is also what keeps the bar compact
enough to read as floating: 64px tall at the top of the page leaves 10px of
breathing room above and below each control.

### Nothing may be squashed to make room

`flex-shrink: 0` on every control in the cluster. Without it a flex item
shrinks before its container overflows, and a shrunk circular control stops
being a 44px tap target — **measured at 1024, where the theme toggle came
out 28px wide**. Running out of width is a breakpoint problem; it must never
be solved by crushing a control.

---

## 3. Where the breakpoints come from

The five links are centred with `1fr auto 1fr`, which centres honestly only
while **both** side columns fit inside their own track. The action cluster is
always the wider one, so the question at every width is:

```
2 × max(left, right)  +  centre  +  2 × gap   ≤   shell inner width ?
```

Measured, with the bar as built:

| width | shell inner | left | centre | right | needed | fits |
| ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| 1024 | 908 | 117 | 357 | 344 | 1077 | no |
| 1152 | 1024 | 117 | 357 | 344 | 1077 | no |
| 1280 | 1141 | 117 | 387 | 344 | 1107 | **yes** |
| 1440 | 1286 | 117 | 387 | 344 | 1107 | yes |
| 1536 | 1374 | 117 | 387 | 344 | 1107 | yes |
| 1600 | 1432 | 117 | 387 | **495** | 1409 | **yes** |
| 1920 | 1691 | 117 | 387 | 495 | 1409 | yes |

So:

- **below 1024** — compact. Logo, contact circles, toggle, hamburger. The
  five links would not fit at any readable size, and §10 of the brief
  explicitly allows switching to the compact layout earlier.
- **1024–1279** — `auto minmax(0,1fr) auto`. The links appear and centre
  within the space left over. They sit left of the shell's true centre,
  because the action cluster (344px) is wider than the logo (117px). That
  offset is invisible; a crushed control is not.
- **1280+** — `1fr auto 1fr`. The links are centred against the shell
  itself. Verified: offset 0px at 1280, 1440 and 1920.
- **1600+** — labelled "WhatsApp" and "Call Us" pills. They cost 151px more
  than the two circles, which needs ~1409px of shell; that arrives at about
  1600px with 23px to spare. Below it the same two actions are 44px circles
  carrying their labels on `aria-label`, which §6 allows when the bar is
  short of room.

---

## 4. The scroll transition

`data-scrolled` goes on the header past 8px of scroll. The shell loses 4px
of height on mobile and 8px on desktop, and its background goes from 0.72 to
0.90 opacity so labels stay legible over whatever has scrolled beneath.

**The bar shrinks; the reserved space does not.** `--header-h` — which
`scroll-padding-top`, the hero's top padding and the sticky estimator all
read — is a constant per breakpoint. Anchoring to a moving target would
shift every in-page jump by the difference. Verified: `#work`, `#pricing`
and `#faqs` all land clear of the shell's bottom edge at 390 and 1440.

The header never hides. Checked at 6000px of scroll.

---

## 5. Active section

An `IntersectionObserver` with `rootMargin: "-32% 0px -62% 0px"` — a band
across the middle of the viewport, so at most one section qualifies at a
time and the highlight changes once, cleanly, as a section crosses the
middle of the screen. A full-height root would have three sections "visible"
at once on a tall display and the link would flicker between them.

The hero is observed too, under a sentinel key: while it holds the band the
answer is "none", which keeps every link quiet at the top of the page rather
than lighting up Work before the visitor has got there.

When the band falls in a gap between sections nothing is reported and the
previous answer stands — the alternative is the highlight blinking off
between two sections.

Clicking a link sets the state immediately; the observer confirms it a
moment later. The highlight is an orange label plus a drawn 2px rule — the
same rule the hover state animates, so the two are one idea rather than two
decorations.

Verified by scrolling to each of the five sections in turn and reading back
which link carries `data-active`.

---

## 6. Mobile

The bar holds the logo, the two contact circles (from 380px), the toggle and
the hamburger. The consultation CTA is not in the bar below 640px — it is
the first thing in the menu instead, full width.

The panel is **mounted at all times** so it can animate out as well as in.
`inert` is what keeps it out of the tab order and the accessibility tree
while closed; `pointer-events: none` alone would leave every link tabbable
behind the page.

Rows stagger in at 45ms intervals. The stagger applies **only on the way in**
— on close everything leaves together, because a staggered exit keeps the
last row on screen after the visitor has already moved on.

The hamburger is two bars that travel to the centre and cross, not an icon
swap: swapping two SVGs cannot be animated and reads as a flicker at 18px.

Behaviour, all verified: closes on choosing a link, closes on Escape with focus
returned to the trigger, focus moves into the panel on open, Tab is trapped
inside it, background scroll is locked while open and released after, and
the panel stays within the viewport.

### The panel lives outside `<header>`, and that is load-bearing

The shell carries `backdrop-filter`, and **a filtered element becomes the
containing block for its fixed-position descendants**. When the panel lived
inside the header, `top: …; bottom: 0` resolved against the header's own box
instead of the viewport: the panel computed to 1px tall, its links painted
over the hero, and `elementFromPoint` at a link's centre returned the hero
section. Every item in the mobile menu was unclickable.

The suite still asserts both halves of that: the panel is over 300px tall
when open, and every section link is hittable at its own centre.

---

## 7. Glass

`backdrop-filter: blur(18px) saturate(140%)`, declared **unprefixed and only
once**. Lightning CSS dedupes a hand-written standard/`-webkit-` pair and
keeps the prefixed one, which Chrome then reports as unsupported — that is
what silently killed the glass elsewhere in this project.

Under `@media (hover: none)` the blur is dropped and the shell falls back to
its more opaque background. `backdrop-filter` is the most expensive thing in
this header for a phone GPU and it sits over content that scrolls
continuously; the glass utilities already make the same trade below `lg`.

Colours are four tokens — `--nav-bg`, `--nav-bg-scrolled`, `--nav-border`,
`--nav-shadow` — declared light in `:root` and flipped in both dark scopes,
matching how every other themed colour in this codebase works.

---

## 8. What was measured

`scratchpad/qa/navbar.mjs` — **242 assertions**, all passing, across
320/360/375/390/414/430/768/820/1024/1280/1440/1920:

| Area | Result |
| --- | --- |
| Overflow | no page overflow, shell inside the viewport, grid never overflows its track |
| Vertical centring | every painted control shares one centre line, spread ≤ 1px |
| Equal heights | all action controls one height at every width |
| Tap targets | every action control ≥ 44×44 |
| Edge alignment | shell left edge matches the page content edge within 1px |
| Layout switch | five links above 1024, hamburger below, never both |
| Centring | offset 0px at 1280/1440/1920 |
| Scroll | settles, −4/−8px height, opacity 0.72 → 0.90, never hides |
| Active link | correct for all five sections; quiet over the hero |
| Mobile menu | open/close, Escape, focus trap, scroll lock, hit-testing, stagger, hamburger morph |
| Destinations | WhatsApp, `tel:`, `#estimator` and all five section hrefs unchanged |
| Anchors | every in-page jump lands clear of the bar |
| Contrast | both themes, scrolled, composited over the real ancestor stack — all pass AA |
| Theme switch | zero layout shift |
| Reduced motion | stagger and travel removed, everything still visible |
