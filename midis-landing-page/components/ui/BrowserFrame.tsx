import Image from "next/image";
import { cn } from "@/lib/utils";
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from "@/content/work";

/**
 * Browser chrome around a project screenshot.
 *
 * The chrome is drawn rather than photographed, so it stays crisp at any
 * size and costs nothing to download. It carries the project's real host in
 * the address bar — the URL in the frame is the site you actually land on,
 * which is the point of showing it.
 *
 * `aria-hidden` on the chrome itself: the traffic-light dots and the address
 * bar are decoration repeating information the card already gives in text.
 */

interface BrowserFrameProps {
  src: string;
  /**
   * Describes the screenshot for anyone who cannot see it. Required — these
   * are the page's primary evidence, not decoration, so they do not get an
   * empty alt.
   */
  alt: string;
  host: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  /** Scales the chrome down for the small stacked previews in the hero. */
  compact?: boolean;
  /**
   * Zooms the screenshot slightly when an ancestor marked `group` is
   * hovered. The transform origin is the TOP edge, so the zoom reads as
   * leaning into the page rather than drifting the header off-screen.
   */
  zoomOnHover?: boolean;
  /**
   * Parallaxes the screenshot inside its frame as the frame crosses the
   * viewport, driven by the CSS scroll timeline — no listener, no JS. The
   * image is pre-scaled so the drift never exposes an edge.
   */
  drift?: boolean;
}

export function BrowserFrame({
  src,
  alt,
  host,
  priority = false,
  sizes,
  className,
  compact = false,
  zoomOnHover = false,
  drift = false,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-white ring-1 ring-ink/10",
        "shadow-[0_18px_40px_-20px_rgba(20,21,24,0.45)]",
        className,
      )}
    >
      {/* ---- chrome ---- */}
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center gap-2 border-b border-line bg-[#f1f1ee]",
          compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5",
        )}
      >
        <div className="flex gap-1.5">
          {["#e5685c", "#e6b14c", "#5ec16a"].map((colour) => (
            <span
              key={colour}
              style={{ backgroundColor: colour }}
              className={cn(
                "block rounded-full",
                compact ? "size-1.5" : "size-2.5",
              )}
            />
          ))}
        </div>

        <div
          className={cn(
            "ml-1 flex-1 truncate rounded-full bg-white/80 text-center font-medium text-muted",
            compact
              ? "px-2 py-0.5 text-[0.5rem]"
              : "px-3 py-1 text-[0.6875rem]",
          )}
        >
          {host}
        </div>
      </div>

      {/* ---- screenshot ---- */}
      {/* The viewport the screenshot drifts inside. Without this clip the
          parallax would push the image past the frame's rounded corner. */}
      <div className={cn(drift && "overflow-hidden")}>
        <Image
          src={src}
          alt={alt}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          sizes={sizes}
          priority={priority}
          /* Everything below the hero decodes lazily; the hero passes priority. */
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "block h-auto w-full origin-top",
            drift && "media-drift",
            zoomOnHover &&
              "transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none",
          )}
        />
      </div>
    </div>
  );
}
