"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { TOWNS, townName } from "@/lib/data/towns";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { formatDate, todayIso } from "@/lib/format";
import type { DeliveryOffer, DeliveryRequestStatus } from "@/lib/types";

const STATUS_TONE: Record<DeliveryRequestStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  delivered: "plum",
};

export default function SellerDeliveryPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const store = useMyStore();

  const offers = useHirfa((s) => s.deliveryOffers);
  const requests = useHirfa((s) => s.deliveryRequests);
  const requestDelivery = useHirfa((s) => s.requestDelivery);
  const respond = useHirfa((s) => s.respondToDeliveryRequest);
  const createOffer = useHirfa((s) => s.createDeliveryOffer);

  const [tab, setTab] = useState<"offers" | "outgoing" | "incoming">("offers");
  const [requestFor, setRequestFor] = useState<DeliveryOffer | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  const [draft, setDraft] = useState({
    toTownId: "beer-sheva",
    preferredDate: todayIso(),
    orderReference: "",
    note: "",
  });

  const [offerDraft, setOfferDraft] = useState({
    areas: [] as string[],
    availability: "",
    estimatedCost: "",
  });

  const activeOffers = useMemo(
    () => offers.filter((o) => o.active && o.providerStoreId !== store?.id),
    [offers, store?.id],
  );

  const outgoing = useMemo(
    () =>
      requests
        .filter((r) => r.requesterStoreId === store?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, store?.id],
  );

  const incoming = useMemo(() => {
    const myOfferIds = offers.filter((o) => o.providerStoreId === store?.id).map((o) => o.id);
    return requests
      .filter((r) => myOfferIds.includes(r.offerId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [requests, offers, store?.id]);

  const hasOwnOffer = offers.some((o) => o.providerStoreId === store?.id);

  if (!store) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("deliveryNet.title")}
        description={t("deliveryNet.desc")}
        actions={
          !hasOwnOffer && (
            <Button variant="outline" onClick={() => setOfferOpen(true)}>
              {t("deliveryNet.offerService")}
            </Button>
          )
        }
      />

      <Notice tone="neutral" icon={ShieldCheck}>
        {t("deliveryNet.contactHidden")}
      </Notice>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "offers", label: t("deliveryNet.title"), count: activeOffers.length },
          { value: "outgoing", label: t("deliveryNet.outgoing"), count: outgoing.length },
          { value: "incoming", label: t("deliveryNet.incoming"), count: incoming.length },
        ]}
      />

      {tab === "offers" &&
        (activeOffers.length === 0 ? (
          <EmptyState icon={Truck} title={t("deliveryNet.empty")} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {activeOffers.map((offer) => (
              <li key={offer.id}>
                <Card className="h-full">
                  <CardBody className="flex h-full flex-col">
                    <h3 className="text-base font-bold text-sand-900">{offer.providerName}</h3>

                    <dl className="mt-4 flex-1 space-y-2.5 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-sand-600">
                          {t("deliveryNet.areas")}
                        </dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {offer.areas.map((area) => (
                            <Badge key={area} tone="neutral">
                              {townName(area, locale)}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-sand-600">{t("deliveryNet.availability")}</dt>
                        <dd className="text-end font-medium text-sand-800">
                          {offer.availability}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-sand-600">{t("deliveryNet.cost")}</dt>
                        <dd className="font-medium text-sand-800">{offer.estimatedCost}</dd>
                      </div>
                    </dl>

                    <Button
                      className="mt-5 w-full"
                      onClick={() => setRequestFor(offer)}
                    >
                      {t("deliveryNet.request")}
                    </Button>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      {tab === "outgoing" &&
        (outgoing.length === 0 ? (
          <EmptyState icon={Truck} title={t("board.empty")} />
        ) : (
          <RequestList
            requests={outgoing}
            offers={offers}
            locale={locale}
            t={t}
            showContactWhenAccepted
          />
        ))}

      {tab === "incoming" &&
        (incoming.length === 0 ? (
          <EmptyState icon={Truck} title={t("board.empty")} />
        ) : (
          <ul className="space-y-3">
            {incoming.map((request) => (
              <li key={request.id}>
                <Card>
                  <CardBody className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-sand-900">
                          {request.requesterName}
                        </p>
                        <Badge tone={STATUS_TONE[request.status]}>
                          {t(`deliveryRequest.${request.status}`)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-sand-600">
                        {t("deliveryNet.from")} {townName(request.fromTownId, locale)} →{" "}
                        {townName(request.toTownId, locale)} ·{" "}
                        {formatDate(request.preferredDate, locale)}
                      </p>
                      {request.note && (
                        <p className="mt-1 text-xs italic text-sand-600">“{request.note}”</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              respond(request.id, "accepted");
                              toast(t("deliveryRequest.accepted"), "success");
                            }}
                          >
                            {t("deliveryNet.accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respond(request.id, "declined")}
                          >
                            {t("deliveryNet.decline")}
                          </Button>
                        </>
                      )}
                      {request.status === "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            respond(request.id, "delivered");
                            toast(t("deliveryRequest.delivered"), "success");
                          }}
                        >
                          {t("deliveryNet.markDelivered")}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      {/* request modal */}
      <Modal
        open={Boolean(requestFor)}
        onClose={() => setRequestFor(null)}
        title={t("deliveryNet.request")}
        description={requestFor?.providerName}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRequestFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (requestFor) {
                  requestDelivery({
                    offerId: requestFor.id,
                    requesterStoreId: store.id,
                    requesterName: store.name,
                    orderReference: draft.orderReference || undefined,
                    fromTownId: store.townId,
                    toTownId: draft.toTownId,
                    preferredDate: draft.preferredDate,
                    note: draft.note || undefined,
                  });
                }
                setRequestFor(null);
                setTab("outgoing");
                toast(t("deliveryRequest.pending"), "info");
              }}
            >
              {t("deliveryNet.request")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("deliveryNet.from")}>
              {(id) => <Input id={id} readOnly value={townName(store.townId, locale)} />}
            </Field>
            <Field label={t("deliveryNet.to")}>
              {(id) => (
                <Select
                  id={id}
                  value={draft.toTownId}
                  onChange={(e) => setDraft({ ...draft, toTownId: e.target.value })}
                >
                  {TOWNS.map((town) => (
                    <option key={town.id} value={town.id}>
                      {town.name[locale]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label={t("deliveryNet.date")}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={draft.preferredDate}
                onChange={(e) => setDraft({ ...draft, preferredDate: e.target.value })}
              />
            )}
          </Field>

          <Field label={t("orders.orderNumber")} hint={t("common.optional")}>
            {(id) => (
              <Input
                id={id}
                value={draft.orderReference}
                onChange={(e) => setDraft({ ...draft, orderReference: e.target.value })}
                placeholder="1042"
              />
            )}
          </Field>

          <Field label={t("board.postBody")} hint={t("common.optional")}>
            {(id) => (
              <Textarea
                id={id}
                rows={2}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            )}
          </Field>

          <Notice tone="neutral">{t("deliveryNet.contactHidden")}</Notice>
        </div>
      </Modal>

      {/* offer modal */}
      <Modal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        title={t("deliveryNet.offerService")}
        description={t("deliveryNet.desc")}
        footer={
          <>
            <Button variant="outline" onClick={() => setOfferOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={offerDraft.areas.length === 0 || !offerDraft.availability.trim()}
              onClick={() => {
                createOffer({
                  providerStoreId: store.id,
                  providerName: store.name,
                  areas: offerDraft.areas,
                  availability: offerDraft.availability.trim(),
                  estimatedCost: offerDraft.estimatedCost.trim() || "حسب الاتفاق",
                  contact: store.publicPhone ?? "",
                });
                setOfferOpen(false);
                toast(t("account.saved"), "success");
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-sand-800">{t("deliveryNet.areas")}</p>
            <div className="flex flex-wrap gap-2">
              {TOWNS.map((town) => {
                const active = offerDraft.areas.includes(town.id);
                return (
                  <button
                    key={town.id}
                    type="button"
                    onClick={() =>
                      setOfferDraft((prev) => ({
                        ...prev,
                        areas: active
                          ? prev.areas.filter((a) => a !== town.id)
                          : [...prev.areas, town.id],
                      }))
                    }
                    className={`border px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-plum-500 bg-plum-50 text-plum-600"
                        : "border-sand-300 text-sand-700 hover:border-sand-400"
                    }`}
                  >
                    {town.name[locale]}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label={t("deliveryNet.availability")} required>
            {(id) => (
              <Input
                id={id}
                value={offerDraft.availability}
                onChange={(e) =>
                  setOfferDraft({ ...offerDraft, availability: e.target.value })
                }
                placeholder="مثلًا: أحد – خميس، بين ٤ و٧ مساءً"
              />
            )}
          </Field>

          <Field label={t("deliveryNet.cost")}>
            {(id) => (
              <Input
                id={id}
                value={offerDraft.estimatedCost}
                onChange={(e) =>
                  setOfferDraft({ ...offerDraft, estimatedCost: e.target.value })
                }
                placeholder="مثلًا: ٢٠–٣٠ ₪ حسب المسافة"
              />
            )}
          </Field>

          <Notice tone="warning">
            عرض خدمة التوصيل اختياري تمامًا، ووسيلة تواصلك ما بتنعرض إلا بعد ما تقبلي طلب تنسيق.
          </Notice>
        </div>
      </Modal>
    </div>
  );
}

function RequestList({
  requests,
  offers,
  locale,
  t,
  showContactWhenAccepted,
}: {
  requests: ReturnType<typeof useHirfa.getState>["deliveryRequests"];
  offers: DeliveryOffer[];
  locale: ReturnType<typeof useLocale>;
  t: ReturnType<typeof useT>;
  showContactWhenAccepted?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => {
        const offer = offers.find((o) => o.id === request.offerId);
        return (
          <li key={request.id}>
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-sand-900">{offer?.providerName}</p>
                      <Badge tone={STATUS_TONE[request.status]}>
                        {t(`deliveryRequest.${request.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-sand-600">
                      {townName(request.fromTownId, locale)} →{" "}
                      {townName(request.toTownId, locale)} ·{" "}
                      {formatDate(request.preferredDate, locale)}
                      {request.orderReference && ` · #${request.orderReference}`}
                    </p>
                  </div>

                  {showContactWhenAccepted && request.status === "accepted" && offer && (
                    <a
                      href={`tel:${offer.contact}`}
                      className="text-sm font-semibold text-plum-500 hover:text-plum-700"
                      dir="ltr"
                    >
                      {offer.contact}
                    </a>
                  )}
                </div>

                {request.status === "pending" && (
                  <p className="mt-3 text-xs text-sand-600">
                    {t("deliveryNet.contactHidden")}
                  </p>
                )}
              </CardBody>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
