"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { Store } from "@/lib/types";
import { useLocale, useT } from "@/lib/store/hooks";
import { townName } from "@/lib/data/towns";
import { CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { Rating } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StoreCard({
  store,
  productCount,
  className,
}: {
  store: Store;
  productCount?: number;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const category = CATEGORY_BY_SLUG.get(store.category);

  return (
    <article
      className={cn(
        "group relative flex flex-col border border-sand-300 bg-white transition-colors duration-300 hover:border-sand-900/30",
        className,
      )}
    >
      <div className="relative aspect-[21/9] overflow-hidden bg-sand-100">
        <Image
          src={store.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {!store.acceptingOrders && (
          <span className="absolute end-3 top-3">
            <Badge tone="neutral" className="bg-white/95 backdrop-blur">
              {t("storeStatus.paused")}
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="-mt-11 mb-3 flex items-end gap-3">
          <span className="relative size-14 shrink-0 overflow-hidden border-4 border-white bg-white">
            <Image src={store.logo} alt="" fill sizes="56px" className="object-cover" />
          </span>
        </div>

        <h3 className="flex items-center gap-1.5 text-base font-bold leading-snug text-sand-900">
          <Link href={`/stores/${store.slug}`} className="after:absolute after:inset-0">
            {store.name}
          </Link>
          {store.verified && (
            <BadgeCheck
              className="size-4 shrink-0 text-plum-500"
              aria-label={t("store.verified")}
            />
          )}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-sand-600">
          {store.tagline || store.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-sand-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {townName(store.townId, locale)}
          </span>
          {category && <Badge tone="clay">{category.name[locale]}</Badge>}
          {productCount != null && (
            <span className="tabular-nums">
              {productCount} {t("store.products")}
            </span>
          )}
        </div>

        <div className="mt-4 border-t border-sand-200 pt-3">
          <Rating
            value={store.ratingAverage}
            count={store.ratingCount}
            emptyLabel={t("store.noRating")}
          />
        </div>
      </div>
    </article>
  );
}
