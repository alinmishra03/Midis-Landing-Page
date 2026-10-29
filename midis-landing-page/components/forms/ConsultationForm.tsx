"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Country } from "react-phone-number-input/max";
import { Eyebrow } from "@/components/ui/Section";
import { Arrow, Button } from "@/components/ui/Button";
import { FieldError, Honeypot, SelectField, TextField } from "@/components/forms/Fields";
import { PhoneField } from "@/components/forms/PhoneField";
import { site } from "@/content/site";
import {
  CONSULTATION_SERVICES,
  consultationForm as copy,
  type ConsultationService,
} from "@/content/forms";
import { consultationSchema, type ConsultationSource } from "@/lib/consultation";
import { ESTIMATOR_PRESELECT_EVENT } from "@/lib/estimator-prefill";
import { markLeadSubmitted } from "@/lib/popups";
import { cn } from "@/lib/utils";

/**
 * THE CONSULTATION FORM (MIDIS client-approved brief, 2026-10-28).
 *
 * ONE COMPONENT for every place a visitor can ask for a consultation — the
 * homepage hero (`#estimator`), the lead popup and the Free Website Audit
 * page's in-place form — so the heading, description, five fields, options,
 * validation, submit button and consent line can never drift apart. It
 * replaced the four-step Project Estimator. All wording lives in
 * content/forms.ts (`consultationForm`), verbatim from the brief.
 *
 * VALIDATION is lib/consultation.ts's schema, the same one the server runs:
 * name, business email, an international phone number checked against the
 * chosen country's numbering plan, an optional website (validated only when
 * filled), and one of the five approved services.
 *
 * SUBMISSION → /api/consultation → the unified Strapi collection
 * portfolio-inquiries (lib/portfolio-inquiry.ts). Only once the route
 * confirms Strapi stored the record does the visitor move on — client-side,
 * to the dedicated /thank-you page (MIDIS brief, 2026-10-29), with nothing
 * from the form in the URL or in storage. Any error keeps every value in
 * place and says what to do. A pending request disables the button, and a
 * second submit is ignored; the button stays disabled through the
 * navigation. A success marks the session (lib/popups.ts), so the lead
 * popup does not pitch again.
 */

/** The dedicated confirmation page (app/thank-you/page.tsx). */
const THANK_YOU_PATH = "/thank-you";

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
  layout = "stacked",
  titleId,
  descriptionId,
  onSubmitted,
}: {
  /** Where the form is rendered (the homepage one takes the Services
      preselect). Every record is stored with sourceWebsite "midis-portfolio". */
  source: ConsultationSource;
  /** "wide" (the homepage hero panel): from xl the heading block sits
      beside the fields instead of above them. "popup" (the lead popup):
      tighter spacing and never more than two columns, however wide the
      dialog. Content is identical in every layout. */
  layout?: "stacked" | "wide" | "popup";
  /** Lets a dialog name itself after the visible heading. */
  titleId?: string;
  descriptionId?: string;
  /** Runs after a confirmed submission, just before the redirect — the
      popup closes itself here. */
  onSubmitted?: () => void;
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
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

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

  /* A success has exactly one destination; fetch it ahead so the redirect
     is instant. */
  useEffect(() => {
    router.prefetch(THANK_YOU_PATH);
  }, [router]);

  /* Next keeps the page we leave mounted but hidden (React <Activity>, see
     node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md),
     so without this a visitor returning from /thank-you would find the
     form still "Submitting…" with their details in it. The cleanup runs as
     the page is hidden; the ref limits it to after a confirmed submission,
     so an unsent draft is still kept. */
  const resetOnHide = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (!resetOnHide.current) return;
      resetOnHide.current = false;
      sending.current = false;
      setValues(EMPTY);
      setCountry("IN");
      setErrors({});
      setFormError(null);
      setHoney("");
      setStatus("idle");
    };
  }, []);

  function focusField(field: FieldName) {
    const name = field === "website" ? "websiteUrl" : field;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${name}"]:not([tabindex="-1"])`)
      ?.focus();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current) return;

    const parsed = consultationSchema.safeParse({ ...values, hp: honey });
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
        body: JSON.stringify({ ...values, hp: honey }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.ok) {
        setFormError(
          body.message ??
            `We could not submit your request just now. Please try again, or email us at ${site.email}.`,
        );
        if (body.fieldErrors) setErrors(body.fieldErrors);
        sending.current = false;
        setStatus("idle");
        return;
      }
    } catch {
      setFormError(
        `We could not reach our server. Please check your connection and try again, or email us at ${site.email}.`,
      );
      sending.current = false;
      setStatus("idle");
      return;
    }

    /* Only now — the CMS has confirmed the record. `sending` and the
       disabled button are left as they are until the confirmation page
       replaces this one, so nothing can be submitted twice on the way. */
    markLeadSubmitted();
    resetOnHide.current = true;
    onSubmitted?.();
    router.push(THANK_YOU_PATH);
  }

  const fields = copy.fields;
  const wide = layout === "wide";
  const popup = layout === "popup";

  return (
    /* COMPACT LAYOUT (MIDIS brief, 2026-10-28): 44px fields (46px on
       phones), 13px labels 6px above them, 14px rows, 12px columns, a 48px
       submit — sizes in globals.css under `.consult-form`. */
    <div
      className={cn(
        "consult-form",
        popup && "consult-popup",
        wide && "xl:grid xl:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] xl:items-start xl:gap-x-12",
      )}
    >
      <div>
        <Eyebrow className={popup ? "mb-1" : "mb-1 md:mb-1.5"}>Start your project</Eyebrow>
        <h2
          id={headingId}
          className={cn(
            /* 20px below 768px (mobile compact pass, 2026-10-28), 24px above. */
            "font-display text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.02em] text-balance md:text-[1.5rem]",
            wide && "xl:text-[1.75rem] xl:leading-[1.15]",
          )}
        >
          {copy.heading}
        </h2>
        <p
          id={introId}
          className={cn(
            "mt-1 text-[0.8125rem] leading-[1.5] text-muted md:mt-1.5 md:text-sm md:leading-[1.55]",
            wide && "xl:mt-3",
            popup && "md:mt-1 md:text-[0.84375rem] md:leading-[1.5]",
          )}
        >
          {copy.description}
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        aria-busy={status === "submitting" || undefined}
        /* `@container`: the field PAIRS (name + email, phone + website)
           sit side by side only when the FORM itself is at least 25rem
           (400px) wide — each half then keeps ~194px, enough for the phone
           field's country code plus a usable number box; from 42rem (672px,
           the hero's wide panel) THREE per row — name / email / phone, then
           website / service / the submit. Narrower (phones) it is one
           column. The viewport is never consulted: the same form lives in
           the hero, a dialog and the audit page. */
        className={cn("@container relative mt-3 md:mt-4", wide && "xl:mt-0", popup && "md:mt-3.5")}
      >
        <Honeypot value={honey} onChange={setHoney} />

        <div
          className={cn(
            "consult-fields grid gap-x-3 @[25rem]:grid-cols-2",
            /* The popup stays at two columns (its brief), 12px rows. */
            /* Rows: 10px (popup) / 12px on phones, 12 / 14px from 768px. */
            popup ? "gap-y-2.5 md:gap-y-3" : "gap-y-3 md:gap-y-3.5 @[42rem]:grid-cols-3",
          )}
        >
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
          <div className={cn("@[25rem]:col-span-2", !popup && "@[42rem]:col-span-1")}>
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

          {/* In three columns the submit is the row's third cell: the top
              padding is a label's height plus its gap, so the button lines
              up with the inputs beside it, even when they show errors. */}
          <div className={cn("@[25rem]:col-span-2", !popup && "@[42rem]:col-span-1 @[42rem]:pt-[1.625rem]")}>
            <Button
              type="submit"
              size="md"
              disabled={status === "submitting"}
              className={cn(
                "consult-submit w-full whitespace-nowrap",
                /* 44px (popup) / 46px on phones; 46 / 48px from 768px. */
                popup
                  ? "min-h-11 md:min-h-[2.875rem]"
                  : "mt-0.5 min-h-[2.875rem] md:min-h-12 @[42rem]:mt-0 @[42rem]:min-h-11",
              )}
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
          </div>

          {formError ? (
            <div
              role="alert"
              className="col-span-full rounded-lg border border-danger/30 bg-danger-soft p-3"
            >
              <FieldError id={`${headingId}-form-error`}>{formError}</FieldError>
            </div>
          ) : null}
        </div>

        <p
          className={cn(
            "consult-consent text-xs leading-normal sm:text-[0.8125rem]",
            popup ? "mt-2" : "mt-2 md:mt-2.5",
          )}
        >
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
