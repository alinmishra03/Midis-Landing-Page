# Client feedback section

"Words From Our Clients": nine MIDIS client relationships, one featured at
a time. Rebuilt twice on 2026-10-21 — first as a logo showcase with
project spotlights, then (same day, on instruction) reworked to carry
client FEEDBACK about working with MIDIS, with all logos removed from the
section. Clients: Country Kids, Mounting Backend Services (MBS), Sofisam,
Gulf Connect Consultancy (GCC), Mobile Tyre Champions (MTC), High Spirits,
AlinKriti, HQB Pro Solutions, Mining Discovery.

---

## 1. How the feedback works

Each story in `content/testimonials.ts` carries a `feedback` quote —
with **no invented person names, job titles, ratings or metrics** — plus
an `approved` flag.

- `approved: true` (all nine as of 2026-10-21): the quote renders as a
  real `<blockquote>` with quotation marks under a **Client Feedback**
  label, attributed to the company.
- `approved: false`: the quote is dropped and the page shows the
  client's factual **Project Spotlight** instead, as a plain paragraph
  under that label.

**Provenance of the published quotes.** The nine quotes were supplied
verbatim on 2026-10-21 and published on the explicit confirmation —
given in answer to a direct question in-session — that this is feedback
the clients actually gave MIDIS and that MIDIS confirms they are fine
being quoted. If that ever fails to hold for a client, flip their
`approved: false` and their quote leaves the page with no code change.
Ghost-written drafts written earlier the same day were replaced by these
supplied quotes and are no longer in the repo (see git history).

## 2. Sources for the factual material (verified 2026-10-21)

Industries and spotlights: Country Kids / Gulf Connect / AlinKriti from
`content/work.ts` (MIDIS portfolio, live sites checked 2026-10-14); MBS
from mountingbackendservices.com; Sofisam from sofisam.com (SOFISAM FZCO,
DMCC Dubai); MTC from mobiletyrechampions.com; HQB from
hqbprosolutions.com (Edmonton); Mining Discovery from miningdiscovery.com
(also a client logo on midis.in's case-study page). Only the three
portfolio-documented engagements carry a services line.

**High Spirits is unverified**: several unrelated companies share the
name and none matched. Its entry claims no industry ("Client Partner")
and its draft speaks only to the working relationship. MIDIS should
confirm what this business does.

## 3. No logos

Removed from this section on instruction (second pass). The selector is
a rail of company-name pills; attribution is text. The Trust rail's logo
board is untouched. `public/images/clients/mining-discovery.webp` —
downloaded from miningdiscovery.com during the first pass — remains in
the repo, currently unreferenced, in case MIDIS wants Mining Discovery
added to the Trust rail.

## 4. The component

`components/home/Testimonials.tsx`, between `<CaseStudies />` and
`<Pricing />`. Featured panel (quote mark, content-type label, word-
cascade text reveal via the existing `.t-word` animation, text
attribution), a pill rail with every client directly selectable
(`aria-current`, 44px+ targets, horizontal scroll strip on phones with
`shrink-0` items), prev/next with wrap-around, an 01/09 counter, progress
hairline, `aria-live` announcements, no autoplay, and one internal CTA —
"Start Your Project" → `#estimator`. No external links in the section.

## 5. What was measured (2026-10-21, second pass)

`scratchpad/qa-testimonials.mjs` (puppeteer-core, production build) —
**26 assertions, all passing** against the published state: heading
renders and the "Client Feedback" label shows (no spotlight label);
zero demo content; nine pills, each selecting the right story with its
own quote text verified; **zero `<img>` in the section**; the featured
story is a real `<blockquote>`; counter and wrap-around; only
`#estimator` linked; dark theme; 390/320px with no page overflow,
internal rail scroll, working tap selection and 44px+ targets; reduced
motion leaves text visible with animations off.

QA caveat: the lead popups open over a fresh session and swallow clicks;
the suite suppresses them via their own `sessionStorage` key. Expected
behaviour, not a bug.
