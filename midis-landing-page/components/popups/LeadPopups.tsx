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
 * THE TIMED POPUP OPENS AFTER EVERY 20 SECONDS OF ACTIVE SCROLLING (MIDIS
 * instruction, 2026-10-28; it was briefly a plain 20s clock):
 *   - Only scrolling time counts. A scroll starts the clock; it runs while
 *     scroll events keep arriving and pauses once they have stopped for
 *     SCROLL_IDLE_MS. An idle page, reading without scrolling and a
 *     background tab add nothing, so nothing opens on load.
 *   - Closing it starts a fresh 20 seconds of scrolling — dismissal never
 *     disables it. The clock never runs while it is open (the page cannot
 *     scroll then), so two never stack.
 *   - It stops for the rest of the browser session once a lead is
 *     submitted, here or through the homepage form.
 *   - When the 20 seconds are up but the visitor is in a form field, typed
 *     in any form in the last FORM_ACTIVE_MS, or another modal (the work
 *     gallery's dialog, the mobile menu) is open, it holds and opens on the
 *     next scroll once that has cleared.
 *   (Until 2026-10-28 it also held whenever the homepage form was on screen
 *   with anything typed in it, or had merely been clicked in the last
 *   minute — which kept it from ever opening for many visitors.)
 * * THE EXIT POPUP (MIDIS request, 2026-10-23) is the second automatic
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
 * heading, five fields, validation and consent line are one
 * implementation. A success closes the popup and goes to /thank-you. No "Maybe Later" / "No Thanks" button any more.
 *
 * MANUAL CTAs are untouched: every "Get a Project Estimate" button is a
 * plain link to #estimator and works instantly.
 *
 * Mounted once in the root layout, so client-side navigation never spawns a
 * second timer or listener set, and the scrolling time banked so far
 * carries across pages. It runs on every page except the thank-you pages
 * (a visitor there has just converted).
 * * Every popup is dismissible: close button, Escape, backdrop click. The
 * form posts source:"popup" to /api/consultation, like the homepage form.
 */

/** The timed popup opens after this much accumulated scrolling time. */
const REPEAT_MS = 20_000;
/** Scrolling counts as stopped this long after the last scroll event. */
const SCROLL_IDLE_MS = 1_000;
/** Typing in any form this recently means the visitor is still on it. */
const FORM_ACTIVE_MS = 30_000;
/** The exit popup ignores the toolbar for this long after landing. */
const EXIT_MIN_DWELL_MS = 10_000;
/** Pages the popup never opens on. */
const isQuietRoute = (pathname: string) => pathname.startsWith("/thank-you");
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

/** True while the visitor typed in a form field recently. */
function formInProgress(lastInput: number): boolean {
  return lastInput > 0 && performance.now() - lastInput < FORM_ACTIVE_MS;
}
export function LeadPopups() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PopupKind>("timed");
  const [closing, setClosing] = useState(false);

  const pathname = usePathname();
  const autoRoute = !isQuietRoute(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /* When the visitor last typed in a form field (any form on the page). */
  const formInputRef = useRef(0);
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

  /* After a successful submission: gone immediately, no exit transition. */
  const closeForRedirect = useCallback(() => {
    setOpen(false);
    setClosing(false);
  }, []);

  /* ---------------- the automatic trigger ---------------- */

  /* Form typing, recorded without re-rendering. */
  useEffect(() => {
    if (!autoRoute) return;
    const onInput = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("form")) {
        formInputRef.current = performance.now();
      }
    };
    document.addEventListener("input", onInput, true);
    return () => document.removeEventListener("input", onInput, true);
  }, [autoRoute]);

  /* Runs while the popup is CLOSED; opening it tears this down, closing it
     starts a fresh 20s of scrolling. All bookkeeping lives in closure
     variables, so scrolling never re-renders anything; at most one timeout
     is pending, and only while the visitor is scrolling. Route changes
     between allowed pages keep this effect (and its banked time) alive. */
  useEffect(() => {
    if (!autoRoute || open) return;
    if (readPopupState().submitted) return;

    /* Scrolling time banked from earlier bursts. */
    let banked = 0;
    /* Start of the current burst, or null while not scrolling. */
    let burstStart: number | null = null;
    let lastScroll = 0;
    let timer: number | undefined;

    /* A burst counts up to its last scroll event plus the idle grace. */
    const elapsed = (now: number) =>
      banked +
      (burstStart === null
        ? 0
        : Math.min(now, lastScroll + SCROLL_IDLE_MS) - burstStart);

    const endBurst = (now: number) => {
      banked = elapsed(now);
      burstStart = null;
      window.clearTimeout(timer);
    };

    const due = () => {
      if (readPopupState().submitted) return;
      if (isTyping() || otherModalOpen() || formInProgress(formInputRef.current)) {
        /* Hold at "due": the next scroll checks again. */
        banked = REPEAT_MS;
        return;
      }
      updatePopupState({ timedCount: readPopupState().timedCount + 1 });
      show("timed");
    };

    /* Wakes at whichever comes first: the 20s mark or the burst going
       idle. Scroll events in between only move lastScroll forward. */
    const tick = () => {
      const now = performance.now();
      if (elapsed(now) >= REPEAT_MS) {
        endBurst(now);
        due();
        return;
      }
      if (now - lastScroll >= SCROLL_IDLE_MS) {
        endBurst(now);
        return;
      }
      timer = window.setTimeout(
        tick,
        Math.min(REPEAT_MS - elapsed(now), lastScroll + SCROLL_IDLE_MS - now),
      );
    };

    const onScroll = () => {
      if (document.visibilityState !== "visible") return;
      lastScroll = performance.now();
      if (burstStart === null) {
        burstStart = lastScroll;
        tick();
      }
    };

    /* A hidden tab ends the burst; nothing accrues until scrolling resumes. */
    const onVisibility = () => {
      if (document.visibilityState !== "visible") endBurst(performance.now());
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
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

    /* Touch devices: keep the focused field clear of the on-screen
       keyboard. Once after focus (the keyboard is opening), and again
       whenever the visible viewport resizes while a field in the dialog
       has focus — the keyboard arriving or changing height — the field is
       scrolled to the middle of the dialog's own scroll area. */
    const panelNode = panelRef.current;
    let keyboardTimer: number | undefined;
    const focusedField = () => {
      const active = document.activeElement;
      return active instanceof HTMLElement &&
        panelNode?.contains(active) &&
        active.matches("input, select, textarea")
        ? active
        : null;
    };
    const recentre = () => focusedField()?.scrollIntoView({ block: "center" });
    const onFocusIn = () => {
      if (!focusedField() || !window.matchMedia("(pointer: coarse)").matches) return;
      window.clearTimeout(keyboardTimer);
      keyboardTimer = window.setTimeout(recentre, 320);
    };
    const onViewportResize = () => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      window.clearTimeout(keyboardTimer);
      keyboardTimer = window.setTimeout(recentre, 60);
    };
    const viewport = window.visualViewport ?? window;
    panelNode?.addEventListener("focusin", onFocusIn);
    viewport.addEventListener("resize", onViewportResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      panelNode?.removeEventListener("focusin", onFocusIn);
      viewport.removeEventListener("resize", onViewportResize);
      window.clearTimeout(keyboardTimer);
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
            fields, validation and consent line. A successful submission
            marks the session, so neither popup opens again this visit,
            closes the popup at once and goes to /thank-you (2026-10-29).
            No focus restore: the page underneath is being replaced. */}
        <ConsultationForm
          source="popup"
          layout="popup"
          titleId={headingId}
          descriptionId={descriptionId}
          onSubmitted={closeForRedirect}
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

