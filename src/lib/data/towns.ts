import type { Town } from "@/lib/types";

/** Pilot area from the deck: Rahat first, then the wider Negev. */
export const TOWNS: Town[] = [
  {
    id: "rahat",
    name: { ar: "رهط", he: "רהט", en: "Rahat" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "tel-sheva",
    name: { ar: "تل السبع", he: "תל שבע", en: "Tel Sheva" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "segev-shalom",
    name: { ar: "شقيب السلام", he: "שגב שלום", en: "Segev Shalom" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "hura",
    name: { ar: "حورة", he: "חורה", en: "Hura" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "laqiya",
    name: { ar: "اللقية", he: "לקיה", en: "Laqiya" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "arara",
    name: { ar: "عرعرة النقب", he: "ערערה בנגב", en: "Ar'ara BaNegev" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "ksar-a-sir",
    name: { ar: "كسرى-السّر", he: "כסייפה-אל-סר", en: "Ksar a-Sir" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "abu-qrenat",
    name: { ar: "أبو قرينات", he: "אבו קרינאת", en: "Abu Qrenat" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
  {
    id: "beer-sheva",
    name: { ar: "بئر السبع", he: "באר שבע", en: "Beer Sheva" },
    region: { ar: "النقب", he: "הנגב", en: "Negev" },
  },
];

export const TOWN_BY_ID = new Map(TOWNS.map((t) => [t.id, t]));

export function townName(id: string | undefined, locale: "ar" | "he" | "en") {
  if (!id) return "";
  return TOWN_BY_ID.get(id)?.name[locale] ?? id;
}
