"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  emptyLabel,
}: {
  value: number | null;
  count?: number;
  size?: "sm" | "md";
  emptyLabel?: string;
}) {
  if (value === null) {
    return <span className="text-xs text-sand-500">{emptyLabel ?? "—"}</span>;
  }
  const dimension = size === "sm" ? "size-3.5" : "size-4";
  return (
    <span className="inline-flex items-center gap-1.5" dir="ltr">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              dimension,
              n <= Math.round(value)
                ? "fill-gold-500 text-gold-500"
                : "fill-sand-200 text-sand-200",
            )}
          />
        ))}
      </span>
      <span className={cn("font-semibold text-sand-800", size === "sm" ? "text-xs" : "text-sm")}>
        {value.toFixed(1)}
      </span>
      {count != null && <span className="text-xs text-sand-500">({count})</span>}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="inline-flex gap-1" dir="ltr">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "size-7",
              n <= value ? "fill-gold-500 text-gold-500" : "fill-sand-200 text-sand-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "plum" | "success" | "warning" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tones = {
    neutral: "text-sand-900",
    plum: "text-plum-500",
    success: "text-success-700",
    warning: "text-warning-700",
    danger: "text-danger-700",
  } as const;

  return (
    <div className="border border-sand-300 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-sand-600">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-sand-400" />}
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", tones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-sand-600">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-sand-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-sand-900 sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-sand-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-md bg-sand-200/60 p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-sm px-4 py-2 text-[0.8125rem] font-semibold transition-all duration-200",
              active
                ? "bg-white text-plum-600 shadow-[0_1px_2px_rgb(51_35_43/0.08)]"
                : "text-sand-700 hover:text-sand-900",
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6875rem] tabular-nums",
                  active ? "bg-plum-100 text-plum-600" : "bg-sand-300/70 text-sand-700",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
