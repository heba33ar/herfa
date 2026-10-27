import type { Category } from "@/lib/types";

/** PRD §2 — the category list shown on the home page. */
export const CATEGORIES: Category[] = [
  {
    slug: "food",
    name: { ar: "مأكولات", he: "מאכלים", en: "Food" },
    icon: "CookingPot",
  },
  {
    slug: "sweets",
    name: { ar: "حلويات", he: "מתוקים", en: "Sweets" },
    icon: "CakeSlice",
  },
  {
    slug: "gifts",
    name: { ar: "هدايا", he: "מתנות", en: "Gifts" },
    icon: "Gift",
  },
  {
    slug: "fashion",
    name: { ar: "أزياء", he: "אופנה", en: "Fashion" },
    icon: "Shirt",
  },
  {
    slug: "beauty",
    name: { ar: "تجميل", he: "יופי", en: "Beauty" },
    icon: "Sparkles",
  },
  {
    slug: "handicraft",
    name: { ar: "أشغال يدوية", he: "עבודות יד", en: "Handicraft" },
    icon: "Scissors",
  },
  {
    slug: "events",
    name: { ar: "خدمات المناسبات", he: "שירותי אירועים", en: "Event services" },
    icon: "PartyPopper",
  },
];

export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
