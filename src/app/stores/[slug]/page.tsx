"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  Heart,
  AtSign,
  Link2,
  MapPin,
  MessageCircle,
  PackageX,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Rating, Tabs } from "@/components/ui/misc";
import { LoadingBlock, Breadcrumbs } from "@/components/layout/guards";
import { ProductCard } from "@/components/commerce/product-card";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { storeReviews } from "@/lib/store/selectors";
import { townName } from "@/lib/data/towns";
import { CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { formatDate, weekdayName } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useT();
  const locale = useLocale();
  const hydrated = useHydrated();
  const toast = useToast();

  const store = useHirfa((s) => s.stores.find((x) => x.slug === slug));
  const products = useHirfa((s) => s.products);
  const reviews = useHirfa((s) => s.reviews);
  const favorites = useHirfa((s) => s.favoriteStoreIds);
  const toggleFavorite = useHirfa((s) => s.toggleFavoriteStore);
  const trackStoreView = useHirfa((s) => s.trackStoreView);
  const trackWhatsapp = useHirfa((s) => s.trackWhatsappClick);

  const [tab, setTab] = useState<"products" | "reviews" | "info">("products");

  useEffect(() => {
    if (hydrated && store) trackStoreView();
    // Counted once per mount; the PRD treats views as a separate metric
    // from orders, so it never feeds the sales figures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, store?.id]);

  const storeProducts = useMemo(
    () => (store ? products.filter((p) => p.storeId === store.id && !p.hidden) : []),
    [products, store],
  );

  const storeReviewList = useMemo(
    () => (store ? storeReviews(reviews, store.id) : []),
    [reviews, store],
  );

  if (!hydrated) return <LoadingBlock />;

  if (!store) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={PackageX} title={t("common.notFound")} description={t("common.notFoundDesc")} />
      </div>
    );
  }

  const category = CATEGORY_BY_SLUG.get(store.category);
  const isFavorite = favorites.includes(store.id);
  const suspended = store.status === "suspended";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast(t("store.linkCopied"), "success");
    } catch {
      toast(window.location.href, "info");
    }
  }

  return (
    <div className="pb-16">
      {/* cover */}
      <div className="relative h-48 w-full overflow-hidden bg-sand-200 sm:h-64">
        <Image src={store.cover} alt="" fill sizes="100vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-900/55 to-transparent" />
      </div>

      <div className="container-page">
        {/* header card */}
        <div className="-mt-14 rounded-lg border border-sand-200 bg-white p-5 shadow-[0_12px_32px_-20px_rgb(51_35_43/0.3)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-sand-200 bg-white sm:size-24">
              <Image src={store.logo} alt="" fill sizes="96px" className="object-cover" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-sand-900">{store.name}</h1>
                {store.verified && (
                  <Badge tone="plum">
                    <BadgeCheck className="size-3.5" />
                    {t("store.verified")}
                  </Badge>
                )}
              </div>

              {store.tagline && (
                <p className="mt-1.5 text-sm text-sand-600">{store.tagline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sand-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {townName(store.townId, locale)}
                </span>
                {category && <Badge tone="clay">{category.name[locale]}</Badge>}
                <Rating
                  value={store.ratingAverage}
                  count={store.ratingCount}
                  emptyLabel={t("store.noRating")}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={isFavorite ? "subtle" : "outline"}
                onClick={() => toggleFavorite(store.id)}
              >
                <Heart className={cn("size-4", isFavorite && "fill-plum-500 text-plum-500")} />
                {isFavorite ? t("favorites.remove") : t("favorites.add")}
              </Button>
              <Button variant="outline" onClick={copyLink}>
                <Link2 className="size-4" />
                {t("store.share")}
              </Button>
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${store.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsapp()}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-success-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-success-700"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Breadcrumbs
            items={[
              { href: "/", label: t("nav.home") },
              { href: "/stores", label: t("nav.stores") },
              { label: store.name },
            ]}
          />
        </div>

        {suspended && (
          <Notice tone="danger" className="mb-6">
            هذا المتجر موقوف حاليًا من قبل إدارة المنصة.
            {store.suspensionReason && ` السبب: ${store.suspensionReason}`}
          </Notice>
        )}

        {!store.acceptingOrders && !suspended && (
          <Notice tone="warning" className="mb-6" icon={Clock}>
            {t("store.pausedNotice")}
          </Notice>
        )}

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "products", label: t("store.products"), count: storeProducts.length },
            { value: "reviews", label: t("store.reviews"), count: storeReviewList.length },
            { value: "info", label: t("store.info") },
          ]}
        />

        <div className="mt-8">
          {tab === "products" &&
            (storeProducts.length === 0 ? (
              <EmptyState icon={PackageX} title={t("store.noProducts")} />
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {storeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ))}

          {tab === "reviews" &&
            (storeReviewList.length === 0 ? (
              <EmptyState title={t("store.noReviews")} />
            ) : (
              <ul className="space-y-4">
                {storeReviewList.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-lg border border-sand-200 bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-sand-900">{review.buyerName}</p>
                        <p className="mt-0.5 text-xs text-sand-500">
                          {formatDate(review.createdAt, locale)}
                        </p>
                      </div>
                      <Rating value={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-sand-700">
                        {review.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          {tab === "info" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-sand-200 bg-white p-5">
                <h2 className="text-sm font-bold text-sand-900">{t("product.aboutStore")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-sand-700">{store.description}</p>
                {store.story && (
                  <blockquote className="mt-4 border-s-2 border-plum-200 ps-4 text-sm italic leading-relaxed text-sand-600">
                    {store.story}
                  </blockquote>
                )}

                <dl className="mt-5 space-y-3 border-t border-sand-200 pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sand-600">{t("search.delivery")}</dt>
                    <dd className="flex flex-wrap justify-end gap-1.5">
                      {store.deliveryMethods.map((method) => (
                        <Badge key={method} tone="neutral">
                          {t(`delivery.${method}`)}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                  {store.deliveryFee != null && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sand-600">{t("cart.deliveryFee")}</dt>
                      <dd className="font-semibold tabular-nums text-sand-900">
                        {store.deliveryFee} ₪
                      </dd>
                    </div>
                  )}
                  {store.publicPhone && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sand-600">{t("account.phone")}</dt>
                      <dd className="inline-flex items-center gap-1.5 font-semibold text-sand-900">
                        <Phone className="size-3.5 text-sand-500" />
                        <span dir="ltr">{store.publicPhone}</span>
                      </dd>
                    </div>
                  )}
                  {store.instagram && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-sand-600">Instagram</dt>
                      <dd>
                        <Link
                          href={`https://instagram.com/${store.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-plum-500 hover:text-plum-700"
                        >
                          <AtSign className="size-3.5" />
                          <span dir="ltr">@{store.instagram}</span>
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>

                {store.deliveryNote && (
                  <p className="mt-4 rounded-md bg-sand-100 px-4 py-3 text-xs leading-relaxed text-sand-700">
                    {store.deliveryNote}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-sand-200 bg-white p-5">
                <h2 className="text-sm font-bold text-sand-900">{t("store.workingDays")}</h2>
                <ul className="mt-4 divide-y divide-sand-200 text-sm">
                  {store.workingDays.map((day) => (
                    <li
                      key={day.day}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="font-medium text-sand-800">
                        {weekdayName(day.day, locale)}
                      </span>
                      {day.open ? (
                        <span className="tabular-nums text-sand-700" dir="ltr">
                          {day.from} – {day.to}
                        </span>
                      ) : (
                        <span className="text-sand-500">—</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
