"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { StoreCard } from "@/components/commerce/store-card";
import { CATEGORIES } from "@/lib/data/categories";
import { TOWNS } from "@/lib/data/towns";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { filterStores, publicProducts } from "@/lib/store/selectors";
import type { CategorySlug } from "@/lib/types";

export default function StoresPage() {
  const t = useT();
  const locale = useLocale();
  const hydrated = useHydrated();

  const stores = useHirfa((s) => s.stores);
  const products = useHirfa((s) => s.products);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [townId, setTownId] = useState("all");

  const matched = useMemo(
    () => filterStores(stores, { query, category, townId }),
    [stores, query, category, townId],
  );

  const countByStore = publicProducts(products, stores).reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.storeId] = (acc[p.storeId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="container-page py-10">
      <PageHeader
        title={t("nav.stores")}
        description="تصفّحي كل المتاجر النشطة على المنصة، وفلتري حسب الفئة أو البلدة."
      />

      <div className="mt-8 grid gap-3 rounded-lg border border-sand-200 bg-white p-4 sm:grid-cols-3">
        <Field label={t("common.search")}>
          {(id) => (
            <Input
              id={id}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
            />
          )}
        </Field>
        <Field label={t("search.category")}>
          {(id) => (
            <Select
              id={id}
              value={category}
              onChange={(e) => setCategory(e.target.value as CategorySlug | "all")}
            >
              <option value="all">{t("common.all")}</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("search.town")}>
          {(id) => (
            <Select id={id} value={townId} onChange={(e) => setTownId(e.target.value)}>
              <option value="all">{t("home.allTowns")}</option>
              {TOWNS.map((town) => (
                <option key={town.id} value={town.id}>
                  {town.name[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="mt-8">
        {!hydrated ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : matched.length === 0 ? (
          <EmptyState icon={SearchX} title={t("search.empty")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matched.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                productCount={countByStore[store.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
