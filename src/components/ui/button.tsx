"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-plum-500 text-white hover:bg-plum-600 active:bg-plum-700 shadow-[0_1px_2px_rgb(51_35_43/0.12)]",
  secondary: "bg-clay-500 text-white hover:bg-clay-600 active:bg-clay-700",
  outline: "border border-sand-300 bg-white text-sand-900 hover:bg-sand-100 hover:border-sand-400",
  ghost: "text-sand-800 hover:bg-sand-200/70",
  subtle: "bg-plum-50 text-plum-600 hover:bg-plum-100",
  danger: "bg-danger-500 text-white hover:bg-danger-700",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
  icon: "h-10 w-10 justify-center",
};

const BASE =
  "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 " +
  "disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
});

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />;
}
