"use client";

import { useMemo, useState } from "react";
import { Flag, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { PageHeader, Rating, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate } from "@/lib/format";
import type { SupportTicket, TicketStatus } from "@/lib/types";

const TONE: Record<TicketStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  open: "danger",
  in_progress: "warning",
  resolved: "success",
};

export default function AdminReportsPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const tickets = useHirfa((s) => s.tickets);
  const reviews = useHirfa((s) => s.reviews);
  const stores = useHirfa((s) => s.stores);
  const setTicketStatus = useHirfa((s) => s.setTicketStatus);
  const setReviewHidden = useHirfa((s) => s.setReviewHidden);

  const [tab, setTab] = useState<"tickets" | "reviews">("tickets");
  const [resolving, setResolving] = useState<SupportTicket | null>(null);
  const [note, setNote] = useState("");

  const storeById = new Map(stores.map((s) => [s.id, s]));

  const openTickets = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const order = { open: 0, in_progress: 1, resolved: 2 };
        return order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt);
      }),
    [tickets],
  );

  const reportedReviews = useMemo(
    () => reviews.filter((r) => r.reported || r.hidden),
    [reviews],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.reports")} />

      <Notice tone="warning" icon={ShieldAlert}>
        {t("admin.hideReviewNotice")}
      </Notice>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          {
            value: "tickets",
            label: t("admin.reports"),
            count: tickets.filter((x) => x.status !== "resolved").length,
          },
          { value: "reviews", label: t("store.reviews"), count: reportedReviews.length },
        ]}
      />

      {tab === "tickets" &&
        (openTickets.length === 0 ? (
          <EmptyState icon={Flag} title={t("admin.noPending")} />
        ) : (
          <ul className="space-y-3">
            {openTickets.map((ticket) => (
              <li key={ticket.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-sand-900">{ticket.subject}</h3>
                          <Badge tone="neutral">{t(`ticket.${ticket.type}`)}</Badge>
                          <Badge tone={TONE[ticket.status]}>
                            {t(`ticketStatus.${ticket.status}`)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-sand-600">
                          {ticket.reporterName}
                          {ticket.relatedStoreId &&
                            ` · ${storeById.get(ticket.relatedStoreId)?.name ?? ""}`}{" "}
                          · {formatDate(ticket.createdAt, locale)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-sand-700">{ticket.body}</p>

                    {ticket.resolutionNote && (
                      <Notice tone="success">{ticket.resolutionNote}</Notice>
                    )}

                    {ticket.status !== "resolved" && (
                      <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-3">
                        {ticket.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTicketStatus(ticket.id, "in_progress")}
                          >
                            {t("ticketStatus.in_progress")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            setResolving(ticket);
                            setNote("");
                          }}
                        >
                          {t("admin.resolve")}
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      {tab === "reviews" &&
        (reportedReviews.length === 0 ? (
          <EmptyState icon={Flag} title={t("admin.noPending")} />
        ) : (
          <ul className="space-y-3">
            {reportedReviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-sand-900">{review.buyerName}</p>
                        <p className="mt-0.5 text-xs text-sand-600">
                          {storeById.get(review.storeId)?.name} ·{" "}
                          {formatDate(review.createdAt, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Rating value={review.rating} />
                        {review.hidden && <Badge tone="danger">{t("seller.hidden")}</Badge>}
                        {review.reported && !review.hidden && (
                          <Badge tone="warning">{t("review.reported")}</Badge>
                        )}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-sm leading-relaxed text-sand-700">“{review.comment}”</p>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-3">
                      <Button
                        size="sm"
                        variant={review.hidden ? "outline" : "ghost"}
                        className={review.hidden ? undefined : "text-danger-700"}
                        onClick={() => {
                          setReviewHidden(review.id, !review.hidden);
                          toast(
                            review.hidden ? t("seller.visible") : t("admin.hideReview"),
                            "info",
                          );
                        }}
                      >
                        {review.hidden ? t("seller.visible") : t("admin.hideReview")}
                      </Button>
                      {review.reported && !review.hidden && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReviewHidden(review.id, false)}
                        >
                          إبقاء التقييم
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      <Modal
        open={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title={t("admin.resolve")}
        description={resolving?.subject}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setResolving(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (resolving) {
                  setTicketStatus(resolving.id, "resolved", note.trim() || undefined);
                  toast(t("ticketStatus.resolved"), "success");
                }
                setResolving(null);
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Field label={t("admin.decisionNote")} hint={t("common.optional")}>
          {(id) => (
            <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
      </Modal>
    </div>
  );
}
