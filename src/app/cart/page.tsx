"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { LoadingBlock } from "@/components/layout/guards";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function CartPage() {
  const t = useT();
  const locale = useLocale();
  const hydrated = useHydrated();

  const cart = useHirfa((s) => s.cart);
  const products = useHirfa((s) => s.products);
  const stores = useHirfa((s) => s.stores);
  const setQuantity = useHirfa((s) => s.setCartQuantity);
  const removeItem = useHirfa((s) => s.removeCartItem);
  const clearCart = useHirfa((s) => s.clearCart);

  if (!hydrated) return <LoadingBlock />;

  const store = stores.find((s) => s.id === cart.storeId);

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
    const unitPrice = product?.price == null ? null : product.price + optionsDelta;
    return { line, product, unitPrice };
  });

  const subtotal = sum(lines, (l) => (l.unitPrice ?? 0) * l.line.quantity);
  const deliveryFee = store.deliveryFee ?? 0;

  return (
    <div className="container-page py-10">
      <PageHeader
        title={t("cart.title")}
        actions={
          <Button variant="ghost" onClick={clearCart} className="text-danger-700">
            <Trash2 className="size-4" />
            {t("cart.clear")}
          </Button>
        }
      />

      <Notice tone="neutral" className="mt-6">
        {t("cart.singleStoreNotice")}
      </Notice>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <Link
            href={`/stores/${store.slug}`}
            className="mb-4 inline-flex items-center gap-2.5 text-sm font-semibold text-sand-800 transition-colors hover:text-plum-500"
          >
            <span className="relative size-8 overflow-hidden rounded-md border border-sand-200">
              <Image src={store.logo} alt="" fill sizes="32px" className="object-cover" />
            </span>
            {store.name}
          </Link>

          <ul className="divide-y divide-sand-200 overflow-hidden rounded-lg border border-sand-200 bg-white">
            {lines.map(({ line, product, unitPrice }, index) => (
              <li key={`${line.productId}-${index}`} className="flex gap-4 p-4">
                <Link
                  href={`/products/${line.productId}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand-100"
                >
                  <Image
                    src={product?.images[0] ?? "/img/p1.svg"}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${line.productId}`}
                        className="text-sm font-bold text-sand-900 transition-colors hover:text-plum-500"
                      >
                        {product?.name ?? line.productId}
                      </Link>
                      {line.selectedOptions.length > 0 && (
                        <p className="mt-1 text-xs text-sand-600">
                          {line.selectedOptions.map((o) => `${o.label}: ${o.choice}`).join(" · ")}
                        </p>
                      )}
                      {line.note && (
                        <p className="mt-1 text-xs italic text-sand-600">“{line.note}”</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={t("cart.remove")}
                      className="shrink-0 rounded-xs p-1.5 text-sand-500 transition-colors hover:bg-danger-50 hover:text-danger-700"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-md border border-sand-300">
                      <button
                        type="button"
                        onClick={() => setQuantity(index, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="grid size-8 place-items-center text-sand-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
                        aria-label="−"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-bold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(index, line.quantity + 1)}
                        className="grid size-8 place-items-center text-sand-600 transition-colors hover:bg-sand-100"
                        aria-label="+"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-bold tabular-nums text-sand-900">
                      {formatPrice((unitPrice ?? 0) * line.quantity, locale)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-sand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-sand-900">{t("checkout.summary")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
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

            <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
              {t("cart.checkout")}
            </ButtonLink>
            <ButtonLink
              href="/stores"
              variant="ghost"
              className="mt-2 w-full"
            >
              {t("cart.continueShopping")}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
