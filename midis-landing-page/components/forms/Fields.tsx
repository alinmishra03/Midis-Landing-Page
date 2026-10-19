"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives shared by the estimator and the audit form.
 *
 * ACCESSIBILITY DECISIONS MADE ONCE, HERE
 * ---------------------------------------
 * - Option groups are a real `<fieldset>` + `<legend>` wrapping real
 *   `<input type="radio">`. They LOOK like cards, but the native control is
 *   underneath, so arrow-key navigation, the roving tab stop, form reset and
 *   screen-reader group semantics all work without a line of JavaScript. A
 *   div with `role="radiogroup"` would mean reimplementing all of that, and
 *   getting it subtly wrong.
 * - Every error is tied to its control with `aria-describedby`, and the
 *   control carries `aria-invalid`. A red border alone is invisible to a
 *   screen reader and to anyone who cannot distinguish the colour.
 * - Error text is never colour-only: it is prefixed with an icon and sits
 *   directly beneath the field.
 * - Required fields are marked in the label with a visible asterisk AND
 *   `required` on the input, so the state is conveyed twice.
 */

/* ========================================================================== */

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;

  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm text-[#b42318]">
      <svg
        viewBox="0 0 16 16"
        width="15"
        height="15"
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M8 4.75v4M8 11.1v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/* ========================================================================== */

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  /** Appends a visible "(optional)" rather than leaving it to be guessed. */
  optional?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  optional,
  className,
  required,
  ...props
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-accent-ink" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="ml-1.5 font-normal text-muted">(optional)</span>
        ) : null}
      </label>

      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          cn(error && errorId, hint && hintId).trim() || undefined
        }
        className={cn(
          "mt-2 block w-full rounded-lg border bg-surface px-3.5 py-3 text-base text-ink",
          "placeholder:text-muted/70",
          "transition-colors duration-[var(--dur-fast)]",
          "focus:border-accent focus:outline-none",
          error ? "border-[#b42318]" : "border-line hover:border-ink/25",
        )}
        {...props}
      />

      {hint ? (
        <p id={hintId} className="mt-2 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

/* ========================================================================== */

interface SelectFieldProps {
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** Shown as the unselected first option. */
  placeholder?: string;
}

/**
 * A native `<select>`.
 *
 * MIDIS.pdf renders "What is your main goal?" as a dropdown, so it is a
 * dropdown here. It is the real element rather than a custom listbox: on a
 * phone that means the OS picker, which is faster and more familiar than any
 * reimplementation, and it gets keyboard support, type-ahead and form
 * semantics at no cost.
 *
 * The chevron is a background image on the element itself, so there is no
 * overlay sitting between the pointer and the control.
 */
export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = "Please choose…",
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-accent-ink" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          /*
            `min-w-0` is load-bearing, not tidying.

            A native <select> reports a min-content width equal to its widest
            OPTION. "Improve website design and UX" made that 232px, and
            because an `auto` grid track is never sized below its items'
            min-content, the whole form column was forced to 328px inside a
            288px container — which overflowed the page at 320px wide.
            Measured with Playwright; the track printed as `327.656px`.

            Setting `min-width: 0` drops that contribution so the control
            follows its container and the browser elides the long option, as
            it does natively on a narrow screen.
          */
          "mt-2 block w-full min-w-0 appearance-none rounded-lg border bg-surface px-3.5 py-3 pr-10 text-base text-ink",
          "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%20fill%3D%22none%22%20stroke%3D%22%23686868%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.875rem_center] bg-no-repeat",
          "transition-colors duration-[var(--dur-fast)]",
          "focus:border-accent focus:outline-none",
          error ? "border-[#b42318]" : "border-line hover:border-ink/25",
          value === "" && "text-muted",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="text-ink">
            {option}
          </option>
        ))}
      </select>

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

/* ========================================================================== */

interface OptionGroupProps {
  legend: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** `cards` for the prominent choices, `list` for the longer sets. */
  variant?: "cards" | "list";
  columns?: 1 | 2 | 3;
}

export function OptionGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  required,
  variant = "cards",
  columns = 2,
}: OptionGroupProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="text-sm font-medium text-ink">
        {legend}
        {required ? (
          <span className="ml-0.5 text-accent-ink" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>

      <div
        className={cn(
          "mt-3 grid gap-2.5",
          variant === "cards" && columns === 2 && "sm:grid-cols-2",
          variant === "cards" && columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const checked = value === option;

          return (
            <label
              key={option}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5",
                "transition-colors duration-[var(--dur-fast)]",
                /* The ring is drawn on the label when the input inside it
                   has focus, so the visible focus state follows the control
                   even though the control itself is visually hidden. */
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                checked
                  ? "border-accent bg-accent-soft"
                  : error
                    ? "border-[#b42318] bg-surface hover:border-ink/35"
                    : "border-line bg-surface hover:border-ink/35",
              )}
            >
              {/*
                The real radio, visually hidden but NOT `display:none` — it
                has to stay focusable and announceable. `sr-only` keeps it in
                the accessibility tree and in the tab/arrow order.
              */}
              <input
                type="radio"
                name={name}
                value={option}
                checked={checked}
                required={required}
                onChange={() => onChange(option)}
                className="sr-only"
              />

              {/* The drawn control. aria-hidden: the input above is the
                  real one, and this would otherwise be announced twice. */}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
                  checked ? "border-accent bg-accent" : "border-ink/30 bg-surface",
                )}
              >
                {checked ? (
                  <span className="block size-1.5 rounded-full bg-ink" />
                ) : null}
              </span>

              <span className="text-[0.9375rem] leading-snug text-ink">
                {option}
              </span>
            </label>
          );
        })}
      </div>

      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}

/* ========================================================================== */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  error,
  required,
  children,
}: CheckboxProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            /* 24px, which is WCAG 2.5.8's minimum target size. The
               associated <label> extends the clickable area well beyond
               this, but the box the browser hit-tests should clear the bar
               on its own rather than relying on that. */
            "mt-px size-6 shrink-0 cursor-pointer appearance-none rounded border bg-surface",
            "transition-colors duration-[var(--dur-fast)]",
            "checked:border-accent checked:bg-accent",
            /* The tick, drawn with a background image so it rides on the
               input itself and needs no extra element. */
            "checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M3.5%208.2l3%203%206-6.4%22%20fill%3D%22none%22%20stroke%3D%22%23141518%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat",
            error ? "border-[#b42318]" : "border-ink/30 hover:border-ink/50",
          )}
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-sm leading-relaxed text-ink"
        >
          {children}
        </label>
      </div>

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

/* ========================================================================== */

/**
 * The honeypot.
 *
 * Hidden with an off-screen wrapper rather than `type="hidden"` — a bot that
 * fills visible-ish inputs will fill this one; a real visitor never reaches
 * it because it is out of the tab order (`tabIndex={-1}`) and hidden from
 * assistive technology (`aria-hidden`). `autoComplete="off"` stops a browser
 * helpfully filling it in and locking a genuine person out of the form.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden"
    >
      <label htmlFor="website-hp">Website (leave this blank)</label>
      <input
        id="website-hp"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
