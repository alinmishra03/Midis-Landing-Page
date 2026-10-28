"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
import { ConsultationForm } from "@/components/forms/ConsultationForm";
import { Checkbox, FieldError, TextField } from "@/components/forms/Fields";
import { consent } from "@/content/forms";
import { footerLegal } from "@/content/site";
import {
  BAND_LABEL,
  CATEGORIES,
  PRIORITY_LABEL,
  band,
  interpret,
  scopeLabel,
  type AuditResult,
  type Issue,
  type Strategy,
} from "@/lib/audit/types";
import { cn } from "@/lib/utils";

/**
 * THE FREE WEBSITE AUDIT TOOL (MIDIS brief, 2026-10-23) — replaces the
 * old request-an-audit form. Three steps, styled exactly like the Project
 * Estimator (same card, step line, segment bar, fields and buttons):
 *
 *   1. Website Analysis — the URL, then a REAL audit (/api/audit):
 *      Google Lighthouse via PageSpeed Insights plus direct page checks.
 *      While it runs: an indeterminate shimmer and rotating status lines
 *      (presentation states — no fake percentage).
 *   2. Contact Details — name, email, phone (all required), the privacy
 *      notice, an optional unticked marketing opt-in. /api/audit/report
 *      builds the PDF, emails it, notifies MIDIS, stores the lead.
 *   3. Your Audit Results — the real scores, the top three findings, and
 *      the TRUE email status: "accepted" only when the provider accepted it;
 *      otherwise a retry, and the PDF to download either way.
 *
 * Nothing is invented on the client: every score and finding shown here
 * arrives from the server's audit, and anything not measured renders as
 * "Not available".
 *
 * PROGRESS SURVIVES A RELOAD (sessionStorage: the URL, the sealed audit
 * token and the request id) so nobody re-runs an audit or re-types it.
 * Contact details are NOT stored in the browser.
 */

const STEPS = [
  { title: "Website Analysis" },
  { title: "Contact Details" },
  { title: "Your Audit Results" },
] as const;

/* The audit's REAL stages, driven by the server's progress stream
   (app/api/audit/route.ts): a stage is shown as finished only once the
   server has said so — never on a timer. Mobile and desktop run in
   parallel, so both can be in progress at once. */
type StageState = "pending" | "running" | "done" | "failed";
interface Progress {
  connect: StageState;
  mobile: StageState;
  desktop: StageState;
  prepare: StageState;
}
const STAGES: { key: keyof Progress; label: string }[] = [
  { key: "connect", label: "Connecting to Google PageSpeed Insights" },
  { key: "mobile", label: "Analysing mobile performance" },
  { key: "desktop", label: "Analysing desktop performance" },
  { key: "prepare", label: "Preparing your audit results" },
];
const START: Progress = { connect: "running", mobile: "pending", desktop: "pending", prepare: "pending" };

function advance(progress: Progress, event: { stage?: string; outcome?: string }): Progress {
  switch (event.stage) {
    case "lighthouse":
      return { ...progress, connect: "done", mobile: "running", desktop: "running" };
    case "mobile":
    case "desktop":
      return { ...progress, [event.stage]: event.outcome === "done" ? "done" : "failed" };
    case "preparing":
      return { ...progress, prepare: "running" };
    default:
      return progress;
  }
}

/** The line announced (and shown first): the earliest unfinished stage. */
function currentLine(progress: Progress): string {
  const mobile = progress.mobile === "running";
  const desktop = progress.desktop === "running";
  if (progress.connect === "running") return STAGES[0].label;
  if (mobile && desktop) return "Analysing mobile and desktop performance";
  if (mobile) return STAGES[1].label;
  if (desktop) return STAGES[2].label;
  return STAGES[3].label;
}

/* v2: audits now carry an ID — a v1 session from before is not restored. */
const STORE_KEY = "midis-audit-v2";
const CLIENT_TIMEOUT_MS = 75_000;
const PRIVACY_URL = footerLegal.find((l) => /privacy/i.test(l.label))?.href;

interface Preview {
  auditId: string;
  url: string;
  analyzedAt: string;
  status: "complete" | "partial";
  note?: string;
  /** False until Resend is configured: Step 2 then promises a download,
      not an email. */
  emailEnabled?: boolean;
}

interface Report {
  reference: string;
  email: { status: "accepted" | "failed" | "not_configured"; address: string };
  /** Whether MIDIS has the lead (saved in the CMS or notified by email). */
  lead: { saved: boolean };
  result: AuditResult;
  top: Issue[];
  /** Null when the PDF could not be generated. */
  pdf: string | null;
}

type ContactField = "name" | "email" | "phone";

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function validateContact(values: Record<ContactField, string>) {
  const errors: Partial<Record<ContactField, string>> = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your full name.";
  const email = values.email.trim();
  if (!email) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Please enter a valid email address.";
  const phone = values.phone.trim();
  const digits = phone.replace(/\D/g, "").length;
  if (!phone) errors.phone = "Please enter your phone number.";
  else if (!/^\+[\d\s().-]+$/.test(phone)) errors.phone = "Please include your country code, starting with +.";
  else if (digits < 8 || digits > 15) errors.phone = "Please enter a valid international phone number.";
  return errors;
}

export function WebsiteAuditTool() {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string>();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>(START);
  /* Step 1 failed in a way worth retrying: offer a retry button. */
  const [retryable, setRetryable] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [requestId, setRequestId] = useState("");

  const [values, setValues] = useState<Record<ContactField, string>>({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  /* "Discuss These Improvements" opens the Project Estimator right here. */
  const [estimating, setEstimating] = useState(false);
  const estimatorRef = useRef<HTMLDivElement>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [honey, setHoney] = useState("");
  const stepHeadingRef = useRef<HTMLParagraphElement>(null);
  const firstRender = useRef(true);
  const busy = useRef(false);
  const emails = preview?.emailEnabled !== false;

  /* Restore an in-progress audit (after a reload or coming back). */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "null");
      if (saved?.token && saved?.preview) {
        /* One-time hydration from storage after mount — client-only data. */
        /* eslint-disable react-hooks/set-state-in-effect */
        setUrl(saved.url ?? "");
        setToken(saved.token);
        setPreview(saved.preview);
        setRequestId(saved.requestId ?? newRequestId());
        setStep(1);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      /* Storage blocked: start fresh. */
    }
  }, []);

  /* Move focus to the step line on every step change (not on load). */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus({ preventScroll: true });
    stepHeadingRef.current?.closest("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function persist(next: { url: string; token: string; preview: Preview; requestId: string } | null) {
    try {
      if (next) sessionStorage.setItem(STORE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* Not essential. */
    }
  }

  async function runAudit() {
    if (busy.current) return;
    const value = url.trim();
    if (!value) {
      setUrlError("Please enter your website address.");
      return;
    }
    if (!/\./.test(value) || /\s/.test(value)) {
      setUrlError("Please enter a valid website address, for example https://www.yourwebsite.com.");
      return;
    }
    busy.current = true;
    setUrlError(undefined);
    setFormError(null);
    setRetryable(false);
    setRunning(true);
    setProgress(START);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ url: value, hp: honey }),
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      });
      /* Input errors come back as plain JSON before any audit starts; a
         running audit streams its progress, then its result. */
      let status = response.status;
      let body: { ok?: boolean; field?: string; message?: string; retryable?: boolean; token?: string; preview?: Preview } = {};
      if (response.body && response.headers.get("content-type")?.includes("application/x-ndjson")) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        for (;;) {
          const { done, value: chunk } = await reader.read();
          if (chunk) buffer += decoder.decode(chunk, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line) continue;
            const event = JSON.parse(line);
            if (event.type === "progress") setProgress((p) => advance(p, event));
            else if (event.type === "result") {
              status = event.status;
              body = event.body ?? {};
              finished = true;
            }
          }
          if (done) break;
        }
        /* The stream ended without a result: the platform cut it off. */
        if (!finished) status = 504;
      } else {
        body = await response.json().catch(() => ({}));
      }
      if (status !== 200 || !body.ok || !body.token || !body.preview) {
        setRetryable(body.field !== "url" && status !== 429 && status !== 400);
        /* The server's message is written for visitors; fall back only when
           there is none (e.g. the platform itself failed). */
        if (body.field === "url") setUrlError(body.message);
        else
          setFormError(
            body.message ??
              (status >= 500
                ? "Our audit service is temporarily unavailable. Please try again shortly."
                : "We couldn't analyze this website. Please check the URL and try again."),
          );
        return;
      }
      setProgress((p) => ({ ...p, prepare: "done" }));
      const id = newRequestId();
      setToken(body.token);
      setPreview(body.preview);
      setRequestId(id);
      persist({ url: value, token: body.token, preview: body.preview, requestId: id });
      setStep(1);
    } catch (error) {
      setFormError(
        (error as Error).name === "TimeoutError"
          ? "The audit is taking longer than expected. Your website may be slow to respond — please try again."
          : "We couldn't reach our audit service. Please check your connection and try again.",
      );
      setRetryable(true);
    } finally {
      busy.current = false;
      setRunning(false);
    }
  }

  async function deliver(mode: "submit" | "retry-email") {
    if (busy.current || !token) return;
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    busy.current = true;
    setFormError(null);
    if (mode === "submit") setSubmitting(true);
    else setRetrying(true);
    try {
      const response = await fetch("/api/audit/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          requestId,
          mode,
          hp: honey,
          contact: { ...values, marketingConsent: marketing },
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        if (body.fieldErrors) setErrors(body.fieldErrors);
        if (body.expired) {
          persist(null);
          setToken(null);
          setPreview(null);
          setStep(0);
        }
        setFormError(
          response.status >= 500 && !body.message
            ? "Our audit service is temporarily unavailable. Please try again shortly."
            : (body.message ?? "We couldn't send your report just now. Please try again."),
        );
        return;
      }
      setReport({ reference: body.reference, lead: body.lead, email: body.email, result: body.result, top: body.top, pdf: body.pdf });
      persist(null);
      setStep(2);
    } catch {
      setFormError("We couldn't reach our server. Please check your connection and try again.");
    } finally {
      busy.current = false;
      setSubmitting(false);
      setRetrying(false);
    }
  }

  function restart() {
    persist(null);
    setToken(null);
    setPreview(null);
    setReport(null);
    setEstimating(false);
    setFormError(null);
    setRetryable(false);
    setUrl("");
    setStep(0);
  }

  /* Open the estimator below the results, then bring it into view and put
     focus on its first question — what every estimator link does. */
  useEffect(() => {
    if (!estimating) return;
    const shell = estimatorRef.current;
    if (!shell) return;
    shell.scrollIntoView({ behavior: "smooth", block: "start" });
    /* The first real field — never the hidden spam trap (tabIndex -1). */
    shell
      .querySelector<HTMLElement>("form :is(input, select, textarea):not([tabindex='-1'])")
      ?.focus({ preventScroll: true });
  }, [estimating]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 0) void runAudit();
    else if (step === 1) void deliver("submit");
  }

  const set = (field: ContactField) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={running || submitting}
      className="relative scroll-mt-28 rounded-2xl border border-line bg-surface p-5 sm:p-8"
    >
      {/* SPAM TRAP. Not the shared offscreen Honeypot: that field is named
          "website", and on a form ABOUT websites browsers and password
          managers autofilled it, so real visitors were rejected at step 2.
          display:none means no autofill can reach this one; only bots that
          fill every input in the markup will. */}
      <input
        type="text"
        name="mx-hp-ref"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honey}
        onChange={(event) => setHoney(event.target.value)}
        style={{ display: "none" }}
      />

      {/* ================= progress (the estimator's own pattern) ================= */}
      <div>
        <p ref={stepHeadingRef} tabIndex={-1} className="text-sm font-semibold text-fg outline-none">
          <span className="text-accent-ink">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="mx-2 text-line" aria-hidden="true">
            —
          </span>
          {STEPS[step].title}
        </p>
        <div aria-hidden="true" className="mt-2 flex gap-1.5 sm:mt-3">
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

      <div key={step} className="hero-rise mt-6 sm:mt-8">
        {step === 0 ? (
          <StepUrl
            url={url}
            onUrl={(value) => {
              setUrl(value);
              if (urlError) setUrlError(undefined);
            }}
            error={urlError}
            running={running}
            progress={progress}
          />
        ) : null}

        {step === 1 && preview ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">Your Website Audit Is Ready.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                {emails
                  ? "Tell us where to send your complete website audit report."
                  : "Enter your details to see your results and download your complete website audit report."}
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-paper p-4 text-sm">
              <CheckGlyph className={preview.status === "complete" ? "text-accent-ink" : "text-muted"} />
              <div className="min-w-0">
                <p className="font-medium text-fg">
                  {preview.status === "complete" ? "Audit complete for " : "Audit finished (partial) for "}
                  <span className="[overflow-wrap:anywhere]">{preview.url}</span>
                </p>
                {preview.note ? <p className="mt-1 text-xs leading-relaxed text-muted">{preview.note}</p> : null}
                <button
                  type="button"
                  onClick={restart}
                  className="mt-1.5 text-xs font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                >
                  Audit a different website
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  required
                  value={values.name}
                  onChange={(event) => set("name")(event.target.value)}
                  error={errors.name}
                />
              </div>
              <TextField
                label="Email Address"
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
            </div>

            <p className="text-xs leading-relaxed text-muted">
              MIDIS will use these details to {emails ? "send" : "provide"} your requested audit report and to follow up about
              it.
              {PRIVACY_URL ? (
                <>
                  {" "}
                  See our{" "}
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                  >
                    privacy policy
                  </a>
                  .
                </>
              ) : null}
            </p>

            <Checkbox checked={marketing} onChange={setMarketing}>
              {/* The approved marketing-consent wording, optional and unticked. */}
              <span className="text-muted">
                {consent.marketing} <span className="text-muted/80">(optional)</span>
              </span>
            </Checkbox>
          </div>
        ) : null}

        {step === 2 && report ? (
          <StepResults
            report={report}
            retrying={retrying}
            onRetry={() => void deliver("retry-email")}
            onRestart={restart}
            onDiscuss={() => setEstimating(true)}
          />
        ) : null}
      </div>

      {formError ? (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger-soft p-4">
          <FieldError id="audit-form-error">{formError}</FieldError>
          {step === 0 && retryable && !running ? (
            <button
              type="button"
              onClick={() => void runAudit()}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
            >
              Try the analysis again
            </button>
          ) : null}
        </div>
      ) : null}

      {step < 2 ? (
        <ButtonGroup align="between" className="mt-6 flex-col-reverse sm:mt-8">
          <span className="hidden sm:block" />
          <Button type="submit" size="lg" disabled={running || submitting}>
            {step === 0 ? (
              running ? (
                <>
                  <Spinner />
                  Analysing…
                </>
              ) : (
                <>
                  Analyze My Website
                  <Arrow />
                </>
              )
            ) : submitting ? (
              <>
                <Spinner />
                Preparing your report…
              </>
            ) : (
              <>
                {emails ? "Send My Free Audit Report" : "View My Audit Results"}
                <Arrow />
              </>
            )}
          </Button>
        </ButtonGroup>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {running ? currentLine(progress) : submitting ? (emails ? "Preparing and sending your report." : "Preparing your report.") : ""}
      </p>
    </form>

    {estimating ? (
      /* The landing page's own consultation form — the same component as
         the homepage hero and the lead popup (it replaced the four-step
         estimator, 2026-10-28), opened in place. A sibling of the audit
         form, never inside it (forms can't nest). */
      <div ref={estimatorRef} id="estimator" className="hero-rise scroll-mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <ConsultationForm source="audit" />
      </div>
    ) : null}
    </div>
  );
}

/* ========================================================================== */

function StepUrl({
  url,
  onUrl,
  error,
  running,
  progress,
}: {
  url: string;
  onUrl: (value: string) => void;
  error?: string;
  running: boolean;
  progress: Progress;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">Let&rsquo;s See How Your Website Performs.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          Enter your website URL to discover opportunities to improve its performance, SEO, accessibility, and user
          experience.
        </p>
      </div>

      <TextField
        label="Your Website URL"
        name="url"
        type="url"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="https://www.yourwebsite.com"
        required
        disabled={running}
        value={url}
        onChange={(event) => onUrl(event.target.value)}
        error={error}
      />

      {running ? (
        <div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
          <ul className="flex flex-col gap-2.5">
            {STAGES.map(({ key, label }) => {
              const state = progress[key];
              return (
                <li key={key} className="flex items-center gap-3">
                  {state === "running" ? (
                    <Spinner className="text-accent-ink" />
                  ) : state === "done" ? (
                    <CheckGlyph className="mt-0 size-4 text-accent-ink" />
                  ) : state === "failed" ? (
                    <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center text-sm font-bold leading-none text-danger">
                      ×
                    </span>
                  ) : (
                    <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
                      <span className="size-1.5 rounded-full bg-line" />
                    </span>
                  )}
                  <p className={cn("text-sm", state === "pending" ? "text-muted" : "font-medium text-fg")}>
                    {label}
                    {state === "failed" ? <span className="font-normal text-muted"> — not available</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="audit-shimmer mt-3.5" aria-hidden="true" />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            We&rsquo;re running Google Lighthouse on mobile and desktop and checking your page directly. This usually
            takes 20–40 seconds.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ========================================================================== */

function StepResults({
  report,
  retrying,
  onRetry,
  onRestart,
  onDiscuss,
}: {
  report: Report;
  retrying: boolean;
  onRetry: () => void;
  onRestart: () => void;
  onDiscuss: () => void;
}) {
  const { result } = report;
  const available = (["mobile", "desktop"] as Strategy[]).filter((s) => result.lighthouse[s]);
  const [strategy, setStrategy] = useState<Strategy>(available[0] ?? "mobile");
  const tabsId = useId();
  const scores = result.lighthouse[strategy]?.scores;
  const complete = result.lighthouse.status === "complete" && result.onPage.status === "complete";
  const analysed = new Date(result.analyzedAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });

  function download() {
    if (!report.pdf) return;
    const bytes = Uint8Array.from(atob(report.pdf), (c) => c.charCodeAt(0));
    const href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `MIDIS-Website-Audit-${report.reference}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">Your Website Audit Is Ready!</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          Thank you for choosing MIDIS. Here&rsquo;s a quick overview of your website&rsquo;s performance.
        </p>
      </div>

      {/* ---- email status: the truth, never an assumption ---- */}
      {report.email.status === "accepted" ? (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-paper p-4 text-sm">
          <CheckGlyph className="text-accent-ink" />
          <p className="min-w-0 leading-relaxed">
            <span className="font-semibold text-fg">We&rsquo;ve sent your full website audit report to your email.</span>{" "}
            <span className="text-muted">
              It&rsquo;s on its way to <span className="font-medium text-fg [overflow-wrap:anywhere]">{report.email.address}</span>.
            </span>
          </p>
        </div>
      ) : report.email.status === "not_configured" && report.pdf ? (
        /* Email isn't set up: nothing failed, so no error styling — the
           report is a download. */
        <div className="flex items-start gap-3 rounded-lg border border-line bg-paper p-4 text-sm">
          <CheckGlyph className="text-accent-ink" />
          <p className="min-w-0 leading-relaxed">
            <span className="font-semibold text-fg">Your full website audit report is ready.</span>{" "}
            <span className="text-muted">Download it below — it&rsquo;s a PDF you can keep and share.</span>
          </p>
        </div>
      ) : (
        <div role="status" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm leading-relaxed">
          <p className="font-semibold text-fg">Your audit is ready, but we couldn&rsquo;t email the report.</p>
          <p className="mt-1 text-muted">
            {report.pdf
              ? report.email.status === "failed"
                ? "You can download it below or retry sending it."
                : "You can download it below."
              : "We couldn't prepare the PDF just now — please retry sending it."}
            {report.lead.saved ? " Your details are saved, so there's no need to enter them again." : ""}
          </p>
          {report.email.status === "failed" ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent disabled:opacity-60"
            >
              {retrying ? <Spinner /> : null}
              {retrying ? "Sending…" : "Try sending it again"}
            </button>
          ) : null}
        </div>
      )}

      {/* ---- what was audited ---- */}
      <dl className="grid gap-x-6 gap-y-2.5 rounded-lg bg-paper p-4 text-sm sm:grid-cols-2">
        {(
          [
            ["Website", result.finalUrl],
            ["Analysed", analysed],
            ["Status", complete ? "Complete" : "Partial — some checks were unavailable"],
            ["Results for", scopeLabel(result)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-0.5 break-words font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>

      {/* ---- scorecard ---- */}
      <section aria-labelledby={`${tabsId}-scores`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={`${tabsId}-scores`} className="text-lg">
            Lighthouse scores
          </h3>
          {available.length > 1 ? (
            <div role="group" aria-label="Device" className="inline-flex rounded-full border border-line p-1">
              {available.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={strategy === s}
                  onClick={() => setStrategy(s)}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-sm font-medium capitalize transition-colors",
                    strategy === s ? "bg-fg text-paper" : "text-muted hover:text-fg",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {scores ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const score = scores[cat.key];
              return (
                <li key={`${strategy}-${cat.key}`} className="flex flex-col items-center rounded-xl border border-line p-3.5 text-center">
                  <ScoreRing score={score} />
                  <p className="mt-2 text-sm font-semibold text-fg">{cat.label}</p>
                  <p className="text-xs text-muted">{score === undefined ? "Not available" : BAND_LABEL[band(score)]}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg bg-paper p-4 text-sm leading-relaxed text-muted">
            Lighthouse scores aren&rsquo;t available for this audit
            {result.lighthouse.reason ? ` — ${result.lighthouse.reason}` : "."} Your report includes the direct page
            checks we could complete.
          </p>
        )}

        {/* A partial audit says which device is missing, and why. */}
        {(["mobile", "desktop"] as Strategy[])
          .filter((s) => !result.lighthouse[s] && result.lighthouse.missing?.[s])
          .map((s) => (
            <p key={s} className="mt-3 rounded-lg bg-paper p-3 text-sm leading-relaxed text-muted">
              <span className="font-semibold capitalize text-fg">{s} results aren&rsquo;t available</span> for this
              audit: {result.lighthouse.missing?.[s]}
            </p>
          ))}

        {scores ? (
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-muted">
            {CATEGORIES.map((cat) => {
              const score = scores[cat.key];
              return score === undefined ? null : (
                <li key={cat.key}>
                  <span className="font-semibold text-fg">{cat.label}:</span> {interpret(cat.key, score)}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {/* ---- top three ---- */}
      <section aria-labelledby={`${tabsId}-top`}>
        <h3 id={`${tabsId}-top`} className="text-lg">
          Your Top Improvement Opportunities
        </h3>
        {report.top.length ? (
          <ol className="mt-4 flex flex-col gap-3">
            {report.top.map((issue, index) => (
              <li key={issue.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold text-accent-ink">0{index + 1}</span>
                  <PriorityBadge priority={issue.priority} />
                </div>
                <p className="mt-2 font-semibold leading-snug text-fg">{issue.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{issue.detail}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">
                  <span className="font-semibold">Suggested improvement: </span>
                  {issue.suggestion}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The audit didn&rsquo;t flag any significant issues — your full report covers every check in detail.
          </p>
        )}
      </section>

      <ButtonGroup className="gap-3">
        {/* Opens this landing page's own Project Estimator in place, below
            the results — no trip back to the homepage. */}
        <Button type="button" size="lg" onClick={onDiscuss}>
          Discuss These Improvements
          <Arrow />
        </Button>
        {report.pdf ? (
          <Button type="button" variant="secondary" size="lg" onClick={download}>
            Download Full Audit Report
          </Button>
        ) : null}
      </ButtonGroup>

      <p className="text-xs leading-relaxed text-muted">
        Report reference {report.reference}. Scores come from Google Lighthouse at the time of analysis and can vary
        slightly between runs.{" "}
        <button
          type="button"
          onClick={onRestart}
          className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
        >
          Audit another website
        </button>
      </p>
    </div>
  );
}

/* ---- small parts ---- */

const RING_COLOR = { good: "#1E9A5F", average: "#C77A00", poor: "#D64531" };

function ScoreRing({ score }: { score?: number }) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    /* Animate from empty once mounted (the global reduced-motion rule
       flattens the transition). */
    const frame = requestAnimationFrame(() => setShown(score ?? 0));
    return () => cancelAnimationFrame(frame);
  }, [score]);
  return (
    <div className="relative size-20" role="img" aria-label={score === undefined ? "Not available" : `${score} out of 100`}>
      <svg viewBox="0 0 72 72" className="size-20 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        {score !== undefined ? (
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={RING_COLOR[band(score)]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - shown / 100)}
            style={{ transition: "stroke-dashoffset 900ms var(--ease-out-expo)" }}
          />
        ) : null}
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold text-fg">
        {score ?? "—"}
      </span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Issue["priority"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider",
        priority === "critical" && "bg-danger-soft text-danger",
        priority === "high" && "bg-accent-soft text-accent-ink",
        priority === "medium" && "bg-paper text-muted",
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" className={cn("mt-px shrink-0", className)}>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.9 8.2l2.1 2.1 4.1-4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={cn("shrink-0 animate-spin", className)}>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
