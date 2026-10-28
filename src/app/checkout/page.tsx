"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleCheckBig, Info, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { LoadingBlock, RequireAuth } from "@/components/layout/guards";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useCurrentUser, useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { DeliveryMethod } from "@/lib/types";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}

function CheckoutForm() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useCurrentUser();

  const cart = useHirfa((s) => s.cart);
  const products = useHirfa((s) => s.products);
  const stores = useHirfa((s) => s.stores);
  const placeOrder = useHirfa((s) => s.placeOrder);

  const store = stores.find((s) => s.id === cart.storeId);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    store?.deliveryMethods[0] ?? "pickup",
  );
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placedId, setPlacedId] = useState<string | null>(null);

  if (!hydrated) return <LoadingBlock />;

  if (placedId) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={CircleCheckBig}
          title={t("checkout.success")}
          description={t("checkout.successDesc")}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={`/account/orders/${placedId}`}>
                {t("checkout.viewOrder")}
              </ButtonLink>
              <ButtonLink href="/stores" variant="outline">
                {t("cart.continueShopping")}
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  if (!store || cart.items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title={t("cart.empty")}
          description={t("cart.emptyDesc")}
          action={<ButtonLink href="/stores">{t("cart.continueShopping")}</ButtonLink>}
        />
      </div>
    );
  }

  const lines = cart.items.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const optionsDelta = sum(line.selectedOptions, (o) => o.priceDelta);
    return {
      line,
      product,
      unitPrice: product?.price == null ? null : product.price + optionsDelta,
    };
  });

  const subtotal = sum(lines, (l) => (l.unitPrice ?? 0) * l.line.quantity);
  const deliveryFee = deliveryMethod === "pickup" ? 0 : (store.deliveryFee ?? 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("common.required");
    if (!phone.trim()) nextErrors.phone = t("common.required");
    if (deliveryMethod !== "pickup" && !address.trim()) nextErrors.address = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = placeOrder({
      name: name.trim(),
      phone: phone.trim(),
      deliveryMethod,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
    });

    if (result.ok && result.orderId) {
      setPlacedId(result.orderId);
      // Tell the seller. The server resolves her address from the store's
      // owner id, so no email address is ever sent from the browser.
      void api.notify({
        type: "order_placed",
        ownerId: store!.ownerId,
        reference: result.orderId.replace(/^o-/, ""),
        buyerName: name.trim(),
        total: formatPrice(subtotal + deliveryFee, locale),
        items: lines.map((l) => `${l.product?.name} × ${l.line.quantity}`).join("، "),
      });
      router.refresh();
    } else {
      // placeOrder refuses when the store has paused orders since the cart
      // was filled. Silence here looked like a dead button.
      setErrors({ form: t("checkout.failed") });
    }
  }

  return (
    <div className="container-page py-10">
      <PageHeader title={t("checkout.title")} />

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("checkout.contactDetails")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t("account.name")} required error={errors.name}>
                {(id) => (
                  <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />
                )}
              </Field>
              <Field label={t("account.phone")} required error={errors.phone}>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-000-0000"
                  />
                )}
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("checkout.deliveryMethod")}</h2>
            <div className="mt-4 space-y-4">
              <Field label={t("search.delivery")}>
                {(id) => (
                  <Select
                    id={id}
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                  >
                    {store.deliveryMethods.map((method) => (
                      <option key={method} value={method}>
                        {t(`delivery.${method}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {deliveryMethod !== "pickup" && (
                <Field label={t("checkout.address")} required error={errors.address}>
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="البلدة، الحي، نقطة دالّة"
                    />
                  )}
                </Field>
              )}

              {store.deliveryNote && deliveryMethod !== "pickup" && (
                <Notice tone="neutral">{store.deliveryNote}</Notice>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("checkout.noteToSeller")}</h2>
            <div className="mt-4">
              <Field label={t("common.optional")}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("product.notePlaceholder")}
                  />
                )}
              </Field>
            </div>
          </section>

          {errors.form && <Notice tone="danger">{errors.form}</Notice>}

          <Notice tone="info" icon={Info}>
            {t("checkout.paymentNotice")}
          </Notice>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("checkout.summary")}</h2>

            <div className="mt-4 flex items-center gap-2.5 border-b border-sand-200 pb-4">
              <span className="relative size-8 shrink-0 overflow-hidden rounded-md border border-sand-200">
                <Image src={store.logo} alt="" fill sizes="32px" className="object-cover" />
              </span>
              <span className="truncate text-sm font-semibold text-sand-800">{store.name}</span>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              {lines.map(({ line, product, unitPrice }, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span className="min-w-0 text-sand-700">
                    <span className="font-medium">{product?.name}</span>
                    <span className="text-sand-500"> × {line.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatPrice((unitPrice ?? 0) * line.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 border-t border-sand-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-sand-600">{t("cart.subtotal")}</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(subtotal, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sand-600">{t("cart.deliveryFee")}</dt>
                <dd className="font-semibold tabular-nums">
                  {deliveryFee > 0 ? formatPrice(deliveryFee, locale) : t("common.none")}
                </dd>
              </div>
              <div className="flex justify-between border-t border-sand-200 pt-3 text-base">
                <dt className="font-bold text-sand-900">{t("cart.total")}</dt>
                <dd className="font-bold tabular-nums text-plum-500">
                  {formatPrice(subtotal + deliveryFee, locale)}
                </dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-5 w-full">
              {t("checkout.placeOrder")}
            </Button>

            <p className="mt-3 text-xs leading-relaxed text-sand-600">
              {t("checkout.confirmNotice")}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
