"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Button";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { services, servicesSection } from "@/content/sections";
import { preselectProjectType } from "@/lib/estimator-prefill";
import type { ProjectType } from "@/content/forms";

/**
 * SECTION 4 — Core services. IMAGE-LED SHOWCASE GRID, 2026-10-21 (fifth
 * pass).
 *
 * WHY THE TABS WENT. The fourth pass was a tablist driving one shared
 * demo stage — six text rows on the left, one visual on the right. MIDIS
 * rejected it: too much unused space, services hidden behind clicks, one
 * generic illustration carrying the whole section. This pass shows ALL
 * SIX services simultaneously as an editorial card grid — no tabs, no
 * accordion, no carousel, no internal scrolling, nothing revealed only by
 * interaction. The visitor reads the section top to bottom and has seen
 * every service.
 *
 * SIX DISTINCT VISUALS, REAL WORK FIRST (MIDIS brief, 2026-10-22). Each
 * card demonstrates a service with genuine captures of a project whose
 * service record supports it (content/work.ts tags), never a concept:
 *   01 Gulf Connect (Development): the live desktop homepage, then its
 *      REAL mobile layout slides in — responsive development, shown;
 *   02 NeoCloudz (UI/UX Design): its live dashboard interface — the
 *      real theme toggle (dark → light), then its real "Jobs" tab;
 *   03 AlinKriti (E-commerce): one real shopping journey — collection,
 *      product page, the store's own cart after "Add to cart";
 *   04 Silver One Resources (Redesign): the draggable before/after;
 *   05 Mining Discovery (SEO): its live search snippet, structured data
 *      and crawl files, read from the live site — foundations only, no
 *      ranking or traffic claimed;
 *   06 MIDIS's own lead pipeline (Automation): the real estimator with
 *      demo data, the checks app/api/project-estimate actually runs, the real
 *      confirmation page.
 * Raw captures live in assets-source/; every source host is credited on
 * the visual. No metric, ranking or outcome appears anywhere.
 *
 * HOVER IS SEASONING, NEVER THE MEAL. Every card animates differently on
 * hover (zoom, drift, sweep, signal pulse), but each visual is complete
 * and legible at rest: touch visitors and reduced-motion visitors miss
 * an effect, not information. All effects are transform/opacity/
 * clip-path under @media (hover:hover), removed by reduced-motion.
 *
 * LEAD GENERATION (unchanged): every CTA goes to #estimator,
 * preselecting the matching approved project type where one exists.
 * No external links.
 */

/** Service slug → APPROVED estimator option (content/forms.ts). Only exact
    conceptual matches; mapping the rest to "Other" would silently answer a
    form question the visitor never saw. */
const ESTIMATOR_TYPE: Partial<Record<string, ProjectType>> = {
  "website-design-development": "New Website",
  "ecommerce-shopify": "E-commerce",
  "website-redesign": "Redesign",
};

const CARD_IMG_SIZES = "(min-width:1024px) 31vw, (min-width:768px) 46vw, 94vw";

/* ======================================================================
   The six visual compositions. All decorative (aria-hidden): the card's
   text carries every fact. Skeleton bars stand in for copy so nothing
   fictional is ever readable; the only real content is real portfolio
   screenshots, credited by their address bars.
   ====================================================================== */

/* ======================================================================
   THE SCENE ENGINE (MIDIS brief, 2026-10-22: real work, demonstrated).

   Cards 01, 02, 03 and 06 each play a short scripted sequence made of
   REAL captured interface states. `useScene` owns the timing:

   - The server renders `rest` — a meaningful, finished state — so a
     visitor without JavaScript, or with reduced motion, sees a real
     interface rather than a blank first frame.
   - On mount, a card still below the fold is ARMED (reset to step 0)
     so its scene can play when it arrives; a card already on screen at
     load is left at rest rather than replaying mid-view.
   - It plays ONCE when the visual is mostly on screen, then again only
     when a mouse enters it — never on a loop, never off-screen (the
     timers simply run out).
   - Reduced motion: never armed, never played; CSS also drops every
     transition. Nothing here changes layout — every layer is absolutely
     positioned inside the fixed 16:10 media box.
   ====================================================================== */

function useScene(timeline: readonly number[], rest: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(rest);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const still = useRef(false);

  const play = useCallback(() => {
    if (busy.current || still.current) return;
    busy.current = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    setStep(0);
    timers.current = timeline.map((at, index) =>
      window.setTimeout(() => {
        setStep(index + 1);
        if (index === timeline.length - 1) busy.current = false;
      }, at),
    );
  }, [timeline]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      still.current = true;
      return;
    }
    const belowFold = element.getBoundingClientRect().top > window.innerHeight;
    const arm = requestAnimationFrame(() => {
      if (belowFold) setStep(0);
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (belowFold) play();
      },
      { threshold: 0.55 },
    );
    observer.observe(element);
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(arm);
      observer.disconnect();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [play]);

  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") play();
  };

  return { ref, step, onPointerEnter };
}

/** One full-bleed real screenshot, shown while `on`. */
function SceneLayer({ src, on }: { src: string; on: boolean }) {
  return (
    <div className="sc-layer" data-on={on || undefined}>
      <Image
        src={src}
        alt=""
        fill
        sizes={CARD_IMG_SIZES}
        loading="lazy"
        className="object-cover object-left-top"
      />
    </div>
  );
}

/** The demonstration pointer. Positions are percentages of the 16:10
    box, measured from the real element in each captured screenshot. */
function SceneCursor({ x, y, show, click }: { x: number; y: number; show: boolean; click?: boolean }) {
  /* The arrow's tip sits at (x, y); .sc-cursor offsets the glyph so. */
  return (
    <span
      className="sc-cursor"
      data-show={show || undefined}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {click ? <span key={`${x}-${y}`} className="sc-click" /> : null}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M5 3l14 7.6-6.2 1.6L9.4 18 5 3Z"
          fill="#141518"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ---- 01: Gulf Connect, desktop + its REAL mobile layout ----
   The desktop capture (2026-10-14) and a mobile capture of the same live
   homepage (390×844 @2x, 2026-10-22, non-essential cookies rejected).
   The phone slides in after the desktop settles: responsive development,
   shown with the site's own two layouts. */

const WEB_TIMELINE = [550] as const;

function VisualWebDev() {
  const { ref, step, onPointerEnter } = useScene(WEB_TIMELINE, 1);
  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      aria-hidden="true"
      className="sv sv-web"
      data-step={step}
    >
      <div className="sv-browser">
        <div className="sv-browser-bar">
          <span className="sv-dots">
            <i /><i /><i />
          </span>
          <span className="sv-addr">gulfconnectconsultancy.com</span>
        </div>
        <Image
          src="/images/work/gulf-connect.jpg"
          alt=""
          width={1800}
          height={1125}
          sizes={CARD_IMG_SIZES}
          loading="lazy"
          className="sv-browser-img"
        />
      </div>
      <div className="sv-phone">
        <Image
          src="/images/work/services/gcc-mobile.webp"
          alt=""
          fill
          sizes="130px"
          loading="lazy"
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}

/* ---- 02: NeoCloudz, real interface states (MIDIS, 2026-10-22) ----
   Three captures of the live homepage — a working GPU-cluster dashboard
   — in one session: the dark interface; the same interface after its
   real theme toggle is pressed; then its real "Jobs" tab selected,
   showing the job list. The hero headline is a live typewriter, so
   each frame was taken when it showed the same complete phrase, for a
   clean cross-fade. */

const UIUX_TIMELINE = [350, 1250, 2300, 3200] as const;
const UIUX_TOGGLE = { x: 84.4, y: 8.4 };
const UIUX_JOBS = { x: 73.8, y: 43.8 };
const UIUX_REST = { x: 62, y: 74 };

function VisualUiux() {
  const { ref, step, onPointerEnter } = useScene(UIUX_TIMELINE, 4);
  const cursor = step === 0 ? UIUX_REST : step <= 2 ? UIUX_TOGGLE : UIUX_JOBS;
  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      aria-hidden="true"
      className="sv sc"
    >
      <SceneLayer src="/images/work/services/neocloudz-dark.webp" on />
      <SceneLayer src="/images/work/services/neocloudz-light.webp" on={step >= 2} />
      <SceneLayer src="/images/work/services/neocloudz-jobs.webp" on={step >= 4} />
      <SceneCursor
        x={cursor.x}
        y={cursor.y}
        show
        click={step === 2 || step === 4}
      />
      <span className="sv-addr sc-host">neocloudz.com</span>
    </div>
  );
}

/* ---- 03: AlinKriti, a real shopping journey ----
   Three captures of the live store (2026-10-22): the earrings
   collection; the product page reached by clicking that product; the
   store's own cart page holding it after its real "Add to cart" (no
   checkout, no personal data). Nothing is drawn on top of the store. */

const SHOP_TIMELINE = [350, 1300, 2150, 3100] as const;
const SHOP_PRODUCT = { x: 47.4, y: 35.2 };
const SHOP_ADD = { x: 78.5, y: 51.8 };
const SHOP_REST = { x: 62, y: 80 };

function VisualEcommerce() {
  const { ref, step, onPointerEnter } = useScene(SHOP_TIMELINE, 4);
  const cursor =
    step === 0 ? SHOP_REST : step <= 2 ? SHOP_PRODUCT : SHOP_ADD;
  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      aria-hidden="true"
      className="sv sc"
    >
      <SceneLayer src="/images/work/services/ak-1-collection.webp" on />
      <SceneLayer src="/images/work/services/ak-2-product.webp" on={step >= 2} />
      <SceneLayer src="/images/work/services/ak-3-cart.webp" on={step >= 4} />
      <SceneCursor
        x={cursor.x}
        y={cursor.y}
        show={step < 4}
        click={step === 2}
      />
      <span className="sv-addr sc-host">alinkriti.com</span>
    </div>
  );
}

/* ---- 04: the real before/after (MIDIS brief, 2026-10-22) ----

   THE ASSETS. Two genuine screenshots of Silver One Resources supplied by
   MIDIS — the original site and the MIDIS redesign. Both were cut with ONE
   crop rectangle (same origin, same size, 16:10 like this media box) so
   they overlay pixel-for-pixel: the divider only reveals, it never moves
   or resizes either image. Unmodified originals: assets-source/silver-one.

   THE MECHANISM. The AFTER image is the base layer; the BEFORE image sits
   on top, clipped to the left `pos`% with clip-path — a true overlay, not
   two images side by side. Each label lives inside its own layer, so it
   is revealed and hidden with the site it names.

   INPUT. Mouse/pen drag immediately. Touch waits for a clearly horizontal
   gesture before taking over, and the box is `touch-action: pan-y`, so a
   vertical swipe that starts on the image still scrolls the page. The
   handle is a focusable role="slider": arrows step 5%, PageUp/PageDown
   20%, Home/End go to the edges.

   THE REVEAL. Once, the first time the card is mostly on screen: the
   original site sweeps in, the redesign sweeps back across it, and the
   divider settles at the centre (~2s). Any interaction cancels it
   instantly; reduced-motion skips it entirely. Transform-free and inside
   a fixed-ratio box, so it can never shift layout. */

const REVEAL_FRAMES: readonly (readonly [ms: number, pos: number])[] = [
  [0, 50],
  [450, 88],
  [1350, 12],
  [2000, 50],
];

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const clampPos = (value: number) => Math.min(100, Math.max(0, value));

function VisualRedesign() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const interacted = useRef(false);
  const frame = useRef<number | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    touch: boolean;
    active: boolean;
  } | null>(null);

  const stopReveal = useCallback(() => {
    interacted.current = true;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const posFromX = useCallback((clientX: number) => {
    const box = rootRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    setPos(clampPos(((clientX - box.left) / box.width) * 100));
  }, []);

  /* the one-time reveal */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const play = () => {
      const start = performance.now();
      const total = REVEAL_FRAMES[REVEAL_FRAMES.length - 1][0];
      const tick = (now: number) => {
        if (interacted.current) return;
        const t = Math.min(now - start, total);
        let i = 1;
        while (i < REVEAL_FRAMES.length - 1 && t > REVEAL_FRAMES[i][0]) i++;
        const [t0, p0] = REVEAL_FRAMES[i - 1];
        const [t1, p1] = REVEAL_FRAMES[i];
        setPos(p0 + (p1 - p0) * easeInOut((t - t0) / (t1 - t0)));
        frame.current = t < total ? requestAnimationFrame(tick) : null;
      };
      frame.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (!interacted.current) play();
      },
      { threshold: 0.6 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    stopReveal();
    const touch = event.pointerType === "touch";
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      touch,
      active: !touch,
    };
    if (!touch) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      posFromX(event.clientX);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    if (!g.active) {
      const dx = Math.abs(event.clientX - g.x);
      const dy = Math.abs(event.clientY - g.y);
      if (dy > dx && dy > 6) {
        gesture.current = null; // a vertical swipe: leave it to the page
        return;
      }
      if (dx < 6) return;
      g.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    posFromX(event.clientX);
  };

  const endGesture = () => {
    gesture.current = null;
    setDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = {
      ArrowLeft: -5,
      ArrowDown: -5,
      ArrowRight: 5,
      ArrowUp: 5,
      PageDown: -20,
      PageUp: 20,
    };
    let next: number | null = null;
    if (event.key in step) next = pos + step[event.key];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    stopReveal();
    setPos(clampPos(next));
  };

  const shown = Math.round(pos);

  return (
    <div
      ref={rootRef}
      className="sv rd"
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
    >
      {/* AFTER — the base layer */}
      <div className="rd-layer">
        <Image
          src="/images/work/silver-one-after.webp"
          alt="Silver One Resources website after the MIDIS redesign"
          fill
          sizes={CARD_IMG_SIZES}
          draggable={false}
          className="rd-img"
        />
        <span className="rd-tag rd-tag-after" aria-hidden="true">
          After
        </span>
      </div>

      {/* BEFORE — on top, clipped to the left of the divider */}
      <div
        className="rd-layer"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src="/images/work/silver-one-before.webp"
          alt="Silver One Resources website before the MIDIS redesign"
          fill
          sizes={CARD_IMG_SIZES}
          draggable={false}
          className="rd-img"
        />
        <span className="rd-tag rd-tag-before" aria-hidden="true">
          Before
        </span>
      </div>

      {/* the divider and its handle */}
      <span className="rd-line" style={{ left: `${pos}%` }} aria-hidden="true" />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare the Silver One Resources website before and after the redesign"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        aria-valuetext={`${shown}% original website, ${100 - shown}% redesign`}
        onKeyDown={onKeyDown}
        className="rd-handle"
        style={{ left: `${pos}%` }}
      >
        <span className="rd-knob" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path
              d="M6 4 2.5 8 6 12M10 4l3.5 4L10 12"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ---- 05: Mining Discovery's technical SEO, as it is live ----
   A site MIDIS built (content/case-studies.ts). Everything shown was read
   from the live site on 2026-10-22: its real <title> and meta
   description — the search snippet it publishes — its real favicon, the
   schema.org types in its JSON-LD (WebSite with a SearchAction,
   Organization), and its robots.txt and sitemap.xml, both served. The
   background is the genuine homepage capture from Featured Work. No
   ranking, traffic or outcome is claimed or implied — only the
   foundations that are publicly verifiable on the live site. */

const SEO_TIMELINE = [250, 1500, 2600, 3600] as const;
const SEO_SITE = {
  host: "miningdiscovery.com",
  title: "Mining Discovery — Mining News, Insights & Analysis",
  description:
    "Mining Discovery is the first choice for mining news and insights — covering exploration, production, regulation, investment, and ESG across global mining markets.",
  schema: ["WebSite", "SearchAction", "Organization"],
  checks: ["robots.txt", "sitemap.xml"],
} as const;

function VisualSeo() {
  const { ref, step, onPointerEnter } = useScene(SEO_TIMELINE, 4);
  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      aria-hidden="true"
      className="sv sc seo"
      data-step={step}
    >
      <SceneLayer src="/images/work/mining-discovery.jpg" on />
      <span className="seo-scan" />

      <ul className="seo-checks">
        {SEO_SITE.checks.map((check, index) => (
          <li
            key={check}
            data-on={step >= 4 || undefined}
            style={{ "--ci": index } as React.CSSProperties}
          >
            <span className="sc-pipe-tick">
              <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                <path
                  d="m2.5 6.3 2.3 2.4 4.7-5.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {check}
          </li>
        ))}
      </ul>

      <div className="seo-snippet" data-on={step >= 2 || undefined}>
        <p className="seo-snippet-host">
          <Image
            src="/images/work/services/mining-discovery-icon.png"
            alt=""
            width={64}
            height={64}
            sizes="16px"
            className="size-3.5 rounded-full"
          />
          {SEO_SITE.host}
        </p>
        <p className="seo-snippet-title">{SEO_SITE.title}</p>
        <p className="seo-snippet-desc">{SEO_SITE.description}</p>
        <p className="seo-schema" data-on={step >= 3 || undefined}>
          <span className="seo-schema-label">Structured data</span>
          {SEO_SITE.schema.map((type, index) => (
            <span
              key={type}
              className="seo-schema-type"
              style={{ "--ci": index } as React.CSSProperties}
            >
              {type}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/* ---- 06: MIDIS's own lead pipeline, verified in this codebase ----
   The real estimator (captured with obviously fake demo data, never
   submitted), the server-side checks app/api/project-estimate/route.ts actually
   performs, and the real confirmation page. Every pipeline row names
   something the route does — nothing is an invented integration. */

const AUTO_TIMELINE = [1500, 3900] as const;
const AUTO_CHECKS = [
  "Fields validated",
  "Spam checks: honeypot + rate limit",
  "Lead stored in the MIDIS Strapi CMS",
] as const;
const AUTO_STAGES = ["Enquiry form", "Server checks", "Confirmed"] as const;

function VisualAutomation() {
  const { ref, step, onPointerEnter } = useScene(AUTO_TIMELINE, 2);
  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      aria-hidden="true"
      className="sv sc"
      data-step={step}
    >
      <SceneLayer src="/images/work/services/midis-estimator-demo.webp" on />
      <div className="sc-layer sc-pipe" data-on={step === 1 || undefined}>
        <p className="sc-pipe-route">POST /api/project-estimate</p>
        <ul>
          {AUTO_CHECKS.map((check, index) => (
            <li
              key={check}
              style={{ "--ci": index } as React.CSSProperties}
            >
              <span className="sc-pipe-tick">
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                  <path
                    d="m2.5 6.3 2.3 2.4 4.7-5.4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {check}
            </li>
          ))}
        </ul>
      </div>
      <SceneLayer src="/images/work/services/midis-enquiry-confirmed.webp" on={step >= 2} />
      <ol className="sc-stages">
        {AUTO_STAGES.map((stage, index) => (
          <li key={stage} data-on={index <= step || undefined}>
            {stage}
          </li>
        ))}
      </ol>
      <span className="sv-chip">Demo data</span>
    </div>
  );
}

const VISUALS: Record<string, () => React.JSX.Element> = {
  "website-design-development": VisualWebDev,
  "ui-ux-design": VisualUiux,
  "ecommerce-shopify": VisualEcommerce,
  "website-redesign": VisualRedesign,
  "seo-organic-growth": VisualSeo,
  "automation-optimisation": VisualAutomation,
};

/* ====================================================================== */

export function Services() {
  return (
    <Section id="services" tone="surface" veil="soft" labelledBy="services-heading">
      {/* ================= the editorial header ================= */}
      {/* Two masked lines, no dead band above the grid. The paragraph sits
          directly under the heading at every width (MIDIS, 2026-10-24 — it
          used to sit beside it from lg), spaced like SectionHeader's sub. */}
      <div className="container-site">
        <div>
          <div>
            <Reveal>
              <Eyebrow className="mb-5">What we do</Eyebrow>
            </Reveal>
            {/*
              servicesSection.headline, verbatim, hand-set as two masked
              lines so the closing words carry the accent. The " " text
              node between lines is load-bearing: .reveal-line is
              display:block so it never renders, but without it the
              accessible string reads "AroundYour".
            */}
            <Reveal
              as="h2"
              id="services-heading"
              variant="lines"
              delay={60}
              className="max-w-[24ch] text-[length:var(--text-display-lg)] leading-[1.05]"
            >
              <span className="reveal-line">
                <span className="reveal-line-inner">
                  Digital Solutions Built
                </span>
              </span>{" "}
              <span className="reveal-line">
                <span
                  className="reveal-line-inner"
                  style={{ "--line-delay": "90ms" } as React.CSSProperties}
                >
                  Around Your{" "}
                  <span className="text-accent-ink">Business Goals</span>
                </span>
              </span>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {servicesSection.subheadline}
            </p>
          </Reveal>
        </div>
      </div>

      {/* ================= the showcase grid ================= */}
      {/* All six cards in document flow: 1 column on phones, 2 from md,
          3 from lg. Nothing scrolls inside the section, nothing hides. */}
      <div className="container-wide mt-[var(--space-block)]">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {services.map((service, index) => {
            const Visual = VISUALS[service.slug];
            return (
              <Reveal
                key={service.slug}
                as="li"
                variant="up"
                delay={index * 70}
                className="min-w-0"
              >
                <article className="svc-card group">
                  <div className="svc-media">
                    <Visual />
                    <span className="svc-num">0{index + 1}</span>
                  </div>

                  <div className="svc-body">
                    <h3 className="font-display text-lg font-semibold leading-snug tracking-[-0.01em] text-fg xl:text-xl">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                      {service.description}
                    </p>
                    {/* One label on every card — "Get a Project Estimate",
                        straight to the ONE form (MIDIS instruction,
                        2026-10-22; settled after two passes the same day:
                        no box of any kind, just the site's text-link
                        language in the MIDIS orange). `accent-ink` IS the
                        site's orange for text on light surfaces — the raw
                        brand orange is 2.55:1 on paper and fails as text
                        (see the Button notes). The prefill stays: arriving
                        from a service card still preselects its project
                        type. */}
                    <a
                      href="#estimator"
                      onClick={() => {
                        const type = ESTIMATOR_TYPE[service.slug];
                        if (type) preselectProjectType(type);
                      }}
                      className="group/btn mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink"
                    >
                      <span className="link-underline-accent">
                        Get a Project Estimate
                      </span>
                      <Arrow />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
