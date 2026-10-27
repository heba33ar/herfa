"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { OrderStatusBadge, PaymentBadge } from "@/components/commerce/status";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "awaiting_response",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "rejected",
  "issue",
];

export default function AdminOrdersPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const orders = useHirfa((s) => s.orders);
  const stores = useHirfa((s) => s.stores);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [storeId, setStoreId] = useState("all");

  const storeById = new Map(stores.map((s) => [s.id, s]));

  const rows = useMemo(
    () =>
      orders
        .filter((o) => {
          if (query && !o.reference.includes(query) && !o.buyerName.includes(query)) {
            return false;
          }
          if (status !== "all" && o.status !== status) return false;
          if (storeId !== "all" && o.storeId !== storeId) return false;
          return true;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, query, status, storeId],
  );

  const completed = rows.filter((o) => o.status === "completed");

  function exportCsv() {
    const data = [
      ["رقم الطلب", "المتجر", "المشترية", "التاريخ", "الحالة", "المبلغ", "حالة الدفع", "المصدر"],
      ...rows.map((o) => [
        o.reference,
        storeById.get(o.storeId)?.name ?? o.storeId,
        o.buyerName,
        o.createdAt.slice(0, 10),
        t(`status.${o.status}`),
        String(o.total),
        t(`payment.${o.paymentState}`),
        o.origin === "platform" ? "المنصة" : "واتساب",
      ]),
    ];
    const csv = data
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hirfa-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(t("admin.exportReport"), "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.orders")}
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" />
            {t("admin.exportReport")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("admin.orders")} value={rows.length} />
        <StatCard
          label={t("status.completed")}
          value={completed.length}
          tone="success"
        />
        <StatCard
          label={t("admin.confirmedSales")}
          value={formatPrice(sum(completed, (o) => o.total), locale)}
          tone="plum"
        />
      </div>

      <div className="grid gap-3 border border-sand-300 bg-white p-4 sm:grid-cols-3">
        <Field label={t("common.search")}>
          {(id) => (
            <Input
              id={id}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="رقم الطلب أو اسم المشترية"
            />
          )}
        </Field>
        <Field label={t("orders.status")}>
          {(id) => (
            <Select
              id={id}
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
            >
              <option value="all">{t("common.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("orders.store")}>
          {(id) => (
            <Select id={id} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="all">{t("common.all")}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t("search.empty")} />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-xs text-sand-600">
                  <th className="px-4 py-3 text-start font-semibold">#</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("orders.store")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("role.buyer")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("orders.date")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("orders.status")}</th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t("orders.paymentState")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">{t("orders.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {rows.map((order) => {
                  const store = storeById.get(order.storeId);
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-sand-100/60">
                      <td className="px-4 py-3 font-bold tabular-nums text-sand-900">
                        {order.reference}
                        {order.origin === "whatsapp_referral" && (
                          <Badge tone="neutral" className="ms-2">
                            WA
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {store ? (
                          <Link
                            href={`/stores/${store.slug}`}
                            className="font-medium text-sand-800 transition-colors hover:text-plum-500"
                          >
                            {store.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sand-700">{order.buyerName}</td>
                      <td className="px-4 py-3 text-xs text-sand-600">
                        {formatDate(order.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge state={order.paymentState} />
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-sand-900">
                        {formatPrice(order.total, locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
