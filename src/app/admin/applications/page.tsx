"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { townName } from "@/lib/data/towns";
import { CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate } from "@/lib/format";
import type { ApplicationStatus, SellerApplication } from "@/lib/types";

const TONE: Record<ApplicationStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  new: "info",
  under_review: "warning",
  needs_info: "gold",
  accepted: "success",
  rejected: "danger",
};

export default function AdminApplicationsPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const applications = useHirfa((s) => s.applications);
  const decide = useHirfa((s) => s.decideApplication);

  const [tab, setTab] = useState<"pending" | "decided" | "all">("pending");
  const [decision, setDecision] = useState<{
    application: SellerApplication;
    status: ApplicationStatus;
  } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const buckets = useMemo(() => {
    const sorted = [...applications].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    );
    return {
      pending: sorted.filter((a) =>
        ["new", "under_review", "needs_info"].includes(a.status),
      ),
      decided: sorted.filter((a) => ["accepted", "rejected"].includes(a.status)),
      all: sorted,
    };
  }, [applications]);

  const shown = buckets[tab];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.applications")}
        description="كل قرار لازم يكون معه سبب موثَّق — بينحفظ في سجل التعديلات."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "pending", label: t("applicationStatus.under_review"), count: buckets.pending.length },
          { value: "decided", label: t("admin.review"), count: buckets.decided.length },
          { value: "all", label: t("common.all"), count: buckets.all.length },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState icon={Inbox} title={t("admin.noPending")} />
      ) : (
        <ul className="space-y-4">
          {shown.map((application) => {
            const category = CATEGORY_BY_SLUG.get(application.category);
            return (
              <li key={application.id}>
                <Card>
                  <CardBody className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-sand-900">
                            {application.projectName}
                          </h3>
                          <Badge tone={TONE[application.status]}>
                            {t(`applicationStatus.${application.status}`)}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-sand-600">
                          {application.ownerName} · {townName(application.townId, locale)} ·{" "}
                          {category?.name[locale]} ·{" "}
                          {formatDate(application.submittedAt, locale)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-sand-700">
                      {application.description}
                    </p>

                    <dl className="grid gap-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-sand-600">{t("apply.phone")}</dt>
                        <dd className="mt-0.5 text-sand-800" dir="ltr">
                          {application.phone}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-sand-600">{t("account.email")}</dt>
                        <dd className="mt-0.5 truncate text-sand-800" dir="ltr">
                          {application.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-sand-600">
                          {t("apply.deliveryOptions")}
                        </dt>
                        <dd className="mt-0.5 flex flex-wrap gap-1">
                          {application.deliveryOptions.map((method) => (
                            <Badge key={method} tone="neutral">
                              {t(`delivery.${method}`)}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    </dl>

                    {application.sampleImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {application.sampleImages.map((image) => (
                          <span
                            key={image}
                            className="relative size-16 overflow-hidden border border-sand-300"
                          >
                            <Image
                              src={image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </span>
                        ))}
                      </div>
                    )}

                    {application.decisionNote && (
                      <Notice tone={application.status === "rejected" ? "danger" : "neutral"}>
                        <span className="font-semibold">{t("admin.decisionNote")}: </span>
                        {application.decisionNote}
                        {application.decidedAt && (
                          <span className="mt-1 block text-xs opacity-70">
                            {formatDate(application.decidedAt, locale)}
                          </span>
                        )}
                      </Notice>
                    )}

                    {["new", "under_review", "needs_info"].includes(application.status) && (
                      <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
                        <Button
                          onClick={() => {
                            setDecision({ application, status: "accepted" });
                            setNote("");
                            setError("");
                          }}
                        >
                          {t("admin.accept")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDecision({ application, status: "needs_info" });
                            setNote("");
                            setError("");
                          }}
                        >
                          {t("admin.requestInfo")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-danger-700"
                          onClick={() => {
                            setDecision({ application, status: "rejected" });
                            setNote("");
                            setError("");
                          }}
                        >
                          {t("admin.reject")}
                        </Button>
                        {application.status === "new" && (
                          <Button
                            variant="ghost"
                            className="ms-auto"
                            onClick={() =>
                              decide(application.id, "under_review", "بدأت المراجعة")
                            }
                          >
                            {t("admin.review")}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        title={
          decision?.status === "accepted"
            ? t("admin.accept")
            : decision?.status === "rejected"
              ? t("admin.reject")
              : t("admin.requestInfo")
        }
        description={decision?.application.projectName}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDecision(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={decision?.status === "rejected" ? "danger" : "primary"}
              onClick={() => {
                if (!note.trim()) {
                  setError(t("admin.decisionNoteRequired"));
                  return;
                }
                if (decision) {
                  decide(decision.application.id, decision.status, note.trim());
                  toast(t(`applicationStatus.${decision.status}`), "success");
                }
                setDecision(null);
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Field
          label={t("admin.decisionNote")}
          required
          error={error}
          hint={t("admin.decisionNoteRequired")}
        >
          {(id) => (
            <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
        {decision?.status === "accepted" && (
          <Notice tone="success" className="mt-4">
            بعد القبول بينفتح متجر للبائعة، وبتحصل على صلاحية إدارة متجرها فقط.
          </Notice>
        )}
      </Modal>
    </div>
  );
}
