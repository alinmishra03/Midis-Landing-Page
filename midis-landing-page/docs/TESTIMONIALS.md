# Client testimonials

The "Words From Our Clients" section: what it does, why it is empty today,
and exactly what someone has to do to make it appear.

---

## 1. The section is built, and it renders nothing

`components/home/Testimonials.tsx` is complete and wired into the page
between `<CaseStudies />` and `<Pricing />`. It returns `null`.

That is the intended state, not an unfinished one.

MIDIS.pdf page 10 carries three quotes. Each is headed **"Demo Testimonial —
Placeholder Only"**, attributed to "Demo Client Name" at "Demo Company",
under a developer note in the document itself:

> These testimonials are fictional examples for layout and design testing.
> Do not publish them as genuine customer reviews.

No approved, attributed testimonial has been supplied to replace them, so
none is published. The brief's constraint is explicit — do not invent client
names, do not invent company names, do not publish demo testimonials as
genuine, do not generate fake review ratings, do not invent customer
photographs — and the cheapest way to honour it permanently is to make the
section incapable of rendering unapproved content, rather than to rely on
whoever edits the file next remembering the rule.

**The page does not look incomplete without it.** The section is skipped
whole — heading, banner, cards, controls — so the reading order runs case
studies → cost, with no empty heading, no "testimonials coming soon", and
no placeholder card. Nothing hints that something is missing.

---

## 2. Publishing a real testimonial

Add an entry to `testimonials` in `content/testimonials.ts` with
`approved: true`. Nothing else. The section appears on its own — no
component change, no layout work, no page edit.

```ts
export const testimonials: readonly Testimonial[] = [
  {
    quote: "…the client's own words, never paraphrased…",
    name: "Real Name",
    role: "Their actual role at the time",
    company: "Real Company",
    approved: true,          // written sign-off to publish, with attribution
  },
];
```

Optional per entry: `logo` (a path in `public/images/clients`, plus
`logoWidth`/`logoHeight`) and `projectSlug` to tie a quote to a project in
`content/work.ts`. When no logo is given the card shows the initial of the
name on an accent disc — deliberately **not** a stock portrait, because the
brief forbids inventing customer photographs and a generic avatar implies
one.

### Why `approved` is a field rather than implied by presence

A quote can be staged in the array while it is still being confirmed with
the client, without that confirmation being assumed by the code:

```ts
export const approvedTestimonials = testimonials.filter((t) => t.approved);
```

`approved: false` is inert. Only `true` reaches the page.

---

## 3. Previewing the layout before real quotes exist

```bash
NEXT_PUBLIC_SHOW_DEMO_TESTIMONIALS=true npm run build
```

This renders the PDF's three placeholders so the layout can be reviewed.
It is unset in production, and `NEXT_PUBLIC_` values are inlined at build
time, so a production build contains no testimonial markup at all —
verified: `curl` of the built page matches `Words From Our Clients` **0**
times.

When the flag is on, the preview cannot be mistaken for a live page:

- a banner across the section states the quotes are placeholders from
  MIDIS.pdf, are not client feedback, and do not appear in production;
- **every** card carries a "Demo content" badge;
- the names are the PDF's own placeholders, so even a screenshot of the
  preview invents no person and no business.

Approved quotes always win over demo quotes, so turning the flag on can
never replace or hide real feedback.

---

## 4. The carousel

Below `md` the cards are a horizontal scroll-snap track, one card per view
with the next peeking. From `md` the same `<ul>` becomes a 3-column grid —
the snap and overflow properties stop applying, so one set of markup serves
both and there is no second code path to keep in sync.

**There is no gesture code.** The track is a real scroll container, so touch
swiping, fling momentum, trackpad scrolling and keyboard scrolling are the
browser's own and behave natively on every device. The arrows call
`scrollTo` on the track; the dots come from an `IntersectionObserver` rooted
on the track. Nothing can desynchronise from the real scroll position,
because the real scroll position is the only source of truth.

`scrollTo` on the track, not `scrollIntoView` on the card — the latter also
scrolls the *page* vertically to centre the card, yanking the section around
under the visitor. Measured: page `scrollY` is unchanged by the arrows.

### Why the cards do not individually reveal

Every other card grid on this page staggers its entrance. This one does not,
and the reason is specific: a reveal starts at `opacity: 0` and clears when
the element intersects the **viewport**. Cards 2 and 3 sit outside the
viewport *horizontally*, so they would stay invisible until swiped to, then
animate in under the visitor's thumb mid-gesture. The entrance is therefore
on the track as a whole. No card can be swiped to and found blank.

### Accessibility

- `figure` / `blockquote` / `figcaption` — a real quote with a real
  attribution, not a styled `div`.
- The arrows are `<button>`s with `aria-label`s, focusable, Enter-activated,
  and `disabled` at each end of the track.
- The dots are `aria-hidden`; position is announced through an
  `aria-live="polite"` region reading "Testimonial 2 of 3".
- Both controls are 44×44.
- The logo `img` is `alt=""` and `aria-hidden` — the company name is already
  in the caption text, so announcing it twice is noise.

---

## 5. What was measured

Against a build with the demo flag on (`scratchpad/qa/testimonials.mjs`,
`swipe.mjs`) — **67 assertions, all passing**:

| Area | Result |
| --- | --- |
| Placement | between `case-studies` and `pricing`; still exactly one `h1` |
| Copy | heading and subheading match the brief verbatim |
| Provenance | section banner + 3/3 card badges in the demo preview |
| Desktop 1440 | 3-column grid, equal widths (421px) and heights (337px), one top edge |
| Mobile 390 | `overflow-x: auto`, `x mandatory` snap, `snap-align: center`, card 76% of track |
| Swipe | CDP touch advances the track 0 → 255 and the live region follows; reverse swipe returns |
| Snap | any offset from 200–340 resolves to 287 with the card dead centre (Δ0px) |
| Vertical gesture | a vertical drag inside the carousel still scrolls the page — not trapped |
| Controls | Next/Prev move and disable at the ends; Enter works; 44×44; page never jumps vertically |
| Breakpoints | 320/360/375/390/430/768/1024/1440/1920 — all cards painted, no clipped quotes, no overflow, heading and first card share a left edge (Δ0px) |
| Contrast | both themes, composited over the real ancestor stack — lowest 4.52:1, all pass AA |
| Reduced motion | nothing hidden, arrows jump instantly |

Production build (flag off): the string "Words From Our Clients" appears
**0** times in the served HTML.

### One thing deliberately *not* claimed

Where a real thumb-flick comes to rest is decided by the compositor, and CDP
touch injection in headless Chromium does not run the fling curve or the
snap-after-scroll-end that follows it — the track stops where the synthetic
drag ended and stays there (still 255 after 3.2s, no correction). So the
resting position of a real flick is not observable in this harness and is
not asserted. What *is* asserted is that the snap configuration resolves
exactly when the scroll comes from the scroll API, which is the part the CSS
controls.
