"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { OrderStatusBadge } from "@/components/commerce/status";
import { useHirfa } from "@/lib/store";
import { useCurrentUser, useLocale, useT } from "@/lib/store/hooks";
import { isOpenOrder } from "@/lib/store/selectors";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrdersPage() {
  const t = useT();
  const locale = useLocale();
  const user = useCurrentUser();
  const orders = useHirfa((s) => s.orders);
  const stores = useHirfa((s) => s.stores);
  const [tab, setTab] = useState<"open" | "past">("open");

  const mine = useMemo(
    () =>
      orders
        .filter((o) => o.buyerId === user?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, user?.id],
  );

  const open = mine.filter(isOpenOrder);
  const past = mine.filter((o) => !isOpenOrder(o));
  const shown = tab === "open" ? open : past;
  const storeById = new Map(stores.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <PageHeader title={t("orders.title")} />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "open", label: t("status.preparing"), count: open.length },
          { value: "past", label: t("status.completed"), count: past.length },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("orders.empty")}
          description={t("orders.emptyDesc")}
          action={<ButtonLink href="/stores">{t("cart.continueShopping")}</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((order) => {
            const store = storeById.get(order.storeId);
            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-sand-200 bg-white p-4 transition-all duration-200 hover:border-sand-300 hover:shadow-[0_8px_24px_-16px_rgb(51_35_43/0.25)]"
                >
                  {store && (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-sand-200">
                      <Image src={store.logo} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-sand-900">
                        {t("orders.orderNumber")} {order.reference}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-sand-600">
                      {store?.name} · {formatDate(order.createdAt, locale)} ·{" "}
                      {order.items.length} {t("orders.items")}
                    </p>
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="text-sm font-bold tabular-nums text-sand-900">
                      {formatPrice(order.total, locale)}
                    </p>
                  </div>

                  <ChevronLeft className="size-4 shrink-0 flip-rtl text-sand-400 transition-transform group-hover:-translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
