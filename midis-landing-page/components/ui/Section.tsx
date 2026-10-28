import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal, RevealText } from "./Reveal";

/**
 * Section shell and header.
 *
 * ONE ALIGNMENT SYSTEM. Every section's content sits inside `container-site`,
 * so the left and right edges agree down the whole page — a heading in the
 * hero, a project row, a service card and the footer all start on the same
 * line at every breakpoint. Nothing opts out.
 *
 * ONE VERTICAL RHYTHM. `--space-section` is the padding above and below every
 * section; `--space-block` is the gap from a section header to the content
 * under it. Both are set once in globals.css. Before this, three sections
 * used ad-hoc `mt-8`/`mt-9`/`mt-10` for the same job, which is exactly the
 * kind of drift that makes a page read as assembled rather than designed.
 *
 * TWO HEADING SIZES, AND THE RULE FOR CHOOSING. A heading that owns its full
 * row gets `lg`; a heading sharing its row with a second column gets `md`,
 * because the same type size in half the width produces a four-word line and
 * a ragged block. The choice is a prop rather than a judgement call made
 * again in each file, so it stays consistent.
 */

type Tone = "paper" | "surface" | "ink";

const tones: Record<Tone, string> = {
  paper: "bg-paper text-fg",
  surface: "bg-surface text-fg",
  ink: "bg-ink text-white on-dark",
};

/**
 * Inert since 2026-10-28. It set how much of a site background photograph
 * showed through each section; the photo and the veils built for it are
 * gone (see "SECTION BACKGROUNDS ON THE HOMEPAGE" in globals.css). Still
 * written as `data-veil`, harmlessly, so call sites need not change.
 */
type Veil = "clean" | "subtle" | "soft" | "rich";

interface SectionProps {
  id?: string;
  tone?: Tone;
  veil?: Veil;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}

export function Section({
  id,
  tone = "paper",
  veil = "subtle",
  className,
  children,
  labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      data-veil={veil}
      className={cn(tones[tone], "relative py-[var(--space-section)]", className)}
    >
      {children}
    </section>
  );
}

/**
 * The small uppercase label above a section heading.
 *
 * Extracted because the same seven lines of markup — rule, tracking, the
 * accent colour that differs on dark — were repeated in five files, and had
 * already drifted between them.
 *
 * COLOUR IS NOT OPTIONAL HERE. On a light surface this must be
 * `--color-accent-ink` (#AA5A0A, 4.72:1). The brand orange is 2.55:1 on
 * paper and fails as text at any size.
 */
export function Eyebrow({
  children,
  tone = "paper",
  align = "left",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "eyebrow",
        align === "center" && "justify-center",
        tone === "ink" ? "text-accent" : "text-accent-ink",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block h-px w-6 bg-current opacity-60"
      />
      {children}
    </p>
  );
}

/** The gap from a section header to whatever follows it. One value, one name. */
export const BLOCK_GAP = "mt-[var(--space-block)]";

interface SectionHeaderProps {
  eyebrow?: string;
  heading: ReactNode;
  headingId?: string;
  sub?: ReactNode;
  as?: "h1" | "h2";
  tone?: Tone;
  align?: "left" | "center";
  className?: string;
  aside?: ReactNode;
  /** `lg` for a full-width header, `md` when it shares its row. */
  size?: "lg" | "md";
  /** Omits the outer container, for a header already inside one. */
  bare?: boolean;
}

export function SectionHeader({
  eyebrow,
  heading,
  headingId,
  sub,
  as: Heading = "h2",
  tone = "paper",
  align = "left",
  className,
  aside,
  size = "lg",
  bare = false,
}: SectionHeaderProps) {
  const dark = tone === "ink";

  const content = (
    <div
      className={cn(
        "flex flex-col gap-6",
        /* The aside only earns its own column once there is room for one;
           below that it stacks, keeping the heading full-width on a phone
           rather than squeezed into half the line length. */
        aside && "lg:flex-row lg:items-end lg:justify-between lg:gap-12",
      )}
    >
      <div className={cn(align === "center" && "mx-auto", "max-w-3xl")}>
        {eyebrow ? (
          <Reveal>
            <Eyebrow tone={tone} align={align} className="mb-5">
              {eyebrow}
            </Eyebrow>
          </Reveal>
        ) : null}

        {/*
          The heading reveals line by line. `RevealText` measures where the
          browser actually broke the text and animates those real lines, so
          the effect follows the wrap at every breakpoint instead of being
          baked in at authoring time.
        */}
        <RevealText
          as={Heading}
          id={headingId}
          delay={eyebrow ? 60 : 0}
          className={cn(
            Heading === "h1"
              ? "text-[length:var(--text-display-xl)]"
              : size === "lg"
                ? "text-[length:var(--text-display-lg)]"
                : "text-[length:var(--text-display-md)]",
            "leading-[1.06]",
          )}
        >
          {heading}
        </RevealText>

        {sub ? (
          <Reveal delay={160}>
            <p
              className={cn(
                "mt-3 max-w-2xl text-base leading-relaxed sm:mt-4 sm:text-lg",
                align === "center" && "mx-auto",
                dark ? "text-muted-dark" : "text-muted",
              )}
            >
              {sub}
            </p>
          </Reveal>
        ) : null}
      </div>

      {aside ? (
        <Reveal delay={220} className="shrink-0">
          {aside}
        </Reveal>
      ) : null}
    </div>
  );

  if (bare) return <div className={className}>{content}</div>;

  return (
    <div
      className={cn("container-site", align === "center" && "text-center", className)}
    >
      {content}
    </div>
  );
}
