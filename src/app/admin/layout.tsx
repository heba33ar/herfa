"use client";

import {
  ClipboardList,
  FileClock,
  Flag,
  Mail,
  LayoutDashboard,
  Store,
  UserCheck,
  Users,
} from "lucide-react";
import { ConsoleShell } from "@/components/seller/console-shell";
import { RequireRole } from "@/components/layout/guards";
import { useHirfa } from "@/lib/store";
import { useT } from "@/lib/store/hooks";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminConsole>{children}</AdminConsole>
    </RequireRole>
  );
}

function AdminConsole({ children }: { children: React.ReactNode }) {
  const t = useT();

  const pendingApplications = useHirfa(
    (s) => s.applications.filter((a) => a.status === "new" || a.status === "under_review").length,
  );
  const openTickets = useHirfa((s) => s.tickets.filter((x) => x.status !== "resolved").length);

  const links = [
    { href: "/admin", label: t("admin.overview"), icon: LayoutDashboard },
    {
      href: "/admin/applications",
      label: t("admin.applications"),
      icon: UserCheck,
      badge: pendingApplications,
    },
    { href: "/admin/stores", label: t("admin.stores"), icon: Store },
    { href: "/admin/orders", label: t("admin.orders"), icon: ClipboardList },
    { href: "/admin/users", label: t("admin.users"), icon: Users },
    { href: "/admin/reports", label: t("admin.reports"), icon: Flag, badge: openTickets },
    { href: "/admin/emails", label: t("admin.outbox"), icon: Mail },
    { href: "/admin/audit", label: t("admin.audit"), icon: FileClock },
  ];

  return (
    <ConsoleShell title={t("admin.title")} links={links}>
      {children}
    </ConsoleShell>
  );
}
