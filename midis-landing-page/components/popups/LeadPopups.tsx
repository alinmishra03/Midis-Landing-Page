"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Eyebrow } from "@/components/ui/Section";
import { Arrow, Button } from "@/components/ui/Button";
import { FieldError, Honeypot, SelectField, TextField } from "@/components/forms/Fields";
import { PROJECT_TYPES } from "@/content/forms";
import { popupSchema } from "@/lib/enquiry";
import {
  markLeadSubmitted,
  readPopupState,
  updatePopupState,
} from "@/lib/popups";
import { cn } from "@/lib/utils";

/**
 * THE AUTOMATIC LEAD POPUP (MIDIS brief, 2026-10-23 — replaces the
 * three-trigger system of 2026-10-20, whose welcome popup opened 2.6s after
 * load and interrupted the first look at the page).
 *
 * ONE automatic popup, opened only once BOTH are true:
 *   - the visitor has spent 20 seconds of ACTIVE browsing — the clock pauses
 *     while the tab is hidden and is banked in sessionStorage, so a refresh
 *     or a trip to another page never restarts it; and
 *   - the visitor has genuinely scrolled: a wheel, touch, keyboard or
 *     scrollbar scroll. A restored scroll position, an anchor jump or a
 *     layout shift does not count.
 *
 * And never when:
 *   - it already opened this session (closed, submitted or ignored alike);
 *   - a lead was submitted this session, here or through the estimator;
 *   - the visitor reached for a form themselves — an estimator CTA, the
 *     estimator's own fields, a WhatsApp / email / phone link;
 *   - the visitor is typing in a field, or another modal (the work
 *     gallery's detail dialog, the mobile menu) is open. A blocked moment
 *     is retried on the visitor's next scroll — never on a loop.
 *
 * THE EXIT POPUP (MIDIS request, 2026-10-23) is the second automatic
 * dialog: "Before you go". No browser lets a page show its own content as
 * the tab actually closes, so this is EXIT INTENT, the standard stand-in:
 * the pointer leaving the page through the TOP edge, toward the tabs, the
 * address bar and the close button. Desktop (fine pointer) only, because
 * touch browsers expose no honest exit signal and the old brief rules out
 * back-button tricks. It opens at most once per session, never in the
 * first 10 seconds (a stray swipe at the toolbar is not leaving), never
 * after a lead was submitted, never over another dialog, never while the
 * visitor is typing. The two popups are independent: each opens once per
 * session on its own rules, whichever comes first (MIDIS, 2026-10-23).
 *
 * MANUAL CTAs are untouched: every "Get a Project Estimate" button is a
 * plain link to #estimator and works instantly. This controller only
 * listens to them so it can stand down.
 *
 * Mounted once in the root layout, so client-side navigation never spawns a
 * second timer or listener set. It only OPENS on the landing page — the
 * audit form and the thank-you pages are lead flows of their own — and the
 * clock only runs there.
 *
 * Every popup is dismissible: close button, Escape, backdrop click, and an
 * explicit secondary action. The form posts kind:"popup" through the same
 * validated /api/enquiry route as every other lead.
 */

const ACTIVE_DELAY_MS = 20_000;
/** The exit popup ignores the toolbar for this long after landing. */
const EXIT_MIN_DWELL_MS = 10_000;
/** Movement smaller than this is jitter, not a scroll. */
const SCROLL_MIN_PX = 24;
/** How long after a wheel / touch / key event a scroll still counts as the
    visitor's own. */
const INTENT_WINDOW_MS = 1_000;
const SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
]);
/** Routes the popup may open on. */
const AUTO_ROUTES = new Set(["/"]);
/** Links that mean "the visitor is already on their way to us". */
const ENGAGED_HREF = /#estimator$|^mailto:|^tel:|wa\.me\/|whatsapp/i;

type PopupKind = "timed" | "exit";

const COPY = {
  timed: {
    eyebrow: "Let’s build something better",
    heading: "Have a Website Project in Mind?",
    description:
      "Tell us what you’re planning, and the MIDIS team will help you explore the right solution for your business.",
    primary: "Get a Free Consultation",
    secondary: "Maybe Later",
    source: "initial_popup",
  },
  /* The exit copy from the client's popup brief of 2026-10-20. */
  exit: {
    eyebrow: "Before you go",
    heading: "Let’s Talk About Your Next Big Idea.",
    description:
      "Have a project in mind? Tell us a little about it, and our team can help you explore the next steps.",
    primary: "Get a Free Consultation",
    secondary: "No Thanks",
    source: "exit_popup",
  },
} as const;

/** True while the visitor is in a form field — the popup must wait. */
function isTyping(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  );
}

/** True while another modal surface owns the screen. The header's mobile
    menu and the gallery dialog both lock body scroll while open. */
function otherModalOpen(): boolean {
  return (
    document.querySelector("dialog[open], [aria-modal='true']") !== null ||
    document.body.style.overflow === "hidden"
  );
}

export function LeadPopups() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PopupKind>("timed");
  const [closing, setClosing] = useState(false);
  const [sent, setSent] = useState(false);

  const pathname = usePathname();
  const autoRoute = AUTO_ROUTES.has(pathname);

  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const show = useCallback((which: PopupKind) => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setClosing(false);
    setSent(false);
    setKind(which);
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    setClosing(true);
    /* Let the exit transition play, then unmount and restore focus. */
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      restoreFocusRef.current?.focus?.({ preventScroll: true });
    }, 180);
  }, []);

  /* ---------------- the automatic trigger ---------------- */

  useEffect(() => {
    if (!autoRoute) return;
    const initial = readPopupState();
    if (initial.shown || initial.submitted || initial.engaged) return;

    /* ONE timeout at a time, scheduled for exactly the active time still
       owed; banked into storage whenever it pauses. performance.now() is
       monotonic, so a clock change cannot skip the wait. */
    let activeMs = initial.activeMs;
    let scrolled = initial.scrolled;
    let resumedAt: number | null = null;
    let timer: number | undefined;
    let frame = 0;
    let stopped = false;

    /* Scroll intent: a scroll only counts when it follows the visitor's own
       wheel / touch / key input, or happens while a pointer is held (the
       scrollbar). The baseline is the position when that input began, so a
       restored position or programmatic jump is never mistaken for one. */
    let intentAt = -Infinity;
    let pointerHeld = false;
    let baselineY: number | null = null;

    const elapsed = () =>
      activeMs + (resumedAt === null ? 0 : performance.now() - resumedAt);

    const pause = () => {
      if (resumedAt !== null) {
        activeMs = Math.min(elapsed(), ACTIVE_DELAY_MS);
        resumedAt = null;
      }
      window.clearTimeout(timer);
      updatePopupState({ activeMs });
    };

    const attempt = () => {
      if (stopped || !scrolled || elapsed() < ACTIVE_DELAY_MS) return;
      const state = readPopupState();
      if (state.shown || state.submitted || state.engaged) {
        stop();
        return;
      }
      /* Blocked moments wait for the next genuine scroll. */
      if (isTyping() || otherModalOpen() || document.visibilityState !== "visible") {
        return;
      }
      stop();
      updatePopupState({ shown: true });
      show("timed");
    };

    const resume = () => {
      if (stopped || resumedAt !== null || document.visibilityState !== "visible") {
        return;
      }
      const remaining = ACTIVE_DELAY_MS - activeMs;
      /* Time already served: a visitor returning to the tab is not
         ambushed — the popup waits for their next scroll. */
      if (remaining <= 0) return;
      resumedAt = performance.now();
      timer = window.setTimeout(() => {
        pause();
        attempt();
      }, remaining);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") resume();
      else pause();
    };

    const markIntent = () => {
      intentAt = performance.now();
      if (baselineY === null) baselineY = window.scrollY;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key) && !isTyping()) markIntent();
    };
    const onPointerDown = () => {
      pointerHeld = true;
      markIntent();
    };
    const onPointerUp = () => {
      pointerHeld = false;
    };

    const intentEvents = [
      ["wheel", markIntent],
      ["touchmove", markIntent],
      ["keydown", onKeyDown],
      ["pointerdown", onPointerDown],
      ["pointerup", onPointerUp],
      ["pointercancel", onPointerUp],
    ] as const;
    const dropIntentListeners = () => {
      for (const [type, fn] of intentEvents) {
        window.removeEventListener(type, fn as EventListener);
      }
    };

    /* Coalesced to one check per frame — never work per raw scroll event. */
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!scrolled) {
          const userDriven =
            pointerHeld || performance.now() - intentAt < INTENT_WINDOW_MS;
          if (!userDriven) {
            baselineY = null;
            return;
          }
          if (baselineY === null || Math.abs(window.scrollY - baselineY) < SCROLL_MIN_PX) {
            return;
          }
          scrolled = true;
          updatePopupState({ scrolled: true });
          dropIntentListeners();
        }
        attempt();
      });
    };

    /* The visitor reaching for a form themselves ends the controller. */
    const engage = () => {
      updatePopupState({ engaged: true });
      stop();
    };
    const onClick = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && ENGAGED_HREF.test(link.getAttribute("href") ?? "")) engage();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest("#estimator form")) {
        engage();
      }
    };

    function stop() {
      if (stopped) return;
      pause();
      stopped = true;
      cancelAnimationFrame(frame);
      dropIntentListeners();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", pause);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocusIn);
    }

    if (!scrolled) {
      for (const [type, fn] of intentEvents) {
        window.addEventListener(type, fn as EventListener, { passive: true });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", pause);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocusIn);
    resume();

    return stop;
  }, [autoRoute, show]);

  /* ---------------- the exit-intent trigger ---------------- */

  useEffect(() => {
    if (!autoRoute) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const initial = readPopupState();
    if (initial.exitShown || initial.submitted) return;

    const mountedAt = performance.now();

    const onMouseOut = (event: MouseEvent) => {
      /* relatedTarget null = the pointer left the document entirely;
         clientY <= 0 = it left through the top edge. */
      if (event.relatedTarget !== null || event.clientY > 0) return;
      if (performance.now() - mountedAt < EXIT_MIN_DWELL_MS) return;
      const state = readPopupState();
      if (state.exitShown || state.submitted) {
        document.removeEventListener("mouseout", onMouseOut);
        return;
      }
      /* Blocked now; the next exit attempt gets another chance. */
      if (isTyping() || otherModalOpen()) return;
      document.removeEventListener("mouseout", onMouseOut);
      updatePopupState({ exitShown: true });
      show("exit");
    };

    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [autoRoute, show]);

  /* ---------------- dialog behaviour: lock, focus, escape ---------------- */

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Focus lands on the panel itself, so the first Tab reaches the close
       button and a screen reader announces the dialog title. */
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;
      /* Keep Tab inside the dialog while it is modal. */
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = [
        ...panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss]);

  /* While the popup is on screen, flag the body (styling hook for any
     fixed overlay that should step back). */
  useEffect(() => {
    if (!open) return;
    document.body.setAttribute("data-popup-open", "");
    return () => document.body.removeAttribute("data-popup-open");
  }, [open]);

  const onSubmitted = useCallback(() => {
    markLeadSubmitted();
    setSent(true);
  }, []);

  const headingId = useId();
  const descriptionId = useId();

  if (!open) return null;
  const copy = COPY[kind];

  return (
    <div
      className="popup-backdrop"
      data-closing={closing || undefined}
      onPointerDown={dismiss}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={sent ? undefined : descriptionId}
        tabIndex={-1}
        className="popup-panel"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="popup-close"
        >
          <CloseGlyph />
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <SuccessGlyph />
            <h2 id={headingId} className="mt-4 font-display text-xl font-semibold">
              Thank you — we&rsquo;ve received your enquiry.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A member of the MIDIS team will get back to you shortly.
            </p>
            <Button type="button" size="md" onClick={dismiss} className="mt-6">
              Continue Browsing
            </Button>
          </div>
        ) : (
          <>
            <Eyebrow className="mb-2.5">{copy.eyebrow}</Eyebrow>
            <h2
              id={headingId}
              className="font-display text-[1.375rem] font-semibold leading-[1.15] sm:text-2xl"
            >
              {copy.heading}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
              {copy.description}
            </p>

            <PopupForm
              key={kind}
              source={copy.source}
              submitLabel={copy.primary}
              secondaryLabel={copy.secondary}
              onDismiss={dismiss}
              onSubmitted={onSubmitted}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */

type FieldName = "name" | "email" | "projectType" | "phone" | "message";

const EMPTY: Record<FieldName, string> = {
  name: "",
  email: "",
  projectType: "",
  phone: "",
  message: "",
};

/**
 * The popups' concise lead form. Validates field-by-field against the SAME
 * Zod schema the server runs, posts to the same /api/enquiry route, and
 * reports success only when the CMS confirmed the record — exactly the
 * estimator's contract, with five fields instead of four steps.
 */
function PopupForm({
  source,
  submitLabel,
  secondaryLabel,
  onDismiss,
  onSubmitted,
}: {
  source: (typeof COPY)[PopupKind]["source"];
  submitLabel: string;
  secondaryLabel: string;
  onDismiss: () => void;
  onSubmitted: () => void;
}) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [honey, setHoney] = useState("");
  const sentRef = useRef(false);
  const messageId = useId();

  const set = (field: FieldName) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "submitting" || sentRef.current) return;

    const parsed = popupSchema.safeParse({
      kind: "popup",
      source,
      ...values,
      website: honey,
    });

    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.ok) {
        setStatus("idle");
        setFormError(
          body.message ??
            "We could not submit your request just now. Please email us at hello@midis.in.",
        );
        if (body.fieldErrors) setErrors(body.fieldErrors);
        return;
      }

      /* Only now — the CMS has confirmed the record. */
      sentRef.current = true;
      onSubmitted();
    } catch {
      setStatus("idle");
      setFormError(
        "We could not reach our server. Please check your connection, or email us at hello@midis.in.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-5">
      <Honeypot value={honey} onChange={setHoney} />

      <div className="flex flex-col gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            onChange={(event) => set("name")(event.target.value)}
            error={errors.name}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="yourname@gmail.com"
            required
            value={values.email}
            onChange={(event) => set("email")(event.target.value)}
            error={errors.email}
          />
        </div>

        <SelectField
          label="What do you need?"
          name="projectType"
          options={PROJECT_TYPES}
          required
          value={values.projectType}
          onChange={set("projectType")}
          error={errors.projectType}
        />

        <TextField
          label="Phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          optional
          placeholder="Include country code"
          value={values.phone}
          onChange={(event) => set("phone")(event.target.value)}
          error={errors.phone}
        />

        <div>
          <label htmlFor={messageId} className="block text-sm font-medium text-fg">
            About your project{" "}
            <span className="ml-0.5 font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={messageId}
            name="message"
            rows={2}
            value={values.message}
            onChange={(event) => set("message")(event.target.value)}
            aria-invalid={errors.message ? true : undefined}
            className={cn(
              "mt-2 block w-full resize-none rounded-lg border bg-surface px-3.5 py-3 text-base text-fg",
              "placeholder:text-muted/70 transition-colors duration-[var(--dur-fast)]",
              "focus:border-accent focus:outline-none",
              errors.message ? "border-danger" : "border-line hover:border-fg/25",
            )}
            placeholder="A sentence or two is plenty."
          />
          <FieldError id={`${messageId}-error`}>{errors.message}</FieldError>
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3.5"
        >
          <FieldError id="popup-form-error">{formError}</FieldError>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col items-stretch gap-2.5">
        <Button type="submit" size="md" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <SpinnerGlyph />
              Sending…
            </>
          ) : (
            <>
              {submitLabel}
              <Arrow />
            </>
          )}
        </Button>
        <button type="button" onClick={onDismiss} className="popup-secondary">
          {secondaryLabel}
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "submitting" ? "Sending your enquiry." : ""}
      </p>
    </form>
  );
}

/* ========================================================================== */

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 3.5l9 9m0-9-9 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuccessGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="40"
      height="40"
      aria-hidden="true"
      className="mx-auto text-accent-ink"
    >
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.5 12.4l3 3 6-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="animate-spin">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
