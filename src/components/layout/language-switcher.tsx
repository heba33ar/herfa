"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { useHirfa } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useHirfa((s) => s.locale);
  const setLocale = useHirfa((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-sand-700 transition-colors hover:bg-sand-200/70"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{LOCALE_META[locale].label}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="animate-rise absolute end-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-sand-200 bg-white p-1 shadow-[0_12px_32px_-12px_rgb(51_35_43/0.25)]"
        >
          {LOCALES.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xs px-3 py-2 text-sm transition-colors",
                  code === locale
                    ? "bg-plum-50 font-semibold text-plum-600"
                    : "text-sand-800 hover:bg-sand-100",
                )}
                dir={LOCALE_META[code].dir}
              >
                {LOCALE_META[code].label}
                {code === locale && <Check className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
