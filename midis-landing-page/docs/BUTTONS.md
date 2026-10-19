# MIDIS Landing Page — button system

Date: 2026-10-19. Eighth pass. No label, URL, section or integration
changed; this standardises how every CTA is built and laid out.

---

## What the audit found

Measuring every pill-shaped CTA across 3 routes × 10 widths, before any
change:

```
320–430px   heights vary: 44, 45, 52, 54, 76
            "Get a Free Consultation" + "Explore Our Work"
                heights 52/54
                stacked but widths 261/350
                stacked but edges L20 R281/370
768–1920px  "Start Your Project" + "Book a Consultation" heights 52/54
```

Five distinct heights, and the hero pair you reported sitting at different
widths with different right edges.

## Three root causes

**1. The border was adding 2px.** A border is part of an auto height, so
every bordered variant rendered 54px against the primary's 52px. Side by
side under `items-center` that also pushed their tops out of line. Fixed by
giving the base a **transparent border** and letting variants change only its
colour — so every variant is now exactly the same height by construction.

**2. A wrapper was blocking the stretch.** The hero's primary was wrapped in
`Magnetic`, an `inline-flex` span with no width. In the stacked mobile
column the secondary stretched to the full width while the primary kept its
natural 261px. The mismatch was the wrapper, not the buttons. `Magnetic` was
used in exactly one place, so it and its CSS were removed rather than
special-cased.

**3. Flex was squashing instead of wrapping.** At 1024px the hero's
two-column split left the text column only 471px — too narrow for both CTAs,
so flex shrank them until their labels broke onto a second line and the pair
measured 74px. Fixed in two places: `ButtonGroup` children are now
`shrink-0` with the row allowed to wrap, and the hero's split moved from
`lg` to `xl`, which also gives the headline proper room at 1024.

---

## The system

**`Button`** owns height, radius, padding, type, icon gap, transition,
disabled and press behaviour. Two sizes, the only two on the site:

| size | height | used for |
| --- | --- | --- |
| `lg` | 52px | every page CTA |
| `md` | 48px | dense chrome (the header) |

Height is `min-h`, not `h`, so a long label on a narrow phone wraps and grows
the button rather than spilling out of it.

**`ButtonGroup`** is the one place CTA layout is decided. Every section used
to hand-roll `flex flex-col gap-3 sm:flex-row sm:items-center`, and the small
differences between those copies are what produced the mismatches. It now
stacks and stretches on a phone — so related buttons share an exact width and
both edges — and forms a natural-width row from `sm`, with `items-stretch`
keeping tops and bottoms in line.

`[&>*]:w-full sm:[&>*]:w-auto` reaches any direct child, so a group never
depends on a call site remembering to pass a width class. The per-button
`w-full sm:w-auto` and `disabled:*` overrides are gone from every form and
section.

Converted: hero, final CTA, confirmation pages, estimator step controls. The
estimator keeps `flex-col-reverse` so the forward action stays above Back on
a phone — the primary path should not sit under the way out.

---

## Verification

| Check | Result |
| --- | --- |
| **Buttons: 3 routes × 10 widths** | **ALL CONSISTENT** — one radius, heights 52 (page) / 48 (header) |
| Related buttons stacked on mobile | identical width, height and both edges |
| Related buttons in a row | identical heights, aligned tops |
| Contrast, both themes, 3 routes | every text node passes **WCAG AA** |
| Theme toggle, persistence, no-flash, hydration | **18/18** |
| Responsive: 3 routes × 13 widths | **39/39 clean** |
| Functional (nav, forms, accordion, keyboard) | **34/34** |
| Effects (tilt, glass, scroll timeline, reduced motion) | **15/15** |
| Links in CTA + footer | 22/23 resolve (23rd is the Facebook bot-block false positive) |
| `tsc`, `eslint`, production build | clean |

The two remaining 74px readings in the audit are a **long label wrapping to
two lines at 320px** — "Have a Project in Mind? Let's Talk." and the audit
submit. That is the intended behaviour of a `min-h` floor: wrapping prevents
the overflow that a fixed height or `whitespace-nowrap` would cause. (An
earlier `whitespace-nowrap` on this component is what once pushed the audit
form's column to 328px inside a 288px container.) Both buttons are full-width
in their container, so the wrap reads as deliberate.

---

## Still outstanding (unchanged)

1. **midis.in sub-paths 404** — footer nav points at `MAIN_SITE_URL`.
2. **No real submission has reached the CMS.**
3. **`NEXT_PUBLIC_CALENDLY_URL` is unset.**
4. **No Lighthouse score taken.**
5. The eight content questions in `STATUS.md` §6 still stand.


---

## A third size, added for the floating navbar

`sm` — 44px, `min-h-11 px-4 text-sm`.

The floating header is 64px tall at the top of the page and 56px once
scrolled. A 48px `md` control leaves four pixels of breathing room at the
bottom of that travel, and the pill stops reading as floating. `sm` is used
by the consultation CTA in the bar, and matched by `ContactActions
size="sm"` and the theme toggle, so every control in the navbar is exactly
44px.

44px is the WCAG 2.5.8 floor, so this is as small as a control on this site
is allowed to get, and `sm` is for the navbar only — no page CTA uses it.

The three heights are now:

| size | height | used by |
| --- | --- | --- |
| `sm` | 44px | the floating navbar, and nothing else |
| `md` | 48px | dense chrome |
| `lg` | 52px | every page CTA |

Nothing in the navbar sets its own height: `.nav-group-end a, .nav-group-end
button { min-height: var(--nav-control-h) }` is the bar's standing
guarantee, and `flex-shrink: 0` stops any of them being squashed — measured
at 1024, where the theme toggle came out 28px wide before that rule existed.
