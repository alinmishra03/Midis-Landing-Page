# MIDIS Landing Page — implementation report

Last updated: 2026-10-20.

All ten PDF sections, the Free Website Audit route and both confirmation
routes are built. Nothing below is described as working unless it was
actually run and checked — §4 lists what was **not** verified.

---

## 1. Build result

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/enquiry
├ ○ /free-website-audit
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ○ /thank-you/book-a-call
└ ○ /thank-you/project-enquiry
```

Every content route prerenders as static; only the enquiry API is dynamic.
That is the shape Core Web Vitals wants — HTML arrives complete, nothing
above the fold waits on a server round-trip.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | 0 errors |
| `npx eslint .` | 0 errors, 0 warnings |
| `npm run build` | Compiled successfully, 10/10 static pages generated |
| Route smoke test (4 routes) | all 200 |
| Asset integrity (15 local assets/route) | no 404s |
| Internal links | all resolve |
| Heading hierarchy | exactly one `<h1>` per route, no skipped levels |
| Image alt text | every `<img>` has `alt`; 6 decorative images use `alt=""` + `aria-hidden` |
| Form labelling | 31 controls across 2 forms, 0 unlabelled |
| Pinch-zoom | not blocked (WCAG 1.4.4) |
| JSON-LD | parses; no `aggregateRating`/`review`/`offers`/`award` |
| API validation | 405 / 422 / honeypot / rate-limit all behave correctly |

---

## 2. Sections — all from MIDIS.pdf

| § | Section | Component |
| --- | --- | --- |
| 1 | Hero | `components/home/Hero.tsx` |
| 2 | Trust & credibility | `components/home/Trust.tsx` |
| 3 | Featured projects | `components/home/Work.tsx` |
| 4 | Core services | `components/home/Services.tsx` |
| 5 | Project estimator | `components/home/Estimator.tsx` + `forms/EstimatorForm.tsx` |
| 6 | How it works | `components/home/Process.tsx` |
| 7 | Case studies | `components/home/CaseStudies.tsx` |
| 7b | Client testimonials | `components/home/Testimonials.tsx` + `content/testimonials.ts` |
| 8 | Pricing & scope | `components/home/Pricing.tsx` |
| 9 | FAQs | `components/home/Faqs.tsx` |
| 10 | Final CTA | `components/home/FinalCta.tsx` |
| P4 | Free Website Audit | `app/free-website-audit/` + `forms/AuditForm.tsx` |
| P5 | Confirmation + booking | `app/thank-you/book-a-call/`, `app/thank-you/project-enquiry/` |

---

## 3. A bug found and fixed during QA

The honeypot used `z.literal("")`, which fails on a **missing** key as well
as a filled one. The API treats a `website` validation error as spam and
answers with a silent `200 {ok:true}`. So any payload that omitted the
field — a stripped proxy, a client-side regression — would have been
**dropped while the visitor was told it had been received**. That is the
exact fake-success failure the codebase is written to prevent.

Now `z.string().optional().default("")` plus a refinement: absent passes,
filled fails. Re-tested — an empty payload correctly returns 422 listing
all nine missing fields, and a filled honeypot is still silently absorbed.

---

## 4. NOT verified — read before launch

1. **No real form submission has ever been made.** The Strapi proxy is
   written against a contract verified during the earlier MIDIS site audit
   (five fields; `services` a strict enum whose values carry trailing
   spaces and whose catch-all is the empty string, not `"Other"`). Every
   validation path was tested, but **no payload has reached the live CMS** —
   deliberately, because that would write a real lead into MIDIS's
   production inbox. Send one test submission and confirm it lands before
   treating the integration as working.
2. **No browser-based QA.** The Chrome extension was not connected, so
   there has been **no visual check, no responsive sweep across the
   320–1920px range, no keyboard walkthrough, no reduced-motion check and
   no console-error check**. The responsive work is written carefully
   (fluid clamps, a 16px gutter, `overflow-x: clip` on `body`, a distinct
   mobile hero composition) and the markup is sound, but it has not been
   *seen*. This is the main outstanding risk.
3. **Lighthouse / Core Web Vitals not measured.** The build shape is right
   and the LCP path is deliberate — the hero headline animates from CSS
   alone so it never waits on hydration, and the lead screenshot carries
   `priority` — but no score has been taken.

---

## 5. Decisions, and why

**No testimonials.** MIDIS.pdf p.10 carries three quotes, each headed
"Placeholder Only", attributed to "Demo Client Name", under a note reading
"Do not publish them as genuine customer reviews." No approved replacement
was supplied, so there is no testimonial component on the page at all.
Section 7 uses the PDF's own case-study alternative.

**No "View Case Study" links.** The PDF's template ends with "The Results:
Add verified metrics" and no metric exists for any project. Each project
links to its **live site** instead — checkable proof rather than invented
outcomes. The four-part structure is still shown, as the method MIDIS works
to, with an explicit line saying outcomes are published once verified.

**No prices.** MIDIS has no confirmed rate card. §8 explains the five
factors that move the number; the estimator summarises selections rather
than calculating a figure, per the PDF's own developer note.

**Package-style pricing layout, without prices (added 2026-10-20).** The
PDF's p.11 visual reference is a multi-column pricing-package page, and the
full-audit brief asked for that structure explicitly. §8 now opens with
three scope-tier cards — Landing Page / Business Website / E-commerce &
Custom, the PDF's own project types, middle card emphasised — whose price
slot reads "Tailored estimate" and whose CTA is the section's approved
"Get a Project Estimate". Scope lines are hedged supporting copy drawn
from the approved service descriptions; nothing is presented as a fixed
package or included deliverable. The five factor cards follow beneath,
unchanged, under "What moves the number". If MIDIS approves real package
prices, `pricingTiers` in `content/sections.ts` takes the figures without
a layout change.

**No invented counts.** The hero shows two numbers, both recounted from
lists in the repo: 18 clients, 6 live projects.

**No `FAQPage` structured data.** Google restricted FAQ rich results to
government and health sites, so it would earn nothing. The Q&As remain
plain crawlable markup.

**Two confirmation routes, not one.** `/thank-you/book-a-call` carries the
PDF's approved audit wording; showing it to a project enquirer would be
wrong. Separate static routes rather than a `searchParams` switch, which
would make the page dynamic under `cacheComponents` for no benefit.

---

## 6. Open questions for MIDIS

1. **Testimonials — the section is live but showing SAMPLE CONTENT.**
   Six placeholder quotes under placeholder names, each carrying a "Sample"
   chip, with a note under the subheading saying they are not real reviews.
   Switched on at MIDIS's request on 2026-10-19 so the section is visible
   while real quotes are collected. **This should not stay on at launch.**
   Supply any approved, attributed review (quote, name, role, company, plus
   sign-off to publish) and it replaces the samples automatically by adding
   one entry to `content/testimonials.ts` — no code change. See
   `docs/TESTIMONIALS.md`.
2. **Canonical host** — the PDF writes `midis.com/thank-you/book-a-call`.
   The verified domain is `midis.in`. The **path** is honoured exactly; the
   **host** is `midis.in`. Confirm.
3. **Case-study results** — any verified metric, with client, baseline,
   period and measurement method, would activate real case studies.
4. **Client logo permission** — the 18 marks are published on MIDIS's
   instruction of 2026-10-12, which is not written permission from each
   client. Worth confirming.
5. **Project relationships** — the portfolio presents entries as
   "concepts". Which of the six were delivered engagements? Set
   `relationship` in `content/work.ts` and the copy can say so.
6. **Budget currency — flagged as the brief required.** The PDF specifies
   **USD** and those bands ship unchanged, as confirmed. MIDIS is
   India-based and its internal cost references are INR. Confirm USD suits
   the intended audience.
7. **Audit service list** — the PDF screenshot is cut off by a scroll
   indicator after "SEO and conversion optimisation". Five options are
   reproduced exactly; none was added. If a sixth exists below the fold, it
   is missing.
8. **Calendly URL** — not supplied. See §7.

---

## 7. Environment

```
# Optional. Defaults to the existing MIDIS Strapi instance.
STRAPI_URL=https://jubilant-sparkle-2f7bfe100e.strapiapp.com
# Only needed if Strapi write access becomes token-gated.
STRAPI_API_TOKEN=
# Not yet supplied by MIDIS — see open question 8.
NEXT_PUBLIC_CALENDLY_URL=
```

No credential is read in a client component; the Strapi call happens only in
`app/api/enquiry/route.ts`.

**Booking behaviour.** With `NEXT_PUBLIC_CALENDLY_URL` set, the approved
"Choose a Meeting Time" button appears and opens the real scheduling page.
Unset — which is the state today — the button does **not** render, and an
email/WhatsApp fallback appears instead. There is deliberately no disabled
button and no placeholder link: a button that goes nowhere reads as a broken
site. Nothing on the page implies a meeting has been booked; it confirms the
*request* was received, which is true because the API confirmed the CMS
stored it before the page was reached.

---

## 8. Assets

Copied from the existing MIDIS website build into `public/`:

- `brand/` — 8 files. Orange is **#EF8716**, measured from the logo artwork
  (the horizontal logo is a two-colour PNG containing only `#FFFFFF` and
  `#EF8716`), not estimated.
- `images/work/` — 7 screenshots at 1800×1125, captured 2026-10-14, each of
  a live site that returned a rendered page on that date.
- `images/clients/` — 18 authentic client marks, colours untouched.
- `images/services/` — 6 Pexels-licensed photographs, one per service, none
  repeated.

### Contrast rules the design system enforces

`#EF8716` is **2.55:1** on white — it can never be body text on a light
surface. So:

- orange **text on light** uses `--color-accent-ink` (`#AA5A0A`, 4.72:1);
- orange **buttons** take charcoal text, not white (7.26:1);
- orange at full strength is used for text only on dark surfaces;
- image-backed service cards put white text over a bottom-weighted scrim
  that reaches 0.94 opacity, so contrast holds regardless of the photograph.
