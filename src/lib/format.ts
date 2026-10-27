import type { Locale } from "@/lib/types";

const LOCALE_TAG: Record<Locale, string> = {
  ar: "ar",
  he: "he-IL",
  en: "en-GB",
};

/**
 * Prices use Western digits in every locale. Arabic-Indic digits read well in
 * prose but are harder to scan in a price list, and sellers compare against
 * figures they see in banking apps.
 */
export function formatPrice(amount: number | null, locale: Locale): string {
  if (amount === null) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return locale === "en" ? `₪${formatted}` : `${formatted} ₪`;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] === "ar" ? "en-US" : LOCALE_TAG[locale]).format(
    value,
  );
}

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAG[locale], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMonth(key: string, locale: Locale): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : LOCALE_TAG[locale], {
    month: "long",
    year: "numeric",
  }).format(date);
}

const WEEKDAY_NAMES: Record<Locale, string[]> = {
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  he: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function weekdayName(day: number, locale: Locale) {
  return WEEKDAY_NAMES[locale][day] ?? "";
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** The current month as a finance filter key, e.g. "2026-10". */
export function monthKeyNow() {
  return new Date().toISOString().slice(0, 7);
}
