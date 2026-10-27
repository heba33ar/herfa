"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  Heart,
  Minus,
  PackageX,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { Rating, SectionTitle } from "@/components/ui/misc";
import { LoadingBlock, Breadcrumbs } from "@/components/layout/guards";
import { PriceTag, ProductCard } from "@/components/commerce/product-card";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { townName } from "@/lib/data/towns";
import { useToast } from "@/components/ui/toast";
import { cn, sum } from "@/lib/utils";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const toast = useToast();

  const product = useHirfa((s) => s.products.find((p) => p.id === id));
  const stores = useHirfa((s) => s.stores);
  const products = useHirfa((s) => s.products);
  const favorites = useHirfa((s) => s.favoriteProductIds);
  const toggleFavorite = useHirfa((s) => s.toggleFavoriteProduct);
  const addToCart = useHirfa((s) => s.addToCart);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<string | null>(null);

  const store = product ? stores.find((s) => s.id === product.storeId) : undefined;

  const related = useMemo(
    () =>
      product
        ? products
            .filter((p) => p.storeId === product.storeId && p.id !== product.id && !p.hidden)
            .slice(0, 4)
        : [],
    [products, product],
  );

  if (!hydrated) return <LoadingBlock />;

  if (!product || !store) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={PackageX}
          title={t("common.notFound")}
          description={t("common.notFoundDesc")}
          action={
            <ButtonLink href="/search" variant="outline">
              {t("common.backHome")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const selectedOptions = product.options
    .map((option) => {
      const choiceId = choices[option.id] ?? option.choices[0]?.id;
      const choice = option.choices.find((c) => c.id === choiceId);
      return choice
        ? { label: option.label, choice: choice.label, priceDelta: choice.priceDelta }
        : null;
    })
    .filter((x): x is { label: string; choice: string; priceDelta: number } => x !== null);

  const unitPrice =
    product.price === null ? null : product.price + sum(selectedOptions, (o) => o.priceDelta);

  const isFavorite = favorites.includes(product.id);
  const orderable =
    product.available && store.acceptingOrders && store.status !== "suspended";
  const quotable = product.pricingMode === "on_request";

  function handleAdd(replaceStore = false) {
    const result = addToCart(
      product!.id,
      { quantity, selectedOptions, note: note || undefined },
      { replaceStore },
    );
    if (!result.ok && result.conflictStoreId) {
      setConflict(result.conflictStoreId);
      return;
    }
    if (result.ok) {
      setConflict(null);
      toast(t("product.addedToCart"), "success");
    }
  }

  const conflictStore = conflict ? stores.find((s) => s.id === conflict) : null;

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/stores", label: t("nav.stores") },
          { href: `/stores/${store.slug}`, label: store.name },
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ------------------------------------------------------ gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-sand-200 bg-sand-100">
            <Image
              src={product.images[activeImage] ?? product.images[0] ?? "/img/p1.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`${product.name} ${index + 1}`}
                  className={cn(
                    "relative size-20 overflow-hidden rounded-md border-2 transition-colors",
                    index === activeImage
                      ? "border-plum-500"
                      : "border-sand-200 hover:border-sand-400",
                  )}
                >
                  <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.kind === "service" && <Badge tone="plum">{t("product.service")}</Badge>}
            {!product.available && <Badge tone="neutral">{t("product.unavailable")}</Badge>}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-sand-900 sm:text-3xl">
            {product.name}
          </h1>

          <Link
            href={`/stores/${store.slug}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-sand-600 transition-colors hover:text-plum-500"
          >
            <span className="relative size-7 overflow-hidden rounded-full border border-sand-200">
              <Image src={store.logo} alt="" fill sizes="28px" className="object-cover" />
            </span>
            <span className="font-semibold text-sand-800">{store.name}</span>
            {store.verified && <BadgeCheck className="size-4 text-plum-500" />}
            <span className="text-sand-400">·</span>
            <span>{townName(store.townId, locale)}</span>
          </Link>

          <div className="mt-2">
            <Rating
              value={store.ratingAverage}
              count={store.ratingCount}
              emptyLabel={t("store.noRating")}
            />
          </div>

          <div className="mt-6 border-y border-sand-200 py-5">
            <PriceTag product={{ ...product, price: unitPrice }} large />
            {product.pricingMode === "starting_from" && (
              <p className="mt-1.5 text-xs text-sand-600">
                السعر النهائي بيتحدّد بعد التواصل مع البائعة حسب التفاصيل.
              </p>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-sand-700">{product.description}</p>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-sand-700">
              <Clock className="size-4 shrink-0 text-sand-500" />
              <dt className="text-sand-600">{t("product.preparationTime")}:</dt>
              <dd className="font-semibold">{product.preparationTime}</dd>
            </div>
            <div className="flex items-start gap-2 text-sand-700">
              <Truck className="mt-0.5 size-4 shrink-0 text-sand-500" />
              <dt className="text-sand-600">{t("product.deliveryOptions")}:</dt>
              <dd className="flex flex-wrap gap-1.5">
                {store.deliveryMethods.map((method) => (
                  <Badge key={method} tone="neutral">
                    {t(`delivery.${method}`)}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>

          {/* options */}
          {product.options.length > 0 && (
            <div className="mt-6 space-y-4">
              {product.options.map((option) => (
                <div key={option.id}>
                  <p className="mb-2 text-sm font-semibold text-sand-800">{option.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map((choice) => {
                      const active =
                        (choices[option.id] ?? option.choices[0]?.id) === choice.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() =>
                            setChoices((prev) => ({ ...prev, [option.id]: choice.id }))
                          }
                          className={cn(
                            "rounded-md border px-3.5 py-2 text-sm font-medium transition-all",
                            active
                              ? "border-plum-500 bg-plum-50 text-plum-600"
                              : "border-sand-300 bg-white text-sand-700 hover:border-sand-400",
                          )}
                        >
                          {choice.label}
                          {choice.priceDelta !== 0 && (
                            <span className="ms-1.5 text-xs tabular-nums opacity-70">
                              {choice.priceDelta > 0 ? "+" : "−"}
                              {formatPrice(Math.abs(choice.priceDelta), locale)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* quantity + note */}
          {orderable && !quotable && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-sand-800">
                  {t("product.quantity")}
                </p>
                <div className="inline-flex items-center rounded-md border border-sand-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="grid size-11 place-items-center text-sand-600 transition-colors hover:bg-sand-100 disabled:opacity-40"
                    disabled={quantity <= 1}
                    aria-label="−"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="grid size-11 place-items-center text-sand-600 transition-colors hover:bg-sand-100"
                    aria-label="+"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <Field label={t("product.note")} hint={t("product.notePlaceholder")}>
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
          )}

          {/* actions */}
          <div className="mt-7 flex flex-wrap gap-3">
            {!orderable ? (
              <Notice tone="warning" className="w-full">
                {!product.available ? t("product.unavailable") : t("store.pausedNotice")}
              </Notice>
            ) : quotable ? (
              <a
                href={store.whatsapp ? `https://wa.me/${store.whatsapp}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-md bg-plum-500 px-7 text-base font-semibold text-white transition-colors hover:bg-plum-600"
              >
                {t("product.requestQuote")}
              </a>
            ) : (
              <>
                <Button size="lg" className="flex-1" onClick={() => handleAdd()}>
                  <ShoppingBag className="size-4" />
                  {t("product.addToCart")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    handleAdd();
                    router.push("/cart");
                  }}
                >
                  {t("product.orderNow")}
                </Button>
              </>
            )}

            <Button
              size="icon"
              variant={isFavorite ? "subtle" : "outline"}
              className="h-13 w-13"
              onClick={() => toggleFavorite(product.id)}
              aria-label={isFavorite ? t("favorites.remove") : t("favorites.add")}
            >
              <Heart className={cn("size-5", isFavorite && "fill-plum-500 text-plum-500")} />
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionTitle title={t("product.moreFromStore")} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={Boolean(conflict)}
        onClose={() => setConflict(null)}
        title={t("cart.replaceCart")}
        description={conflictStore ? `السلة الحالية من: ${conflictStore.name}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConflict(null)}>
              {t("cart.keep")}
            </Button>
            <Button onClick={() => handleAdd(true)}>{t("cart.replace")}</Button>
          </>
        }
      >
        <Notice tone="neutral">{t("cart.singleStoreNotice")}</Notice>
      </Modal>
    </div>
  );
}
