import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The MIDIS wordmark.
 *
 * Two files, not one recoloured with a CSS filter: `wordmark-on-light` is
 * the charcoal mark and `wordmark-on-dark` is the white one. Both are the
 * brand's own artwork. Intrinsic size is 960x303; the rendered box is set in
 * CSS so the aspect ratio is reserved before the image arrives and the
 * header never shifts.
 *
 * `tone="auto"` RENDERS BOTH AND LETS CSS CHOOSE. The alternative — reading
 * the theme in JavaScript and picking one — cannot work here: the server has
 * no idea which theme the visitor will get, so the markup would be wrong on
 * first paint and React would report a hydration mismatch. Showing and
 * hiding with the same media query and attribute selector the rest of the
 * theme uses means the correct mark is painted immediately, before any
 * script runs.
 *
 * The hidden copy is `aria-hidden` and the visible one carries the alt text,
 * so the wordmark is announced once rather than twice.
 */

export function Logo({
  tone = "auto",
  className,
}: {
  /**
   * `auto` follows the theme — use it in the header and anywhere on a page
   * surface. `light` and `dark` are for fixed grounds: a dark band keeps the
   * white mark whatever the theme is doing.
   */
  tone?: "light" | "dark" | "auto";
  className?: string;
}) {
  const box = cn("h-7 w-auto sm:h-8", className);

  if (tone !== "auto") {
    return (
      <Image
        src={tone === "dark" ? "/brand/wordmark-on-dark.png" : "/brand/wordmark-on-light.png"}
        alt="MIDIS"
        width={960}
        height={303}
        priority
        className={box}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/wordmark-on-light.png"
        alt="MIDIS"
        width={960}
        height={303}
        priority
        className={cn(box, "logo-on-light")}
      />
      <Image
        src="/brand/wordmark-on-dark.png"
        alt=""
        aria-hidden="true"
        width={960}
        height={303}
        priority
        className={cn(box, "logo-on-dark")}
      />
    </>
  );
}
