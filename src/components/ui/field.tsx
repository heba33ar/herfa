"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-md border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-sand-900 " +
  "placeholder:text-sand-500 transition-colors duration-150 " +
  "hover:border-sand-400 focus:border-plum-400 focus:outline-2 focus:outline-offset-0 focus:outline-plum-300 " +
  "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-sand-500";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-semibold text-sand-800", className)} {...props} />
  );
}

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </Label>
      )}
      {children(id)}
      {hint && !error && <p className="text-xs leading-relaxed text-sand-600">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger-700">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(CONTROL, "resize-y", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(CONTROL, "cursor-pointer appearance-none bg-no-repeat pe-9", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238c7b82' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: "left 0.85rem center",
        }}
        {...props}
      />
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; description?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer rounded-xs border-sand-400 accent-plum-500"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-sand-800">
        {label}
        {description && <span className="mt-0.5 block text-xs text-sand-600">{description}</span>}
      </label>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-sand-800">{label}</p>
        {description && <p className="mt-1 text-xs leading-relaxed text-sand-600">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
          checked ? "bg-plum-500" : "bg-sand-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "start-[1.375rem]" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}
