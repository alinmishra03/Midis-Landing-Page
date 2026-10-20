/**
 * Popup frequency state — the memory behind the lead-popup rules.
 *
 * sessionStorage, deliberately: the brief asks for per-SESSION frequency
 * control ("once per eligible visitor session") and for storing only the
 * minimal state needed. A closed tab forgets everything; nothing here
 * identifies the visitor.
 *
 * Every read and write is wrapped in try/catch because storage access
 * throws outright in some privacy modes — in which case the safe behaviour
 * is "treat nothing as shown, nothing as submitted", which only ever errs
 * on the side of the visitor seeing at most what a first-time visitor sees.
 */

export type PopupTrigger = "initial" | "scroll" | "exit";

export interface PopupState {
  /** Triggers that have already fired this session. Each fires at most once. */
  shown: Partial<Record<PopupTrigger, true>>;
  /** When the visitor last closed a popup — drives the cooldown. */
  lastClosedAt: number;
  /** A lead landed this session: suppress every further popup. */
  submitted: boolean;
}

const KEY = "midis-popups";

const EMPTY: PopupState = { shown: {}, lastClosedAt: 0, submitted: false };

export function readPopupState(): PopupState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, shown: {} };
    const parsed = JSON.parse(raw) as Partial<PopupState>;
    return {
      shown: typeof parsed.shown === "object" && parsed.shown ? parsed.shown : {},
      lastClosedAt:
        typeof parsed.lastClosedAt === "number" ? parsed.lastClosedAt : 0,
      submitted: parsed.submitted === true,
    };
  } catch {
    return { ...EMPTY, shown: {} };
  }
}

function write(state: PopupState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Private mode or storage blocked: frequency rules then live only in
       this page's memory, which the manager also keeps. Not worth throwing. */
  }
}

export function markPopupShown(trigger: PopupTrigger) {
  const state = readPopupState();
  state.shown[trigger] = true;
  write(state);
}

export function markPopupClosed() {
  const state = readPopupState();
  state.lastClosedAt = Date.now();
  write(state);
}

/**
 * Called after ANY successful lead submission this session — the popups'
 * own form, and the hero estimator — so a visitor who has already enquired
 * is never pitched again on the same visit.
 */
export function markLeadSubmitted() {
  const state = readPopupState();
  state.submitted = true;
  write(state);
}
