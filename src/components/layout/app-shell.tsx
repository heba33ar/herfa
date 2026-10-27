"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LOCALE_META } from "@/lib/i18n/config";
import { useHirfa } from "@/lib/store";
import { useHydrated } from "@/lib/store/hooks";
import { Toaster } from "@/components/ui/toast";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/**
 * Keeps `<html lang>` and `<html dir>` in step with the chosen locale, and
 * hides chrome on the dashboards, which carry their own shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useHirfa((s) => s.locale);
  const hydrated = useHydrated();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    const meta = LOCALE_META[locale];
    document.documentElement.lang = meta.htmlLang;
    document.documentElement.dir = meta.dir;
  }, [locale, hydrated]);

  const isConsole = pathname.startsWith("/seller") || pathname.startsWith("/admin");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader compact={isConsole} />
      <main className="flex-1">{children}</main>
      {!isConsole && <SiteFooter />}
      <Toaster />
    </div>
  );
}
