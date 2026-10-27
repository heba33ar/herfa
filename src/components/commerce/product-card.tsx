"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import type { Product, Store } from "@/lib/types";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { townName } from "@/lib/data/towns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  store,
  className,
}: {
  product: Product;
  store?: Store;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const favorites = useHirfa((s) => s.favoriteProductIds);
  const toggleFavorite = useHirfa((s) => s.toggleFavoriteProduct);
  const isFavorite = favorites.includes(product.id);

  return (
    <article
      className={cn(
        "group relative flex flex-col border border-sand-300 bg-white transition-colors duration-300 hover:border-sand-900/30",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-sand-100">
        <Image
          src={product.images[0] ?? "/img/p1.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-col items-start gap-1.5">
            {product.kind === "service" && (
              <Badge tone="plum" className="bg-white/95 backdrop-blur">
                {t("product.service")}
              </Badge>
            )}
            {!product.available && (
              <Badge tone="neutral" className="bg-white/95 backdrop-blur">
                {t("product.unavailable")}
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={isFavorite ? t("favorites.remove") : t("favorites.add")}
            aria-pressed={isFavorite}
            className="grid size-8 place-items-center rounded-full bg-white/95 text-sand-600 shadow-sm backdrop-blur transition-colors hover:text-plum-500"
          >
            <Heart className={cn("size-4", isFavorite && "fill-plum-500 text-plum-500")} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-sand-900">
          <Link href={`/products/${product.id}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>

        {store && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-sand-600">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {store.name} · {townName(store.townId, locale)}
            </span>
          </p>
        )}

        <div className="mt-auto pt-3">
          <PriceTag product={product} />
        </div>
      </div>
    </article>
  );
}

export function PriceTag({ product, large }: { product: Product; large?: boolean }) {
  const t = useT();
  const locale = useLocale();

  if (product.pricingMode === "on_request" || product.price === null) {
    return (
      <span
        className={cn(
          "font-bold text-plum-500",
          large ? "text-lg" : "text-sm",
        )}
      >
        {t("product.priceOnRequest")}
      </span>
    );
  }

  return (
    <span className="flex items-baseline gap-1.5">
      {product.pricingMode === "starting_from" && (
        <span className="text-xs font-medium text-sand-600">{t("product.startingFrom")}</span>
      )}
      <span
        className={cn(
          "font-bold tabular-nums text-sand-900",
          large ? "text-2xl" : "text-base",
        )}
      >
        {formatPrice(product.price, locale)}
      </span>
    </span>
  );
}
