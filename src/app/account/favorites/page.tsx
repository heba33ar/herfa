"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { ProductCard } from "@/components/commerce/product-card";
import { StoreCard } from "@/components/commerce/store-card";
import { useHirfa } from "@/lib/store";
import { useT } from "@/lib/store/hooks";

export default function FavoritesPage() {
  const t = useT();
  const [tab, setTab] = useState<"products" | "stores">("products");

  const products = useHirfa((s) => s.products);
  const stores = useHirfa((s) => s.stores);
  const favoriteProductIds = useHirfa((s) => s.favoriteProductIds);
  const favoriteStoreIds = useHirfa((s) => s.favoriteStoreIds);

  const savedProducts = products.filter((p) => favoriteProductIds.includes(p.id));
  const savedStores = stores.filter((s) => favoriteStoreIds.includes(s.id));
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const shown = tab === "products" ? savedProducts.length : savedStores.length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("favorites.title")} />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "products", label: t("favorites.products"), count: savedProducts.length },
          { value: "stores", label: t("favorites.stores"), count: savedStores.length },
        ]}
      />

      {shown === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("favorites.empty")}
          action={<ButtonLink href="/stores">{t("cart.continueShopping")}</ButtonLink>}
        />
      ) : tab === "products" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              store={storeById.get(product.storeId)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {savedStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
