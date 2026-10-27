"use client";

import {
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Package,
  Store,
  Truck,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ConsoleShell } from "@/components/seller/console-shell";
import { RequireRole } from "@/components/layout/guards";
import { useHirfa } from "@/lib/store";
import { useMyStore, useT } from "@/lib/store/hooks";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The application form is public: a visitor has no seller role yet.
  if (pathname.startsWith("/seller/apply")) {
    return <>{children}</>;
  }

  return (
    <RequireRole role="seller">
      <SellerConsole>{children}</SellerConsole>
    </RequireRole>
  );
}

function SellerConsole({ children }: { children: React.ReactNode }) {
  const t = useT();
  const store = useMyStore();
  const pendingCount = useHirfa(
    (s) =>
      s.orders.filter((o) => o.storeId === store?.id && o.status === "awaiting_response").length,
  );

  const links = [
    { href: "/seller", label: t("seller.overview"), icon: LayoutDashboard },
    { href: "/seller/orders", label: t("seller.orders"), icon: ClipboardList, badge: pendingCount },
    { href: "/seller/products", label: t("seller.products"), icon: Package },
    { href: "/seller/store", label: t("seller.myStore"), icon: Store },
    { href: "/seller/finance", label: t("seller.finance"), icon: Wallet },
    { href: "/seller/board", label: t("seller.board"), icon: Megaphone },
    { href: "/seller/delivery", label: t("seller.delivery"), icon: Truck },
    { href: "/seller/resources", label: t("seller.resources"), icon: GraduationCap },
  ];

  return (
    <ConsoleShell title={t("seller.dashboard")} links={links}>
      {children}
    </ConsoleShell>
  );
}
