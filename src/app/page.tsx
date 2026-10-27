"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/feedback";
import { ProductCard } from "@/components/commerce/product-card";
import { CATEGORIES } from "@/lib/data/categories";
import { TOWNS, townName } from "@/lib/data/towns";
import { useHirfa } from "@/lib/store";
import { useHydrated, useLocale, useT } from "@/lib/store/hooks";
import { publicProducts, publicStores } from "@/lib/store/selectors";
import { formatNumber } from "@/lib/format";
import { Rating } from "@/components/ui/misc";

export default function HomePage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();

  const stores = useHirfa((s) => s.stores);
  const products = useHirfa((s) => s.products);

  const [query, setQuery] = useState("");
  const [townId, setTownId] = useState("all");

  const visibleStores = useMemo(() => publicStores(stores), [stores]);
  const visibleProducts = useMemo(() => publicProducts(products, stores), [products, stores]);

  const featured = visibleStores.filter((s) => s.featured).slice(0, 3);
  const newest = [...visibleProducts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const countByCategory = visibleProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (townId !== "all") params.set("town", townId);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <>
      {/* ============================================================ HERO */}
      <section className="border-b border-sand-300 bg-sand-50">
        <div className="container-page">
          <div className="grid lg:grid-cols-[1.15fr_1px_0.85fr]">
            {/* headline column */}
            <div className="py-14 lg:py-20 lg:pe-12">
              <p className="eyebrow">{t("brand.subtagline")}</p>

              <h1 className="mt-7 text-balance text-[2.1rem] font-bold leading-[1.15] tracking-tight text-sand-900 sm:text-[2.75rem] lg:text-[3.25rem]">
                سوق المشاريع
                <br />
                <span className="text-plum-500">المنزلية النسائية</span>
                <br />
                في النقب
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-sand-700">
                اكتشفي منتجات وخدمات من مشاريع نسائية في بلدتك، اطلبي مباشرة من صاحبة المشروع،
                وتابعي طلبك خطوة بخطوة.
              </p>

              {/* search — a bordered bar, not a floating pill */}
              <form
                onSubmit={submitSearch}
                className="mt-9 flex flex-col divide-y divide-sand-300 border border-sand-900/15 bg-white sm:flex-row sm:divide-x sm:divide-y-0 sm:divide-x-reverse"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-sand-500" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.searchPlaceholder")}
                    aria-label={t("home.search")}
                    className="h-14 w-full bg-transparent ps-11 pe-4 text-sm text-sand-900 placeholder:text-sand-500 focus:outline-none"
                  />
                </div>

                <div className="relative sm:w-48">
                  <MapPin className="pointer-events-none absolute start-4 top-1/2 z-10 size-4 -translate-y-1/2 text-sand-500" />
                  <Select
                    value={townId}
                    onChange={(e) => setTownId(e.target.value)}
                    aria-label={t("search.town")}
                    className="h-14 rounded-none border-0 ps-11 focus:outline-none"
                  >
                    <option value="all">{t("home.allTowns")}</option>
                    {TOWNS.map((town) => (
                      <option key={town.id} value={town.id}>
                        {town.name[locale]}
                      </option>
                    ))}
                  </Select>
                </div>

                <Button type="submit" className="h-14 rounded-none px-8 sm:w-auto">
                  {t("home.search")}
                </Button>
              </form>

              {/* figures */}
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
                {[
                  { value: visibleStores.length, label: t("home.statsStores") },
                  { value: TOWNS.length, label: t("home.statsTowns") },
                  { value: visibleProducts.length, label: t("home.statsProducts") },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="text-[1.75rem] font-bold leading-none tabular-nums text-sand-900">
                      {hydrated ? formatNumber(stat.value, locale) : "—"}
                    </dd>
                    <dd className="mt-2 text-xs tracking-wide text-sand-600">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="hidden bg-sand-300 lg:block" aria-hidden="true" />

            {/* two doors */}
            <div className="flex max-w-md flex-col justify-center border-t border-sand-300 py-10 lg:border-t-0 lg:ps-12 lg:py-20">
              <p className="section-index">اختاري بوابتك</p>

              <Link
                href="/stores"
                className="group mt-6 block border-b border-sand-300 pb-7"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-xl font-bold text-sand-900 transition-colors group-hover:text-plum-500">
                    {t("home.gateBuy")}
                  </span>
                  <ArrowLeft className="size-5 shrink-0 flip-rtl text-sand-400 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-plum-500" />
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-sand-600">
                  {t("home.gateBuyDesc")}
                </span>
              </Link>

              <Link href="/seller/apply" className="group mt-7 block">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-xl font-bold text-sand-900 transition-colors group-hover:text-clay-600">
                    {t("home.gateSell")}
                  </span>
                  <ArrowLeft className="size-5 shrink-0 flip-rtl text-sand-400 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-clay-600" />
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-sand-600">
                  {t("home.gateSellDesc")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== CATEGORIES */}
      <section className="border-b border-sand-300 bg-white">
        <div className="container-page py-12">
          <SectionHead index="01" title={t("home.browseCategories")} />

          <ul className="mt-8 grid border-t border-sand-200 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category, index) => (
              <li key={category.slug}>
                <Link
                  href={`/search?category=${category.slug}`}
                  className="group flex items-baseline justify-between gap-4 border-b border-sand-200 py-5 transition-colors hover:bg-sand-100/70 lg:px-5"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="section-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base font-bold text-sand-900 transition-colors group-hover:text-plum-500">
                      {category.name[locale]}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-sand-500">
                    {hydrated ? (countByCategory[category.slug] ?? 0) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================================================ FEATURED STORES */}
      <section className="border-b border-sand-300">
        <div className="container-page py-14">
          <SectionHead
            index="02"
            title={t("home.featuredStores")}
            description={t("home.featuredStoresDesc")}
            href="/stores"
            linkLabel={t("home.viewAll")}
          />

          {!hydrated ? (
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <ol className="mt-10 grid gap-10 md:grid-cols-3">
              {featured.map((store, index) => (
                <li key={store.id} className="group">
                  <Link href={`/stores/${store.slug}`} className="block">
                    <span className="relative block aspect-[4/5] overflow-hidden bg-sand-200">
                      <Image
                        src={store.cover}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <span className="absolute bottom-0 start-0 bg-sand-50 px-3 py-1.5 text-xs font-bold tabular-nums text-sand-900">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </span>

                    <span className="mt-5 flex items-center gap-1.5">
                      <span className="text-lg font-bold text-sand-900 transition-colors group-hover:text-plum-500">
                        {store.name}
                      </span>
                      {store.verified && (
                        <BadgeCheck
                          className="size-4 shrink-0 text-plum-500"
                          aria-label={t("store.verified")}
                        />
                      )}
                    </span>

                    <span className="mt-1.5 block text-sm leading-relaxed text-sand-600">
                      {store.tagline}
                    </span>

                    <span className="mt-4 flex items-center justify-between gap-3 border-t border-sand-300 pt-3 text-xs text-sand-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {townName(store.townId, locale)}
                      </span>
                      <Rating
                        value={store.ratingAverage}
                        count={store.ratingCount}
                        emptyLabel={t("store.noRating")}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ====================================================== NEW ARRIVALS */}
      <section className="border-b border-sand-300 bg-white">
        <div className="container-page py-14">
          <SectionHead
            index="03"
            title={t("home.newProducts")}
            href="/search?sort=newest"
            linkLabel={t("home.viewAll")}
          />

          {!hydrated ? (
            <div className="mt-10 grid grid-cols-2 gap-px bg-sand-200 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {newest.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={storeById.get(product.storeId)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== HOW IT WORKS */}
      <section className="border-b border-sand-300">
        <div className="container-page py-16">
          <SectionHead index="04" title={t("home.howItWorks")} />

          <ol className="mt-10 grid gap-px bg-sand-300 md:grid-cols-3">
            {[
              { title: t("home.step1"), body: t("home.step1Desc") },
              { title: t("home.step2"), body: t("home.step2Desc") },
              { title: t("home.step3"), body: t("home.step3Desc") },
            ].map((step, index) => (
              <li key={step.title} className="bg-sand-100 p-7">
                <span className="text-[2.5rem] font-bold leading-none tabular-nums text-plum-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-base font-bold text-sand-900">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-sand-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========================================================= SELLER CTA */}
      <section className="bg-plum-500">
        <div className="container-page py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow text-plum-200">{t("footer.forSellers")}</p>
              <h2 className="mt-6 text-balance text-2xl font-bold leading-tight text-white sm:text-[2rem]">
                {t("home.sellerCtaTitle")}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-plum-100">
                {t("home.sellerCtaDesc")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/seller/apply"
                size="lg"
                className="bg-white text-plum-600 hover:bg-sand-100"
              >
                {t("nav.joinAsSeller")}
              </ButtonLink>
              <ButtonLink
                href="/about"
                size="lg"
                variant="ghost"
                className="text-white ring-1 ring-white/30 hover:bg-white/10"
              >
                {t("nav.about")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  index,
  title,
  description,
  href,
  linkLabel,
}: {
  index: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sand-900/15 pb-4">
      <div className="min-w-0">
        <span className="section-index">{index}</span>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-sand-900 sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-sand-600">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 transition-colors hover:text-plum-700"
        >
          {linkLabel}
          <ArrowLeft className="size-4 flip-rtl transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
}
