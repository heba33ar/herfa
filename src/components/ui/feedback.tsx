"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-sand-300 bg-white px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center border border-sand-300 bg-sand-100 text-plum-500">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-base font-bold text-sand-900">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-sand-600">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-sand-200/80", className)}
      aria-hidden="true"
    />
  );
}

export function Notice({
  tone = "info",
  children,
  className,
  icon: Icon,
}: {
  tone?: "info" | "warning" | "success" | "danger" | "neutral";
  children: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tones = {
    info: "bg-info-50 text-info-700 border-info-500/20",
    warning: "bg-warning-50 text-warning-700 border-warning-500/25",
    success: "bg-success-50 text-success-700 border-success-500/20",
    danger: "bg-danger-50 text-danger-700 border-danger-500/20",
    neutral: "bg-sand-100 text-sand-700 border-sand-300",
  } as const;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-4 py-3 text-[0.8125rem] leading-relaxed",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-plum-900/35 backdrop-blur-[2px] animate-fade"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-rise relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-[0_24px_60px_-20px_rgb(51_35_43/0.35)] sm:rounded-lg",
          widths[size],
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sand-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-sand-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-sand-600">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق">
            <X className="size-4" />
          </Button>
        </div>
        {children && <div className="px-5 py-5">{children}</div>}
        {footer && (
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-sand-200 bg-white px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
