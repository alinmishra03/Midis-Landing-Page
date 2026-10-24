"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import PhoneInput, { getCountryCallingCode, type Country } from "react-phone-number-input/max";
import flags from "react-phone-number-input/flags";
import { FieldError } from "./Fields";
import { cn } from "@/lib/utils";

/**
 * THE INTERNATIONAL PHONE FIELD (MIDIS brief, 2026-10-24).
 *
 * `react-phone-number-input` (the `max` build: libphonenumber-js with full
 * metadata, so validity is checked against each country's real numbering
 * plan, not just a length) owns the number: parsing, as-you-type
 * formatting, and the E.164 value it reports (`+919876543210`). This file
 * only supplies the parts its defaults do not cover:
 *
 *   - CountrySelect — a searchable listbox in place of the library's plain
 *     <select>. Search matches country name, ISO code or dialling code.
 *   - The look: the wrapper carries exactly the classes of the form's
 *     other inputs (TextField in Fields.tsx), so height, radius, border,
 *     surface and the orange focus border all match; the flag + code sit
 *     inside it behind a hairline divider.
 *
 * FLAGS ARE BUNDLED (react-phone-number-input/flags), not loaded from the
 * library's default CDN URL — no visitor's browser is sent to a third party
 * for a picture of a flag.
 *
 * THE LIST IS PORTALLED with fixed positioning: the hero's glass card
 * would clip an absolutely positioned dropdown. It opens below the field,
 * flips above when there is more room there, never leaves the visible
 * viewport (window.visualViewport, so an open phone keyboard is accounted
 * for), and follows the field on scroll / resize.
 */

const DEFAULT_COUNTRY: Country = "IN";

interface PhoneFieldProps {
  label: string;
  name: string;
  /** E.164, or "" while empty. */
  value: string;
  onChange: (value: string) => void;
  /** The selected country — held by the form so it survives step changes. */
  country?: Country;
  onCountryChange: (country: Country) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function PhoneField({
  label,
  name,
  value,
  onChange,
  country = DEFAULT_COUNTRY,
  onCountryChange,
  error,
  required,
  placeholder,
}: PhoneFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required ? (
          <span className="ml-0.5 text-accent-ink" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <PhoneInput
        id={id}
        name={name}
        value={value || undefined}
        onChange={(next) => onChange(next ?? "")}
        defaultCountry={country}
        /* A restored value (Back to step 1) shows nationally, beside its
           code — not as "+44 7400…" next to a button already reading +44. */
        initialValueFormat="national"
        onCountryChange={(next) => {
          if (next) onCountryChange(next);
        }}
        addInternationalOption={false}
        countrySelectComponent={CountrySelect}
        autoComplete="tel"
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        containerComponentProps={{ "data-phone-field": "" }}
        /* The same classes as TextField's <input>, moved to the wrapper; the
           orange border follows focus anywhere inside it. */
        className={cn(
          "mt-2 flex w-full items-stretch rounded-lg border bg-surface text-base text-fg",
          "transition-colors duration-[var(--dur-fast)]",
          "focus-within:border-accent",
          error ? "border-danger" : "border-line hover:border-fg/25",
        )}
        /* `w-0 flex-1`, not just `flex-1`: an <input> has an intrinsic
           ~20-character width, and on phones that min-content width
           propagated up and stretched the hero's single grid column past
           the screen. A zero basis contributes nothing; flex-1 grows it. */
        numberInputProps={{
          className:
            "w-0 min-w-0 flex-1 rounded-r-lg bg-transparent px-3.5 py-3 text-base text-fg placeholder:text-muted/70 focus:outline-none",
        }}
      />

      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

/* ========================================================================== */

interface CountryOption {
  value?: Country;
  label: string;
  divider?: boolean;
}

/** The props react-phone-number-input passes a custom country select. */
interface CountrySelectProps {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
}

function Flag({ country, className }: { country: Country; className?: string }) {
  const Svg = flags[country];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-[15px] w-5 shrink-0 overflow-hidden rounded-[3px] bg-line shadow-[0_0_0_1px_rgb(0_0_0/0.08)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        className,
      )}
    >
      {Svg ? <Svg title="" /> : null}
    </span>
  );
}

/**
 * How well a country matches the search, best first; 0 = no match. Ranked
 * so the likely answer is on top for Enter: "india" → India, not British
 * Indian Ocean Territory; "+1" → the +1 countries before +1xxx ones.
 */
function score(country: Country, label: string, query: string) {
  const q = query.toLowerCase();
  const name = label.toLowerCase();
  const iso = country.toLowerCase();
  const digits = q.replace(/^\+/, "");
  const code = getCountryCallingCode(country);
  if (/^\d+$/.test(digits)) {
    if (code === digits) return 6;
    if (code.startsWith(digits)) return 3;
  }
  if (name === q) return 7;
  if (iso === q) return 6;
  if (name.startsWith(q)) return 5;
  if (name.split(/[\s(),.-]+/).some((word) => word.startsWith(q))) return 4;
  if (name.includes(q)) return 2;
  return 0;
}

/** Where the list goes, in viewport coordinates. */
interface Placement {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const GAP = 6;
const EDGE = 8;
const LIST_MAX = 320;

function CountrySelect({ value, onChange, options, disabled, readOnly }: CountrySelectProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const countries = useMemo(
    () => options.filter((o): o is CountryOption & { value: Country } => !o.divider && !!o.value),
    [options],
  );
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return countries;
    /* Stable sort on score: ties keep the library's alphabetical order. */
    return countries
      .map((option) => ({ option, s: score(option.value, option.label, q) }))
      .filter((entry) => entry.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((entry) => entry.option);
  }, [countries, query]);
  const selected = countries.find((o) => o.value === value);
  const code = value ? `+${getCountryCallingCode(value)}` : "";

  /* ---- placement ---- */
  const place = useCallback(() => {
    const field = buttonRef.current?.closest("[data-phone-field]") ?? buttonRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewTop = vv ? vv.offsetTop : 0;
    const viewHeight = vv ? vv.height : window.innerHeight;
    const viewWidth = document.documentElement.clientWidth;

    const width = Math.min(Math.max(rect.width, 280), viewWidth - EDGE * 2);
    const left = Math.min(Math.max(rect.left, EDGE), viewWidth - width - EDGE);
    const below = viewTop + viewHeight - rect.bottom - GAP - EDGE;
    const above = rect.top - viewTop - GAP - EDGE;

    /* Below unless it is cramped there and roomier above. */
    if (below >= 220 || below >= above) {
      setPlacement({ left, width, top: rect.bottom + GAP, maxHeight: Math.max(Math.min(below, LIST_MAX + 64), 140) });
    } else {
      setPlacement({
        left,
        width,
        bottom: window.innerHeight - rect.top + GAP,
        maxHeight: Math.max(Math.min(above, LIST_MAX + 64), 140),
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const vv = window.visualViewport;
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    vv?.addEventListener("resize", place);
    vv?.addEventListener("scroll", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      vv?.removeEventListener("resize", place);
      vv?.removeEventListener("scroll", place);
    };
  }, [open, place]);

  /* ---- open / close ---- */
  const openList = (viaKeyboard: boolean) => {
    if (disabled || readOnly) return;
    setQuery("");
    setActive(Math.max(countries.findIndex((o) => o.value === value), 0));
    setOpen(true);
    /* Fine pointers and keyboards go straight to the search box. On touch
       the keyboard would cover half the list before the visitor has
       asked to type, so search there is one tap away instead. */
    const focusSearch =
      viaKeyboard || window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    requestAnimationFrame(() => {
      if (focusSearch) searchRef.current?.focus({ preventScroll: true });
      else listRef.current?.focus({ preventScroll: true });
    });
  };

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const choose = (country: Country) => {
    setOpen(false);
    /* The library moves focus to the number input after a selection. */
    onChange(country);
  };

  /* Outside press closes. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  /* Keep the active option in view — including on open, once the list
     exists (it mounts only after the first placement), so the selected
     country is what the visitor sees first. */
  const placed = placement !== null;
  useEffect(() => {
    if (!open || !placed) return;
    const option = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [open, placed, active, filtered]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const last = filtered.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (event.target === listRef.current) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (event.target === listRef.current) {
          event.preventDefault();
          setActive(last);
        }
        break;
      case "Enter": {
        event.preventDefault();
        const option = filtered[active];
        if (option) choose(option.value);
        break;
      }
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const activeOption = filtered[active];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={
          selected
            ? `Country calling code: ${selected.label} ${code}. Change country`
            : "Choose a country calling code"
        }
        onClick={() => (open ? close(false) : openList(false))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList(true);
          }
        }}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-l-lg border-r border-line pl-3 pr-2.5 sm:gap-2 sm:pl-3.5 sm:pr-3",
          "text-[0.9375rem] tabular-nums text-fg transition-colors duration-[var(--dur-fast)]",
          "hover:bg-accent-soft/60 focus:outline-none focus-visible:bg-accent-soft",
          open && "bg-accent-soft/60",
        )}
      >
        {value ? <Flag country={value} /> : null}
        <span>{code}</span>
        <svg
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-muted transition-transform duration-[var(--dur-fast)]",
            open && "rotate-180",
          )}
        >
          <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && placement
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_44px_-18px_rgb(20_21_24/0.4),0_2px_8px_-2px_rgb(20_21_24/0.08)]"
              style={{
                left: placement.left,
                width: placement.width,
                top: placement.top,
                bottom: placement.bottom,
                maxHeight: placement.maxHeight,
              }}
            >
              <div className="border-b border-line p-2">
                <input
                  ref={searchRef}
                  type="search"
                  role="combobox"
                  aria-label="Search countries by name or dialling code"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeOption ? `${baseId}-${activeOption.value}` : undefined}
                  placeholder="Search country or code"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKeyDown}
                  className="block w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none sm:text-sm"
                />
              </div>

              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                tabIndex={-1}
                aria-label="Countries"
                aria-activedescendant={activeOption ? `${baseId}-${activeOption.value}` : undefined}
                onKeyDown={onListKeyDown}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 focus:outline-none"
              >
                {filtered.length === 0 ? (
                  <li role="presentation" className="px-4 py-3 text-sm text-muted">
                    No countries match &ldquo;{query.trim()}&rdquo;
                  </li>
                ) : (
                  filtered.map((option, index) => {
                    const isSelected = option.value === value;
                    const isActive = index === active;
                    return (
                      <li
                        key={option.value}
                        id={`${baseId}-${option.value}`}
                        role="option"
                        aria-selected={isSelected}
                        data-index={index}
                        onPointerDown={(event) => event.preventDefault()}
                        onPointerMove={() => setActive(index)}
                        onClick={() => choose(option.value)}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 px-3.5 text-sm",
                          isSelected
                            ? "bg-accent-soft font-semibold text-accent-ink"
                            : isActive
                              ? "bg-fg/[0.05] text-fg"
                              : "text-fg",
                          isActive && "shadow-[inset_3px_0_0_var(--color-accent)]",
                        )}
                      >
                        <Flag country={option.value} />
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        <span className={cn("shrink-0 tabular-nums", isSelected ? "text-accent-ink" : "text-muted")}>
                          +{getCountryCallingCode(option.value)}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
