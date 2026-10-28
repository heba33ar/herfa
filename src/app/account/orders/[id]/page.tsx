"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleAlert, PackageX, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { PageHeader, StarPicker } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { OrderStatusBadge, OrderTimeline, PaymentBadge } from "@/components/commerce/status";
import { Breadcrumbs } from "@/components/layout/guards";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  // An order is only readable by the buyer who placed it. Without this any
  // signed-in visitor could open another buyer's address and phone number.
  const order = useHirfa((s) => {
    const found = s.orders.find((o) => o.id === id);
    return found && found.buyerId === s.currentUserId ? found : undefined;
  });
  const store = useHirfa((s) => s.stores.find((x) => x.id === order?.storeId));
  const existingReview = useHirfa((s) => s.reviews.find((r) => r.orderId === id));
  const cancelOrder = useHirfa((s) => s.cancelOrder);
  const reportIssue = useHirfa((s) => s.reportOrderIssue);
  const submitReview = useHirfa((s) => s.submitReview);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("common.notFound")}
        description={t("common.notFoundDesc")}
        action={
          <ButtonLink href="/account/orders" variant="outline">
            {t("orders.title")}
          </ButtonLink>
        }
      />
    );
  }

  const cancellable = order.status === "awaiting_response" || order.status === "confirmed";
  const reviewable = order.status === "completed" && !existingReview;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { href: "/account", label: t("account.title") },
          { href: "/account/orders", label: t("orders.title") },
          { label: `${t("orders.orderNumber")} ${order.reference}` },
        ]}
      />

      <PageHeader
        title={`${t("orders.orderNumber")} ${order.reference}`}
        description={formatDate(order.createdAt, locale)}
        actions={
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge state={order.paymentState} />
          </div>
        }
      />

      {order.origin === "whatsapp_referral" && (
        <Notice tone="warning" icon={CircleAlert}>
          هذا الطلب تمّ عبر واتساب وسجّلته البائعة يدويًا في النظام.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.items")}</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-sand-200">
                {order.items.map((item, index) => (
                  <li key={index} className="flex items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-sand-900">{item.name}</p>
                      {item.selectedOptions.length > 0 && (
                        <p className="mt-1 text-xs text-sand-600">
                          {item.selectedOptions
                            .map((o) => `${o.label}: ${o.choice}`)
                            .join(" · ")}
                        </p>
                      )}
                      {item.note && (
                        <p className="mt-1 text-xs italic text-sand-600">“{item.note}”</p>
                      )}
                      <p className="mt-1.5 text-xs text-sand-500">× {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-sand-900">
                      {formatPrice((item.unitPrice ?? 0) * item.quantity, locale)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="space-y-3 border-t border-sand-200 p-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-sand-600">{t("cart.subtotal")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatPrice(order.subtotal, locale)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sand-600">{t("cart.deliveryFee")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {order.deliveryFee > 0
                      ? formatPrice(order.deliveryFee, locale)
                      : t("common.none")}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-3 text-base">
                  <dt className="font-bold text-sand-900">{t("cart.total")}</dt>
                  <dd className="font-bold tabular-nums text-plum-500">
                    {formatPrice(order.total, locale)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {(order.sellerNote || order.buyerNote) && (
            <Card>
              <CardBody className="space-y-4">
                {order.buyerNote && (
                  <div>
                    <p className="text-xs font-semibold text-sand-600">
                      {t("checkout.noteToSeller")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-sand-800">
                      {order.buyerNote}
                    </p>
                  </div>
                )}
                {order.sellerNote && (
                  <div>
                    <p className="text-xs font-semibold text-sand-600">
                      {t("orders.sellerNote")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-sand-800">
                      {order.sellerNote}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("orders.timeline")}</CardTitle>
            </CardHeader>
            <CardBody>
              <OrderTimeline order={order} />
            </CardBody>
          </Card>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          {store && (
            <Card>
              <CardBody>
                <Link
                  href={`/stores/${store.slug}`}
                  className="flex items-center gap-3 transition-colors hover:text-plum-500"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-sand-200">
                    <Image src={store.logo} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-sand-900">
                      {store.name}
                    </span>
                    <span className="block text-xs text-sand-600">{t("orders.store")}</span>
                  </span>
                </Link>

                {store.whatsapp && (
                  <a
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-10 items-center justify-center rounded-md bg-success-500 text-sm font-semibold text-white transition-colors hover:bg-success-700"
                  >
                    WhatsApp
                  </a>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-sand-600">{t("orders.deliveryMethod")}</dt>
                  <dd className="font-semibold">{t(`delivery.${order.deliveryMethod}`)}</dd>
                </div>
                {order.deliveryAddress && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-sand-600">{t("checkout.address")}</dt>
                    <dd className="text-end font-semibold">{order.deliveryAddress}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sand-600">{t("orders.paymentState")}</dt>
                  <dd>
                    <PaymentBadge state={order.paymentState} />
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <div className="space-y-2">
            {reviewable && (
              <Button className="w-full" onClick={() => setReviewOpen(true)}>
                <Star className="size-4" />
                {t("orders.leaveReview")}
              </Button>
            )}
            {existingReview && (
              <Notice tone="success">{t("orders.reviewSubmitted")}</Notice>
            )}
            {cancellable && (
              <Button variant="outline" className="w-full" onClick={() => setCancelOpen(true)}>
                {t("orders.cancel")}
              </Button>
            )}
            {!cancellable && order.status !== "completed" && (
              <Button variant="ghost" className="w-full" onClick={() => setIssueOpen(true)}>
                {t("orders.reportIssue")}
              </Button>
            )}
          </div>

          {order.status === "completed" && !reviewable && !existingReview && (
            <Badge tone="neutral">{t("review.onlyAfterCompleted")}</Badge>
          )}
        </aside>
      </div>

      {/* ----------------------------------------------------------- modals */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("orders.cancel")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelOrder(order.id);
                setCancelOpen(false);
                toast(t("status.cancelled"), "info");
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-sand-700">{t("orders.cancelConfirm")}</p>
      </Modal>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title={t("orders.reportIssue")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!issueText.trim()}
              onClick={() => {
                reportIssue(order.id, issueText.trim());
                setIssueOpen(false);
                setIssueText("");
                toast(t("orders.reportIssue"), "info");
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Field label={t("board.postBody")} required>
          {(id) => (
            <Textarea
              id={id}
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="اشرحي المشكلة باختصار"
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={t("orders.leaveReview")}
        description={t("review.onlyAfterCompleted")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                submitReview({ orderId: order.id, rating, comment: comment.trim() || undefined });
                setReviewOpen(false);
                toast(t("orders.reviewSubmitted"), "success");
              }}
            >
              {t("review.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-sand-800">{t("review.rating")}</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <Field label={t("review.comment")}>
            {(id) => (
              <Textarea
                id={id}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            )}
          </Field>
        </div>
      </Modal>
    </div>
  );
}
