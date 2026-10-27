"use client";

import Link from "next/link";
import {
  ChevronLeft,
  CircleAlert,
  ClipboardList,
  CookingPot,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { OrderStatusBadge } from "@/components/commerce/status";
import { useHirfa } from "@/lib/store";
import { useCurrentUser, useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { financeSummary } from "@/lib/store/selectors";
import { formatDate, formatPrice, monthKeyNow } from "@/lib/format";

export default function SellerOverviewPage() {
  const t = useT();
  const locale = useLocale();
  const user = useCurrentUser();
  const store = useMyStore();

  const orders = useHirfa((s) => s.orders);
  const expenses = useHirfa((s) => s.expenses);
  const products = useHirfa((s) => s.products);

  if (!store) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="ما في متجر مرتبط بحسابك"
        description="بعد قبول طلب الانضمام، بينفتح لك متجر وبتقدري تديريه من هون."
        action={<ButtonLink href="/seller/apply">{t("apply.title")}</ButtonLink>}
      />
    );
  }

  const storeOrders = orders.filter((o) => o.storeId === store.id);
  const pending = storeOrders.filter((o) => o.status === "awaiting_response");
  const preparing = storeOrders.filter(
    (o) => o.status === "preparing" || o.status === "confirmed",
  );
  const completed = storeOrders.filter((o) => o.status === "completed");
  const issues = storeOrders.filter((o) => o.status === "issue");

  const month = monthKeyNow();
  const finance = financeSummary(orders, expenses, store.id, month);
  const storeProducts = products.filter((p) => p.storeId === store.id);

  const recent = [...storeOrders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("seller.greeting")} ${user?.name?.split(" ")[0] ?? ""} 👋`}
        description={`${store.name} · ${storeProducts.length} ${t("store.products")}`}
        actions={
          <>
            <ButtonLink href={`/stores/${store.slug}`} variant="outline">
              عرض المتجر
            </ButtonLink>
            <ButtonLink href="/seller/products">{t("seller.addProduct")}</ButtonLink>
          </>
        }
      />

      {!store.acceptingOrders && (
        <Notice tone="warning">
          متجرك متوقف عن استقبال الطلبات. تقدري تفعّليه من{" "}
          <Link href="/seller/store" className="font-semibold underline">
            {t("seller.storeSettings")}
          </Link>
          .
        </Notice>
      )}

      {issues.length > 0 && (
        <Notice tone="danger" icon={CircleAlert}>
          عندك {issues.length} طلب فيه مشكلة بحاجة لمتابعة.
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("seller.pendingOrders")}
          value={pending.length}
          icon={ClipboardList}
          tone={pending.length > 0 ? "warning" : "neutral"}
          hint={pending.length > 0 ? "بحاجة لردّك" : undefined}
        />
        <StatCard
          label={t("seller.preparingOrders")}
          value={preparing.length}
          icon={CookingPot}
        />
        <StatCard
          label={t("seller.completedOrders")}
          value={completed.length}
          icon={PackageCheck}
          tone="success"
        />
        <StatCard
          label={t("seller.monthSales")}
          value={formatPrice(finance.recordedSales, locale)}
          icon={Wallet}
          tone="plum"
          hint={`${t("finance.collected")}: ${formatPrice(finance.collected, locale)}`}
        />
      </div>

      <Notice tone="neutral">{t("finance.salesVsCollected")}</Notice>

      <Card>
        <CardHeader>
          <CardTitle>{t("seller.recentOrders")}</CardTitle>
          <Link
            href="/seller/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-plum-500 hover:text-plum-700"
          >
            {t("home.viewAll")}
            <ChevronLeft className="size-4 flip-rtl" />
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={ClipboardList} title={t("seller.noOrders")} />
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/seller/orders?focus=${order.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-sand-100/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-sand-900">
                          #{order.reference}
                        </span>
                        <OrderStatusBadge status={order.status} />
                        {order.origin === "whatsapp_referral" && (
                          <Badge tone="neutral">WhatsApp</Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-sand-600">
                        {order.buyerName} · {order.items.map((i) => i.name).join("، ")} ·{" "}
                        {formatDate(order.createdAt, locale)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-sand-900">
                      {formatPrice(order.total, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
