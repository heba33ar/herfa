"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useHirfa, SEED_RESOURCES } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate } from "@/lib/format";
import type { Resource } from "@/lib/types";

export default function SellerResourcesPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const workshops = useHirfa((s) => s.workshops);
  const registrations = useHirfa((s) => s.workshopRegistrations);
  const toggleRegistration = useHirfa((s) => s.toggleWorkshopRegistration);

  const [reading, setReading] = useState<Resource | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader title={t("resources.title")} description={t("resources.desc")} />

      {/* guides */}
      <section>
        <div className="rule-diamond mb-6" />
        <ul className="grid gap-4 md:grid-cols-2">
          {SEED_RESOURCES.map((resource) => (
            <li key={resource.id}>
              <button
                type="button"
                onClick={() => setReading(resource)}
                className="group h-full w-full border border-sand-300 bg-white p-5 text-start transition-colors hover:border-sand-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="clay">{t(`topic.${resource.topic}`)}</Badge>
                  <span className="shrink-0 text-xs tabular-nums text-sand-500">
                    {resource.readingMinutes} {t("resources.readingTime")}
                  </span>
                </div>
                <h3 className="mt-3.5 text-base font-bold text-sand-900 transition-colors group-hover:text-plum-500">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-600">{resource.summary}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* workshops */}
      <section>
        <h2 className="text-lg font-bold tracking-tight text-sand-900">
          {t("resources.workshops")}
        </h2>
        <div className="rule-diamond mt-4 mb-6" />

        <ul className="space-y-3">
          {workshops.map((workshop) => {
            const registered = registrations.includes(workshop.id);
            const seatsLeft = workshop.seats - workshop.seatsTaken;
            const full = seatsLeft <= 0 && !registered;

            return (
              <li key={workshop.id}>
                <Card>
                  <CardBody className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-sand-900">{workshop.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-sand-600">
                        {workshop.description}
                      </p>
                      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sand-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {formatDate(workshop.date, locale)}
                        </span>
                        <span>{workshop.location}</span>
                        <span className="tabular-nums">
                          {full
                            ? t("resources.full")
                            : `${seatsLeft} ${t("resources.seatsLeft")}`}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant={registered ? "subtle" : "primary"}
                      disabled={full}
                      onClick={() => {
                        toggleRegistration(workshop.id);
                        toast(
                          registered ? t("common.cancel") : t("resources.registered"),
                          registered ? "info" : "success",
                        );
                      }}
                    >
                      {registered && <Check className="size-4" />}
                      {registered ? t("resources.registered") : t("resources.register")}
                    </Button>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        open={Boolean(reading)}
        onClose={() => setReading(null)}
        title={reading?.title ?? ""}
        description={reading?.summary}
        size="lg"
      >
        {reading && (
          <ol className="space-y-4">
            {reading.body.map((paragraph, index) => (
              <li key={index} className="flex gap-3.5">
                <span className="grid size-6 shrink-0 place-items-center bg-plum-50 text-xs font-bold text-plum-600">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-sand-700">{paragraph}</p>
              </li>
            ))}
          </ol>
        )}
        {reading && (
          <p className="mt-6 flex items-center gap-2 border-t border-sand-200 pt-4 text-xs text-sand-500">
            <BookOpen className="size-3.5" />
            {t(`topic.${reading.topic}`)} · {reading.readingMinutes}{" "}
            {t("resources.readingTime")}
          </p>
        )}
      </Modal>
    </div>
  );
}
