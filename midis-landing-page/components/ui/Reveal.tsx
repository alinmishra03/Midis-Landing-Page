"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal primitives.
 *
 * The motion itself lives in globals.css, keyed off `data-reveal`. These
 * components only flip an attribute when the element enters the viewport,
 * then stop observing — an entrance, not something that replays on every
 * scroll past.
 *
 * THE CONTENT CAN NEVER BE TRAPPED INVISIBLE. Four guards, because a blank
 * section is a far worse failure than a missing animation:
 *
 *   1. State starts at "shown", so the server-rendered HTML is visible and a
 *      hydration that never happens leaves the page readable.
 *   2. `prefers-reduced-motion` is checked in JS as well as CSS, so a
 *      reduced-motion visitor never enters the hidden state at all.
 *   3. No `IntersectionObserver` means show immediately.
 *   4. A `<noscript>` block in the layout pins everything visible.
 *
 * NOT USED IN THE HERO. The hero animates from CSS alone, so its headline —
 * the LCP element — never waits on hydration to become visible.
 *
 * PERFORMANCE. Only `opacity`, `transform` and `clip-path` are animated:
 * all compositor properties, none of which trigger layout. There is no
 * scroll event handler anywhere in this file.
 */

/** Shared: decides whether this element should animate at all. */
function useRevealState(
  ref: React.RefObject<HTMLElement | null>,
  onShow?: () => void,
) {
  const [state, setState] = useState<"shown" | "pending">("shown");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    /*
     * Already in view on load — a deep link, or a restored scroll position?
     * Then there is no entrance to play, and starting one mid-scroll would
     * look worse than not animating.
     */
    if (element.getBoundingClientRect().top < window.innerHeight * 0.88) return;

    setState("pending");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            onShow?.();
            observer.disconnect();
          }
        }
      },
      /* Fires slightly before the top edge arrives, so the motion resolves
         as the element settles into view rather than after it has landed. */
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/* ========================================================================== */

/**
 * Entrance identities.
 *
 * Each major section uses a different one so the page does not read as a
 * single fade-up repeated ten times — but they all share the same easing and
 * duration tokens, so they belong to one motion system rather than feeling
 * like ten unrelated effects. The transforms live in globals.css.
 */
type Variant =
  | "up"
  | "fade"
  | "scale"
  | "clip"
  /** Logos: brighten and settle rather than travel. */
  | "lift"
  /** Editorial rows: enter from the side the content sits on. */
  | "side-left"
  | "side-right"
  /** Process steps: rise with a slight rotation, like cards being dealt. */
  | "deal"
  /**
   * Per-line mask reveal. `RevealText` sets this itself after measuring a
   * heading; it is also available directly for a heading whose lines are
   * authored by hand — the final CTA sets its own two lines so the second
   * can carry the accent treatment, which the automatic splitter declines
   * to touch because it contains nested markup.
   *
   * Expects children shaped as `.reveal-line > .reveal-line-inner`.
   */
  | "lines";

interface RevealProps {
  children: ReactNode;
  /** Stagger in milliseconds, applied via the --reveal-delay custom prop. */
  delay?: number;
  as?: ElementType;
  className?: string;
  /** Needed when the revealed element is itself an `aria-labelledby` target. */
  id?: string;
  /**
   * `up` fade and rise — the default, for text and most blocks.
   * `fade` opacity only, for things where movement would be noise.
   * `scale` a 1.5% settle, for cards.
   * `clip` an image wipe from the bottom edge, for photographs.
   */
  variant?: Variant;
}

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  variant = "up",
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const state = useRevealState(ref);

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={state}
      data-reveal-variant={variant}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined
      }
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

/* ========================================================================== */

/**
 * A heading that reveals line by line.
 *
 * HOW THE LINES ARE FOUND. The text is split into words, each word measured,
 * and words sharing an `offsetTop` grouped into a line. That reads the
 * wrapping the browser actually produced, so the effect follows the real
 * line breaks at every viewport width instead of breaks guessed at authoring
 * time. It re-splits on resize for the same reason.
 *
 * WHY IT CANNOT CAUSE LAYOUT SHIFT. The rebuilt lines are block-level spans
 * containing exactly the words that were already on that line, so the
 * wrapping is reproduced rather than recalculated, and the heading occupies
 * precisely the height it did before. Measurement waits on
 * `document.fonts.ready`, because splitting against a fallback font would
 * measure line breaks that stop existing the moment the real font arrives.
 *
 * WHY IT IS SAFE FOR SEO AND SCREEN READERS. The server renders the heading
 * as plain text — the split happens on the client, after paint, and only
 * ever wraps the existing words in spans. No text is added, removed or
 * reordered, so a crawler sees the full heading in the HTML and a screen
 * reader reads one continuous string.
 *
 * WHEN IT DECLINES TO SPLIT. Only a heading whose content is a single text
 * node is split. Anything with nested markup — the hero's accented word, a
 * link inside a heading — would lose those elements in the rebuild, so it
 * falls back to revealing as one block.
 */
export function RevealText({
  children,
  as: Tag = "h2",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [split, setSplit] = useState(false);
  const state = useRevealState(ref);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Only a single text node is safe to rebuild. */
    if (element.childNodes.length !== 1 || element.firstChild?.nodeType !== 3) {
      return;
    }

    const original = element.textContent ?? "";
    if (!original.trim()) return;

    let cancelled = false;

    function build() {
      const el = ref.current;
      if (!el || cancelled) return;

      const words = original.trim().split(/\s+/);

      /* Pass 1 — measure where the browser breaks the text. */
      el.textContent = "";
      const probes: HTMLSpanElement[] = [];
      words.forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        el.appendChild(span);
        probes.push(span);
        if (index < words.length - 1) el.appendChild(document.createTextNode(" "));
      });

      const lines: string[][] = [];
      let lastTop: number | null = null;
      probes.forEach((span, index) => {
        const top = span.offsetTop;
        if (lastTop === null || top !== lastTop) {
          lines.push([words[index]]);
          lastTop = top;
        } else {
          lines[lines.length - 1].push(words[index]);
        }
      });

      /* Pass 2 — rebuild as one masked span per real line. */
      el.textContent = "";
      lines.forEach((line, index) => {
        /*
         * A SPACE BETWEEN LINES IS NOT OPTIONAL.
         *
         * Without it the heading's `textContent` concatenates the lines with
         * no separator — "Our Work" + "Speaks for Itself" became "Our
         * WorkSpeaks for Itself" on every viewport where the heading wrapped.
         * That is what a screen reader announces, what a copy-paste yields,
         * and what a crawler reads from the rendered DOM.
         *
         * `.reveal-line` is `display: block`, so this whitespace text node
         * collapses and never renders — it exists purely so the accessible
         * text survives the split.
         */
        if (index > 0) el.appendChild(document.createTextNode(" "));

        const outer = document.createElement("span");
        outer.className = "reveal-line";
        const inner = document.createElement("span");
        inner.className = "reveal-line-inner";
        inner.style.setProperty("--line-delay", `${index * 90}ms`);
        inner.textContent = line.join(" ");
        outer.appendChild(inner);
        el.appendChild(outer);
      });

      if (!cancelled) setSplit(true);
    }

    /* Measuring before the webfont lands would record line breaks that stop
       existing a moment later. */
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(build).catch(build);
    else build();

    /* Re-split on resize — the whole point is to follow the real wrap. */
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const el = ref.current;
        if (el) el.textContent = original;
        build();
      }, 180);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={state}
      data-reveal-variant={split ? "lines" : "up"}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined
      }
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

/* ========================================================================== */

/**
 * Staggers its children without each call site counting delays by hand.
 *
 * Takes the children as an array and wraps each in a `Reveal` whose delay is
 * its index times `step`, which is what every "cards animate in sequence"
 * block was doing manually and inconsistently.
 */
export function RevealGroup({
  children,
  step = 70,
  variant = "up",
  as: Tag = "div",
  itemAs = "div",
  className,
  itemClassName,
}: {
  children: ReactNode[];
  step?: number;
  variant?: Variant;
  as?: ElementType;
  itemAs?: ElementType;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <Tag className={className}>
      {children.map((child, index) => (
        <Reveal
          key={index}
          as={itemAs}
          variant={variant}
          delay={index * step}
          className={itemClassName}
        >
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
