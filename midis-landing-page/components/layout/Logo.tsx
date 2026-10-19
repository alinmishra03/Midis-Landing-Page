import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The MIDIS wordmark.
 *
 * Two files, not one recoloured with a CSS filter: `wordmark-on-light` is the
 * charcoal mark and `wordmark-on-dark` is the white one. Both are the brand's
 * own artwork. Intrinsic size is 960x303; the rendered box is set in CSS so
 * the aspect ratio is reserved before the image arrives and the header never
 * shifts.
 */

export function Logo({
  tone = "light",
  className,
}: {
  /** The surface it sits ON: "light" = paper, "dark" = charcoal. */
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Image
      src={tone === "dark" ? "/brand/wordmark-on-dark.png" : "/brand/wordmark-on-light.png"}
      alt="MIDIS"
      width={960}
      height={303}
      priority
      className={cn("h-7 w-auto sm:h-8", className)}
    />
  );
}
