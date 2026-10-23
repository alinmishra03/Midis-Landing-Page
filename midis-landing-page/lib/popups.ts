/**
 * Popup session state — the memory behind the automatic lead popup.
 *
 * sessionStorage, deliberately: the brief asks for per-SESSION frequency
 * control. A refresh or a route change keeps the state; a new browsing
 * session (new tab, closed browser) starts clean. Nothing here identifies
 * the visitor.
 *
 * Every read and write is wrapped in try/catch because storage access
 * throws outright in some privacy modes — in which case the safe behaviour
 * is "treat nothing as shown, nothing as submitted", which only ever errs
 * on the side of the visitor seeing at most what a first-time visitor sees.
 */

export interface PopupState {
  /** The timed popup has opened this session. It never opens again —
      whether the visitor submitted, closed it, or simply moved on. */
  shown: boolean;
  /** The exit-intent popup has opened this session. Also once only. */
  exitShown: boolean;
  /** Active (visible-tab) browsing time banked so far, in ms. Survives
      refreshes and navigation so the 20-second clock never restarts. */
  activeMs: number;
  /** The visitor has genuinely scrolled at least once this session. */
  scrolled: boolean;
  /** The visitor reached for a form themselves (an estimator CTA, the
      estimator's fields, a contact link): no automatic pitch after that. */
  engaged: boolean;
  /** A lead landed this session: suppress the popup entirely. */
  submitted: boolean;
}

/* A new key rather than the old "midis-popups": the three-trigger shape it
   held does not map onto the timed + exit pair. */
const KEY = "midis-popup";

function empty(): PopupState {
  return {
    shown: false,
    exitShown: false,
    activeMs: 0,
    scrolled: false,
    engaged: false,
    submitted: false,
  };
}

export function readPopupState(): PopupState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<PopupState>;
    return {
      shown: parsed.shown === true,
      exitShown: parsed.exitShown === true,
      activeMs:
        typeof parsed.activeMs === "number" && parsed.activeMs > 0
          ? parsed.activeMs
          : 0,
      scrolled: parsed.scrolled === true,
      engaged: parsed.engaged === true,
      submitted: parsed.submitted === true,
    };
  } catch {
    return empty();
  }
}

export function updatePopupState(patch: Partial<PopupState>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readPopupState(), ...patch }));
  } catch {
    /* Private mode or storage blocked: the controller still holds the
       state in memory for this page. Not worth throwing. */
  }
}

/**
 * Called after ANY successful lead submission this session — the popup's
 * own form, and the hero estimator — so a visitor who has already enquired
 * is never pitched again on the same visit.
 */
export function markLeadSubmitted() {
  updatePopupState({ submitted: true });
}
