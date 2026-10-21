"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Eyebrow } from "@/components/ui/Section";
import { Arrow, Button } from "@/components/ui/Button";
import { FieldError, Honeypot, SelectField, TextField } from "@/components/forms/Fields";
import { PROJECT_TYPES } from "@/content/forms";
import { popupSchema } from "@/lib/enquiry";
import {
  markLeadSubmitted,
  markPopupClosed,
  markPopupShown,
  readPopupState,
  type PopupTrigger,
} from "@/lib/popups";
import { cn } from "@/lib/utils";

/**
 * THE LEAD-GENERATION POPUP SYSTEM (MIDIS brief, 2026-10-20).
 *
 * One dialog, three triggers — welcome (2.6s after load), 40% scroll depth,
 * and exit intent — governed by one manager so the rules cannot drift:
 *
 *   - Never more than one popup at a time, never stacked.
 *   - Each trigger fires at most once per session (sessionStorage).
 *   - 45s cooldown after any dismissal before another trigger may fire.
 *   - Nothing fires while the visitor is typing in ANY field (which also
 *     covers the mobile keyboard being open).
 *   - Nothing fires after a successful lead submission this session —
 *     including one made through the hero estimator.
 *   - Every popup is dismissible: close button, Escape, backdrop click,
 *     and an explicit secondary action. Nothing blocks navigation.
 *
 * EXIT INTENT is desktop-only in the literal sense (pointer leaving the
 * viewport through the top edge, only after 12s on the page, so a stray
 * swipe across the toolbar does not count). Mobile browsers expose no
 * honest exit signal, and the brief forbids history tricks — so touch
 * devices get a NON-MODAL reminder card instead, shown once after real
 * engagement (70% depth and 30s dwell), which never traps focus and never
 * blocks the page.
 *
 * COPY comes from the client's own popup brief (SUPPORTING — it introduces
 * the ask; the form options are the approved estimator content). The form
 * posts kind:"popup" with a `source` identifier through the same validated
 * /api/enquiry route as every other lead — one backend, honest success
 * states, no duplicate records.
 */

const COOLDOWN_MS = 45_000;
const INITIAL_DELAY_MS = 2_600;
const INITIAL_RETRY_MS = 11_000;
const EXIT_MIN_DWELL_MS = 12_000;
const REMINDER_MIN_DWELL_MS = 30_000;
const SCROLL_DEPTH = 0.4;
const REMINDER_DEPTH = 0.7;

interface VariantCopy {
  eyebrow: string;
  heading: string;
  description: string;
  primary: string;
  secondary: string;
  /** Welcome and exit carry the lead form; the scroll variant routes to the
      estimator instead — its job is to point at the existing form, not to
      open a second one. */
  hasForm: boolean;
  source: "initial_popup" | "scroll_popup" | "exit_popup";
}

const VARIANTS: Record<PopupTrigger, VariantCopy> = {
  initial: {
    eyebrow: "Let’s build something better",
    heading: "Have a Website Project in Mind?",
    description:
      "Tell us what you’re planning, and the MIDIS team will help you explore the right solution for your business.",
    primary: "Get a Free Consultation",
    secondary: "Maybe Later",
    hasForm: true,
    source: "initial_popup",
  },
  scroll: {
    eyebrow: "Your next project starts here",
    heading: "Let’s Turn Your Idea Into Reality.",
    description:
      "Planning a new website or redesign? Share your requirements and we’ll help you take the next step.",
    primary: "Get a Project Estimate",
    secondary: "Continue Exploring",
    hasForm: false,
    source: "scroll_popup",
  },
  exit: {
    eyebrow: "Before you go",
    heading: "Let’s Talk About Your Next Big Idea.",
    description:
      "Have a project in mind? Tell us a little about it, and our team can help you explore the next steps.",
    primary: "Get a Free Consultation",
    secondary: "No Thanks",
    hasForm: true,
    source: "exit_popup",
  },
};

/** True while the visitor is in a form field — popups must wait. */
function isTyping(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")
  );
}

function scrollDepth(): number {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 1;
}

export function LeadPopups() {
  const [active, setActive] = useState<PopupTrigger | null>(null);
  const [closing, setClosing] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [sent, setSent] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /* Mirrors `active` for the long-lived trigger listeners, synced in an
     effect because writing a ref during render is forbidden. */
  const activeRef = useRef<PopupTrigger | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /** The gate every trigger passes through. Reads fresh state each time. */
  const tryShow = useCallback((trigger: PopupTrigger): boolean => {
    const state = readPopupState();
    if (
      state.submitted ||
      activeRef.current !== null ||
      state.shown[trigger] ||
      Date.now() - state.lastClosedAt < COOLDOWN_MS ||
      isTyping()
    ) {
      return false;
    }
    markPopupShown(trigger);
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setClosing(false);
    setSent(false);
    setActive(trigger);
    return true;
  }, []);

  const dismiss = useCallback(() => {
    markPopupClosed();
    setClosing(true);
    /* Let the exit transition play, then unmount and restore focus. */
    window.setTimeout(() => {
      setActive(null);
      setClosing(false);
      restoreFocusRef.current?.focus?.();
    }, 180);
  }, []);

  /* ---------------- triggers ---------------- */

  useEffect(() => {
    const timers: number[] = [];
    const cleanups: (() => void)[] = [];
    const mountedAt = Date.now();

    /* 1 — welcome, shortly after the page is interactive. If the moment is
       blocked (visitor already typing), one quiet retry; never a loop. */
    timers.push(
      window.setTimeout(() => {
        if (!tryShow("initial")) {
          timers.push(window.setTimeout(() => tryShow("initial"), INITIAL_RETRY_MS));
        }
      }, INITIAL_DELAY_MS),
    );

    /* 2 — 40% of the real scrollable height. The listener stays until the
       trigger actually fires (so a cooldown at first crossing just defers
       it to further scrolling), then removes itself. */
    const onScroll = () => {
      if (scrollDepth() >= SCROLL_DEPTH && tryShow("scroll")) {
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (fine) {
      /* 3a — desktop exit intent: the pointer leaving through the TOP edge
         (toward tabs / URL bar), never mere movement across the page, and
         only once the visitor has actually been here a while. */
      const onMouseOut = (event: MouseEvent) => {
        if (
          event.relatedTarget === null &&
          event.clientY <= 0 &&
          Date.now() - mountedAt > EXIT_MIN_DWELL_MS
        ) {
          tryShow("exit");
        }
      };
      document.addEventListener("mouseout", onMouseOut);
      cleanups.push(() => document.removeEventListener("mouseout", onMouseOut));
    } else {
      /* 3b — touch devices: no exit signal exists, so after meaningful
         engagement show the NON-MODAL reminder card once, under the same
         frequency rules (it books the "exit" slot). */
      const onEngaged = () => {
        if (
          Date.now() - mountedAt > REMINDER_MIN_DWELL_MS &&
          scrollDepth() >= REMINDER_DEPTH
        ) {
          const state = readPopupState();
          if (
            !state.submitted &&
            !state.shown.exit &&
            activeRef.current === null &&
            Date.now() - state.lastClosedAt >= COOLDOWN_MS &&
            !isTyping()
          ) {
            markPopupShown("exit");
            setReminder(true);
            window.removeEventListener("scroll", onEngaged);
          }
        }
      };
      window.addEventListener("scroll", onEngaged, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onEngaged));
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      cleanups.forEach((fn) => fn());
    };
  }, [tryShow]);

  /* ---------------- dialog behaviour: lock, focus, escape ---------------- */

  useEffect(() => {
    if (!active) return;

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
  }, [active, dismiss]);

  /* While any popup (modal or the mobile reminder) is on screen, flag the
     body so the floating CTA group hides itself in pure CSS — the two
     overlays never compete for the bottom of the viewport. */
  useEffect(() => {
    if (!active && !reminder) return;
    document.body.setAttribute("data-popup-open", "");
    return () => document.body.removeAttribute("data-popup-open");
  }, [active, reminder]);

  const onSubmitted = useCallback(() => {
    markLeadSubmitted();
    setSent(true);
  }, []);

  /* The scroll variant's primary: close, then glide to the estimator once
     the scroll lock has lifted. */
  const goToEstimator = useCallback(() => {
    dismiss();
    window.setTimeout(() => {
      document
        .getElementById("estimator")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [dismiss]);

  const headingId = useId();
  const variant = active ? VARIANTS[active] : null;

  return (
    <>
      {variant ? (
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
                <Eyebrow className="mb-2.5">{variant.eyebrow}</Eyebrow>
                <h2
                  id={headingId}
                  className="font-display text-[1.375rem] font-semibold leading-[1.15] sm:text-2xl"
                >
                  {variant.heading}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {variant.description}
                </p>

                {variant.hasForm ? (
                  <PopupForm
                    source={variant.source}
                    submitLabel={variant.primary}
                    secondaryLabel={variant.secondary}
                    onDismiss={dismiss}
                    onSubmitted={onSubmitted}
                  />
                ) : (
                  <div className="mt-6 flex flex-col items-stretch gap-2.5">
                    <Button type="button" size="md" onClick={goToEstimator}>
                      {variant.primary}
                      <Arrow />
                    </Button>
                    <button
                      type="button"
                      onClick={dismiss}
                      className="popup-secondary"
                    >
                      {variant.secondary}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/*
        The touch-device reminder: NON-modal by design. role="complementary"
        rather than dialog, no focus trap, no backdrop — the page stays
        fully usable, and the card simply offers the next step once.
      */}
      {reminder ? (
        <div className="popup-reminder" role="complementary" aria-label="Project enquiry">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug">
              {VARIANTS.exit.heading}
            </p>
            <a
              href="#estimator"
              onClick={() => {
                markPopupClosed();
                setReminder(false);
              }}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
            >
              Get a Free Consultation
              <Arrow className="size-3.5" />
            </a>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="popup-close static shrink-0"
            onClick={() => {
              markPopupClosed();
              setReminder(false);
            }}
          >
            <CloseGlyph />
          </button>
        </div>
      ) : null}
    </>
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
  source: VariantCopy["source"];
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
