"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Arrow, Button, ButtonGroup } from "@/components/ui/Button";
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

const LOADING_LINES = [
  "Connecting to your website…",
  "Analysing performance…",
  "Checking SEO fundamentals…",
  "Reviewing accessibility…",
  "Checking technical best practices…",
  "Preparing your results…",
];

const STORE_KEY = "midis-audit-v1";
const CLIENT_TIMEOUT_MS = 75_000;
const PRIVACY_URL = footerLegal.find((l) => /privacy/i.test(l.label))?.href;

interface Preview {
  url: string;
  analyzedAt: string;
  status: "complete" | "partial";
  note?: string;
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
  const [line, setLine] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [requestId, setRequestId] = useState("");

  const [values, setValues] = useState<Record<ContactField, string>>({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [honey, setHoney] = useState("");
  const stepHeadingRef = useRef<HTMLParagraphElement>(null);
  const firstRender = useRef(true);
  const busy = useRef(false);

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

  /* Rotate the loading lines while an audit runs; hold on the last one. */
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setLine((n) => Math.min(n + 1, LOADING_LINES.length - 1)), 2800);
    return () => window.clearInterval(timer);
  }, [running]);

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
    setRunning(true);
    setLine(0);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value, hp: honey }),
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        /* The server's message is written for visitors; fall back only when
           there is none (e.g. the platform itself failed). */
        if (body.field === "url") setUrlError(body.message);
        else
          setFormError(
            body.message ??
              (response.status >= 500
                ? "Our audit service is temporarily unavailable. Please try again shortly."
                : "We couldn't analyze this website. Please check the URL and try again."),
          );
        return;
      }
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
    setFormError(null);
    setUrl("");
    setStep(0);
  }

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
            line={LOADING_LINES[line]}
          />
        ) : null}

        {step === 1 && preview ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[length:var(--text-display-sm)] leading-[1.1]">Your Website Audit Is Ready.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                Tell us where to send your complete website audit report.
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
              MIDIS will use these details to send your requested audit report and to follow up about it.
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
          />
        ) : null}
      </div>

      {formError ? (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger-soft p-4">
          <FieldError id="audit-form-error">{formError}</FieldError>
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
                Send My Free Audit Report
                <Arrow />
              </>
            )}
          </Button>
        </ButtonGroup>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {running ? LOADING_LINES[line] : submitting ? "Preparing and sending your report." : ""}
      </p>
    </form>
  );
}

/* ========================================================================== */

function StepUrl({
  url,
  onUrl,
  error,
  running,
  line,
}: {
  url: string;
  onUrl: (value: string) => void;
  error?: string;
  running: boolean;
  line: string;
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
          <div className="flex items-center gap-3">
            <Spinner className="text-accent-ink" />
            <p className="text-sm font-medium text-fg">{line}</p>
          </div>
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
}: {
  report: Report;
  retrying: boolean;
  onRetry: () => void;
  onRestart: () => void;
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
            <span className="font-semibold text-fg">We&rsquo;ve emailed your full website audit report.</span>{" "}
            <span className="text-muted">
              It&rsquo;s on its way to <span className="font-medium text-fg [overflow-wrap:anywhere]">{report.email.address}</span>.
            </span>
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
        {/* Same-site link: this landing page's own Project Estimator. (site.url
            is the separate main MIDIS website, which has no estimator.) */}
        <Button href="/#estimator" size="lg">
          Discuss These Improvements
          <Arrow />
        </Button>
        {report.pdf ? (
          <Button type="button" variant="secondary" size="lg" onClick={download}>
            Download Full Report (PDF)
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
