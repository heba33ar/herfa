"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Logo } from "./logo";
import { useHirfa } from "@/lib/store";
import { useT } from "@/lib/store/hooks";
import { useToast } from "@/components/ui/toast";

export function SiteFooter() {
  const t = useT();
  const resetData = useHirfa((s) => s.resetData);
  const toast = useToast();

  const columns = [
    {
      title: t("footer.forBuyers"),
      links: [
        { href: "/stores", label: t("nav.stores") },
        { href: "/search", label: t("nav.products") },
        { href: "/account/orders", label: t("nav.orders") },
        { href: "/account/favorites", label: t("nav.favorites") },
      ],
    },
    {
      title: t("footer.forSellers"),
      links: [
        { href: "/seller/apply", label: t("nav.joinAsSeller") },
        { href: "/seller", label: t("nav.sellerDashboard") },
        { href: "/seller/resources", label: t("resources.title") },
        { href: "/seller/board", label: t("board.title") },
      ],
    },
    {
      title: t("footer.about"),
      links: [
        { href: "/about", label: t("nav.about") },
        { href: "/terms", label: t("footer.terms") },
        { href: "/privacy", label: t("footer.privacy") },
        { href: "/contact", label: t("footer.contact") },
      ],
    },
  ];

  return (
    <footer className="border-t border-sand-900/15 bg-sand-50">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand-600">
              {t("brand.tagline")}
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-bold text-sand-900">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-sand-600 transition-colors hover:text-plum-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-sand-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-sand-500">
            © {new Date().getFullYear()} حِرفة · {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-sand-500">{t("footer.demoNotice")}</p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("misc.resetConfirm"))) {
                  resetData();
                  toast(t("misc.reset"), "info");
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 transition-colors hover:text-plum-500"
            >
              <RotateCcw className="size-3.5" />
              {t("misc.reset")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
