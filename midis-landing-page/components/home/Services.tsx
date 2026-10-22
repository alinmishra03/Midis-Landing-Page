"use client";

import Image from "next/image";
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
 * SIX DISTINCT VISUALS. Each card's media area is its own composition
 * (globals.css, "SERVICES SHOWCASE"):
 *   01 layered browser + phone mockups carrying REAL portfolio
 *      screenshots (Gulf Connect, Country Kids — content/work.ts, live
 *      sites verified 2026-10-14);
 *   02 a design-workspace still life — wireframe, type specimen,
 *      swatches, a built component;
 *   03 a storefront built on the real AlinKriti screenshot with an
 *      illustrative product card;
 *   04 a before/after split, both sides drawn and labelled as an
 *      illustration — no real site is shown as "before";
 *   05 a search-results panel, skeleton bars only — no invented
 *      rankings, no fake traffic numbers;
 *   06 a four-node automation workflow: Enquiry → CRM → Notification →
 *      Follow-up.
 * Honesty rules carried over from the demos: real screenshots are real
 * and credited by their address bars; everything else is wireframe-
 * abstract or labelled "Illustration"; no metric appears anywhere.
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

/** Skeleton line — the honest stand-in for text that does not exist. */
function Bar({ className }: { className?: string }) {
  return <span className={`sv-bar ${className ?? ""}`} />;
}

function VisualWebDev() {
  return (
    <div aria-hidden="true" className="sv sv-web">
      {/* the desktop mockup: a real MIDIS project, named in its chrome */}
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
      {/* the phone mockup: a second real project, layered for depth */}
      <div className="sv-phone">
        <Image
          src="/images/work/country-kids.jpg"
          alt=""
          fill
          sizes="120px"
          loading="lazy"
          className="object-cover object-left-top"
        />
      </div>
    </div>
  );
}

function VisualUiux() {
  return (
    <div aria-hidden="true" className="sv sv-uiux">
      {/* wireframe panel */}
      <div className="sv-wire">
        <span className="sv-wire-media" />
        <Bar className="w-4/5" />
        <Bar className="w-3/5" />
        <Bar className="w-2/5" />
      </div>
      {/* type specimen */}
      <div className="sv-type">
        <span className="sv-type-aa">Aa</span>
        <Bar className="w-10" />
      </div>
      {/* colour swatches */}
      <div className="sv-swatches">
        <i /><i /><i /><i />
      </div>
      {/* a built component the wireframe becomes */}
      <div className="sv-component">
        <span className="sv-component-cta">Get Started</span>
        <span className="sv-toggle"><i /></span>
      </div>
      {/* the designer's cursor */}
      <svg className="sv-cursor" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3l14 7.6-6.2 1.6L9.4 18 5 3Z"
          fill="var(--color-accent)"
          stroke="#fff"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
}

function VisualEcommerce() {
  return (
    <div aria-hidden="true" className="sv sv-shop">
      {/* the storefront: a real MIDIS e-commerce project */}
      <Image
        src="/images/work/alinkriti.jpg"
        alt=""
        fill
        sizes={CARD_IMG_SIZES}
        loading="lazy"
        className="sv-shop-img object-cover"
      />
      <span className="sv-shop-scrim" />
      <span className="sv-addr sv-shop-host">alinkriti.com</span>
      {/* illustrative product card — bars, not invented products */}
      <div className="sv-product">
        <Bar className="w-3/4" />
        <Bar className="w-1/3" />
        <span className="sv-cart-cta">
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M3 5h10l-.8 7.2a1.4 1.4 0 0 1-1.4 1.3H5.2a1.4 1.4 0 0 1-1.4-1.3L3 5Zm2.6 0V4a2.4 2.4 0 0 1 4.8 0v1"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add to Cart
        </span>
      </div>
      {/* the bag that answers the add-to-cart */}
      <span className="sv-bag">
        <svg viewBox="0 0 16 16" fill="none" className="size-4">
          <path
            d="M3 5h10l-.8 7.2a1.4 1.4 0 0 1-1.4 1.3H5.2a1.4 1.4 0 0 1-1.4-1.3L3 5Zm2.6 0V4a2.4 2.4 0 0 1 4.8 0v1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sv-bag-badge">1</span>
      </span>
    </div>
  );
}

function VisualRedesign() {
  return (
    <div aria-hidden="true" className="sv sv-redesign">
      {/* the dated site — deliberately clumsy, clearly drawn */}
      <div className="sv-before">
        <span className="sv-before-head" />
        <span className="sv-before-title" />
        <div className="sv-before-cols">
          <span /><span /><span />
        </div>
        <span className="sv-tag">Before</span>
      </div>
      {/* the modern rebuild sweeps in over it */}
      <div className="sv-after">
        <div className="sv-after-inner">
          <span className="sv-after-nav" />
          <Bar className="sv-after-h1" />
          <Bar className="sv-after-sub" />
          <span className="sv-after-cta" />
        </div>
        <span className="sv-tag sv-tag-accent">After</span>
      </div>
      <span className="sv-split" />
      <span className="sv-chip">Illustration</span>
    </div>
  );
}

function VisualSeo() {
  return (
    <div aria-hidden="true" className="sv sv-seo">
      <div className="sv-search">
        <div className="sv-search-bar">
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0">
            <circle cx="7" cy="7" r="4.4" stroke="currentColor" strokeWidth="1.4" />
            <path d="m10.4 10.4 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <Bar className="w-1/2" />
          <span className="sv-caret" />
        </div>
        {/* three illustrative results; the highlight marks the one
            climbing, and climbs a place itself on hover */}
        <div className="sv-results">
          {[0, 1, 2].map((row) => (
            <div key={row} className="sv-result">
              <span className="sv-favicon" />
              <span className="sv-result-lines">
                <Bar className="w-2/3" />
                <Bar className="w-full" />
              </span>
              <svg viewBox="0 0 12 12" fill="none" className="sv-up">
                <path d="M6 9.5v-7M3 5.2 6 2.3l3 2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>
      {/* organic growth, drawn — no numbers, no invented traffic */}
      <div className="sv-bars">
        <i /><i /><i /><i />
      </div>
    </div>
  );
}

const FLOW_NODES = [
  { label: "Enquiry", x: "6%", y: "14%" },
  { label: "CRM", x: "56%", y: "8%" },
  { label: "Notification", x: "12%", y: "58%" },
  { label: "Follow-up", x: "58%", y: "64%" },
] as const;

function VisualAutomation() {
  return (
    <div aria-hidden="true" className="sv sv-flow">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62" preserveAspectRatio="none">
        <path className="sv-flow-line" d="M24 14 C 40 14, 48 12, 60 12" />
        <path className="sv-flow-line" d="M66 18 C 66 34, 44 32, 30 38" style={{ "--fd": "0.5s" } as React.CSSProperties} />
        <path className="sv-flow-line" d="M32 44 C 44 48, 50 44, 62 42" style={{ "--fd": "1s" } as React.CSSProperties} />
      </svg>
      {FLOW_NODES.map((node, index) => (
        <span
          key={node.label}
          className="sv-node"
          style={{ left: node.x, top: node.y, "--nd": `${index * 120}ms` } as React.CSSProperties}
        >
          <span className="sv-node-dot" />
          {node.label}
          <span className="sv-node-status" />
        </span>
      ))}
      <span className="sv-signal" />
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
    <Section id="services" tone="surface" labelledBy="services-heading">
      {/* ================= the editorial header ================= */}
      {/* Tighter than the last pass on MIDIS's note: two masked lines
          instead of three, column widths that keep the paragraph beside
          the heading from lg, no dead band above the grid. */}
      <div className="container-site">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-14">
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
            <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
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
