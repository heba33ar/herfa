"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/field";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { ProductCard } from "@/components/commerce/product-card";
import { StoreCard } from "@/components/commerce/store-card";
import { CATEGORIES } from "@/lib/data/categories";
import { TOWNS } from "@/lib/data/towns";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { filterProducts, filterStores, publicProducts } from "@/lib/store/selectors";
import type { CategorySlug, DeliveryMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

export function SearchView() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();

  const stores = useHirfa((s) => s.stores);
  const products = useHirfa((s) => s.products);

  const [tab, setTab] = useState<"products" | "stores">("products");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategorySlug | "all">(
    (params.get("category") as CategorySlug) ?? "all",
  );
  const [townId, setTownId] = useState(params.get("town") ?? "all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod | "all">("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) ?? "relevance");

  const filters = {
    query,
    category,
    townId,
    minPrice: minPrice ? Number(minPrice) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    delivery,
    availableOnly,
    sort,
  };

  const matchedProducts = useMemo(
    () => filterProducts(products, stores, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, stores, query, category, townId, minPrice, maxPrice, delivery, availableOnly, sort],
  );

  const matchedStores = useMemo(
    () => filterStores(stores, { query, category, townId }),
    [stores, query, category, townId],
  );

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const countByStore = publicProducts(products, stores).reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.storeId] = (acc[p.storeId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const hasFilters =
    query ||
    category !== "all" ||
    townId !== "all" ||
    minPrice ||
    maxPrice ||
    delivery !== "all" ||
    availableOnly;

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setTownId("all");
    setMinPrice("");
    setMaxPrice("");
    setDelivery("all");
    setAvailableOnly(false);
    setSort("relevance");
    router.replace("/search");
  }

  const results = tab === "products" ? matchedProducts.length : matchedStores.length;

  return (
    <div className="container-page py-10">
      <PageHeader
        title={t("search.title")}
        description={
          hydrated ? `${results} ${t("search.resultsCount")}` : undefined
        }
        actions={
          <Button
            variant="outline"
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="size-4" />
            {t("search.filters")}
          </Button>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        {/* ------------------------------------------------------ filters */}
        <aside
          className={cn(
            "space-y-5 lg:block",
            filtersOpen ? "block" : "hidden",
          )}
        >
          <div className="rounded-lg border border-sand-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-sand-900">{t("search.filters")}</h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-plum-500 transition-colors hover:text-plum-700"
                >
                  {t("search.clearFilters")}
                </button>
              )}
            </div>

            <div className="mt-5 space-y-5">
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

              {tab === "products" && (
                <>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-sand-800">
                      {t("search.priceRange")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder={t("search.minPrice")}
                        aria-label={t("search.minPrice")}
                      />
                      <span className="text-sand-400">—</span>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={t("search.maxPrice")}
                        aria-label={t("search.maxPrice")}
                      />
                    </div>
                  </div>

                  <Field label={t("search.delivery")}>
                    {(id) => (
                      <Select
                        id={id}
                        value={delivery}
                        onChange={(e) => setDelivery(e.target.value as DeliveryMethod | "all")}
                      >
                        <option value="all">{t("common.all")}</option>
                        <option value="pickup">{t("delivery.pickup")}</option>
                        <option value="local_delivery">{t("delivery.local_delivery")}</option>
                        <option value="shipping">{t("delivery.shipping")}</option>
                      </Select>
                    )}
                  </Field>

                  <Checkbox
                    label={t("search.availableOnly")}
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                  />
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------ results */}
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "products", label: t("search.tabProducts"), count: matchedProducts.length },
                { value: "stores", label: t("search.tabStores"), count: matchedStores.length },
              ]}
            />

            {tab === "products" && (
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label={t("search.sort")}
                className="w-auto"
              >
                <option value="relevance">{t("search.sortRelevance")}</option>
                <option value="newest">{t("search.sortNewest")}</option>
                <option value="price_asc">{t("search.sortPriceAsc")}</option>
                <option value="price_desc">{t("search.sortPriceDesc")}</option>
              </Select>
            )}
          </div>

          {!hydrated ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : results === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t("search.empty")}
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("search.clearFilters")}
                  </Button>
                ) : undefined
              }
            />
          ) : tab === "products" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {matchedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={storeById.get(product.storeId)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {matchedStores.map((store) => (
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
    </div>
  );
}
