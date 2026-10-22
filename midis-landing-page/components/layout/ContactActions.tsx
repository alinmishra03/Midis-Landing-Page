import { whatsappHref } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";

/**
 * The WhatsApp entry point for the header.
 *
 * THE DESTINATION IS VERIFIED, NOT INVENTED. It comes from content/site.ts:
 * the line MIDIS confirmed is WhatsApp-enabled, never written out here.
 *
 * ONE ACTION ONLY (MIDIS instruction, 2026-10-22): the Call control that
 * used to sit beside WhatsApp was removed from the header — same pass that
 * removed Call and Estimate from the floating dock. `callHref` still lives
 * in content/site.ts for the footer and schema.
 *
 * TWO PRESENTATIONS, ONE SOURCE. `variant="icon"` is the compact circle
 * for the mobile bar; `variant="pill"` is the labelled pill for the desktop
 * header and the mobile menu panel. Both are 44px minimum targets.
 *
 * `size` picks the pill height. `sm` (44px) matches the floating header's
 * other controls — the theme toggle and the consultation CTA — so all three
 * sit on one baseline without the bar having to correct any of them. `md`
 * (48px) is for the mobile menu panel, where the pill sits directly above
 * full-width `lg` buttons and a 44px pill would read as the odd one out.
 *
 * THEME. WhatsApp wears its OWN brand green in both themes — MIDIS's
 * explicit instruction of 2026-10-21 ("recognizable WhatsApp branding",
 * #25D366, hover #1EBE5D, white glyph). The white-on-green pairing is
 * WhatsApp's own button convention; the aria-label and title carry the
 * full name regardless.
 */

/** WhatsApp's published brand colours — the one palette on the page that is
    deliberately not ours (MIDIS instruction, 2026-10-21). */
const WHATSAPP_GREEN = cn(
  "border-transparent bg-[#25D366] text-white",
  "hover:border-transparent hover:bg-[#1EBE5D] hover:text-white",
);

/* One shared interaction language for both presentations. */
const SHARED = cn(
  "group/contact inline-flex items-center justify-center",
  "border transition-[background-color,border-color,color,transform]",
  "duration-[var(--dur-fast)] ease-[var(--ease-out-quart)]",
  "active:translate-y-px",
);

export function ContactActions({
  variant = "pill",
  size = "md",
  className,
}: {
  variant?: "pill" | "icon";
  size?: "sm" | "md";
  className?: string;
}) {
  const icon = variant === "icon";

  /* Icons are always a 44px circle — there is no smaller tap target that
     still passes. Pills take their height from `size`. */
  const shape = icon
    ? "size-11 rounded-full"
    : size === "sm"
      ? "min-h-11 gap-2 rounded-full px-4 text-sm font-semibold"
      : "min-h-12 gap-2 rounded-full px-4 text-[0.9375rem] font-semibold";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message MIDIS on WhatsApp"
        title="Message us on WhatsApp"
        className={cn(SHARED, shape, WHATSAPP_GREEN)}
      >
        <WhatsAppIcon className="transition-transform duration-[var(--dur-fast)] group-hover/contact:scale-110 motion-reduce:transform-none" />
        {icon ? null : <span>WhatsApp</span>}
      </a>
    </div>
  );
}
