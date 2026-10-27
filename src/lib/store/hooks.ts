"use client";

import { useSyncExternalStore } from "react";
import { useHirfa } from "./index";
import { dictionary, type TranslationKey } from "@/lib/i18n/dictionary";
import { LOCALE_META } from "@/lib/i18n/config";
import type { Role } from "@/lib/types";

/**
 * Persisted state is only correct after rehydration. Components render a
 * skeleton until this returns true, which keeps the server markup and the
 * first client render identical.
 */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useHirfa.persist.onFinishHydration(onChange),
    () => useHirfa.persist.hasHydrated(),
    // The server never has persisted state, so it always reports "not hydrated".
    () => false,
  );
}

export function useLocale() {
  return useHirfa((s) => s.locale);
}

/** `t("nav.home")` — resolves against the active locale. */
export function useT() {
  const locale = useHirfa((s) => s.locale);
  return (key: TranslationKey) => dictionary[key][locale];
}

export function useDir() {
  const locale = useHirfa((s) => s.locale);
  return LOCALE_META[locale].dir;
}

export function useCurrentUser() {
  return useHirfa((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
}

export function useHasRole(role: Role) {
  return useHirfa((s) => {
    const user = s.users.find((u) => u.id === s.currentUserId);
    return Boolean(user?.roles.includes(role));
  });
}

/** The store owned by the signed-in seller — never anyone else's. */
export function useMyStore() {
  return useHirfa((s) => s.stores.find((store) => store.ownerId === s.currentUserId) ?? null);
}

export function useCartCount() {
  return useHirfa((s) => s.cart.items.reduce((n, line) => n + line.quantity, 0));
}
