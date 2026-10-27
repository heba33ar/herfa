"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "success") => {
    nextId += 1;
    const toast = { id: nextId, message, tone };
    set((s) => ({ toasts: [...s.toasts, toast] }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook so call sites read `toast("تم الحفظ")`. */
export function useToast() {
  return useToasts((s) => s.push);
}

const ICONS = { success: Check, info: Info, error: TriangleAlert };
const TONES: Record<ToastTone, string> = {
  success: "border-success-500/25 bg-success-50 text-success-700",
  info: "border-info-500/25 bg-info-50 text-info-700",
  error: "border-danger-500/25 bg-danger-50 text-danger-700",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const Icon = ICONS[toast.tone];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "animate-rise pointer-events-auto flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium shadow-[0_12px_32px_-12px_rgb(51_35_43/0.25)] backdrop-blur",
        TONES[toast.tone],
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="opacity-50 transition-opacity hover:opacity-100"
        aria-label="إغلاق"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:start-6 sm:items-start">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
