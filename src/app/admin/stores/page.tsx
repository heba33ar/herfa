"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, StoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { StoreStatusBadge } from "@/components/commerce/status";
import { TOWNS, townName } from "@/lib/data/towns";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { CategorySlug, Store, StoreStatus } from "@/lib/types";

export default function AdminStoresPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const stores = useHirfa((s) => s.stores);
  const orders = useHirfa((s) => s.orders);
  const setFeatured = useHirfa((s) => s.setStoreFeatured);
  const setVerified = useHirfa((s) => s.setStoreVerified);
  const suspend = useHirfa((s) => s.suspendStore);
  const reactivate = useHirfa((s) => s.reactivateStore);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StoreStatus | "all">("all");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [townId, setTownId] = useState("all");
  const [sort, setSort] = useState<"revenue" | "orders" | "newest">("revenue");

  const [suspending, setSuspending] = useState<Store | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    return stores
      .map((store) => {
        const storeOrders = orders.filter((o) => o.storeId === store.id);
        const storeCompleted = completed.filter((o) => o.storeId === store.id);
        return {
          store,
          orderCount: storeOrders.length,
          completedCount: storeCompleted.length,
          revenue: sum(storeCompleted, (o) => o.total),
        };
      })
      .filter(({ store }) => {
        if (query && !store.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (status !== "all" && store.status !== status) return false;
        if (category !== "all" && store.category !== category) return false;
        if (townId !== "all" && store.townId !== townId) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "orders") return b.orderCount - a.orderCount;
        if (sort === "newest") return b.store.createdAt.localeCompare(a.store.createdAt);
        return b.revenue - a.revenue;
      });
  }, [stores, orders, query, status, category, townId, sort]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.stores")}
        description="فلترة حسب الحالة، الفئة، المنطقة والمبيعات. المبيعات المعروضة مبنية على الطلبات المكتملة فقط."
      />

      <div className="grid gap-3 border border-sand-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t("common.search")}>
          {(id) => (
            <Input
              id={id}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </Field>
        <Field label={t("orders.status")}>
          {(id) => (
            <Select
              id={id}
              value={status}
              onChange={(e) => setStatus(e.target.value as StoreStatus | "all")}
            >
              <option value="all">{t("common.all")}</option>
              <option value="active">{t("storeStatus.active")}</option>
              <option value="paused">{t("storeStatus.paused")}</option>
              <option value="needs_review">{t("storeStatus.needs_review")}</option>
              <option value="suspended">{t("storeStatus.suspended")}</option>
            </Select>
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
              <option value="all">{t("common.all")}</option>
              {TOWNS.map((town) => (
                <option key={town.id} value={town.id}>
                  {town.name[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("search.sort")}>
          {(id) => (
            <Select
              id={id}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="revenue">{t("admin.confirmedSales")}</option>
              <option value="orders">{t("admin.orders")}</option>
              <option value="newest">{t("search.sortNewest")}</option>
            </Select>
          )}
        </Field>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={StoreIcon} title={t("search.empty")} />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ store, orderCount, completedCount, revenue }) => (
            <li key={store.id}>
              <Card>
                <CardBody className="flex flex-wrap items-start gap-4">
                  <span className="relative size-14 shrink-0 overflow-hidden border border-sand-300">
                    <Image src={store.logo} alt="" fill sizes="56px" className="object-cover" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/stores/${store.slug}`}
                        className="text-sm font-bold text-sand-900 transition-colors hover:text-plum-500"
                      >
                        {store.name}
                      </Link>
                      <StoreStatusBadge status={store.status} />
                      {store.verified && (
                        <Badge tone="plum">
                          <BadgeCheck className="size-3" />
                          {t("store.verified")}
                        </Badge>
                      )}
                      {store.featured && (
                        <Badge tone="gold">
                          <Star className="size-3" />
                          {t("admin.feature")}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-sand-600">
                      {townName(store.townId, locale)} ·{" "}
                      {CATEGORY_BY_SLUG.get(store.category)?.name[locale]} · {orderCount}{" "}
                      {t("admin.orders")} · {completedCount} {t("status.completed")}
                    </p>

                    {store.suspensionReason && (
                      <p className="mt-2 text-xs text-danger-700">
                        {t("admin.suspendReason")}: {store.suspensionReason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="text-sm font-bold tabular-nums text-sand-900">
                      {completedCount > 0 ? formatPrice(revenue, locale) : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-sand-500">{t("admin.confirmedSales")}</p>
                  </div>

                  <div className="flex w-full flex-wrap gap-1.5 border-t border-sand-200 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFeatured(store.id, !store.featured)}
                    >
                      {store.featured ? t("admin.unfeature") : t("admin.feature")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVerified(store.id, !store.verified)}
                    >
                      {store.verified ? t("admin.unverify") : t("admin.verify")}
                    </Button>
                    {store.status === "suspended" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          reactivate(store.id);
                          toast(t("admin.reactivate"), "success");
                        }}
                      >
                        {t("admin.reactivate")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger-700"
                        onClick={() => {
                          setSuspending(store);
                          setReason("");
                          setError("");
                        }}
                      >
                        {t("admin.suspend")}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(suspending)}
        onClose={() => setSuspending(null)}
        title={t("admin.suspend")}
        description={suspending?.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSuspending(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!reason.trim()) {
                  setError(t("admin.decisionNoteRequired"));
                  return;
                }
                if (suspending) suspend(suspending.id, reason.trim());
                setSuspending(null);
                toast(t("storeStatus.suspended"), "info");
              }}
            >
              {t("admin.suspend")}
            </Button>
          </>
        }
      >
        <Field
          label={t("admin.suspendReason")}
          required
          error={error}
          hint={t("admin.decisionNoteRequired")}
        >
          {(id) => (
            <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} />
          )}
        </Field>
        <Notice tone="warning" className="mt-4">
          إيقاف المتجر بيخفي زر الطلب فورًا. الطلبات القائمة بتضل ظاهرة للبائعة والمشتريات.
        </Notice>
      </Modal>
    </div>
  );
}
