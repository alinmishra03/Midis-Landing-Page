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
  /** How many times the timed popup has opened this session. It repeats
      every 20 seconds up to a cap (MIDIS, 2026-10-24: 3 per visit). */
  timedCount: number;
  /** The exit-intent popup has opened this session. Once only. */
  exitShown: boolean;
  /** A lead landed this session: suppress the popup entirely. */
  submitted: boolean;
}

/* A new key rather than the old "midis-popups": the three-trigger shape it
   held does not map onto the timed + exit pair. */
const KEY = "midis-popup";

function empty(): PopupState {
  return {
    timedCount: 0,
    exitShown: false,
    submitted: false,
  };
}

export function readPopupState(): PopupState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<PopupState>;
    return {
      timedCount:
        typeof parsed.timedCount === "number" && parsed.timedCount > 0
          ? parsed.timedCount
          : 0,
      exitShown: parsed.exitShown === true,
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
