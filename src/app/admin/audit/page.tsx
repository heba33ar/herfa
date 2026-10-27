"use client";

import { FileClock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  accept_order: "قبول طلب",
  reject_order: "رفض طلب",
  cancel_order: "إلغاء طلب",
  set_order_status: "تغيير حالة طلب",
  set_order_payment: "تحديث حالة دفع",
  save_product: "حفظ منتج",
  delete_product: "حذف منتج",
  update_store: "تعديل متجر",
  decide_application: "قرار على طلب انضمام",
  feature_store: "إبراز متجر",
  unfeature_store: "إلغاء إبراز متجر",
  verify_store: "منح توثيق",
  unverify_store: "سحب توثيق",
  suspend_store: "إيقاف متجر",
  reactivate_store: "إعادة تفعيل متجر",
  hide_review: "إخفاء تقييم",
  unhide_review: "إظهار تقييم",
  set_ticket_status: "تحديث بلاغ",
};

export default function AdminAuditPage() {
  const t = useT();
  const locale = useLocale();
  const logs = useHirfa((s) => s.auditLogs);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.audit")}
        description="كل تعديل حسّاس بينسجّل: مين عدّل، شو، وإيمتى."
      />

      <Notice tone="neutral">
        السجل بيحتفظ بآخر ٣٠٠ عملية في هذه النسخة. في نسخة الإنتاج بينحفظ كامل في قاعدة
        البيانات مع إمكانية التصدير.
      </Notice>

      {logs.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="السجل فاضي"
          description="العمليات اللي بتعمليها في لوحة الإدارة أو لوحة البائعة بتظهر هون."
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-sand-200">
              {logs.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-sand-900">
                      <span className="font-bold">{entry.actorName}</span>{" "}
                      <span className="text-sand-600">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>{" "}
                      <span className="font-mono text-xs text-sand-500">
                        {entry.entity}#{entry.entityId}
                      </span>
                    </p>
                    {entry.detail && (
                      <p className="mt-1 text-xs leading-relaxed text-sand-600">
                        {entry.detail}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-sand-500">
                    {formatDateTime(entry.at, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
