"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import type { Country } from "react-phone-number-input/max";
import { FieldError, Honeypot, OptionGroup, TextField } from "./Fields";
import { PhoneField } from "./PhoneField";
import { BUDGETS, EXISTING_SITE, PROJECT_TYPES } from "@/content/forms";
import { ESTIMATOR_PRESELECT_EVENT } from "@/lib/estimator-prefill";
import { projectEstimateSchema, type Stage } from "@/lib/project-estimate";
import { footerLegal } from "@/content/site";
import { markLeadSubmitted } from "@/lib/popups";
import { estimator } from "@/content/sections";
import { cn } from "@/lib/utils";

/**
 * SECTION 5 — the Website Project Estimator.
 *
 * WHAT IT DOES NOT DO: calculate a price. The brief forbids inventing an
 * automatic estimate, MIDIS has no confirmed rate card, and MIDIS.pdf's own
 * developer note says to show an indicative figure "only if MIDIS has a
 * defined pricing model. Otherwise, use the form to collect requirements and
 * arrange a consultation." So step 4 shows a plain-language SUMMARY of what
 * the visitor selected — useful, honest, and not a number anyone could be
 * held to.
 *
 * STEP ORDER (reordered 2026-10-20 per MIDIS instruction):
 *   Step 1 — Contact Details   (name, email, phone*, company)
 *   Step 2 — Project Type      (what do you need?)
 *   Step 3 — Requirements      (existing site?)
 *   Step 4 — Budget & Submit   (budget range + project summary + submit)
 *
 * Previously contact details were step 4. Moving them to step 1 means the
 * team receives contact information even if the visitor abandons mid-flow,
 * and the visitor commits their identity before the project questions — a
 * warmer, more personal journey.
 *
 * STEP VALIDATION. Each step is validated against the same Zod field schemas
 * the server uses, field by field, so the browser and the API can never
 * disagree about what is valid. Phone is required on both sides. Advancing
 * is blocked on a failing step — but errors
 * appear only after an attempt to advance, never while the visitor is still
 * typing their first character into a field.
 *
 * DUPLICATE SUBMISSION. Guarded twice: `status` disables the control, and
 * `sent` is a ref that survives re-renders, so a double-click, an Enter
 * keypress landing on the button, and a re-submit after a slow response all
 * resolve to one POST.
 *
 * WHERE IT GOES: /api/project-estimate → ONE record per visitor in the
 * MIDIS admin's portfolio-project-estimates collection, SAVED AS THEY GO
 * (2026-10-26; mapping and stages: lib/project-estimate.ts):
 *   - Step 1 auto-saves 1.2s after typing pauses, once the email is valid
 *     (the notice under the fields says so) — the lead survives even if
 *     the visitor leaves before Step 2;
 *   - "Save & Continue" saves each step and moves on only when the server
 *     confirms; a failed save keeps the visitor, and every answer, there;
 *   - the final button submits and marks the lead completed.
 * Saves run ONE AT A TIME, in order: the first creates the record, every
 * later one updates it through the signed lead token the server returns.
 */

const PRIVACY_URL = footerLegal.find((link) => /privacy/i.test(link.label))?.href;
/* Survives a reload, so a refreshed page keeps updating the same lead.
   Only the opaque token and a random id — never the visitor's details. */
const LEAD_KEY = "midis-estimate-lead";
const AUTOSAVE_MS = 1200;

type SaveState = "idle" | "saving" | "saved" | "error";
type SaveResult =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Partial<Record<FieldName, string>> };

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/*
 * THE FOUR-STEP SHAPE IS UNCHANGED in count. Step titles and which fields
 * live in each step have been reordered per MIDIS's instruction.
 */
const STEPS = [
  { title: "Contact Details", legend: "Let's get to know you" },
  { title: "Project Type", legend: "What do you need?" },
  { title: "Requirements", legend: "Tell us about the site" },
  { title: "Budget & Submit", legend: "Scope" },
] as const;

/** Which fields each step owns. Drives both validation and focus. */
const STEP_FIELDS = [
  ["name", "email", "phone", "company"],
  ["projectType"],
  ["existingSite"],
  ["budget"],
] as const;

type FieldName =
  | "projectType"
  | "existingSite"
  | "budget"
  | "name"
  | "email"
  | "company"
  | "phone";

const EMPTY = {
  projectType: "",
  existingSite: "",
  budget: "",
  name: "",
  email: "",
  company: "",
  phone: "",
};

interface EstimatorFormProps {
  /**
   * `card` draws the form's own bordered surface — the standalone layout.
   * `bare` renders only the form, for a host that provides the surface
   * itself (the hero's glass shell). Logic, steps, validation and
   * submission are identical in both; this touches one className.
   */
  variant?: "card" | "bare";
}

export function EstimatorForm({ variant = "card" }: EstimatorFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<FieldName, string>>(EMPTY);
  /* The phone field's country lives here, not in the field: step 1
     unmounts on Continue, and Back must find the visitor's choice intact
     (India by default — no location lookup). */
  const [phoneCountry, setPhoneCountry] = useState<Country>("IN");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [honey, setHoney] = useState("");

  const sent = useRef(false);
  const stepHeadingRef = useRef<HTMLParagraphElement>(null);

  /* ---- step-by-step saving ---- */
  const [saveState, setSaveState] = useState<SaveState>("idle");
  /* A "Save & Continue" in flight: disables the button. */
  const [advancing, setAdvancing] = useState(false);
  const valuesRef = useRef(values);
  const honeyRef = useRef(honey);
  useEffect(() => {
    valuesRef.current = values;
    honeyRef.current = honey;
  });
  const lead = useRef<{ token?: string; formId: string } | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const lastDraft = useRef("");
  /* The save that failed last — what the indicator's Retry re-runs. */
  const failedStage = useRef<Stage | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function leadState() {
    if (!lead.current) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(LEAD_KEY) ?? "null");
        if (saved?.formId) lead.current = saved;
      } catch {
        /* Storage blocked: a fresh lead. */
      }
      lead.current ??= { formId: randomId() };
    }
    return lead.current;
  }

  /** The answers a stage carries — a draft sends only what is valid yet. */
  function stageValues(stage: Stage, current: Record<FieldName, string>) {
    if (stage === "draft") {
      const shape = projectEstimateSchema.shape;
      const valid = (field: "name" | "phone") =>
        shape[field].safeParse(current[field]).success ? { [field]: current[field] } : {};
      return { email: current.email, company: current.company, ...valid("name"), ...valid("phone") };
    }
    const fields = STEP_FIELDS.slice(0, stage).flat();
    return Object.fromEntries(fields.map((field) => [field, current[field]]));
  }

  /**
   * Saves one stage, queued behind any save still running, with the
   * answers as they are when it runs. "Saved" shows only once the server
   * has confirmed the record.
   */
  function save(stage: Stage): Promise<SaveResult> {
    const run = async (): Promise<SaveResult> => {
      const state = leadState();
      const payload = stageValues(stage, valuesRef.current);
      const fingerprint = JSON.stringify(payload);
      if (stage === "draft" && fingerprint === lastDraft.current) return { ok: true };
      setSaveState("saving");
      try {
        const response = await fetch("/api/project-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            values: payload,
            leadToken: state.token,
            formId: state.formId,
            website: honeyRef.current,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.ok || !body.leadToken) {
          failedStage.current = stage;
          setSaveState("error");
          return { ok: false, message: body.message, fieldErrors: body.fieldErrors };
        }
        state.token = body.leadToken;
        try {
          sessionStorage.setItem(LEAD_KEY, JSON.stringify(state));
        } catch {
          /* Not essential. */
        }
        if (stage === "draft") lastDraft.current = fingerprint;
        failedStage.current = null;
        setSaveState("saved");
        return { ok: true };
      } catch {
        failedStage.current = stage;
        setSaveState("error");
        return {
          ok: false,
          message: "We could not reach our server. Please check your connection and try again.",
        };
      }
    };
    const next = queue.current.then(run, run);
    queue.current = next;
    return next;
  }

  /* STEP 1 AUTO-SAVE: once typing pauses and the email is valid. Never
     per keystroke, never on later steps, never after submission. */
  useEffect(() => {
    if (step !== 0 || sent.current) return;
    if (!projectEstimateSchema.shape.email.safeParse(values.email).success) return;
    const timer = window.setTimeout(() => void save("draft"), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save() reads the latest answers itself
  }, [step, values.name, values.email, values.phone, values.company]);

  const set = (field: FieldName) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    /* Clear this field's error the moment it is touched — leaving a stale
       message under a field the visitor has just fixed is its own problem. */
    setErrors((previous) =>
      previous[field] ? { ...previous, [field]: undefined } : previous,
    );
  };

  /*
   * THE SERVICE → ESTIMATOR BRIDGE (see lib/estimator-prefill.ts). A
   * Services row click lands here and preselects the matching step-2
   * project type. Nothing else changes: the step order, the questions,
   * validation and submission are exactly as they were — the visitor still
   * walks through step 2 and can change the answer. A later click
   * overwrites an earlier preselection, because the latest click is the
   * visitor's latest intent. The value is accepted only if it is one of
   * the APPROVED options — this listener cannot add a form option.
   */
  useEffect(() => {
    const onPreselect = (event: Event) => {
      const type = (event as CustomEvent<string>).detail;
      if ((PROJECT_TYPES as readonly string[]).includes(type)) {
        setValues((previous) => ({ ...previous, projectType: type }));
        setErrors((previous) =>
          previous.projectType
            ? { ...previous, projectType: undefined }
            : previous,
        );
      }
    };
    window.addEventListener(ESTIMATOR_PRESELECT_EVENT, onPreselect);
    return () =>
      window.removeEventListener(ESTIMATOR_PRESELECT_EVENT, onPreselect);
  }, []);

  /**
   * Validates one step against the server's own field schemas.
   */
  function validateStep(index: number) {
    const shape = projectEstimateSchema.shape;
    const next: Partial<Record<FieldName, string>> = {};

    for (const field of STEP_FIELDS[index]) {
      const result = shape[field].safeParse(values[field]);
      if (!result.success) {
        next[field] = result.error.issues[0]?.message ?? "Please check this.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /**
   * Moves focus to the new step's label.
   *
   * Without this, a keyboard or screen-reader user presses "Continue" and
   * focus stays on a button that has just been replaced — so nothing is
   * announced and the next step's fields are somewhere behind them.
   */
  function goTo(index: number) {
    setStep(index);
    setFormError(null);
    requestAnimationFrame(() => stepHeadingRef.current?.focus());
  }

  /* "Not saved — Retry": re-run the save that failed, through the same
     path as the visitor's own action (so validation and moving on apply). */
  function retrySave() {
    const stage = failedStage.current;
    if (stage === "draft") void save("draft");
    else if (stage === 4) formRef.current?.requestSubmit();
    else if (stage !== null) void onNext();
  }

  /* SAVE & CONTINUE: validate, save, and move on only once it is saved. */
  async function onNext() {
    if (advancing || !validateStep(step)) return;
    setAdvancing(true);
    setFormError(null);
    const result = await save((step + 1) as Stage);
    setAdvancing(false);
    if (result.ok) {
      goTo(step + 1);
      return;
    }
    if (result.fieldErrors) setErrors(result.fieldErrors);
    setFormError(result.message ?? "We couldn't save your progress. Please try again.");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (status === "submitting" || sent.current) return;
    if (!validateStep(step)) return;

    const parsed = projectEstimateSchema.safeParse({
      kind: "estimator",
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
      /* Send them back to the earliest step that actually has a problem,
         rather than showing an error about a field three steps behind. */
      const broken = STEP_FIELDS.findIndex((fields) =>
        fields.some((field) => next[field]),
      );
      if (broken >= 0 && broken !== step) goTo(broken);
      return;
    }

    setStatus("submitting");
    setFormError(null);

    /* The final save: the whole form, marking the lead completed. */
    const result = await save(4);
    if (!result.ok) {
      setStatus("idle");
      setFormError(
        result.message ??
          "We could not submit your request just now. Please email us at hello@midis.in.",
      );
      if (result.fieldErrors) setErrors(result.fieldErrors);
      return;
    }

    /* Only now — the CMS has confirmed the record. Never before. */
    sent.current = true;
    try {
      sessionStorage.removeItem(LEAD_KEY);
    } catch {
      /* Not essential. */
    }
    /* A lead has landed: the promotional popups stay away for the rest
       of this session (see lib/popups.ts). */
    markLeadSubmitted();
    router.push("/thank-you/project-enquiry");
  }

  const isLast = step === STEPS.length - 1;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={cn(
        /* `@container`: the field grids below follow the FORM's width,
           not the viewport's, so the form reads well both full width and in
           the hero's narrower desktop column. */
        "@container relative",
        variant === "card" &&
          "rounded-2xl border border-line bg-surface p-5 sm:p-8",
      )}
    >
      <Honeypot value={honey} onChange={setHoney} />

      {/* ================= progress ================= */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <p
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-sm font-semibold text-fg outline-none"
          >
            <span className="whitespace-nowrap text-accent-ink">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="mx-2 text-line" aria-hidden="true">
              /
            </span>
            {STEPS[step].title}
          </p>
          <SaveStatus state={saveState} onRetry={retrySave} />
        </div>

        {/*
          The bar is decorative — the sentence above already states the
          position in text, which is what a screen reader should read.
        */}
        <div
          aria-hidden="true"
          className="mt-2 flex gap-1.5 sm:mt-3"
        >
          {STEPS.map((s, index) => (
            <span
              key={s.title}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-[var(--dur-base)]",
                index <= step ? "bg-accent" : "bg-line",
              )}
            />
          ))}
        </div>
      </div>

      {/* ================= steps ================= */}
      {/*
        `key` on the wrapper restarts the entrance animation per step, which
        is what makes the transition read as movement between steps rather
        than content silently swapping in place.
      */}
      {/* mt-4 on phones, mt-7 from sm — part of the hero compaction: the
          form now sits in the first mobile screen, so its own rhythm
          tightens with the hero's. */}
      <div key={step} className="hero-rise mt-4 sm:mt-7">

        {/* ---- Step 1: Contact Details ---- */}
        {step === 0 ? (
          <div className="flex flex-col gap-1">
            {/*
              Desktop: 2-column grid (Full Name + Email, then Phone + Company).
              Mobile: single column, all fields stack vertically.
            */}
            <div className="grid gap-4 @lg:grid-cols-2">
              <TextField
                label="Full Name"
                name="name"
                autoComplete="name"
                required
                value={values.name}
                onChange={(event) => set("name")(event.target.value)}
                error={errors.name}
              />
              <TextField
                label="Email Address"
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
              {/* International: searchable country code, per-country
                  validation, E.164 value — see PhoneField. */}
              <PhoneField
                label="Phone Number"
                name="phone"
                placeholder="Phone number"
                required
                value={values.phone}
                onChange={set("phone")}
                country={phoneCountry}
                onCountryChange={setPhoneCountry}
                error={errors.phone}
              />
              <TextField
                label="Company Name"
                name="company"
                autoComplete="organization"
                optional
                value={values.company}
                onChange={(event) => set("company")(event.target.value)}
                error={errors.company}
              />
            </div>
            {/* Shown before anything is saved: Step 1 saves as they type. */}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              We save your contact details as you fill them in, so our team can follow up even if you don&rsquo;t
              finish. We won&rsquo;t add you to any mailing list.
              {PRIVACY_URL ? (
                <>
                  {" "}
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                  >
                    Privacy policy
                  </a>
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        {/* ---- Step 2: Project Type ---- */}
        {step === 1 ? (
          <OptionGroup
            legend="What do you need?"
            name="projectType"
            options={PROJECT_TYPES}
            value={values.projectType}
            onChange={set("projectType")}
            error={errors.projectType}
            required
            columns={2}
          />
        ) : null}

        {/* ---- Step 3: Requirements ---- */}
        {step === 2 ? (
          <OptionGroup
            legend="Do you have an existing website?"
            name="existingSite"
            options={EXISTING_SITE}
            value={values.existingSite}
            onChange={set("existingSite")}
            error={errors.existingSite}
            required
            columns={1}
          />
        ) : null}

        {/* ---- Step 4: Budget & Submit ---- */}
        {step === 3 ? (
          <div className="flex flex-col gap-5">
            {/*
              The summary. Shows a recap of what was collected in the previous
              steps — NOT a calculated price. See the note at the top.
            */}
            <div className="rounded-lg bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Your project, so far
              </p>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm @lg:grid-cols-2">
                {(
                  [
                    ["Name", values.name],
                    ["Email", values.email],
                    ["Project", values.projectType],
                    ["Current site", values.existingSite],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <dt className="shrink-0 text-muted">{label}:</dt>
                    <dd className="font-medium text-fg">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Four budget bands — even count lays out cleanly in two columns. */}
            <OptionGroup
              legend="What is your estimated budget?"
              name="budget"
              options={BUDGETS}
              value={values.budget}
              onChange={set("budget")}
              error={errors.budget}
              required
              columns={2}
            />

            <p className="text-xs leading-relaxed text-muted">
              {estimator.supportingText}
            </p>
          </div>
        ) : null}
      </div>

      {/* ================= errors & controls ================= */}
      {/*
        `role="alert"` so a submission failure is announced rather than only
        appearing. It sits above the buttons so it is impossible to miss.
      */}
      {formError ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-danger/30 bg-danger-soft p-4"
        >
          <FieldError id="estimator-form-error">{formError}</FieldError>
        </div>
      ) : null}

      {/* `flex-col-reverse` keeps the forward action ABOVE Back on a phone —
          the primary path should not sit under the way out. twMerge lets it
          override ButtonGroup`s own flex-col. */}
      <ButtonGroup align="between" className="estimator-actions mt-6 flex-col-reverse sm:mt-8">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => goTo(step - 1)}
            className="sm:-ml-3"
          >
            <Arrow flip />
            Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {isLast ? (
          <Button
            type="submit"
            size="lg"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <>
                <Spinner />
                Submitting…
              </>
            ) : (
              <>
                {estimator.cta}
                <Arrow />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={() => void onNext()}
            disabled={advancing}
          >
            {advancing ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              <>
                Save &amp; Continue
                <Arrow />
              </>
            )}
          </Button>
        )}
      </ButtonGroup>

      {/* Politely announces the in-flight state to assistive technology. */}
      <p aria-live="polite" className="sr-only">
        {status === "submitting" ? "Sending your project details." : advancing ? "Saving your progress." : ""}
      </p>
    </form>
  );
}

/**
 * The save indicator in the progress row: "Saving…", "Saved" (only once
 * the server confirmed the record), or "Not saved — Retry" — a button
 * that re-runs the failed save. It must never push the step label onto a
 * second line (the form would jump), so it narrows with the row: the icon
 * alone below 380px (the words stay for screen readers and on hover).
 */
function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "idle") return <span role="status" className="sr-only" />;
  const words = "sr-only min-[380px]:not-sr-only";
  if (state === "error") {
    return (
      <span role="status" className="flex shrink-0">
        <button
          type="button"
          onClick={onRetry}
          title="Not saved — retry"
          className="-my-2 flex min-h-9 items-center gap-1.5 rounded-full px-1 text-xs font-medium text-danger underline-offset-4 hover:underline"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.75v4M8 11.1v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className={words}>
            <span className="hidden sm:inline">Not saved — </span>Retry
          </span>
          <span className="sr-only min-[380px]:hidden">Not saved — Retry</span>
        </button>
      </span>
    );
  }
  return (
    <span
      role="status"
      title={state === "saving" ? "Saving…" : "Saved"}
      className="flex shrink-0 items-center gap-1.5 text-xs text-muted"
    >
      {state === "saving" ? (
        <Spinner />
      ) : (
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true" className="text-accent-ink">
          <path d="m2.5 6.3 2.3 2.4 4.7-5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className={words}>{state === "saving" ? "Saving…" : "Saved"}</span>
    </span>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      className="animate-spin"
    >
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
