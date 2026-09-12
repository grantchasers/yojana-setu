import React, { forwardRef } from "react";

/**
 * RecessedInput - Machined Data Slot
 * Features:
 * - Inset shadow depth Communicating a sunken chassis well
 * - Borderless industrial design
 * - Technical Monospace font for data clarity
 * - Safety-Orange LED focus glow ring
 */
export const RecessedInput = forwardRef(function RecessedInput(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = "",
    containerClassName = "",
    id,
    type = "text",
    ...props
  },
  ref,
) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div
      className={`flex flex-col gap-1.5 text-left w-full ${containerClassName}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-accent">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-ink-muted pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full rounded-lg bg-chassis text-ink font-mono text-sm shadow-recessed border-0 outline-none transition-all duration-200 min-h-[46px] py-2.5 ${
            Icon ? "pl-10 pr-4" : "px-4"
          } placeholder:text-ink-muted/50 placeholder:font-sans focus:shadow-[inset_4px_4px_8px_rgba(17,34,80,0.16),inset_-4px_-4px_8px_#f5f0e9,0_0_0_2px_#e0c58f] disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "ring-2 ring-accent" : ""
          } ${className}`}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <span
          className={`font-mono text-[11px] tracking-tight ${
            error ? "text-accent font-semibold" : "text-ink-muted"
          }`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

export const RecessedSelect = forwardRef(function RecessedSelect(
  {
    label,
    error,
    helperText,
    children,
    className = "",
    containerClassName = "",
    id,
    ...props
  },
  ref,
) {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div
      className={`flex flex-col gap-1.5 text-left w-full ${containerClassName}`}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-accent">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none rounded-lg bg-chassis text-ink font-mono text-sm shadow-recessed border-0 outline-none transition-all duration-200 min-h-[46px] py-2.5 px-4 pr-10 focus:shadow-[inset_4px_4px_8px_rgba(17,34,80,0.16),inset_-4px_-4px_8px_#f5f0e9,0_0_0_2px_#e0c58f] disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "ring-2 ring-accent" : ""
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 pointer-events-none text-ink-muted flex items-center">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {(error || helperText) && (
        <span
          className={`font-mono text-[11px] tracking-tight ${
            error ? "text-accent font-semibold" : "text-ink-muted"
          }`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

export default RecessedInput;
