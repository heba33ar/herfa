"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { StoreStatusBadge } from "@/components/commerce/status";
import { TOWNS } from "@/lib/data/towns";
import { CATEGORIES } from "@/lib/data/categories";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { weekdayName } from "@/lib/format";
import type { CategorySlug, DeliveryMethod } from "@/lib/types";

const LOGOS = ["/img/logo1.svg", "/img/logo4.svg", "/img/logo7.svg", "/img/logo10.svg"];
const COVERS = ["/img/cover1.svg", "/img/cover4.svg", "/img/cover7.svg", "/img/cover10.svg"];

export default function SellerStorePage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const store = useMyStore();
  const updateStore = useHirfa((s) => s.updateStore);

  const [form, setForm] = useState(() => ({
    name: store?.name ?? "",
    tagline: store?.tagline ?? "",
    description: store?.description ?? "",
    story: store?.story ?? "",
    category: store?.category ?? "food",
    townId: store?.townId ?? "rahat",
    publicPhone: store?.publicPhone ?? "",
    whatsapp: store?.whatsapp ?? "",
    instagram: store?.instagram ?? "",
    deliveryFee: store?.deliveryFee ?? 0,
    deliveryNote: store?.deliveryNote ?? "",
  }));

  if (!store) return null;

  const storeUrl =
    typeof window !== "undefined" ? `${window.location.origin}/stores/${store.slug}` : "";

  function save(e: React.FormEvent) {
    e.preventDefault();
    updateStore(store!.id, {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      story: form.story.trim() || undefined,
      category: form.category as CategorySlug,
      townId: form.townId,
      publicPhone: form.publicPhone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      deliveryFee: Number(form.deliveryFee) || 0,
      deliveryNote: form.deliveryNote.trim() || undefined,
    });
    toast(t("account.saved"), "success");
  }

  function toggleDelivery(method: DeliveryMethod, enabled: boolean) {
    const next = enabled
      ? [...store!.deliveryMethods, method]
      : store!.deliveryMethods.filter((m) => m !== method);
    updateStore(store!.id, { deliveryMethods: next.length ? next : ["pickup"] });
  }

  function toggleDay(day: number, open: boolean) {
    updateStore(store!.id, {
      workingDays: store!.workingDays.map((d) =>
        d.day === day
          ? { ...d, open, from: open ? (d.from ?? "09:00") : undefined, to: open ? (d.to ?? "18:00") : undefined }
          : d,
      ),
    });
  }

  function setDayTime(day: number, key: "from" | "to", value: string) {
    updateStore(store!.id, {
      workingDays: store!.workingDays.map((d) => (d.day === day ? { ...d, [key]: value } : d)),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("seller.storeSettings")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StoreStatusBadge status={store.status} />
            {store.verified && (
              <Badge tone="plum">
                <ShieldCheck className="size-3.5" />
                {t("store.verified")}
              </Badge>
            )}
          </div>
        }
      />

      <Notice tone="neutral">{t("seller.privacyHint")}</Notice>

      {/* accepting orders */}
      <Card>
        <CardBody>
          <Switch
            label={t("seller.acceptingOrders")}
            description={t("seller.pauseOrders")}
            checked={store.acceptingOrders}
            disabled={store.status === "suspended"}
            onChange={(next) => {
              updateStore(store.id, {
                acceptingOrders: next,
                status: next ? "active" : "paused",
              });
              toast(next ? t("storeStatus.active") : t("storeStatus.paused"), "info");
            }}
          />
        </CardBody>
      </Card>

      {/* share link */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("seller.storeLink")}</CardTitle>
            <CardDescription>{t("seller.storeLinkHint")}</CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-2">
            <Input readOnly value={storeUrl} dir="ltr" className="font-mono text-xs" />
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(storeUrl);
                toast(t("store.linkCopied"), "success");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* identity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("seller.myStore")}</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("seller.storeName")} required>
              {(id) => (
                <Input
                  id={id}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
            </Field>

            <Field label={t("seller.tagline")}>
              {(id) => (
                <Input
                  id={id}
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="جملة قصيرة بتوصف مشروعك"
                />
              )}
            </Field>

            <Field label={t("seller.storeDescription")} required>
              {(id) => (
                <Textarea
                  id={id}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              )}
            </Field>

            <Field label={t("seller.story")} hint={t("common.optional")}>
              {(id) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={form.story}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  placeholder="كيف بلّشتي؟ شو بيميّز شغلك؟"
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("apply.category")}>
                {(id) => (
                  <Select
                    id={id}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as CategorySlug })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name[locale]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t("apply.town")}>
                {(id) => (
                  <Select
                    id={id}
                    value={form.townId}
                    onChange={(e) => setForm({ ...form, townId: e.target.value })}
                  >
                    {TOWNS.map((town) => (
                      <option key={town.id} value={town.id}>
                        {town.name[locale]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t("account.phone")} hint="رقم للعرض العام">
                {(id) => (
                  <Input
                    id={id}
                    dir="ltr"
                    value={form.publicPhone}
                    onChange={(e) => setForm({ ...form, publicPhone: e.target.value })}
                  />
                )}
              </Field>
              <Field label="WhatsApp" hint="بصيغة دولية بدون +، مثلًا 9725…">
                {(id) => (
                  <Input
                    id={id}
                    dir="ltr"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Instagram" hint={t("common.optional")}>
                {(id) => (
                  <Input
                    id={id}
                    dir="ltr"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  />
                )}
              </Field>
              <Field label={t("cart.deliveryFee")}>
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    value={form.deliveryFee}
                    onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
                  />
                )}
              </Field>
            </div>

            <Field label="ملاحظة التوصيل" hint={t("common.optional")}>
              {(id) => (
                <Input
                  id={id}
                  value={form.deliveryNote}
                  onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
                  placeholder="مثلًا: التوصيل داخل رهط فقط بين ٤ و٧ مساءً"
                />
              )}
            </Field>

            <Button type="submit">{t("account.save")}</Button>
          </form>
        </CardBody>
      </Card>

      {/* imagery */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>الشعار وصورة الغلاف</CardTitle>
            <CardDescription>
              رفع الصور الحقيقي بيحتاج تخزين ملفات — غير مفعّل في هذه النسخة.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-sand-800">الشعار</p>
            <div className="flex flex-wrap gap-2">
              {LOGOS.map((logo) => (
                <button
                  key={logo}
                  type="button"
                  onClick={() => updateStore(store.id, { logo })}
                  className={`relative size-16 overflow-hidden rounded-md border-2 ${
                    store.logo === logo ? "border-plum-500" : "border-sand-200"
                  }`}
                >
                  <Image src={logo} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-sand-800">صورة الغلاف</p>
            <div className="flex flex-wrap gap-2">
              {COVERS.map((cover) => (
                <button
                  key={cover}
                  type="button"
                  onClick={() => updateStore(store.id, { cover })}
                  className={`relative h-14 w-28 overflow-hidden rounded-md border-2 ${
                    store.cover === cover ? "border-plum-500" : "border-sand-200"
                  }`}
                >
                  <Image src={cover} alt="" fill sizes="112px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* delivery methods */}
      <Card>
        <CardHeader>
          <CardTitle>{t("search.delivery")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {(["pickup", "local_delivery", "shipping"] as DeliveryMethod[]).map((method) => (
            <Checkbox
              key={method}
              label={t(`delivery.${method}`)}
              checked={store.deliveryMethods.includes(method)}
              onChange={(e) => toggleDelivery(method, e.target.checked)}
            />
          ))}
        </CardBody>
      </Card>

      {/* working days */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("store.workingDays")}</CardTitle>
            <CardDescription>أوقات استقبال الطلبات اللي بتظهر للمشتريات.</CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-sand-200">
            {store.workingDays.map((day) => (
              <li
                key={day.day}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <label className="flex min-w-32 items-center gap-2.5 text-sm font-medium text-sand-800">
                  <input
                    type="checkbox"
                    checked={day.open}
                    onChange={(e) => toggleDay(day.day, e.target.checked)}
                    className="size-[1.125rem] cursor-pointer rounded-xs border-sand-400 accent-plum-500"
                  />
                  {weekdayName(day.day, locale)}
                </label>

                {day.open ? (
                  <div className="flex items-center gap-2" dir="ltr">
                    <Input
                      type="time"
                      value={day.from ?? "09:00"}
                      onChange={(e) => setDayTime(day.day, "from", e.target.value)}
                      className="w-32"
                      aria-label="from"
                    />
                    <span className="text-sand-400">–</span>
                    <Input
                      type="time"
                      value={day.to ?? "18:00"}
                      onChange={(e) => setDayTime(day.day, "to", e.target.value)}
                      className="w-32"
                      aria-label="to"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-sand-500">{t("common.none")}</span>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
