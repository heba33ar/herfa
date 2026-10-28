"use client";

import { useEffect, useState } from "react";
import { Mail, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice, Skeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDateTime } from "@/lib/format";

type Outbox = Awaited<ReturnType<typeof api.adminEmails>>;
type Payload = Extract<Outbox, { ok: true }>["data"];
type Message = Payload["emails"][number];

const TONE = {
  sent: "success",
  recorded: "neutral",
  failed: "danger",
} as const;

export default function AdminEmailsPage() {
  const t = useT();
  const locale = useLocale();

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<Message | null>(null);

  useEffect(() => {
    api.adminEmails().then((result) => {
      if (result.ok) setPayload(result.data);
      else setError(result.error);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.outbox")} description={t("admin.outboxDesc")} />

      {error && <Notice tone="danger">{error}</Notice>}

      {payload &&
        (payload.provider.configured ? (
          <Notice tone="success" icon={Mail}>
            {t("email.providerActive")} — {payload.provider.provider} ·{" "}
            <span dir="ltr">{payload.provider.from}</span>
          </Notice>
        ) : (
          <Notice tone="warning" icon={TriangleAlert}>
            {t("email.noProvider")}
          </Notice>
        ))}

      {!payload && !error ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : payload && payload.emails.length === 0 ? (
        <EmptyState icon={Mail} title={t("admin.outboxEmpty")} />
      ) : (
        <ul className="space-y-3">
          {payload?.emails.map((message) => (
            <li key={message.id}>
              <Card>
                <CardBody>
                  <button
                    type="button"
                    onClick={() => setReading(message)}
                    className="w-full text-start"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-sand-900">{message.subject}</p>
                          <Badge tone={TONE[message.status]}>
                            {t(`emailStatus.${message.status}`)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-sand-600" dir="ltr">
                          {message.to}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-sand-500">
                        {formatDateTime(message.createdAt, locale)}
                      </span>
                    </div>

                    {message.error && (
                      <p className="mt-2 text-xs leading-relaxed text-danger-700">
                        {message.error}
                      </p>
                    )}
                  </button>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(reading)}
        onClose={() => setReading(null)}
        title={reading?.subject ?? ""}
        description={reading?.to}
        size="lg"
      >
        {reading && (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-sand-700">
            {reading.text}
          </pre>
        )}
      </Modal>
    </div>
  );
}
