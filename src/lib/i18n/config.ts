import type { Locale } from "@/lib/types";

export const LOCALES: Locale[] = ["ar", "he", "en"];

export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_META: Record<
  Locale,
  { label: string; dir: "rtl" | "ltr"; htmlLang: string }
> = {
  ar: { label: "العربية", dir: "rtl", htmlLang: "ar" },
  he: { label: "עברית", dir: "rtl", htmlLang: "he" },
  en: { label: "English", dir: "ltr", htmlLang: "en" },
};

export function dirFor(locale: Locale) {
  return LOCALE_META[locale].dir;
}
