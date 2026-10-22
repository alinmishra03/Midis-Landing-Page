"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Arrow, Button } from "@/components/ui/Button";
import { caseStudies, industries, type CaseStudy } from "@/content/case-studies";
import { cn } from "@/lib/utils";

/**
 * FEATURED WORK — the compact portfolio gallery (MIDIS brief, 2026-10-22).
 *
 * This replaces the long editorial case-study layout of 2026-10-21. The
 * brief's priority: show the quality of the work QUICKLY — less text,
 * bigger images, clear industries — without losing a word of the verified
 * case-study content. So:
 *
 *   FILTERS   One chip per verified industry (derived from the case-study
 *             data, so they can never advertise an industry the grid does
 *             not contain) plus "All Projects". Buttons with aria-pressed,
 *             wrapping naturally — no carousel, no horizontal scroll.
 *
 *   CARDS     Industry badge → client name → verified project type →
 *             genuine screenshot → up to three delivered-service tags.
 *             Exactly the brief's order, nothing longer. All screenshots
 *             are 1800×1125 (16:10), so every image box is the same shape
 *             without any cropping.
 *
 *   CURATED   "All Projects" first shows SIX cards from `sm` up (two
 *   FIRST     desktop rows) and THREE below it, with "Explore More
 *             Projects" revealing the rest. The cut is pure CSS
 *             (nth-child under a data attribute), so there is no
 *             measuring, no hydration mismatch and no resize listener —
 *             and the hidden cards' lazy images are simply never fetched
 *             until shown. Choosing an industry filter always shows every
 *             match. Nothing is ever unreachable.
 *
 *   DETAILS   The overview, full deliverables and live-site features that
 *             used to fill the page now live in an internal detail view —
 *             a native <dialog>, opened from the card (stretched button
 *             over the whole card; the corner arrow is its affordance).
 *             Native semantics give Escape, focus containment and
 *             ::backdrop for free. Still zero external links: the live
 *             host appears as text, and the dialog's one action is
 *             "Discuss a Similar Project" → #estimator.
 *
 * PROVENANCE is unchanged from content/case-studies.ts: verified
 * industries, supportable deliverables only, features phrased as what the
 * live site shows, genuine screenshots, no metrics, no invented outcomes.
 * Screenshots carry no overlays and no dark-mode filters.
 */

/* ---- industry chip icons (lucide-style, drawn inline) ---- */

const INDUSTRY_ICONS: Record<string, React.JSX.Element> = {
  education: (
    <>
      <path d="m22 9.5-10-5-10 5 10 5 10-5Z" />
      <path d="M6 11.8V17c3.2 2.7 8.8 2.7 12 0v-5.2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.9 9.1-1.8 4.6-4.6 1.8 1.8-4.6z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z" />
    </>
  ),
  car: (
    <>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  gem: (
    <>
      <path d="M6 3h12l4 6-10 13L2 9l4-6Z" />
      <path d="M2 9h20" />
      <path d="m11 3-2 6 3 13 3-13-2-6" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  news: (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9" />
      <path d="M10 6h8v4h-8z" />
      <path d="M10 14h8M10 18h5" />
    </>
  ),
  cloud: (
    <path d="M17.5 19H8a6 6 0 1 1 5.7-7.9A4.5 4.5 0 1 1 17.5 19Z" />
  ),
  /* The mobile selector's "all industries" mark — three stacked layers. */
  all: (
    <>
      <path d="m12 2.5 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16.5 9 5 9-5" />
    </>
  ),
};

function IndustryIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {INDUSTRY_ICONS[icon]}
    </svg>
  );
}

/* ---- the mobile industry dropdown ----
   A custom listbox, because the native <select>'s open menu is drawn by
   the OS — on desktop-sized browsers at mobile widths that meant a huge
   unstyled white panel with the browser's blue highlight (MIDIS fix,
   2026-10-22). No headless-UI dependency exists in this project, so the
   WAI-ARIA listbox-button pattern is implemented here directly: the
   trigger is a real <button aria-haspopup>, the menu is role="listbox"
   with aria-activedescendant, and it supports touch, Arrow/Home/End,
   Enter/Space, Escape, Tab-out and outside-click dismissal. The menu is
   absolutely anchored to the trigger's own box (same width, never the
   viewport's), capped at 17rem with internal scrolling only. */

const ALL_OPTION = { slug: "all", label: "All Projects", icon: "all" } as const;

function IndustrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  const options = [ALL_OPTION, ...industries];
  const selectedIndex = Math.max(0, options.findIndex((o) => o.slug === value));

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const openMenu = useCallback(() => {
    setActive(selectedIndex);
    setOpen(true);
  }, [selectedIndex]);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const choose = useCallback(
    (slug: string) => {
      onChange(slug);
      close(true);
    },
    [onChange, close],
  );

  /* Outside click/tap dismisses without stealing the interaction. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* The listbox takes focus while open (aria-activedescendant names the
     active row), and the active row is kept inside the scroll window. */
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(options[active].slug);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "flex h-12 w-full items-center gap-2.5 rounded-full border bg-surface px-4 text-left",
          "transition-[border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)]",
          open ? "border-accent/60" : "border-line",
        )}
      >
        <IndustryIcon
          icon={value === "all" ? "all" : (industries.find((i) => i.slug === value)?.icon ?? "all")}
          className="size-4 shrink-0 text-accent-ink"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
          {value === "all"
            ? "All Industries"
            : industries.find((i) => i.slug === value)?.label}
        </span>
        <svg
          viewBox="0 0 16 16"
          width="15"
          height="15"
          fill="none"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-muted transition-transform duration-[var(--dur-fast)]",
            open && "rotate-180",
          )}
        >
          <path
            d="m3.5 6 4.5 4.5L12.5 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label="Filter projects by industry"
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          className={cn(
            "wg-menu absolute inset-x-0 top-[calc(100%+0.375rem)] z-20",
            "max-h-[17rem] overflow-y-auto overscroll-contain p-1.5",
            "rounded-2xl border border-line bg-surface",
            "shadow-[0_18px_40px_-20px_rgb(20_21_24/0.35)]",
            "focus:outline-none",
          )}
        >
          {options.map((option, index) => {
            const selected = option.slug === value;
            return (
              <li
                key={option.slug}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(option.slug)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-semibold",
                  selected
                    ? "bg-accent-soft text-accent-ink"
                    : cn("text-fg", index === active && "bg-fg/[0.05]"),
                )}
              >
                <IndustryIcon
                  icon={option.icon}
                  className={cn("size-4 shrink-0", selected ? "text-accent-ink" : "text-muted")}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected ? (
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    aria-hidden="true"
                    className="shrink-0 text-accent-ink"
                  >
                    <path
                      d="m3 8.5 3.2 3.2L13 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ---- the delivered-service check, shared by the dialog ---- */

function Check() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft">
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="size-3 text-accent-ink">
        <path
          d="m2.5 6.3 2.3 2.4 4.7-5.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ---- one gallery card ---- */

function GalleryCard({
  study,
  index,
  onOpen,
}: {
  study: CaseStudy;
  index: number;
  onOpen: (study: CaseStudy) => void;
}) {
  return (
    <article
      className={cn(
        "wg-card group relative flex flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5",
        "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]",
        "hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_18px_40px_-28px_rgb(20_21_24/0.45)]",
        "motion-reduce:transform-none motion-reduce:transition-none",
      )}
      style={{ "--wg-i": index } as React.CSSProperties}
    >
      {/*
        The card's ONE action, stretched over the whole surface. A real
        <button> (not a click handler on the article), so it is focusable,
        announced, and nothing interactive ever nests inside it. z-10 keeps
        it above the imagery; the visible focus ring lands on the card
        shape itself.
      */}
      <button
        type="button"
        onClick={() => onOpen(study)}
        aria-label={`View ${study.client} project details`}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      />

      {/* ---- top: industry badge + the directional affordance ---- */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-accent-ink">
          {study.industry}
        </span>
        {/* Always rendered — a touch visitor needs the affordance too.
            Hover emphasises it: accent fill, nudge along its own diagonal. */}
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted",
            "transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)]",
            "group-hover:border-transparent group-hover:bg-accent group-hover:text-on-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            "motion-reduce:transform-none",
          )}
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path
              d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <h3 className="mt-3.5 font-display text-xl font-semibold leading-snug text-fg">
        {study.client}
      </h3>
      <p className="mt-1 text-[0.8125rem] font-semibold uppercase tracking-wider text-muted">
        {study.projectType}
      </p>

      {/* ---- middle: the genuine screenshot, 16:10 on every card ---- */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <Image
          src={study.preview}
          alt={`${study.client} website homepage`}
          width={1800}
          height={1125}
          loading="lazy"
          sizes="(min-width: 1360px) 380px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          className={cn(
            "block h-auto w-full",
            "transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]",
            "group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none",
          )}
        />
      </div>

      {/* ---- bottom: at most three delivered-service tags ---- */}
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Services delivered">
        {study.delivered.slice(0, 3).map((service) => (
          <li
            key={service}
            className="rounded-full border border-accent/25 bg-paper px-3 py-1 text-xs font-semibold text-accent-ink"
          >
            {service}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---- the gallery ---- */

export function WorkGallery() {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CaseStudy | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const shown =
    filter === "all"
      ? caseStudies
      : caseStudies.filter((study) => study.slug === filter);

  /* The CSS cut only applies while "All Projects" is collapsed; a filter
     always shows its full (small) result set. */
  const collapsed = filter === "all" && !expanded;

  const openDetail = useCallback((study: CaseStudy) => {
    setDetail(study);
  }, []);

  const closeDetail = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  /* showModal gives Escape, focus containment and ::backdrop natively;
     the onClose handler below keeps React state in sync with all of its
     close paths. Body scroll locks while the dialog is up — native
     <dialog> does not do that part. */
  useEffect(() => {
    if (!detail) return;
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detail]);

  return (
    <div>
      {/* ============ the filters ============ */}
      {/* PHONES (< md): nine pills wrapped into ~six rows and pushed the
          projects below the fold, so they become ONE 48px dropdown — the
          custom listbox above, anchored to its own trigger so the menu
          can never outgrow the container. */}
      <IndustrySelect value={filter} onChange={setFilter} />

      {/* FROM md: the pill row, exactly as on desktop before. */}
      <div
        role="group"
        aria-label="Filter projects by industry"
        className="hidden flex-wrap gap-2 md:flex"
      >
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={cn("wg-chip", filter === "all" && "wg-chip-active")}
        >
          All Projects
        </button>
        {industries.map((industry) => (
          <button
            key={industry.slug}
            type="button"
            onClick={() =>
              setFilter((current) =>
                current === industry.slug ? "all" : industry.slug,
              )
            }
            aria-pressed={filter === industry.slug}
            className={cn("wg-chip", filter === industry.slug && "wg-chip-active")}
          >
            <IndustryIcon icon={industry.icon} className="size-4 shrink-0" />
            {industry.label}
          </button>
        ))}
      </div>

      <p className="sr-only" role="status">
        {shown.length === 1
          ? "Showing 1 project."
          : `Showing ${shown.length} projects.`}
      </p>

      {/* ============ the grid ============ */}
      <div
        className="wg-grid mt-5 grid gap-5 sm:grid-cols-2 md:mt-7 lg:grid-cols-3"
        data-collapsed={collapsed || undefined}
      >
        {shown.map((study, index) => (
          /* Keyed by filter too, so changing it re-mounts the cards and
             replays their short entrance. */
          <GalleryCard
            key={`${filter}-${study.slug}`}
            study={study}
            index={index}
            onOpen={openDetail}
          />
        ))}
      </div>

      {/* ============ explore more ============ */}
      {filter === "all" && caseStudies.length > 3 ? (
        <div className="mt-8 flex justify-center">
          {/* `lg`, matching the orange section CTA just below it — the two
              sit vertically adjacent, and a 48px outline next to a 52px
              pill reads as a mistake rather than a hierarchy. */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show Fewer Projects" : "Explore More Projects"}
            <svg
              viewBox="0 0 16 16"
              width="15"
              height="15"
              fill="none"
              aria-hidden="true"
              className={cn(
                "shrink-0 transition-transform duration-[var(--dur-fast)]",
                expanded && "rotate-180",
              )}
            >
              <path
                d="m3.5 6 4.5 4.5L12.5 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      ) : null}

      {/* ============ the internal detail view ============ */}
      {/* Mounted once; content swaps per study. Clicking the backdrop —
          the dialog element itself, outside its padding box — closes. */}
      <dialog
        ref={dialogRef}
        className="wg-dialog"
        aria-labelledby={detail ? "wg-dialog-heading" : undefined}
        onClose={() => setDetail(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDetail();
        }}
      >
        {detail ? (
          <div className="max-h-[inherit] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-accent-ink">
                {detail.industry}
              </span>
              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close project details"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg transition-[color,border-color,background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] hover:scale-105 hover:border-fg/40 hover:bg-fg/[0.06] active:scale-95 motion-reduce:transform-none"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                  <path
                    d="m3.5 3.5 9 9m0-9-9 9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <h3
              id="wg-dialog-heading"
              className="mt-4 font-display text-2xl font-semibold leading-tight text-fg sm:text-3xl"
            >
              {detail.client}
            </h3>
            <p className="mt-1.5 text-[0.8125rem] font-semibold uppercase tracking-wider text-muted">
              {detail.projectType}
              <span aria-hidden="true" className="px-2 text-line">
                ·
              </span>
              <span className="normal-case tracking-normal">{detail.host}</span>
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-line">
              <Image
                src={detail.preview}
                alt={`${detail.client} website homepage`}
                width={1800}
                height={1125}
                sizes="(min-width: 768px) 640px, 92vw"
                className="block h-auto w-full"
              />
            </div>

            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
              {detail.overview}
            </p>

            <div className="mt-6 grid gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fg">
                  What we delivered
                </p>
                <ul className="mt-3 space-y-2">
                  {detail.delivered.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm font-medium text-fg"
                    >
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fg">
                  On the website
                </p>
                <ul className="mt-3 space-y-2">
                  {detail.features.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-snug text-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.4rem] size-1.5 shrink-0 rounded-full bg-accent"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7">
              <Button href="#estimator" size="md" onClick={closeDetail}>
                Discuss a Similar Project
                <Arrow />
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
