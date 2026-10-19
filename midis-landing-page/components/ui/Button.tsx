import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page's one button.
 *
 * COLOUR RULE, AND WHY IT IS NOT NEGOTIABLE. The MIDIS orange (#EF8716) is
 * 2.55:1 against white — far below the 4.5:1 floor. So the primary button is
 * orange with CHARCOAL text (7.26:1), never white text. The same reason is
 * why there is no "orange text on a light background" variant here: that job
 * belongs to --color-accent-ink (#AA5A0A), which is AA-safe.
 */

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "md" | "lg";

/*
 * One interaction definition for every button on the page.
 *
 * `transition-[...]` names the properties explicitly rather than using
 * `transition-all`, which would also animate layout properties and make a
 * hover cost a reflow. Press feedback is a 1px drop plus a 0.98 scale at the
 * fast duration, so it reads as mechanical rather than springy — and both
 * are compositor-only.
 *
 * NO `whitespace-nowrap` HERE, DELIBERATELY. It was in this class list and
 * it broke the page at 320px: an unwrappable label gives the button a
 * min-content width equal to the whole label, and because a grid track is
 * never sized below its items' min-content, "Get My Free Website Audit"
 * forced the audit form's column to 328px inside a 288px container. The
 * page then scrolled horizontally on the narrowest phones. Measured with
 * Playwright by hiding subtrees until the track collapsed. Letting a long
 * label wrap is the correct behaviour; `text-center` keeps a wrapped label
 * tidy.
 */
const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[background-color,color,border-color,transform,box-shadow] " +
  "duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] " +
  "active:translate-y-px active:scale-[0.98] motion-reduce:active:scale-100 " +
  /* 44px minimum tap target on every variant, at every size. */
  "min-h-11 text-center";

const variants: Record<Variant, string> = {
  /* Charcoal text on orange — the only accessible way round. */
  primary:
    "bg-accent text-ink hover:bg-accent-hover shadow-[0_1px_2px_rgba(20,21,24,0.14)] " +
    "hover:shadow-[0_8px_20px_-8px_rgba(239,135,22,0.75)]",
  /* On paper: a quiet outline that does not compete with the primary. */
  secondary:
    "border border-ink/20 bg-transparent text-ink hover:border-ink/55 hover:bg-ink/[0.04]",
  ghost: "text-ink hover:text-accent-ink bg-transparent",
  /* On a dark panel, where a white outline is the quiet option. */
  onDark:
    "border border-white/25 bg-transparent text-white hover:border-white/70 hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-[0.9375rem]",
  lg: "px-7 py-3.5 text-base",
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
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;

    /*
     * An in-page anchor or an external URL is a plain <a>: next/link's
     * prefetch and client navigation buy nothing for either, and for "#id"
     * it actively interferes with the browser's native scroll handling.
     */
    const isPlain = href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
    const isExternal = href.startsWith("http");

    if (isPlain) {
      return (
        <a
          href={href}
          className={classes}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
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
 * The arrow that trails a CTA.
 *
 * `aria-hidden` because it is punctuation, not content — a screen reader
 * announcing "right arrow" after every button label is noise. It nudges on
 * hover of the button, not of itself.
 */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className={cn(
        "transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] group-hover/btn:translate-x-1",
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
