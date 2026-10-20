"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Arrow } from "@/components/ui/Button";
import { Eyebrow, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { services, servicesSection } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 4 — Core services. EDITORIAL SHOWCASE, 2026-10-20 (third pass).
 *
 * NO CARDS, NO GRID — on MIDIS's explicit instruction. The section is now
 * typography-led:
 *
 * DESKTOP (lg+): six oversized service ROWS — number, title, description,
 * arrow — separated by hairline dividers that draw themselves on scroll
 * (the existing `line-draw` scroll-timeline utility). Beside them, a
 * DEDICATED PREVIEW PANEL: the brief offers a cursor-chasing floating
 * image or a designated region, and prefers the region — it can never
 * collide with the text, which the floating version always threatens to.
 * Hovering or keyboard-focusing a row crossfades the panel to that
 * service's photograph, full-colour, NO scrim — nothing sits on top of it,
 * so for the first time the imagery needs no darkening at all. A gentle
 * pointer parallax (±10px, skipped under reduced motion) keeps the panel
 * alive without chasing the cursor.
 *
 * MOBILE/TABLET (<lg): an editorial ACCORDION — number, title, plus icon —
 * one service open at a time, the first open by default so the pattern is
 * discoverable. Expanding reveals the photograph, the approved
 * description and the Explore link, through the site's existing
 * grid-template-rows accordion mechanics (globals.css), with real
 * aria-expanded/aria-controls semantics. Nothing depends on hover.
 *
 * THE HEADING is hand-set in three masked lines ("lines" reveal variant,
 * same mechanism as the final CTA) so "Business Goals" can carry the
 * orange accent — the automatic splitter declines nested markup. The
 * words are servicesSection.headline VERBATIM, merely wrapped; the
 * whitespace text nodes between lines keep the accessible string intact.
 *
 * SERVICES, DESCRIPTIONS, CTAs AND LIVE midis.in LINKS are all unchanged.
 * Rows are real anchors, so keyboard users tab through them (focus also
 * drives the preview) and the focus ring comes from the global style.
 */

export function Services() {
  /* Desktop preview: the row under the pointer (or keyboard focus). Starts
     on the first service so the panel is never empty. */
  const [active, setActive] = useState(0);
  /* Mobile accordion: index of the open row, -1 for none. First open by
     default so the interaction is discoverable. */
  const [open, setOpen] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef<boolean | null>(null);
  const baseId = useId();

  /* Gentle parallax: pointer position over the showcase nudges the preview
     a few pixels. Direct style writes — no re-render per mousemove. */
  function onPointerMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion.current === null) {
      reduceMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
    if (reduceMotion.current) return;
    const panel = previewRef.current;
    if (!panel) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    panel.style.setProperty("--px", x.toFixed(3));
    panel.style.setProperty("--py", y.toFixed(3));
  }

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

      {/* ================= desktop: rows + preview panel ================= */}
      <div className="container-wide mt-[var(--space-block)] hidden lg:block">
        <div
          onMouseMove={onPointerMove}
          className="grid grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] items-start gap-12 xl:gap-16"
        >
          {/* ---- the rows ---- */}
          <div>
            {/* The architecture's top rule. */}
            <div aria-hidden="true" className="line-draw h-px bg-line" />
            <ul>
              {services.map((service, index) => (
                <Reveal as="li" key={service.slug} delay={index * 60} className="service-item">
                  <a
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-active={active === index || undefined}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    className="service-row grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-5 py-6 xl:py-7"
                  >
                    <span className="service-row-number font-display text-sm font-semibold">
                      0{index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="service-row-title block font-display text-[1.75rem] font-semibold leading-[1.12] xl:text-[2.125rem]">
                        {service.name}
                      </span>
                      <span className="service-row-desc mt-1.5 block max-w-xl text-sm leading-relaxed text-muted">
                        {service.description}
                      </span>
                    </span>
                    <span className="service-row-arrow justify-self-end text-fg">
                      <Arrow className="size-5" />
                    </span>
                  </a>
                  {/* Divider: draws itself on scroll; its orange segment
                      draws again, shorter, on the row's hover. */}
                  <div aria-hidden="true" className="service-divider line-draw" />
                </Reveal>
              ))}
            </ul>
          </div>

          {/* ---- the preview panel ----
              Sticky so it rides alongside all six rows. aria-hidden: it is
              a visual echo of the focused row, which already names and
              describes its service in text. */}
          <div
            aria-hidden="true"
            className="sticky top-[calc(var(--header-h)+1.5rem)]"
          >
            <Reveal variant="fade" delay={200}>
              <div
                ref={previewRef}
                className="service-preview relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card-lg)] bg-surface-2 ring-1 ring-fg/10"
              >
                {services.map((service, index) => (
                  <Image
                    key={service.slug}
                    src={service.image}
                    alt=""
                    width={1600}
                    height={1200}
                    /* The first preview is visible immediately; the rest
                       swap in on hover, so they can load lazily. */
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 42vw, 1px"
                    className={cn(
                      "service-preview-img absolute inset-0 size-full object-cover",
                      active === index && "is-active",
                    )}
                  />
                ))}
                {/* The panel's one orange detail, echoing the active row. */}
                <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-[rgb(10_11_13/0.55)] px-2.5 py-1 font-display text-xs font-semibold tracking-[0.14em] text-white">
                  0{active + 1}
                </span>
                <span className="service-preview-accent absolute bottom-0 left-0 h-[3px] w-16 bg-accent" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ================= mobile & tablet: the accordion ================= */}
      <div className="container-site mt-[var(--space-block)] lg:hidden">
        <div aria-hidden="true" className="h-px bg-line" />
        {services.map((service, index) => {
          const isOpen = open === index;
          const buttonId = `${baseId}-svc-btn-${index}`;
          const panelId = `${baseId}-svc-panel-${index}`;

          return (
            <Reveal as="div" key={service.slug} delay={index * 40} className="border-b border-line">
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex min-h-14 w-full items-center gap-4 py-4 text-left"
                >
                  <span
                    className={cn(
                      "w-7 shrink-0 font-display text-xs font-semibold transition-colors duration-[var(--dur-fast)]",
                      isOpen ? "text-accent-ink" : "text-muted",
                    )}
                  >
                    0{index + 1}
                  </span>
                  <span
                    className={cn(
                      "flex-1 font-display text-lg font-semibold leading-snug transition-colors duration-[var(--dur-fast)] sm:text-xl",
                      isOpen && "text-accent-ink",
                    )}
                  >
                    {service.name}
                  </span>
                  {/* Plus that turns into a close at 45°. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "service-acc-icon shrink-0 text-fg",
                      isOpen && "service-acc-icon-open",
                    )}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16">
                      <path
                        d="M8 2.5v11M2.5 8h11"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                data-open={isOpen ? "true" : "false"}
                className="accordion-panel"
              >
                <div className="overflow-hidden">
                  <div className="pb-5">
                    <div className="overflow-hidden rounded-xl">
                      <Image
                        src={service.image}
                        alt=""
                        aria-hidden="true"
                        width={1600}
                        height={1000}
                        loading="lazy"
                        sizes="92vw"
                        className="h-44 w-full object-cover sm:h-56"
                      />
                    </div>
                    <p className="mt-3.5 text-sm leading-relaxed text-muted">
                      {service.description}
                    </p>
                    <a
                      href={service.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn mt-3.5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink"
                    >
                      {service.cta}
                      <Arrow />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
