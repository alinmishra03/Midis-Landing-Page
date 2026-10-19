# MIDIS Landing Page — light & dark themes

Date: 2026-10-19. Seventh pass. No section, route, form, integration or
approved copy changed; this is a colour-system change plus one new control.

---

## The architecture

Tailwind v4 compiles `bg-paper` to `background-color: var(--color-paper)`, so
**redefining the variable under a dark scope re-themes every utility without
touching a component class.** That is the whole mechanism. The work was not
plumbing a theme through components — it was deciding which tokens flip and
which do not.

### Two groups of tokens

**Group 1 — flips.** The page surfaces and the text on them: `paper`,
`surface`, `surface-2`, `fg`, `muted`, `muted-strong`, `line`, `accent-ink`,
`accent-soft`, `accent-line`, `danger`, `danger-soft`.

**Group 2 — dark in both themes.** This page has always had deliberately
dark bands (pricing, final CTA, footer) and photo cards under a dark scrim.
Those are a composition device, not a consequence of the theme, so they stay
dark in light mode *and* dark mode — they just go **deeper** than the page in
dark mode (`#09090b` against a `#111113` page) so a band still reads as a
band instead of dissolving into the background. Tokens: `ink`, `ink-soft`,
`ink-raised`, `line-dark`, `muted-dark`, `on-accent`.

### The rename that made it possible

`ink` previously meant two things at once: the primary **text** colour and
the dark **band**. A theme flip needs those to move in opposite directions,
so the text meaning moved to a new `fg` token and `ink` kept the surface
meaning. That is the `text-ink` → `text-fg` rename across the components.

### Three tokens that must never follow the theme

- **`--color-on-accent`** — text on an orange fill. Charcoal on `#EF8716` is
  7.26:1; white on it is **2.1:1** and fails. Fixed in both themes, because
  an orange button needs dark text whatever the page is doing. Used by the
  primary button, the open FAQ icon and the confirmation step badges.
- **`.logo-chip-light` / `.logo-chip-dark`** — a light-on-transparent client
  mark needs a dark chip in *both* themes and a dark mark needs a light one.
  Letting the chip flip would make half the logos vanish, and recolouring or
  inverting someone else's logo to avoid that is not ours to do.
- **Photo scrims** stay dark, so white text over the service photography
  keeps its contrast floor in both themes.

### Accent, which flips for a reason

`#EF8716` is only **2.55:1** on paper, so on light surfaces the accent-as-text
is the darkened `#AA5A0A`. On the dark page the brand orange is **7.1:1** and
needs no darkening, so `--color-accent-ink` flips to `#EF8716`.
`text-accent-ink` is therefore correct in both themes with no conditional at
the call site.

---

## The bug this pass turned up

`body { color: var(--color-ink) }` was still pointing the **inherited text
colour** at what had just become the *deep band background*. In dark mode
every heading and paragraph that set no colour of its own rendered
**near-black on a near-black page** — the hero headline, the audit form
headings and both confirmation pages.

It is invisible in a diff: the rule did not change, its meaning did. It was
caught by compositing every text node against its real ancestor stack and
measuring the contrast ratio. The failing elements reported **1.05:1** and
**1.19:1**, which is how a token rename turns into a blank page.

Fixed by pointing it at `--color-fg`. `::selection` had the same problem and
now uses `--color-on-accent`.

> A second trap, already documented in `FINAL-CTA.md` and hit again here:
> after editing `globals.css`, `npm run build` can serve **stale CSS** from
> the Turbopack cache and report success. One round of this audit measured a
> build that did not contain the fix. Clear `.next` before trusting a CSS
> change.

---

## The toggle

`components/layout/ThemeToggle.tsx` — no new dependency. The job is read a
stored choice, set one attribute, write it back.

- **`useSyncExternalStore`**, not `useState` + `useEffect`. The current theme
  lives in the `data-theme` attribute and the OS preference — both external
  stores. It also solves hydration: `getServerSnapshot` returns `null`, so
  server and first client render agree. The `useState` version is a
  synchronous `setState` inside an effect, which the React Compiler flags as
  a cascading render (it did, during this pass).
- **Icons are not derived from React state.** Both sun and moon render and
  CSS shows one, so the correct icon is painted before any script runs. The
  wordmark uses the same trick with its two brand files — no CSS filter, no
  hydration mismatch, no flash of the wrong mark.
- **Three states, not two.** No stored choice means "follow the system". The
  CSS guards on `:root:not([data-theme="light"])` rather than on the
  attribute merely being absent, which is what lets an **explicit light
  choice survive a dark OS setting**.
- **No flash**: a synchronous inline script in `<head>` replays an explicit
  stored choice before first paint. With no stored choice it writes nothing
  and `prefers-color-scheme` handles it — so the system preference is
  honoured on a first visit with no JavaScript at all. Wrapped in try/catch
  because `localStorage` throws outright in some privacy modes.
- **Transitions are temporary.** `.theme-switching` is added for 320ms and
  removed. A permanent colour transition on every element would fight every
  hover state on the page and cost a repaint on each one.

---

## Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 errors, 0 warnings |
| `npm run build` (clean) | green, 7 content routes still prerender static |
| **Contrast, both themes, 3 routes** | every measured text node passes **WCAG AA** |
| Toggle, persistence, no-flash, hydration, mobile | **18/18 passing** |
| Responsive: 3 routes × 13 widths | **39/39 clean** |
| Functional (nav, menu, accordion, both forms, keyboard) | **34/34 passing** |
| Effects (tilt, glass, scroll timeline, reduced motion) | **15/15 passing** |

The contrast audit composites each text node's colour over its **real
ancestor background stack**, including alpha, rather than comparing declared
values. It skips outlined display type and text over photography, which are
judged visually.

Specifically confirmed:

- System preference honoured on first visit, with **no attribute written**.
- Explicit choice survives reload, navigation **and a conflicting OS
  setting**.
- `data-theme` present at `readyState: "interactive"` — set before paint.
- **No hydration or console errors in either theme.**
- Logo and toggle icon swap correctly; logo chips hold fixed colours in both.
- Toggle is 44×44 at 320px and 390px with no header overflow.

---

## Still outstanding (unchanged)

1. **midis.in sub-paths 404** — footer nav points at `MAIN_SITE_URL`.
2. **No real submission has reached the CMS.**
3. **`NEXT_PUBLIC_CALENDLY_URL` is unset.**
4. **No Lighthouse score taken.**
5. The eight content questions in `STATUS.md` §6 still stand.
