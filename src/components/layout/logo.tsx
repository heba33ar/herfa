import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark. The glyph is a stylised loom/knot — a nod to handwork — drawn
 * rather than imported so it inherits currentColor in every context.
 */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 text-plum-500", className)}
      aria-label="حِرفة — الصفحة الرئيسية"
    >
      <span className="grid size-9 shrink-0 place-items-center bg-plum-500 text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 3v18M4 7.5l16 9M20 7.5l-16 9"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeOpacity="0.55"
          />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        </svg>
      </span>
      {showWord && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight">حِرفة</span>
          <span className="mt-0.5 text-[0.625rem] font-medium tracking-[0.18em] text-sand-500">
            HIRFA
          </span>
        </span>
      )}
    </Link>
  );
}
