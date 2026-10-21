"use client";

import { useId, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Button";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { services, servicesSection } from "@/content/sections";
import { preselectProjectType } from "@/lib/estimator-prefill";
import { cn } from "@/lib/utils";
import type { ProjectType } from "@/content/forms";
import {
  DemoAutomation,
  DemoEcommerce,
  DemoRedesign,
  DemoSeo,
  DemoUiux,
  DemoWebDev,
} from "./service-demos";

/**
 * SECTION 4 — Core services. INTERACTIVE SHOWCASE, 2026-10-21 (fourth pass).
 *
 * WHY THE EDITORIAL ROWS WENT. The third pass drew six near-identical rows
 * with a shared photograph panel, and MIDIS's feedback was that every
 * service looked and behaved the same. This pass keeps the section's
 * typography-led identity but gives each service its own SIGNATURE
 * DEMONSTRATION — a miniature product demo that plays on one shared stage
 * (see service-demos.tsx for the six and the honesty rules they follow).
 * The stock photographs are gone from this section; the demos SHOW the
 * service instead of illustrating it.
 *
 * STRUCTURE: real tabs. The service names are a `tablist` on the left
 * (horizontal scrolling chips below `lg`, a numbered editorial list from
 * `lg`), the active service's approved description + CTA is its `tabpanel`,
 * and the stage swaps demos as the selection changes. Selection follows
 * click/Enter and roving arrow keys — standard tabs keyboard behaviour.
 * Nothing auto-advances; a demo plays when the VISITOR chooses it.
 *
 * SEO: all six approved names, descriptions and CTA labels are server-
 * rendered in the markup (inactive panels carry `hidden`, they are not
 * conditionally omitted), so the content is exactly what the rows carried.
 *
 * LEAD GENERATION (2026-10-21 brief, unchanged): every CTA stays on this
 * page — `#estimator`, preselecting the matching approved project type via
 * lib/estimator-prefill.ts where one exists. ESTIMATOR_TYPE maps only exact
 * conceptual matches; the rest arrive at the form with nothing chosen.
 *
 * THE GRID HAS THREE CHILDREN for two layouts (same trick as the hero):
 * tablist, stage, panels — stacked in that order on a phone so the chips
 * sit directly above the stage they drive; from `lg` the stage spans both
 * rows of the right column and the panels slot under the tablist.
 */

/** Service slug → APPROVED estimator option (content/forms.ts). Only exact
    conceptual matches; mapping the rest to "Other" would silently answer a
    form question the visitor never saw. */
const ESTIMATOR_TYPE: Partial<Record<string, ProjectType>> = {
  "website-design-development": "New Website",
  "ecommerce-shopify": "E-commerce",
  "website-redesign": "Redesign",
};

/** The stage demo for each service. */
const DEMOS: Record<string, () => React.JSX.Element> = {
  "website-design-development": DemoWebDev,
  "ui-ux-design": DemoUiux,
  "ecommerce-shopify": DemoEcommerce,
  "website-redesign": DemoRedesign,
  "seo-organic-growth": DemoSeo,
  "automation-optimisation": DemoAutomation,
};

/** Short labels for the phone chips ONLY — the full approved names render
    in the `lg` tablist and in each panel; nothing approved is altered. */
const SHORT_NAMES: Record<string, string> = {
  "website-design-development": "Web Development",
  "ui-ux-design": "UI/UX Design",
  "ecommerce-shopify": "E-commerce",
  "website-redesign": "Redesign",
  "seo-organic-growth": "SEO",
  "automation-optimisation": "Automation",
};

export function Services() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Standard tabs keyboard behaviour: arrows move AND select (selection is
     cheap — a demo swap), Home/End jump. Roving tabindex below keeps one
     tab stop for the whole list. */
  function onTablistKeyDown(event: React.KeyboardEvent) {
    const last = services.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = active === last ? 0 : active + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = active === 0 ? last : active - 1;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  const ActiveDemo = DEMOS[services[active].slug];

  return (
    <Section id="services" tone="surface" labelledBy="services-heading">
      {/* ================= the editorial header ================= */}
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow className="mb-5">What we do</Eyebrow>
            </Reveal>
            {/*
              servicesSection.headline, verbatim, hand-set as three masked
              lines so the closing words can carry the accent. The " "
              text nodes between lines are load-bearing: .reveal-line is
              display:block, so they never render, but without them the
              accessible string reads "SolutionsBuilt".
            */}
            <Reveal
              as="h2"
              id="services-heading"
              variant="lines"
              delay={60}
              className="text-[length:var(--text-display-lg)] leading-[1.05]"
            >
              <span className="reveal-line">
                <span className="reveal-line-inner">Digital Solutions</span>
              </span>{" "}
              <span className="reveal-line">
                <span
                  className="reveal-line-inner"
                  style={{ "--line-delay": "90ms" } as React.CSSProperties}
                >
                  Built Around Your
                </span>
              </span>{" "}
              <span className="reveal-line">
                <span
                  className="reveal-line-inner text-accent-ink"
                  style={{ "--line-delay": "180ms" } as React.CSSProperties}
                >
                  Business Goals
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

      {/* ================= the showcase ================= */}
      <div className="container-wide mt-[var(--space-block)]">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-14 lg:gap-y-8">
          {/* ---- 1. the service navigator (tablist) ---- */}
          <Reveal className="min-w-0">
            <div aria-hidden="true" className="line-draw hidden h-px bg-line lg:block" />
            <div
              role="tablist"
              aria-label="MIDIS services"
              onKeyDown={onTablistKeyDown}
              className={cn(
                /* phone: horizontally scrolling chips, edge to edge */
                "-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1.5",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                /* lg: the numbered editorial list */
                "lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0",
              )}
            >
              {services.map((service, index) => {
                const selected = active === index;
                return (
                  <button
                    key={service.slug}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${index}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${index}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(index)}
                    data-active={selected || undefined}
                    className={cn(
                      /* phone chip */
                      "svc-tab inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted",
                      /* lg row */
                      "lg:w-full lg:shrink lg:whitespace-normal lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-0 lg:py-4 lg:text-left xl:py-5",
                    )}
                  >
                    <span className="svc-tab-number font-display text-xs font-semibold lg:w-7 lg:shrink-0 lg:text-sm">
                      0{index + 1}
                    </span>
                    <span className="svc-tab-name lg:block lg:font-display lg:text-xl lg:font-semibold lg:leading-snug xl:text-[1.375rem]">
                      <span className="lg:hidden">{SHORT_NAMES[service.slug]}</span>
                      <span className="hidden lg:inline">{service.name}</span>
                    </span>
                    <span className="svc-tab-arrow ml-auto hidden text-fg lg:inline-flex" aria-hidden="true">
                      <Arrow className="size-4.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* ---- 2. the stage ---- */}
          {/* NOT aria-hidden: the comparison slider, the cart and the
              before/after toggle inside the demos are real controls with
              their own names. The drawn artwork marks itself decorative. */}
          <Reveal
            variant="fade"
            delay={140}
            className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <div className="svc-stage relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card-lg)] border border-line bg-surface-2 sm:aspect-[16/11] lg:aspect-[4/3]">
              {/* one soft accent wash so the stage never reads flat */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(34rem 22rem at 70% 8%, rgb(239 135 22 / 0.07), transparent 65%)",
                }}
              />
              {/* keyed remount = each demo plays from its first frame when
                  chosen, and never while nobody is looking at it */}
              <div key={services[active].slug} className="stage-scene absolute inset-0">
                <ActiveDemo />
              </div>
              <span className="pointer-events-none absolute left-3.5 top-3.5 inline-flex items-center rounded-full bg-[rgb(10_11_13/0.55)] px-2.5 py-1 font-display text-xs font-semibold tracking-[0.14em] text-white">
                0{active + 1}
              </span>
            </div>
          </Reveal>

          {/* ---- 3. the panels: approved description + CTA ---- */}
          {/* All six render (SEO keeps every approved description in the
              HTML); `hidden` shows only the selected one. */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            {services.map((service, index) => (
              <div
                key={service.slug}
                role="tabpanel"
                id={`${baseId}-panel-${index}`}
                aria-labelledby={`${baseId}-tab-${index}`}
                hidden={active !== index}
                className="svc-panel"
              >
                <h3 className="text-base font-semibold lg:sr-only">
                  {service.name}
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted sm:text-[0.9375rem] lg:mt-0">
                  {service.description}
                </p>
                <a
                  href="#estimator"
                  onClick={() => {
                    const type = ESTIMATOR_TYPE[service.slug];
                    if (type) preselectProjectType(type);
                  }}
                  className="group/btn mt-3.5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink"
                >
                  <span className="link-underline-accent">{service.cta}</span>
                  <Arrow />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
