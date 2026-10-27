import { cn } from "@/lib/utils";

type Tone = "neutral" | "plum" | "clay" | "gold" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-sand-200 text-sand-700",
  plum: "bg-plum-100 text-plum-600",
  clay: "bg-clay-100 text-clay-700",
  gold: "bg-gold-100 text-gold-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
