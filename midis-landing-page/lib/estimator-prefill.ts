import type { ProjectType } from "@/content/forms";

/**
 * THE SERVICE → ESTIMATOR BRIDGE (MIDIS lead-generation brief, 2026-10-21).
 *
 * The brief removed every external destination from the Services rows and
 * pointed them at the on-page estimator instead — and asked that, where a
 * service matches an existing estimator option, that option arrive
 * preselected. This is the whole mechanism: the service link dispatches a
 * DOM event naming an APPROVED project type, and the estimator (which is
 * already mounted — same page) sets its step-2 value.
 *
 * WHY AN EVENT AND NOT A PROP OR URL PARAM. The services section and the
 * hero estimator are far-apart siblings; threading state through the page
 * would couple three server components for one optional nicety, and a URL
 * param would survive reloads and sharing, preselecting an answer the
 * visitor never chose. The event exists only in the moment of the click.
 *
 * ONLY VALUES FROM PROJECT_TYPES CAN ARRIVE: the estimator re-validates
 * against the approved list before accepting (see EstimatorForm), so this
 * can never invent a form option — the brief's explicit line.
 */
export const ESTIMATOR_PRESELECT_EVENT = "midis:estimator-preselect";

export function preselectProjectType(type: ProjectType) {
  window.dispatchEvent(
    new CustomEvent<ProjectType>(ESTIMATOR_PRESELECT_EVENT, { detail: type }),
  );
}
