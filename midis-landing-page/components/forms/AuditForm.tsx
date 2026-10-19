"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Button } from "@/components/ui/Button";
import {
  Checkbox,
  FieldError,
  Honeypot,
  OptionGroup,
  SelectField,
  TextField,
} from "./Fields";
import {
  AUDIT_SERVICES,
  BUDGETS,
  COUNTRIES,
  GOALS,
  auditIntro,
  consent as consentCopy,
} from "@/content/forms";
import { auditSchema } from "@/lib/enquiry";
import { MAIN_SITE_URL, site } from "@/content/site";

/**
 * PHASE 4 — the Free Website Audit lead-capture form.
 *
 * Transcribed field-for-field from MIDIS.pdf pages 15–16: the field order,
 * every option label, both consent sentences, the helper text under the
 * phone field and the submit label are all the client's approved wording.
 *
 * CONSENT, HANDLED THE WAY THE BRIEF REQUIRES
 * -------------------------------------------
 * Two checkboxes, never one. The WhatsApp consent is REQUIRED and blocks
 * submission; the marketing consent is OPTIONAL and entirely separate.
 * Neither is pre-ticked — `consent` and `marketingConsent` both initialise
 * to `false`, and a pre-ticked marketing box would be unlawful under GDPR
 * and the UK PECR regardless of what the design showed.
 *
 * NO FAKE SUCCESS. The redirect to the confirmation page happens only after
 * the API has confirmed the CMS stored the record. A network failure, a
 * rejected payload or an unreachable CMS all leave the visitor on this page
 * with an honest message and the email address as a fallback.
 *
 * SINGLE PAGE, NOT MULTI-STEP. The estimator is multi-step because it is a
 * qualifying conversation. This is a lead capture at the end of a dedicated
 * landing route — the visitor arrived intending to submit it, so splitting
 * eleven fields across four screens would add friction rather than remove
 * it. The PDF shows it as one scrolling form, and that is what it is.
 */

type FieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "company"
  | "websiteUrl"
  | "country"
  | "service"
  | "goal"
  | "budget"
  | "phone"
  | "consent";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  websiteUrl: "",
  country: "",
  service: "",
  goal: "",
  budget: "",
  phone: "",
};

export function AuditForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [honey, setHoney] = useState("");

  const sent = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const set = (field: string) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) =>
      previous[field as FieldName]
        ? { ...previous, [field]: undefined }
        : previous,
    );
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    /* Two guards, so a double-click and a re-submit after a slow response
       both resolve to exactly one POST. */
    if (status === "submitting" || sent.current) return;

    const parsed = auditSchema.safeParse({
      kind: "audit",
      ...values,
      consent,
      marketingConsent,
      website: honey,
    });

    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setFormError("Please check the highlighted fields and try again.");

      /* Move focus to the summary so the failure is announced and the
         visitor is not left at the bottom of a long form wondering why
         nothing happened. */
      requestAnimationFrame(() => errorRef.current?.focus());
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
            `We could not submit your request just now. Please email us at ${site.email}.`,
        );
        if (body.fieldErrors) setErrors(body.fieldErrors);
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      /* Confirmed stored. Only now. */
      sent.current = true;
      router.push("/thank-you/book-a-call");
    } catch {
      setStatus("idle");
      setFormError(
        `We could not reach our server. Please check your connection, or email us at ${site.email}.`,
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-2xl border border-line bg-surface p-5 sm:p-8"
    >
      <Honeypot value={honey} onChange={setHoney} />

      <h2 className="text-[length:var(--text-display-sm)] leading-tight">
        {auditIntro.formHeading}
      </h2>
      <p className="mt-2 text-sm text-muted">{auditIntro.formIntro}</p>

      {/* ---- error summary ---- */}
      {formError ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-lg border border-[#b42318]/30 bg-[#fef3f2] p-4 outline-none"
        >
          <FieldError id="audit-form-error">{formError}</FieldError>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-6">
        {/* ---- identity ---- */}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            placeholder="First name"
            required
            value={values.firstName}
            onChange={(event) => set("firstName")(event.target.value)}
            error={errors.firstName}
          />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            placeholder="Last name"
            required
            value={values.lastName}
            onChange={(event) => set("lastName")(event.target.value)}
            error={errors.lastName}
          />
        </div>

        <TextField
          label="Business email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={values.email}
          onChange={(event) => set("email")(event.target.value)}
          error={errors.email}
        />

        <TextField
          label="Company name"
          name="company"
          autoComplete="organization"
          placeholder="Your company"
          required
          value={values.company}
          onChange={(event) => set("company")(event.target.value)}
          error={errors.company}
        />

        <TextField
          label="Website URL"
          name="websiteUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://yourwebsite.com"
          required
          value={values.websiteUrl}
          onChange={(event) => set("websiteUrl")(event.target.value)}
          error={errors.websiteUrl}
        />

        {/* ---- qualification ---- */}
        <OptionGroup
          legend="Which country is your business based in?"
          name="country"
          options={COUNTRIES}
          value={values.country}
          onChange={set("country")}
          error={errors.country}
          required
          columns={2}
        />

        <OptionGroup
          legend="What service are you interested in?"
          name="service"
          options={AUDIT_SERVICES}
          value={values.service}
          onChange={set("service")}
          error={errors.service}
          required
          columns={1}
        />

        <SelectField
          label="What is your main goal?"
          name="goal"
          options={GOALS}
          value={values.goal}
          onChange={set("goal")}
          error={errors.goal}
          required
        />

        {/*
          Budget is in USD because MIDIS.pdf specifies USD. The currency is
          stated in the legend rather than left implicit, so nobody picks a
          band in the wrong currency. Flagged for confirmation — see
          docs/STATUS.md, open question 6.
        */}
        <OptionGroup
          legend="Estimated project budget (USD)"
          name="budget"
          options={BUDGETS}
          value={values.budget}
          onChange={set("budget")}
          error={errors.budget}
          required
          columns={2}
        />

        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          optional
          placeholder="Include country code"
          hint="Only request a phone number if you need it for the audit or follow-up."
          value={values.phone}
          onChange={(event) => set("phone")(event.target.value)}
          error={errors.phone}
        />
      </div>

      {/* ---- consent ---- */}
      <div className="mt-8 flex flex-col gap-4 border-t border-line pt-7">
        <Checkbox
          checked={consent}
          onChange={(next) => {
            setConsent(next);
            setErrors((previous) =>
              previous.consent ? { ...previous, consent: undefined } : previous,
            );
          }}
          error={errors.consent}
        >
          {consentCopy.required}
        </Checkbox>

        <Checkbox checked={marketingConsent} onChange={setMarketingConsent}>
          {consentCopy.marketing}
        </Checkbox>

        <p className="text-xs leading-relaxed text-muted">
          By submitting, you agree that MIDIS may use your details to respond
          to your request, as described in its{" "}
          <a
            href={`${MAIN_SITE_URL}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-2 hover:decoration-accent"
          >
            Privacy Policy
          </a>
          . Marketing permissions are optional and separate.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting"}
        className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-65"
      >
        {status === "submitting" ? (
          <>
            <Spinner />
            Sending…
          </>
        ) : (
          <>
            {auditIntro.submitLabel}
            <Arrow />
          </>
        )}
      </Button>

      <p aria-live="polite" className="sr-only">
        {status === "submitting" ? "Sending your audit request." : ""}
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
