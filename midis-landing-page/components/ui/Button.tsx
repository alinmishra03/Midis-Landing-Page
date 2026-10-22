import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page's one button.
 *
 * EVERY CTA ON THE SITE RENDERS THROUGH THIS. Height, radius, padding, type,
 * icon gap, transition, disabled and focus treatment are defined once here;
 * nothing overrides them at a call site. Groups of buttons go through
 * `ButtonGroup` below rather than each section hand-rolling its own flex row.
 *
 * WHY EVERY VARIANT CARRIES A BORDER. The border is part of an auto height,
 * so a bordered button was 2px taller than an unbordered one — measured at
 * 54px against 52px. Side by side under `items-center` that also pushed
 * their tops out of line. Giving the base a TRANSPARENT border and letting
 * variants change only its colour makes every variant exactly the same
 * height. That one line is most of what the "heights vary: 44, 45, 52, 54,
 * 76" audit result came down to.
 *
 * HEIGHT IS A FLOOR, NOT A FIXED VALUE. `min-h` rather than `h`, so a long
 * label on a narrow phone wraps and grows the button instead of spilling out
 * of it. Inside a `ButtonGroup` the siblings stretch to match, so a wrapped
 * label still cannot produce a ragged row.
 *
 * COLOUR RULE, AND WHY IT IS NOT NEGOTIABLE. The MIDIS orange is 2.55:1 on
 * white, so the primary button is orange with CHARCOAL text
 * (`--color-on-accent`, 7.26:1), never white — in either theme.
 */

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

const base = cn(
  "group/btn inline-flex items-center justify-center gap-2 rounded-full",
  "text-center font-semibold leading-snug",
  /* Load-bearing: see the note above. */
  "border border-transparent",
  /* Named properties, never `transition-all` — that would animate layout
     properties too and make every hover cost a reflow. */
  "transition-[background-color,color,border-color,transform,box-shadow]",
  "duration-[var(--dur-fast)] ease-[var(--ease-out-quart)]",
  "active:translate-y-px active:scale-[0.98] motion-reduce:active:scale-100",
  /* One disabled treatment for every variant, so the forms stop defining
     their own. Covers a real <button disabled> and an aria-disabled link. */
  "disabled:pointer-events-none disabled:opacity-60",
  "aria-disabled:pointer-events-none aria-disabled:opacity-60",
);

const variants: Record<Variant, string> = {
  primary: cn(
    "bg-accent text-on-accent hover:bg-accent-hover",
    "shadow-[0_1px_2px_rgba(20,21,24,0.14)]",
    "hover:shadow-[0_8px_20px_-8px_rgba(239,135,22,0.75)]",
    /* The one variant that lifts on hover — it is the page's conversion
       action, and the raised shadow above already implies the depth. A
       transform, so no layout shifts; the press state below still wins
       while the pointer is down. */
    "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
  ),
  /* On a page surface: a quiet outline that does not compete with the
     primary. Driven by `fg`, so it reads in both themes. */
  secondary: cn(
    "border-fg/25 bg-transparent text-fg",
    "hover:border-fg/55 hover:bg-fg/[0.06]",
  ),
  ghost: "bg-transparent text-fg hover:text-accent-ink",
  /* On a dark band, where a light outline is the quiet option. */
  onDark: cn(
    "border-white/30 bg-transparent text-white",
    "hover:border-white/70 hover:bg-white/10",
  ),
};

/**
 * Three sizes, every one of them clearing the 44px tap-target minimum.
 *
 * `lg` (52px) is the page CTA. `md` (48px) is for dense chrome. `sm` (44px)
 * exists for the floating header and nothing else: that bar is 64px tall at
 * the top of the page and 56px once scrolled, so a 48px control leaves four
 * pixels of breathing room at the bottom of the travel and the pill stops
 * reading as floating. 44px is the WCAG 2.5.8 floor, so this is as small as
 * a control on this site is allowed to get.
 *
 * These are the only three button heights on the site.
 */
const sizes: Record<Size, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 py-2.5 text-[0.9375rem]",
  lg: "min-h-[3.25rem] px-7 py-3 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: never };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "lg", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;

    /*
     * An in-page anchor or an external URL is a plain <a>: next/link's
     * prefetch and client navigation buy nothing for either, and for "#id"
     * it actively interferes with the browser's native scroll handling.
     */
    const isPlain =
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:");
    const isExternal = href.startsWith("http");

    if (isPlain) {
      return (
        <a
          href={href}
          className={classes}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...(rest as ComponentProps<"a">)}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/**
 * A row of related CTAs.
 *
 * THE ONE PLACE CTA LAYOUT IS DECIDED. Every section used to hand-roll
 * `flex flex-col gap-3 sm:flex-row sm:items-center`, and the small
 * differences between those copies are exactly what produced mismatched
 * widths and edges: on a phone the hero's primary measured 261px against a
 * secondary stretched to the full column.
 *
 * On a phone the children stack and stretch, so related buttons share an
 * exact width and both edges. From `sm` they sit in a row at natural width,
 * and `items-stretch` keeps their tops and bottoms in line even when one
 * wraps to two lines.
 *
 * `[&>*]:w-full` reaches any DIRECT child — a Button, or a wrapper around
 * one — so a group never depends on each call site remembering to pass a
 * width class.
 */
export function ButtonGroup({
  children,
  align = "start",
  className,
  style,
}: {
  children: ReactNode;
  align?: "start" | "center" | "between";
  className?: string;
  /** For the hero's CSS entrance delay — it animates the group, not each
      button, so the pair arrives together. */
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "flex flex-col items-stretch gap-3",
        "sm:flex-row sm:items-stretch sm:gap-4",
        "[&>*]:w-full sm:[&>*]:w-auto",
        /*
         * WRAP RATHER THAN SQUASH.
         *
         * In a row, flex children shrink before the container overflows — so
         * in the hero's narrowed text column at 1024px both buttons were
         * compressed until their labels broke onto a second line and the
         * pair measured 74px instead of 52px. `shrink-0` keeps each button
         * at its natural width and `flex-wrap` lets the row break instead,
         * which is the better failure: a button on its own line still looks
         * deliberate, a squashed two-line label does not.
         */
        "sm:flex-wrap sm:[&>*]:shrink-0",
        align === "center" && "sm:justify-center",
        align === "between" && "sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The arrow that trails a CTA.
 *
 * `aria-hidden` because it is punctuation, not content — a screen reader
 * announcing "right arrow" after every button label is noise. `shrink-0` so
 * a wrapping label never squashes it. It nudges on hover of the button, not
 * of itself.
 *
 * `flip` is the back-navigation form: same glyph rotated to point left,
 * nudging LEFT on hover — the one arrow component serves both directions,
 * so no call site draws its own (or types a bare "←", which neither aligns
 * with the glyph set nor animates).
 */
export function Arrow({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 transition-transform duration-[var(--dur-fast)]",
        "ease-[var(--ease-out-quart)]",
        flip
          ? "rotate-180 group-hover/btn:-translate-x-1"
          : "group-hover/btn:translate-x-1",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    >
      <path
        d="M2.5 8h11m0 0L9 3.5M13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
