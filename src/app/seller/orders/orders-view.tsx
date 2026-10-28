"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Info, MessageCircle, NotebookPen, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { OrderStatusBadge, OrderTimeline, PaymentBadge } from "@/components/commerce/status";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { nextStatus } from "@/lib/store/selectors";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, PaymentState } from "@/lib/types";

type Filter = "pending" | "active" | "done" | "all";

function bucketFor(status: Order["status"] | undefined): Filter {
  if (!status) return "pending";
  if (status === "awaiting_response") return "pending";
  if (["completed", "cancelled", "rejected"].includes(status)) return "done";
  return "active";
}

export function SellerOrdersView() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const params = useSearchParams();
  const store = useMyStore();

  const orders = useHirfa((s) => s.orders);
  const acceptOrder = useHirfa((s) => s.acceptOrder);
  const rejectOrder = useHirfa((s) => s.rejectOrder);
  const setOrderStatus = useHirfa((s) => s.setOrderStatus);
  const setOrderPayment = useHirfa((s) => s.setOrderPayment);
  const setInternalNote = useHirfa((s) => s.setOrderInternalNote);

  const focusParam = params.get("focus");
  const [focusId, setFocusId] = useState<string | null>(focusParam);
  // Open on the tab that holds the order the dashboard linked to.
  const [filter, setFilter] = useState<Filter>(() =>
    bucketFor(orders.find((o) => o.id === focusParam)?.status),
  );

  // Reject needs a documented reason — the buyer sees it.
  const [rejectFor, setRejectFor] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const [acceptFor, setAcceptFor] = useState<Order | null>(null);
  const [readyAt, setReadyAt] = useState("");

  const [noteFor, setNoteFor] = useState<Order | null>(null);
  const [noteText, setNoteText] = useState("");

  const [payFor, setPayFor] = useState<Order | null>(null);
  const [payState, setPayState] = useState<PaymentState>("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");

  /** Emails the buyer whenever the seller moves an order along. */
  function notifyBuyer(order: Order, status: string, note?: string) {
    void api.notify({
      type: "order_status",
      buyerId: order.buyerId,
      reference: order.reference,
      storeName: store?.name ?? "",
      status,
      note,
    });
  }

  const storeOrders = useMemo(
    () =>
      orders
        .filter((o) => o.storeId === store?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, store?.id],
  );

  const buckets = {
    pending: storeOrders.filter((o) => o.status === "awaiting_response"),
    active: storeOrders.filter((o) =>
      ["confirmed", "preparing", "ready", "issue"].includes(o.status),
    ),
    done: storeOrders.filter((o) =>
      ["completed", "cancelled", "rejected"].includes(o.status),
    ),
    all: storeOrders,
  };

  const shown = buckets[filter];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("seller.orders")}
        description="اقبلي الطلبات أو ارفضيها مع سبب، غيّري الحالة، وسجّلي حالة الدفع."
      />

      <Notice tone="info" icon={Info}>
        {t("seller.completeNotice")}
      </Notice>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: "pending", label: t("seller.pendingOrders"), count: buckets.pending.length },
          { value: "active", label: t("status.preparing"), count: buckets.active.length },
          { value: "done", label: t("status.completed"), count: buckets.done.length },
          { value: "all", label: t("common.all"), count: buckets.all.length },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t("seller.noOrders")} />
      ) : (
        <ul className="space-y-4">
          {shown.map((order) => {
            const next = nextStatus(order.status);
            const expanded = focusId === order.id;

            return (
              <li key={order.id}>
                <Card className={expanded ? "ring-2 ring-plum-200" : undefined}>
                  <CardBody className="space-y-4">
                    {/* header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-sand-900">
                            #{order.reference}
                          </span>
                          <OrderStatusBadge status={order.status} />
                          <PaymentBadge state={order.paymentState} />
                          {order.origin === "whatsapp_referral" && (
                            <Badge tone="neutral">WhatsApp</Badge>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-sand-600">
                          {formatDate(order.createdAt, locale)} · {order.buyerName} ·{" "}
                          {t(`delivery.${order.deliveryMethod}`)}
                        </p>
                      </div>
                      <p className="text-lg font-bold tabular-nums text-sand-900">
                        {formatPrice(order.total, locale)}
                      </p>
                    </div>

                    {/* items */}
                    <ul className="space-y-1.5 rounded-md bg-sand-100/70 p-3.5 text-sm">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between gap-3">
                          <span className="min-w-0 text-sand-800">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sand-500"> × {item.quantity}</span>
                            {item.selectedOptions.length > 0 && (
                              <span className="block text-xs text-sand-600">
                                {item.selectedOptions
                                  .map((o) => `${o.label}: ${o.choice}`)
                                  .join(" · ")}
                              </span>
                            )}
                            {item.note && (
                              <span className="block text-xs italic text-sand-600">
                                “{item.note}”
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {formatPrice((item.unitPrice ?? 0) * item.quantity, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {order.buyerNote && (
                      <p className="rounded-md border border-sand-200 px-3.5 py-2.5 text-sm text-sand-700">
                        <span className="font-semibold">{t("checkout.noteToSeller")}: </span>
                        {order.buyerNote}
                      </p>
                    )}

                    {order.deliveryAddress && (
                      <p className="text-sm text-sand-700">
                        <span className="font-semibold">{t("checkout.address")}: </span>
                        {order.deliveryAddress}
                      </p>
                    )}

                    {order.internalNote && (
                      <p className="rounded-md bg-gold-100/60 px-3.5 py-2.5 text-sm text-sand-800">
                        <span className="font-semibold">{t("seller.internalNote")}: </span>
                        {order.internalNote}
                      </p>
                    )}

                    {/* actions */}
                    <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
                      {order.status === "awaiting_response" && (
                        <>
                          <Button
                            onClick={() => {
                              setAcceptFor(order);
                              setReadyAt("");
                            }}
                          >
                            {t("seller.acceptOrder")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectFor(order);
                              setRejectReason("");
                              setRejectError("");
                            }}
                          >
                            {t("seller.rejectOrder")}
                          </Button>
                        </>
                      )}

                      {next && order.status !== "awaiting_response" && (
                        <Button
                          onClick={() => {
                            setOrderStatus(order.id, next);
                            notifyBuyer(order, next);
                            toast(t(`status.${next}`), "success");
                          }}
                        >
                          {next === "preparing"
                            ? t("seller.markPreparing")
                            : next === "ready"
                              ? t("seller.markReady")
                              : t("seller.markCompleted")}
                        </Button>
                      )}

                      {order.status === "issue" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOrderStatus(order.id, "completed");
                            notifyBuyer(order, "completed");
                            toast(t("status.completed"), "success");
                          }}
                        >
                          {t("seller.markCompleted")}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPayFor(order);
                          setPayState(order.paymentState);
                          setPaidAmount(String(order.paidAmount || order.total));
                          setPayMethod(order.paymentMethod ?? "");
                        }}
                      >
                        {t("orders.paymentState")}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setNoteFor(order);
                          setNoteText(order.internalNote ?? "");
                        }}
                      >
                        <NotebookPen className="size-4" />
                        {t("seller.internalNote")}
                      </Button>

                      <a
                        href={`tel:${order.buyerPhone}`}
                        className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-sand-800 transition-colors hover:bg-sand-200/70"
                      >
                        <Phone className="size-4" />
                        <span dir="ltr">{order.buyerPhone}</span>
                      </a>

                      <a
                        href={`https://wa.me/${order.buyerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-success-700 transition-colors hover:bg-success-50"
                      >
                        <MessageCircle className="size-4" />
                        {t("seller.messageBuyer")}
                      </a>

                      <Button
                        variant="ghost"
                        className="ms-auto"
                        onClick={() => setFocusId(expanded ? null : order.id)}
                      >
                        {expanded ? t("common.close") : t("orders.timeline")}
                      </Button>
                    </div>

                    {expanded && (
                      <div className="border-t border-sand-200 pt-4">
                        <OrderTimeline order={order} />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* --------------------------------------------------------- modals */}
      <Modal
        open={Boolean(acceptFor)}
        onClose={() => setAcceptFor(null)}
        title={t("seller.acceptOrder")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAcceptFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (acceptFor) {
                  acceptOrder(acceptFor.id, readyAt || undefined);
                  notifyBuyer(acceptFor, "confirmed");
                }
                setAcceptFor(null);
                toast(t("status.confirmed"), "success");
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Field label={t("seller.readyDate")} hint={t("common.optional")}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={readyAt}
              onChange={(e) => setReadyAt(e.target.value)}
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={Boolean(rejectFor)}
        onClose={() => setRejectFor(null)}
        title={t("seller.rejectOrder")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectReason.trim()) {
                  setRejectError(t("seller.rejectReasonRequired"));
                  return;
                }
                if (rejectFor) {
                  rejectOrder(rejectFor.id, rejectReason.trim());
                  notifyBuyer(rejectFor, "rejected", rejectReason.trim());
                }
                setRejectFor(null);
                toast(t("status.rejected"), "info");
              }}
            >
              {t("seller.rejectOrder")}
            </Button>
          </>
        }
      >
        <Field
          label={t("seller.rejectReason")}
          required
          error={rejectError}
          hint={t("seller.rejectReasonRequired")}
        >
          {(id) => (
            <Textarea
              id={id}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثلًا: التاريخ محجوز بالكامل"
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={Boolean(noteFor)}
        onClose={() => setNoteFor(null)}
        title={t("seller.internalNote")}
        description={t("seller.internalNoteHint")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (noteFor) setInternalNote(noteFor.id, noteText.trim());
                setNoteFor(null);
                toast(t("account.saved"), "success");
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <Field label={t("seller.internalNote")}>
          {(id) => (
            <Textarea id={id} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          )}
        </Field>
      </Modal>

      <Modal
        open={Boolean(payFor)}
        onClose={() => setPayFor(null)}
        title={t("orders.paymentState")}
        description={t("finance.salesVsCollected")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (payFor) {
                  const amount =
                    payState === "paid"
                      ? payFor.total
                      : payState === "unpaid"
                        ? 0
                        : Number(paidAmount) || 0;
                  setOrderPayment(payFor.id, payState, amount, payMethod || undefined);
                }
                setPayFor(null);
                toast(t("account.saved"), "success");
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("orders.paymentState")}>
            {(id) => (
              <Select
                id={id}
                value={payState}
                onChange={(e) => setPayState(e.target.value as PaymentState)}
              >
                <option value="unpaid">{t("payment.unpaid")}</option>
                <option value="partial">{t("payment.partial")}</option>
                <option value="paid">{t("payment.paid")}</option>
              </Select>
            )}
          </Field>

          {payState === "partial" && (
            <Field label={t("finance.expenseAmount")}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              )}
            </Field>
          )}

          {payState !== "unpaid" && (
            <Field label="طريقة الدفع" hint={t("common.optional")}>
              {(id) => (
                <Select
                  id={id}
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="">—</option>
                  <option value="نقدًا">نقدًا</option>
                  <option value="Bit">Bit</option>
                  <option value="Paybox">Paybox</option>
                  <option value="تحويل بنكي">تحويل بنكي</option>
                </Select>
              )}
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}
