"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { ConsultationForm } from "@/components/forms/ConsultationForm";
import {
  readPopupState,
  updatePopupState,
} from "@/lib/popups";

/**
 * THE AUTOMATIC LEAD POPUP (MIDIS brief, 2026-10-23 — replaces the
 * three-trigger system of 2026-10-20, whose welcome popup opened 2.6s after
 * load and interrupted the first look at the page).
 *
 * THE TIMED POPUP OPENS EVERY 20 SECONDS (MIDIS instruction, 2026-10-28:
 * "while scrolling, and sitting on the page or not scrolling"; the 3-per-
 * visit cap of 2026-10-24 is gone):
 *   - 20 seconds after the page loads, and again 20 seconds after each
 *     close, scrolling or not. The clock only runs while the popup is
 *     closed and the tab is visible, so two never stack and a background
 *     tab is not ambushed on return.
 *   - It stops for good once a lead is submitted this session, here or
 *     through the homepage form — so it never opens over a thank-you
 *     screen.
 *   - When the 20 seconds are up but the visitor is typing in a field, is
 *     part-way through the homepage form (`#estimator`), or another modal (the work
 *     gallery's detail dialog, the mobile menu) is open, it waits and opens
 *     as soon as that clears (checked each second).
 *
 * THE EXIT POPUP (MIDIS request, 2026-10-23) is the second automatic
 * trigger. Since 2026-10-28 both show the same content. No browser lets a page show its own content as
 * the tab actually closes, so this is EXIT INTENT, the standard stand-in:
 * the pointer leaving the page through the TOP edge, toward the tabs, the
 * address bar and the close button. Desktop (fine pointer) only, because
 * touch browsers expose no honest exit signal and the old brief rules out
 * back-button tricks. It opens at most once per session, never in the
 * first 10 seconds (a stray swipe at the toolbar is not leaving), never
 * after a lead was submitted, never over another dialog, never while the
 * visitor is typing. The two popups are independent, each on its own
 * rules; the timed one simply waits while the exit one is open.
 *
 * THE CONTENT (MIDIS client-approved brief, 2026-10-28): exactly the
 * homepage hero's consultation form — the shared ConsultationForm, so the
 * heading, five fields, validation, consent line and thank-you screen are
 * one implementation. No "Maybe Later" / "No Thanks" button any more.
 *
 * MANUAL CTAs are untouched: every "Get a Project Estimate" button is a
 * plain link to #estimator and works instantly.
 *
 * Mounted once in the root layout, so client-side navigation never spawns a
 * second timer or listener set. It only OPENS on the landing page — the
 * audit form and the thank-you pages are lead flows of their own — and the
 * clock only runs there.
 *
 * Every popup is dismissible: close button, Escape, backdrop click. The
 * form posts source:"popup" to /api/consultation, like the homepage form.
 */

/** The timed popup opens every this-many ms of visible, popup-free time. */
const REPEAT_MS = 20_000;
/** How often a due-but-blocked popup re-checks whether it may open. */
const BLOCKED_RETRY_MS = 1_000;
/** Estimator interaction this recent means the visitor is still on it. */
const ESTIMATOR_ACTIVE_MS = 60_000;
/** The exit popup ignores the toolbar for this long after landing. */
const EXIT_MIN_DWELL_MS = 10_000;
/** Routes the popup may open on. */
const AUTO_ROUTES = new Set(["/"]);

type PopupKind = "timed" | "exit";

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

/** True while the visitor is part-way through the Project Estimator: they
    touched it in the last minute, or it is on screen with answers in it. */
function estimatorInProgress(lastActivity: number): boolean {
  if (lastActivity > 0 && performance.now() - lastActivity < ESTIMATOR_ACTIVE_MS) {
    return true;
  }
  const form = document.querySelector<HTMLFormElement>("#estimator form");
  if (!form) return false;
  const box = form.getBoundingClientRect();
  if (box.bottom <= 0 || box.top >= window.innerHeight) return false;
  return [
    ...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea",
    ),
  ].some(
    (field) => !field.closest("[aria-hidden='true']") && field.value.trim() !== "",
  );
}

export function LeadPopups() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PopupKind>("timed");
  const [closing, setClosing] = useState(false);

  const pathname = usePathname();
  const autoRoute = AUTO_ROUTES.has(pathname);

  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /* When the visitor last typed, picked or clicked inside the estimator. */
  const estimatorActivityRef = useRef(0);

  const show = useCallback((which: PopupKind) => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setClosing(false);
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

  /* Estimator activity, recorded without re-rendering. */
  useEffect(() => {
    if (!autoRoute) return;
    const onActivity = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("#estimator")) {
        estimatorActivityRef.current = performance.now();
      }
    };
    document.addEventListener("input", onActivity, true);
    document.addEventListener("pointerdown", onActivity, true);
    return () => {
      document.removeEventListener("input", onActivity, true);
      document.removeEventListener("pointerdown", onActivity, true);
    };
  }, [autoRoute]);

  /* Runs while the popup is CLOSED; opening it tears this down, closing it
     starts a fresh 20s. The countdown pauses while the tab is hidden: the
     time still owed is kept and resumed on return. All bookkeeping lives
     in closure variables, so the clock never re-renders anything, and at
     most one timeout is pending. */
  useEffect(() => {
    if (!autoRoute || open) return;
    if (readPopupState().submitted) return;

    let remaining = REPEAT_MS;
    let startedAt: number | null = null;
    let timer: number | undefined;

    const pause = () => {
      if (startedAt !== null) {
        remaining = Math.max(remaining - (performance.now() - startedAt), 0);
        startedAt = null;
      }
      window.clearTimeout(timer);
    };

    const run = () => {
      if (document.visibilityState !== "visible") return;
      startedAt = performance.now();
      timer = window.setTimeout(due, remaining);
    };

    const due = () => {
      startedAt = null;
      if (readPopupState().submitted) return;
      /* Due but blocked: check again shortly rather than skip a round. */
      if (
        isTyping() ||
        otherModalOpen() ||
        estimatorInProgress(estimatorActivityRef.current)
      ) {
        remaining = BLOCKED_RETRY_MS;
        run();
        return;
      }
      updatePopupState({ timedCount: readPopupState().timedCount + 1 });
      show("timed");
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
      else pause();
    };

    document.addEventListener("visibilitychange", onVisibility);
    run();

    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [autoRoute, open, show]);

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

  const headingId = useId();
  const descriptionId = useId();

  if (!open) return null;

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
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-kind={kind}
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

        {/* The SAME form as the homepage hero (2026-10-28): heading,
            fields, validation, consent line and thank-you screen. A
            successful submission swaps in the thank-you screen here and
            marks the session, so neither popup opens again this visit. */}
        <ConsultationForm
          source="popup"
          titleId={headingId}
          descriptionId={descriptionId}
        />
      </div>
    </div>
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

