"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConsoleLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

/**
 * Shared chrome for the seller and admin consoles: a rail on desktop, a
 * horizontal scroller on mobile.
 */
export function ConsoleShell({
  title,
  links,
  children,
}: {
  title: string;
  links: ConsoleLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const root = links[0]?.href ?? "/";

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <nav aria-label={title} className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3.5 text-xs font-bold uppercase tracking-wider text-sand-500 lg:block">
            {title}
          </p>
          <ul className="no-scrollbar flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:pb-0">
            {links.map((link) => {
              const active =
                link.href === root ? pathname === root : pathname.startsWith(link.href);
              return (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-plum-50 text-plum-600"
                        : "text-sand-700 hover:bg-sand-200/60 hover:text-sand-900",
                    )}
                  >
                    <link.icon className="size-4 shrink-0" />
                    <span className="whitespace-nowrap">{link.label}</span>
                    {link.badge != null && link.badge > 0 && (
                      <span className="ms-auto rounded-full bg-plum-500 px-1.5 py-0.5 text-[0.625rem] font-bold text-white tabular-nums">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
