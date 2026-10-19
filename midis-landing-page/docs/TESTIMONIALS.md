# Client testimonials

The "Words From Our Clients" section: what it does, why it is empty today,
and exactly what someone has to do to make it appear.

---

## 1. The section is live, and it is showing sample content

`components/home/Testimonials.tsx` is wired into the page between
`<CaseStudies />` and `<Pricing />`, and it is visible.

What it shows is **placeholder copy, not client feedback**. The approved
list is still empty; the samples are there so the section is visible and
reviewable while real testimonials are collected. This was switched on at
the client's explicit request on 2026-10-19 — before that the section
rendered nothing at all.

**Every sample is labelled.** A "Sample" chip on each card, and one quiet
line under the subheading reading "Sample content — placeholder quotes shown
while client testimonials are being collected. These are not real reviews."
Both are driven by the same flag as the content, so they cannot drift out of
step with what is on screen, and both disappear the moment a real approved
quote is added.

The names are "Demo Client One" … "Demo Client Six" at "Demo Company"
rather than plausible-looking people at plausible-looking businesses. That
is deliberate: a realistic-sounding fake name is what would turn a layout
placeholder into a fabricated review, and it would also risk resembling a
real person. Nothing in the sample copy claims a result, a metric or an
outcome — the quotes describe working with a team, which is the one thing a
placeholder can say without inventing a business achievement.

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

## 3. Turning the samples off

```bash
NEXT_PUBLIC_SHOW_SAMPLE_TESTIMONIALS=false npm run build
```

With no approved quotes and no samples the section renders nothing at all,
and the page reads as complete without it — no empty heading, no
"testimonials coming soon", no placeholder card.

Approved quotes always win over samples, so adding a real one turns the
samples off by itself. You never have to do both.

There are six samples: the three from MIDIS.pdf page 10, reproduced word for
word, plus three more written in the same register so the desktop grid fills
two rows and the mobile carousel has enough cards to page through.

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

`scratchpad/qa/testimonials.mjs` and `swipe.mjs` — **65 assertions, all
passing**:

| Area | Result |
| --- | --- |
| Placement | between `case-studies` and `pricing`; still exactly one `h1` |
| Copy | heading and subheading match the brief verbatim |
| Provenance | section note + 6/6 card chips, counted on the chip element |
| Desktop 1440 | 3-column grid, six cards in two rows, each row sharing a top edge |
| Mobile 390 | `overflow-x: auto`, `x mandatory` snap, `snap-align: center`, card 76% of track |
| Swipe | CDP touch advances the track 0 → 255 and the live region follows; reverse swipe returns |
| Snap | any offset from 200–340 resolves to 287 with the card dead centre (Δ0px) |
| Vertical gesture | a vertical drag inside the carousel still scrolls the page — not trapped |
| Controls | Next/Prev move and disable at the ends; Enter works; 44×44; page never jumps vertically |
| Breakpoints | 320/360/375/390/430/768/1024/1440/1920 — all cards painted, no clipped quotes, no overflow, heading and first card share a left edge (Δ0px) |
| Contrast | both themes, composited over the real ancestor stack — lowest 4.52:1, all pass AA |
| Reduced motion | nothing hidden, arrows jump instantly |

With `NEXT_PUBLIC_SHOW_SAMPLE_TESTIMONIALS=false` and no approved quotes,
the string "Words From Our Clients" appears **0** times in the served HTML.

### One thing deliberately *not* claimed

Where a real thumb-flick comes to rest is decided by the compositor, and CDP
touch injection in headless Chromium does not run the fling curve or the
snap-after-scroll-end that follows it — the track stops where the synthetic
drag ended and stays there (still 255 after 3.2s, no correction). So the
resting position of a real flick is not observable in this harness and is
not asserted. What *is* asserted is that the snap configuration resolves
exactly when the scroll comes from the scroll API, which is the part the CSS
controls.
