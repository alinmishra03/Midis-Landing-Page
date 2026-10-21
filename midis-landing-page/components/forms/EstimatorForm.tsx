"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { FieldError, Honeypot, OptionGroup, TextField } from "./Fields";
import { BUDGETS, EXISTING_SITE, PROJECT_TYPES } from "@/content/forms";
import { ESTIMATOR_PRESELECT_EVENT } from "@/lib/estimator-prefill";
import { estimatorSchema } from "@/lib/enquiry";
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
 * disagree about what is valid. Phone is required in the UI (step 1) even
 * though the backend schema treats it as optional — the front-end check
 * ensures a number is supplied, while the backend remains permissive in case
 * of direct API calls. Advancing is blocked on a failing step — but errors
 * appear only after an attempt to advance, never while the visitor is still
 * typing their first character into a field.
 *
 * DUPLICATE SUBMISSION. Guarded twice: `status` disables the control, and
 * `sent` is a ref that survives re-renders, so a double-click, an Enter
 * keypress landing on the button, and a re-submit after a slow response all
 * resolve to one POST.
 *
 * PAYLOAD SHAPE UNCHANGED. The backend schema, Strapi mapping, and field
 * names are identical — only the order the visitor fills them in has changed.
 */

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
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [honey, setHoney] = useState("");

  const sent = useRef(false);
  const stepHeadingRef = useRef<HTMLParagraphElement>(null);

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
   * Validates one step against the server's own field schemas, plus the
   * front-end phone requirement on step 0.
   */
  function validateStep(index: number) {
    const shape = estimatorSchema.shape;
    const next: Partial<Record<FieldName, string>> = {};

    for (const field of STEP_FIELDS[index]) {
      /* Phone is required in the UI (step 0) even though the backend schema
         uses optionalPhone. Add the check here before running the schema,
         which would pass an empty string. */
      if (field === "phone" && index === 0 && values.phone.trim() === "") {
        next.phone = "Please enter your phone number.";
        continue;
      }

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

  function onNext() {
    if (validateStep(step)) goTo(step + 1);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (status === "submitting" || sent.current) return;
    if (!validateStep(step)) return;

    const parsed = estimatorSchema.safeParse({
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

      /* Only now — the CMS has confirmed the record. Never before. */
      sent.current = true;
      /* A lead has landed: the promotional popups stay away for the rest
         of this session (see lib/popups.ts). */
      markLeadSubmitted();
      router.push("/thank-you/project-enquiry");
    } catch {
      setStatus("idle");
      setFormError(
        "We could not reach our server. Please check your connection, or email us at hello@midis.in.",
      );
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "relative",
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
            <span className="text-accent-ink">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="mx-2 text-line" aria-hidden="true">
              /
            </span>
            {STEPS[step].title}
          </p>
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
            <div className="grid gap-4 sm:grid-cols-2">
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
              <TextField
                label="Phone Number"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Include country code"
                required
                value={values.phone}
                onChange={(event) => set("phone")(event.target.value)}
                error={errors.phone}
              />
              <TextField
                label="Company / Business Name"
                name="company"
                autoComplete="organization"
                optional
                value={values.company}
                onChange={(event) => set("company")(event.target.value)}
                error={errors.company}
              />
            </div>
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
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
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
      <ButtonGroup align="between" className="mt-6 flex-col-reverse sm:mt-8">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => goTo(step - 1)}
            className="sm:-ml-3"
          >
            <span aria-hidden="true">←</span> Back
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
                Sending…
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
            onClick={onNext}
          >
            Continue
            <Arrow />
          </Button>
        )}
      </ButtonGroup>

      {/* Politely announces the in-flight state to assistive technology. */}
      <p aria-live="polite" className="sr-only">
        {status === "submitting" ? "Sending your project details." : ""}
      </p>
    </form>
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
