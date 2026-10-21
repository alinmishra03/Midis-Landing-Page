import { callHref, primaryPhone, whatsappHref } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";

/**
 * WhatsApp and Call entry points for the header.
 *
 * BOTH DESTINATIONS ARE VERIFIED, NOT INVENTED. They come from
 * content/site.ts: the WhatsApp link uses the line MIDIS confirmed is
 * WhatsApp-enabled, and the Call link uses `primaryPhone`, which is read
 * from the published list rather than written out again. If that list were
 * ever emptied, `callHref` is `null` and the Call control simply does not
 * render — a dialler that opens on nothing is worse than no button.
 *
 * TWO PRESENTATIONS, ONE SOURCE. `variant="icon"` is the compact circular
 * pair for the mobile bar; `variant="pill"` is the labelled pair for the
 * desktop header and the mobile menu panel. Both are 44px minimum targets.
 *
 * `size` picks the pill height. `sm` (44px) matches the floating header's
 * other controls — the theme toggle and the consultation CTA — so all three
 * sit on one baseline without the bar having to correct any of them. `md`
 * (48px) is for the mobile menu panel, where the pills sit directly above
 * full-width `lg` buttons and a 44px pill would read as the odd one out.
 *
 * THEME. The Call control stays on semantic tokens. WhatsApp wears its OWN
 * brand green in both themes — MIDIS's explicit instruction of 2026-10-21
 * ("recognizable WhatsApp branding", #25D366, hover #1EBE5D, white glyph),
 * which supersedes the earlier quiet-outline treatment. The white-on-green
 * pairing is WhatsApp's own button convention; the aria-label and title
 * carry the full name regardless.
 */

/** WhatsApp's published brand colours — the one palette on the page that is
    deliberately not ours (MIDIS instruction, 2026-10-21). */
const WHATSAPP_GREEN = cn(
  "border-transparent bg-[#25D366] text-white",
  "hover:border-transparent hover:bg-[#1EBE5D] hover:text-white",
);

/** Call matches the floating dock's Call button (MIDIS follow-up,
    2026-10-21): charcoal fill, white handset, MIDIS-orange hover accent.
    The faint white hairline is what keeps the circle legible on the dark
    theme's ground, same as the dock. */
const CALL_DARK = cn(
  "border-white/15 bg-ink text-white",
  "hover:border-accent/60 hover:bg-ink hover:text-accent",
);

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-[18px] shrink-0", className)}
    >
      <path
        d="M6.3 3.5h2.4l1.5 3.7-1.8 1.3a11.3 11.3 0 0 0 5.1 5.1l1.3-1.8 3.7 1.5v2.4a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 4.3 5.7a2 2 0 0 1 2-2.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

      {/* Rendered only when a verified number exists. */}
      {callHref && primaryPhone ? (
        <a
          href={callHref}
          aria-label={`Call MIDIS on ${primaryPhone.display}`}
          title={`Call us — ${primaryPhone.display}`}
          className={cn(SHARED, shape, CALL_DARK)}
        >
          <PhoneIcon className="transition-transform duration-[var(--dur-fast)] group-hover/contact:-rotate-12 motion-reduce:transform-none" />
          {icon ? null : <span>Call Us</span>}
        </a>
      ) : null}
    </div>
  );
}
