"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Info, MousePointerClick, ShoppingCart, Store, Users } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { StorageNotice } from "@/components/admin/storage-notice";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatNumber, formatPrice } from "@/lib/format";
import { sum, unique } from "@/lib/utils";

export default function AdminOverviewPage() {
  const t = useT();
  const locale = useLocale();

  const stores = useHirfa((s) => s.stores);
  const orders = useHirfa((s) => s.orders);
  const applications = useHirfa((s) => s.applications);
  const tickets = useHirfa((s) => s.tickets);
  const metrics = useHirfa((s) => s.metrics);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const cancelled = orders.filter(
      (o) => o.status === "cancelled" || o.status === "rejected",
    );
    return {
      activeStores: stores.filter((s) => s.status === "active").length,
      pausedStores: stores.filter((s) => s.status === "paused").length,
      needsReview: stores.filter((s) => s.status === "needs_review").length,
      suspended: stores.filter((s) => s.status === "suspended").length,
      confirmedSales: sum(completed, (o) => o.total),
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      openOrders: orders.filter((o) =>
        ["awaiting_response", "confirmed", "preparing", "ready"].includes(o.status),
      ).length,
      // "Active buyer" means at least one order — never the registration count.
      activeBuyers: unique(completed.map((o) => o.buyerId)).length,
      pendingApplications: applications.filter(
        (a) => a.status === "new" || a.status === "under_review",
      ).length,
      openTickets: tickets.filter((x) => x.status !== "resolved").length,
    };
  }, [stores, orders, applications, tickets]);

  const byStore = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    return stores
      .map((store) => {
        const storeOrders = completed.filter((o) => o.storeId === store.id);
        return {
          store,
          orderCount: storeOrders.length,
          revenue: sum(storeOrders, (o) => o.total),
        };
      })
      .filter((row) => row.orderCount > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [stores, orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.title")}
        description="نظرة عامة على المنصة. المؤشرات معروضة منفصلة عن بعضها عن قصد."
      />

      <StorageNotice />

      <Notice tone="warning" icon={Info}>
        {t("admin.metricsNotice")}
      </Notice>

      {/* platform reach — not sales */}
      <section>
        <p className="eyebrow mb-4">الوصول والزيارات</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("admin.storeViews")}
            value={formatNumber(metrics.storeViews, locale)}
            icon={Store}
            hint="زيارة صفحة متجر"
          />
          <StatCard
            label={t("admin.whatsappClicks")}
            value={formatNumber(metrics.whatsappClicks, locale)}
            icon={MousePointerClick}
            hint="نقرة — وليست مبيعة"
          />
          <StatCard
            label={t("admin.registeredBuyers")}
            value={formatNumber(metrics.registeredBuyers, locale)}
            icon={Users}
            hint="تسجيل حساب فقط"
          />
          <StatCard
            label={t("admin.activeBuyers")}
            value={formatNumber(stats.activeBuyers, locale)}
            icon={ShoppingCart}
            tone="plum"
            hint="أتمّت طلبًا واحدًا على الأقل"
          />
        </div>
      </section>

      {/* confirmed commerce */}
      <section>
        <p className="eyebrow mb-4">المبيعات المؤكَّدة</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("admin.confirmedSales")}
            value={formatPrice(stats.confirmedSales, locale)}
            tone="success"
            hint={`${stats.completedCount} ${t("status.completed")}`}
          />
          <StatCard label={t("seller.pendingOrders")} value={stats.openOrders} tone="warning" />
          <StatCard
            label={t("admin.cancellations")}
            value={stats.cancelledCount}
            tone={stats.cancelledCount > 0 ? "danger" : "neutral"}
          />
          <StatCard
            label={t("admin.activeSellers")}
            value={stats.activeStores}
            hint={`${stats.pausedStores} ${t("storeStatus.paused")} · ${stats.suspended} ${t("storeStatus.suspended")}`}
          />
        </div>
      </section>

      {/* queues */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/applications" className="block">
          <Card className="transition-colors hover:border-sand-900/30">
            <CardBody className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-sand-900">{t("admin.applications")}</p>
                <p className="mt-1 text-xs text-sand-600">بانتظار المراجعة</p>
              </div>
              <span className="text-2xl font-bold tabular-nums text-plum-500">
                {stats.pendingApplications}
              </span>
            </CardBody>
          </Card>
        </Link>

        <Link href="/admin/reports" className="block">
          <Card className="transition-colors hover:border-sand-900/30">
            <CardBody className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-sand-900">{t("admin.reports")}</p>
                <p className="mt-1 text-xs text-sand-600">بلاغات مفتوحة</p>
              </div>
              <span className="text-2xl font-bold tabular-nums text-plum-500">
                {stats.openTickets}
              </span>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* top stores — only where the data is real */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("admin.stores")}</CardTitle>
            <p className="mt-1 text-xs text-sand-600">
              الترتيب حسب المبيعات المؤكَّدة. المتاجر بدون طلبات مكتملة ما بتظهر هون.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {byStore.length === 0 ? (
            <p className="p-5 text-sm text-sand-600">لا توجد بيانات مبيعات مكتملة بعد.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-xs text-sand-600">
                  <th className="px-5 py-3 text-start font-semibold">{t("orders.store")}</th>
                  <th className="px-5 py-3 text-start font-semibold">
                    {t("status.completed")}
                  </th>
                  <th className="px-5 py-3 text-start font-semibold">
                    {t("admin.confirmedSales")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {byStore.map(({ store, orderCount, revenue }) => (
                  <tr key={store.id}>
                    <td className="px-5 py-3 font-semibold text-sand-900">
                      <Link
                        href={`/stores/${store.slug}`}
                        className="transition-colors hover:text-plum-500"
                      >
                        {store.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-sand-700">{orderCount}</td>
                    <td className="px-5 py-3 font-bold tabular-nums text-sand-900">
                      {formatPrice(revenue, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
