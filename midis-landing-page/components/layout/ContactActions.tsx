import { callHref, primaryPhone, whatsappHref } from "@/content/site";
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
 * THEME. Colours are the semantic tokens, so these read correctly in both
 * themes without a conditional: WhatsApp keeps a quiet outline rather than
 * its own brand green, which would be the one off-palette colour on the
 * page and would fight the MIDIS orange two elements away.
 */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-[18px] shrink-0", className)}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.25 8.25-8.25Zm-2.3 4.1c-.17 0-.45.07-.69.33-.23.26-.9.88-.9 2.15 0 1.27.92 2.49 1.05 2.66.13.18 1.79 2.73 4.34 3.83.6.26 1.08.42 1.45.53.61.2 1.16.17 1.6.1.49-.07 1.5-.61 1.72-1.21.21-.6.21-1.1.15-1.21-.06-.1-.23-.17-.49-.29-.26-.13-1.5-.74-1.74-.83-.23-.08-.4-.12-.57.13-.17.26-.65.83-.8 1-.14.18-.29.2-.55.07-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.28-1.52-1.42-1.78-.15-.26-.02-.4.11-.52.12-.12.26-.3.39-.46.13-.15.17-.26.26-.44.08-.17.04-.33-.02-.46-.07-.13-.57-1.38-.79-1.89-.2-.49-.4-.42-.55-.43h-.49Z" />
    </svg>
  );
}

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

  const quiet = cn(
    "border-fg/20 bg-transparent text-fg",
    "hover:border-accent/60 hover:bg-accent-soft hover:text-accent-ink",
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message MIDIS on WhatsApp"
        title="Message us on WhatsApp"
        className={cn(SHARED, shape, quiet)}
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
          className={cn(SHARED, shape, quiet)}
        >
          <PhoneIcon className="transition-transform duration-[var(--dur-fast)] group-hover/contact:-rotate-12 motion-reduce:transform-none" />
          {icon ? null : <span>Call Us</span>}
        </a>
      ) : null}
    </div>
  );
}
