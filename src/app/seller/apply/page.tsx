"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleCheckBig, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { TOWNS, townName } from "@/lib/data/towns";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useCurrentUser, useLocale, useT } from "@/lib/store/hooks";
import type { CategorySlug, DeliveryMethod } from "@/lib/types";

const SAMPLE_IMAGES = [
  "/img/p2.svg", "/img/p7.svg", "/img/p12.svg",
  "/img/p16.svg", "/img/p20.svg", "/img/p23.svg",
];

export default function SellerApplyPage() {
  const t = useT();
  const locale = useLocale();
  const user = useCurrentUser();
  const submitApplication = useHirfa((s) => s.submitApplication);

  const [submitted, setSubmitted] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    ownerName: user?.name ?? "",
    projectName: "",
    category: "food" as CategorySlug,
    townId: "rahat",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    description: "",
  });
  const [delivery, setDelivery] = useState<DeliveryMethod[]>(["pickup"]);
  const [images, setImages] = useState<string[]>([]);
  const [publishConsent, setPublishConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  if (submitted) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={CircleCheckBig}
          title={t("apply.success")}
          description={t("apply.successDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/">{t("common.backHome")}</ButtonLink>
              <ButtonLink href="/stores" variant="outline">
                {t("nav.stores")}
              </ButtonLink>
            </div>
          }
        />
        <p className="mt-6 text-center text-sm text-sand-600">
          رقم الطلب: <span className="font-mono font-semibold">{submitted}</span>
        </p>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.ownerName.trim()) next.ownerName = t("common.required");
    if (!form.projectName.trim()) next.projectName = t("common.required");
    if (!form.phone.trim()) next.phone = t("common.required");
    if (!form.email.trim()) next.email = t("common.required");
    if (form.description.trim().length < 30) next.description = "٣٠ حرفًا على الأقل";
    if (!publishConsent) next.publishConsent = t("common.required");
    if (!terms) next.terms = t("common.required");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = submitApplication({
      userId: user?.id,
      ownerName: form.ownerName.trim(),
      projectName: form.projectName.trim(),
      category: form.category,
      townId: form.townId,
      phone: form.phone.trim(),
      email: form.email.trim(),
      description: form.description.trim(),
      deliveryOptions: delivery,
      sampleImages: images,
      acceptedTerms: true,
    });
    // Let the admins know there is something in the queue.
    void api.notify({
      type: "application_submitted",
      projectName: form.projectName.trim(),
      ownerName: form.ownerName.trim(),
      town: townName(form.townId, locale),
      category: CATEGORY_BY_SLUG.get(form.category)?.name[locale] ?? form.category,
    });
    setSubmitted(result.applicationId);
  }

  function toggleDelivery(method: DeliveryMethod) {
    setDelivery((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("apply.title")} description={t("apply.intro")} />

        {/* review process */}
        <ol className="mt-8 grid gap-px bg-sand-300 sm:grid-cols-4">
          {[
            { label: t("applicationStatus.new"), hint: "تعبّي الطلب" },
            { label: t("applicationStatus.under_review"), hint: "فريق حِرفة بيراجع" },
            { label: "مقابلة ملاءمة", hint: "مكالمة قصيرة" },
            { label: t("applicationStatus.accepted"), hint: "بينفتح متجرك" },
          ].map((step, index) => (
            <li key={step.label} className="bg-white p-4">
              <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-1.5 text-sm font-bold text-sand-900">{step.label}</p>
              <p className="mt-1 text-xs text-sand-600">{step.hint}</p>
            </li>
          ))}
        </ol>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="border border-sand-300 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">عن المشروع</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t("apply.ownerName")} required error={errors.ownerName}>
                {(id) => (
                  <Input
                    id={id}
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  />
                )}
              </Field>
              <Field label={t("apply.projectName")} required error={errors.projectName}>
                {(id) => (
                  <Input
                    id={id}
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  />
                )}
              </Field>
              <Field label={t("apply.category")} required>
                {(id) => (
                  <Select
                    id={id}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as CategorySlug })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name[locale]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t("apply.town")} required>
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
              <Field label={t("apply.phone")} required error={errors.phone}>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="050-000-0000"
                  />
                )}
              </Field>
              <Field label={t("account.email")} required error={errors.email}>
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                )}
              </Field>
            </div>

            <div className="mt-4">
              <Field
                label={t("apply.description")}
                required
                error={errors.description}
                hint={t("apply.descriptionPlaceholder")}
              >
                {(id) => (
                  <Textarea
                    id={id}
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t("apply.descriptionPlaceholder")}
                  />
                )}
              </Field>
            </div>
          </section>

          <section className="border border-sand-300 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("apply.deliveryOptions")}</h2>
            <div className="mt-4 space-y-2.5">
              {(["pickup", "local_delivery", "shipping"] as DeliveryMethod[]).map((method) => (
                <Checkbox
                  key={method}
                  label={t(`delivery.${method}`)}
                  checked={delivery.includes(method)}
                  onChange={() => toggleDelivery(method)}
                />
              ))}
            </div>
          </section>

          <section className="border border-sand-300 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("apply.images")}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-sand-600">
              {t("apply.imagesHint")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SAMPLE_IMAGES.map((image) => {
                const selected = images.includes(image);
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() =>
                      setImages((prev) =>
                        selected ? prev.filter((i) => i !== image) : [...prev, image],
                      )
                    }
                    className={`relative size-20 overflow-hidden border-2 transition-colors ${
                      selected ? "border-plum-500" : "border-sand-300"
                    }`}
                    aria-pressed={selected}
                  >
                    <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-sand-500">
              رفع الصور الحقيقي بيحتاج تخزين ملفات — غير مفعّل في هذه النسخة.
            </p>
          </section>

          <section className="border border-sand-300 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-sand-900">
              <ShieldCheck className="size-4 text-plum-500" />
              الخصوصية والموافقات
            </h2>
            <div className="mt-4 space-y-4">
              <Checkbox
                label={t("apply.privacyConsent")}
                checked={publishConsent}
                onChange={(e) => setPublishConsent(e.target.checked)}
              />
              {errors.publishConsent && (
                <p className="text-xs font-medium text-danger-700">{errors.publishConsent}</p>
              )}

              <Checkbox
                label={t("apply.terms")}
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              {errors.terms && (
                <p className="text-xs font-medium text-danger-700">{errors.terms}</p>
              )}

              <Notice tone="neutral">{t("seller.privacyHint")}</Notice>
            </div>
          </section>

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t("apply.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
