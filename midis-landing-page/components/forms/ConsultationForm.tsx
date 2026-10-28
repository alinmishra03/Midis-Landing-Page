"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Country } from "react-phone-number-input/max";
import { Eyebrow } from "@/components/ui/Section";
import { Arrow, Button } from "@/components/ui/Button";
import { FieldError, Honeypot, SelectField, TextField } from "@/components/forms/Fields";
import { PhoneField } from "@/components/forms/PhoneField";
import { site } from "@/content/site";
import {
  CONSULTATION_SERVICES,
  MEETING_URL,
  consultationForm as copy,
  type ConsultationService,
} from "@/content/forms";
import { consultationSchema, type ConsultationSource } from "@/lib/consultation";
import { ESTIMATOR_PRESELECT_EVENT } from "@/lib/estimator-prefill";
import { markLeadSubmitted } from "@/lib/popups";

/**
 * THE CONSULTATION FORM (MIDIS client-approved brief, 2026-10-28).
 *
 * ONE COMPONENT for every place a visitor can ask for a consultation — the
 * homepage hero (`#estimator`), the lead popup and the Free Website Audit
 * page's in-place form — so the heading, description, five fields, options,
 * validation, submit button, consent line and thank-you screen can never
 * drift apart. It replaced the four-step Project Estimator. All wording
 * lives in content/forms.ts (`consultationForm`), verbatim from the brief.
 *
 * VALIDATION is lib/consultation.ts's schema, the same one the server runs:
 * name, business email, an international phone number checked against the
 * chosen country's numbering plan, an optional website (validated only when
 * filled), and one of the five approved services.
 *
 * SUBMISSION → /api/consultation → MIDIS admin Strapi. The thank-you screen
 * appears ONLY once the route confirms Strapi stored the record; any error
 * keeps every value in place and says what to do. A pending request
 * disables the button, and a second submit is ignored. A success marks the
 * session (lib/popups.ts), so the lead popup does not pitch again.
 *
 * THE THANK-YOU SCREEN has one action: the HubSpot meetings link, opened in
 * a new tab (Button adds target/rel for external URLs). No automatic
 * redirect, no "Maybe later" — the follow-up note is plain text.
 */

type FieldName = "name" | "email" | "phone" | "website" | "service";

const EMPTY: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  website: "",
  service: "",
};

/* The order errors are reported and focused in — the fields' own order. */
const ORDER: FieldName[] = ["name", "email", "phone", "website", "service"];

export function ConsultationForm({
  source,
  titleId,
  descriptionId,
}: {
  /** Where the lead came from — stored with it. */
  source: ConsultationSource;
  /** Lets a dialog name itself after the visible heading. */
  titleId?: string;
  descriptionId?: string;
}) {
  const ownTitleId = useId();
  const ownDescriptionId = useId();
  const headingId = titleId ?? ownTitleId;
  const introId = descriptionId ?? ownDescriptionId;

  const [values, setValues] = useState(EMPTY);
  const [country, setCountry] = useState<Country>("IN");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [honey, setHoney] = useState("");
  const [sent, setSent] = useState(false);
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);

  const set = (field: FieldName) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  /* THE SERVICE → FORM BRIDGE (lib/estimator-prefill.ts): a Services card
     link preselects its matching approved option in the homepage form. */
  useEffect(() => {
    if (source !== "homepage") return;
    const onPreselect = (event: Event) => {
      const service = (event as CustomEvent<string>).detail;
      if ((CONSULTATION_SERVICES as readonly string[]).includes(service)) {
        setValues((prev) => ({ ...prev, service: service as ConsultationService }));
        setErrors((prev) => (prev.service ? { ...prev, service: undefined } : prev));
      }
    };
    window.addEventListener(ESTIMATOR_PRESELECT_EVENT, onPreselect);
    return () => window.removeEventListener(ESTIMATOR_PRESELECT_EVENT, onPreselect);
  }, [source]);

  /* The thank-you heading takes focus, so it is announced and the next Tab
     reaches the booking button. */
  useEffect(() => {
    if (sent) thanksRef.current?.focus({ preventScroll: true });
  }, [sent]);

  function focusField(field: FieldName) {
    const name = field === "website" ? "websiteUrl" : field;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${name}"]:not([tabindex="-1"])`)
      ?.focus();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || sent) return;

    const parsed = consultationSchema.safeParse({ ...values, source, hp: honey });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (ORDER.includes(key) && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = ORDER.find((field) => next[field]);
      if (first) focusField(first);
      return;
    }

    sending.current = true;
    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source, hp: honey }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.ok) {
        setFormError(
          body.message ??
            `We could not submit your request just now. Please try again, or email us at ${site.email}.`,
        );
        if (body.fieldErrors) setErrors(body.fieldErrors);
        return;
      }

      /* Only now — the CMS has confirmed the record. */
      markLeadSubmitted();
      setSent(true);
    } catch {
      setFormError(
        `We could not reach our server. Please check your connection and try again, or email us at ${site.email}.`,
      );
    } finally {
      sending.current = false;
      setStatus("idle");
    }
  }

  if (sent) {
    return <ThankYou headingId={headingId} headingRef={thanksRef} />;
  }

  const fields = copy.fields;

  return (
    /* COMPACT LAYOUT (MIDIS brief, 2026-10-28): 44px fields (46px on
       phones), 13px labels 6px above them, 14px rows, 12px columns, a 48px
       submit — sizes in globals.css under `.consult-form`. */
    <div className="consult-form">
      <Eyebrow className="mb-1.5">Start your project</Eyebrow>
      <h2
        id={headingId}
        className="font-display text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.02em] text-balance sm:text-[1.5rem]"
      >
        {copy.heading}
      </h2>
      <p id={introId} className="mt-1.5 text-sm leading-[1.55] text-muted">
        {copy.description}
      </p>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        aria-busy={status === "submitting" || undefined}
        /* `@container`: the field PAIRS (name + email, phone + website)
           sit side by side only when the FORM itself is at least 25rem
           (400px) wide — each half then keeps ~194px, enough for the phone
           field's country code plus a usable number box. Narrower (phones,
           the hero column below ~1265px) it is one column. The viewport is
           never consulted: the same form lives in a sidebar and a dialog. */
        className="@container relative mt-4"
      >
        <Honeypot value={honey} onChange={setHoney} />

        <div className="consult-fields grid gap-x-3 gap-y-3.5 @[25rem]:grid-cols-2">
          <TextField
            label={fields.name.label}
            name="name"
            autoComplete="name"
            required
            placeholder={fields.name.placeholder}
            value={values.name}
            onChange={(event) => set("name")(event.target.value)}
            error={errors.name}
          />
          <TextField
            label={fields.email.label}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={fields.email.placeholder}
            value={values.email}
            onChange={(event) => set("email")(event.target.value)}
            error={errors.email}
          />
          <PhoneField
            label={fields.phone.label}
            name="phone"
            required
            placeholder={fields.phone.placeholder}
            value={values.phone}
            onChange={set("phone")}
            country={country}
            onCountryChange={setCountry}
            error={errors.phone}
          />
          <TextField
            label={fields.website.label}
            name="websiteUrl"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={fields.website.placeholder}
            value={values.website}
            onChange={(event) => set("website")(event.target.value)}
            error={errors.website}
          />
          <div className="@[25rem]:col-span-2">
            <SelectField
              label={fields.service.label}
              name="service"
              options={CONSULTATION_SERVICES}
              placeholder="Select an option"
              required
              value={values.service}
              onChange={set("service")}
              error={errors.service}
            />
          </div>
        </div>

        {formError ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3"
          >
            <FieldError id={`${headingId}-form-error`}>{formError}</FieldError>
          </div>
        ) : null}

        <Button
          type="submit"
          size="md"
          disabled={status === "submitting"}
          className="consult-submit mt-4 w-full whitespace-nowrap"
        >
          {status === "submitting" ? (
            <>
              <SpinnerGlyph />
              Submitting…
            </>
          ) : (
            <>
              {copy.submit}
              <Arrow />
            </>
          )}
        </Button>

        <p className="consult-consent mt-2.5 text-xs leading-normal sm:text-[0.8125rem]">
          {copy.consent}
        </p>

        <p aria-live="polite" className="sr-only">
          {status === "submitting" ? "Submitting your request." : ""}
        </p>
      </form>
    </div>
  );
}

/* ========================================================================== */

function ThankYou({
  headingId,
  headingRef,
}: {
  headingId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const t = copy.thankYou;
  return (
    <div className="hero-rise text-center">
      <span aria-hidden="true" className="consult-success">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path
            d="M6.5 12.4l3.6 3.6 7.4-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <h2
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className="mt-4 font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-balance focus:outline-none sm:text-[1.75rem]"
      >
        {t.heading}
      </h2>
      {t.confirmation.map((line) => (
        <p key={line} className="mx-auto mt-2 max-w-[28rem] text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          {line}
        </p>
      ))}

      <div className="mt-6 border-t border-line pt-6">
        <h3 className="font-display text-lg font-semibold leading-snug sm:text-xl">
          {t.meetingHeading}
        </h3>
        <p className="mx-auto mt-2 max-w-[28rem] text-sm leading-relaxed text-muted">
          {t.meetingDescription}
        </p>
        <Button href={MEETING_URL} size="lg" className="consult-submit mt-5 w-full">
          {t.meetingCta}
          <Arrow />
          <span className="sr-only"> (opens in a new tab)</span>
        </Button>
      </div>

      <div className="mt-5 space-y-1.5 text-sm leading-relaxed text-muted">
        {t.followUp.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function SpinnerGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="animate-spin">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
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
