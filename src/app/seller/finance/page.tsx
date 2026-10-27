"use client";

import { useMemo, useState } from "react";
import { Download, Info, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { PaymentBadge } from "@/components/commerce/status";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { availableMonths, completedOrders, financeSummary } from "@/lib/store/selectors";
import { formatDate, formatMonth, formatPrice, monthKeyNow, todayIso } from "@/lib/format";
import { monthKey } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/types";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "materials",
  "packaging",
  "delivery",
  "marketing",
  "other",
];

export default function SellerFinancePage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const store = useMyStore();

  const orders = useHirfa((s) => s.orders);
  const expenses = useHirfa((s) => s.expenses);
  const addExpense = useHirfa((s) => s.addExpense);
  const deleteExpense = useHirfa((s) => s.deleteExpense);
  const setOrderPayment = useHirfa((s) => s.setOrderPayment);

  const [month, setMonth] = useState<string>(monthKeyNow());
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({
    label: "",
    amount: "",
    category: "materials" as ExpenseCategory,
    date: todayIso(),
  });

  const months = useMemo(
    () => (store ? availableMonths(orders, expenses, store.id) : []),
    [orders, expenses, store],
  );

  const summary = useMemo(
    () => (store ? financeSummary(orders, expenses, store.id, month) : null),
    [orders, expenses, store, month],
  );

  const sales = useMemo(
    () =>
      store
        ? completedOrders(orders, store.id)
            .filter((o) => month === "all" || monthKey(o.createdAt) === month)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [orders, store, month],
  );

  const monthExpenses = useMemo(
    () =>
      store
        ? expenses
            .filter(
              (e) => e.storeId === store.id && (month === "all" || monthKey(e.date) === month),
            )
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [expenses, store, month],
  );

  if (!store || !summary) return null;

  function exportCsv() {
    const rows: string[][] = [
      ["النوع", "البيان", "التاريخ", "المبلغ", "حالة الدفع", "المستلم"],
      ...sales.map((o) => [
        "مبيعة",
        `طلب ${o.reference} — ${o.items.map((i) => i.name).join(" / ")}`,
        o.createdAt.slice(0, 10),
        String(o.total),
        t(`payment.${o.paymentState}`),
        String(o.paidAmount),
      ]),
      ...monthExpenses.map((e) => [
        "مصروف",
        `${t(`expense.${e.category}`)} — ${e.label}`,
        e.date,
        String(-e.amount),
        "",
        "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // BOM so Excel opens the Arabic columns correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hirfa-${store!.slug}-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(t("finance.exportCsv"), "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("finance.title")}
        description={t("finance.netHint")}
        actions={
          <>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label={t("finance.month")}
              className="w-auto"
            >
              <option value="all">{t("finance.allMonths")}</option>
              {months.map((key) => (
                <option key={key} value={key}>
                  {formatMonth(key, locale)}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              {t("finance.exportCsv")}
            </Button>
          </>
        }
      />

      <Notice tone="info" icon={Info}>
        {t("finance.salesVsCollected")}
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("finance.totalSales")}
          value={formatPrice(summary.recordedSales, locale)}
          hint={`${summary.orderCount} ${t("status.completed")}`}
        />
        <StatCard
          label={t("finance.collected")}
          value={formatPrice(summary.collected, locale)}
          tone="success"
        />
        <StatCard
          label={t("finance.outstanding")}
          value={formatPrice(summary.outstanding, locale)}
          tone={summary.outstanding > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label={t("finance.net")}
          value={formatPrice(summary.net, locale)}
          tone={summary.net >= 0 ? "plum" : "danger"}
          hint={`${t("finance.expenses")}: ${formatPrice(summary.expenses, locale)}`}
        />
      </div>

      {/* sales */}
      <Card>
        <CardHeader>
          <CardTitle>{t("finance.totalSales")}</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {sales.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Wallet} title={t("seller.noOrders")} />
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {sales.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sand-900">
                      #{order.reference} · {order.items.map((i) => i.name).join("، ")}
                    </p>
                    <p className="mt-0.5 text-xs text-sand-600">
                      {formatDate(order.createdAt, locale)} · {order.buyerName}
                      {order.paymentMethod && ` · ${order.paymentMethod}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <PaymentBadge state={order.paymentState} />
                    <span className="text-sm font-bold tabular-nums text-sand-900">
                      {formatPrice(order.total, locale)}
                    </span>
                    {order.paymentState !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOrderPayment(order.id, "paid", order.total, order.paymentMethod);
                          toast(t("payment.paid"), "success");
                        }}
                      >
                        {t("finance.markPaid")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* expenses */}
      <Card>
        <CardHeader>
          <CardTitle>{t("finance.expenses")}</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            {t("finance.addExpense")}
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {monthExpenses.length === 0 ? (
            <div className="p-5">
              <EmptyState title={t("finance.noExpenses")} />
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {monthExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sand-900">{expense.label}</p>
                    <p className="mt-0.5 text-xs text-sand-600">
                      {t(`expense.${expense.category}`)} · {formatDate(expense.date, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-danger-700">
                      −{formatPrice(expense.amount, locale)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-sand-500"
                      onClick={() => deleteExpense(expense.id)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("finance.addExpense")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!draft.label.trim() || !Number(draft.amount)}
              onClick={() => {
                addExpense({
                  storeId: store.id,
                  category: draft.category,
                  label: draft.label.trim(),
                  amount: Number(draft.amount),
                  date: draft.date,
                });
                setAddOpen(false);
                setDraft({
                  label: "",
                  amount: "",
                  category: "materials",
                  date: todayIso(),
                });
                toast(t("account.saved"), "success");
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("finance.expenseLabel")} required>
            {(id) => (
              <Input
                id={id}
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="مثلًا: مواد — طلبية الأسبوع"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("finance.expenseAmount")} required>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                />
              )}
            </Field>
            <Field label={t("finance.expenseDate")}>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              )}
            </Field>
          </div>
          <Field label={t("finance.expenseCategory")}>
            {(id) => (
              <Select
                id={id}
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as ExpenseCategory })
                }
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`expense.${c}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Modal>
    </div>
  );
}
