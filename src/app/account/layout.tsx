"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Package, User } from "lucide-react";
import { RequireAuth } from "@/components/layout/guards";
import { useT } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();

  const links = [
    { href: "/account", label: t("account.profile"), icon: User },
    { href: "/account/orders", label: t("orders.title"), icon: Package },
    { href: "/account/favorites", label: t("favorites.title"), icon: Heart },
  ];

  return (
    <RequireAuth>
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
          <nav aria-label={t("account.title")}>
            <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
              {links.map((link) => {
                const active =
                  link.href === "/account"
                    ? pathname === "/account"
                    : pathname.startsWith(link.href);
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
                      <link.icon className="size-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
