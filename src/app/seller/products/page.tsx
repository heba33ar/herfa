"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { formatPrice } from "@/lib/format";
import { createId } from "@/lib/utils";
import type { PricingMode, Product } from "@/lib/types";

const PLACEHOLDERS = [
  "/img/p1.svg", "/img/p6.svg", "/img/p11.svg", "/img/p17.svg", "/img/p21.svg",
];

export default function SellerProductsPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const store = useMyStore();

  const products = useHirfa((s) => s.products);
  const saveProduct = useHirfa((s) => s.saveProduct);
  const deleteProduct = useHirfa((s) => s.deleteProduct);
  const toggleHidden = useHirfa((s) => s.toggleProductHidden);
  const toggleAvailable = useHirfa((s) => s.toggleProductAvailable);

  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const storeId = store?.id;
  const mine = useMemo(
    () =>
      products
        .filter((p) => p.storeId === storeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [products, storeId],
  );

  function blankProduct(): Product {
    return {
      id: createId("p"),
      storeId: store!.id,
      name: "",
      description: "",
      category: store!.category,
      kind: "product",
      pricingMode: "fixed",
      price: 0,
      images: [PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]],
      options: [],
      preparationTime: "",
      available: true,
      hidden: false,
      createdAt: new Date().toISOString(),
    };
  }

  if (!store) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("seller.products")}
        description="أضيفي منتجاتك وخدماتك، وحدّدي التوفر والظهور لكل واحد."
        actions={
          <Button onClick={() => setEditing(blankProduct())}>
            <Plus className="size-4" />
            {t("seller.addProduct")}
          </Button>
        }
      />

      {mine.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("seller.noProducts")}
          action={
            <Button onClick={() => setEditing(blankProduct())}>{t("seller.addProduct")}</Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {mine.map((product) => (
            <li key={product.id}>
              <Card>
                <CardBody className="flex gap-4">
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand-100">
                    <Image
                      src={product.images[0] ?? "/img/p1.svg"}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-sand-900">
                        {product.name}
                      </h3>
                    </div>

                    <p className="mt-1 text-sm font-semibold tabular-nums text-plum-500">
                      {product.pricingMode === "on_request"
                        ? t("product.priceOnRequest")
                        : `${product.pricingMode === "starting_from" ? `${t("product.startingFrom")} ` : ""}${formatPrice(product.price, locale)}`}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.kind === "service" && (
                        <Badge tone="plum">{t("product.service")}</Badge>
                      )}
                      <Badge tone={product.available ? "success" : "neutral"}>
                        {product.available ? t("seller.available") : t("product.unavailable")}
                      </Badge>
                      <Badge tone={product.hidden ? "warning" : "neutral"}>
                        {product.hidden ? t("seller.hidden") : t("seller.visible")}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(product)}>
                        <Pencil className="size-3.5" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleHidden(product.id)}
                      >
                        {product.hidden ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5" />
                        )}
                        {product.hidden ? t("seller.visible") : t("seller.hidden")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAvailable(product.id)}
                      >
                        {product.available ? t("product.unavailable") : t("seller.available")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger-700"
                        onClick={() => setDeleting(product)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            saveProduct(next);
            setEditing(null);
            toast(t("account.saved"), "success");
          }}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t("seller.deleteProduct")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteProduct(deleting.id);
                setDeleting(null);
                toast(t("common.delete"), "info");
              }}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <Notice tone="danger">{t("seller.deleteProductConfirm")}</Notice>
      </Modal>
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<Product>(product);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = t("common.required");
    if (!draft.description.trim()) next.description = t("common.required");
    if (draft.pricingMode !== "on_request" && (draft.price ?? 0) <= 0) {
      next.price = t("common.required");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: draft.pricingMode === "on_request" ? null : Number(draft.price),
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name ? t("seller.editProduct") : t("seller.addProduct")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit}>{t("common.save")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("seller.productName")} required error={errors.name}>
          {(id) => (
            <Input id={id} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          )}
        </Field>

        <Field label={t("board.postBody")} required error={errors.description}>
          {(id) => (
            <Textarea
              id={id}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="وصف واضح: شو هو، الكمية أو الحجم، والمكوّنات أو الخامات."
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("seller.productKind")}>
            {(id) => (
              <Select
                id={id}
                value={draft.kind}
                onChange={(e) => set("kind", e.target.value as Product["kind"])}
              >
                <option value="product">{t("seller.kindProduct")}</option>
                <option value="service">{t("seller.kindService")}</option>
              </Select>
            )}
          </Field>

          <Field label={t("seller.pricingMode")}>
            {(id) => (
              <Select
                id={id}
                value={draft.pricingMode}
                onChange={(e) => set("pricingMode", e.target.value as PricingMode)}
              >
                <option value="fixed">{t("seller.pricingFixed")}</option>
                <option value="starting_from">{t("seller.pricingStarting")}</option>
                <option value="on_request">{t("seller.pricingOnRequest")}</option>
              </Select>
            )}
          </Field>
        </div>

        {draft.pricingMode !== "on_request" && (
          <Field label={t("seller.price")} required error={errors.price}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                value={draft.price ?? 0}
                onChange={(e) => set("price", Number(e.target.value))}
              />
            )}
          </Field>
        )}

        {draft.pricingMode === "on_request" && (
          <Notice tone="neutral">
            المنتج رح يظهر بدون سعر، مع زر «اطلبي عرض سعر» بدل زر الطلب المباشر.
          </Notice>
        )}

        <Field label={t("product.preparationTime")}>
          {(id) => (
            <Input
              id={id}
              value={draft.preparationTime}
              onChange={(e) => set("preparationTime", e.target.value)}
              placeholder="مثلًا: يومان، أو ٣ أيام عمل"
            />
          )}
        </Field>

        <div className="space-y-2.5 rounded-md border border-sand-200 p-4">
          <Checkbox
            label={t("seller.available")}
            checked={draft.available}
            onChange={(e) => set("available", e.target.checked)}
          />
          <Checkbox
            label={t("seller.hidden")}
            description="المنتج المخفي ما بيظهر في المتجر ولا بالبحث."
            checked={draft.hidden}
            onChange={(e) => set("hidden", e.target.checked)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-sand-800">{t("apply.images")}</p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => set("images", [image])}
                className={`relative size-16 overflow-hidden rounded-md border-2 transition-colors ${
                  draft.images[0] === image ? "border-plum-500" : "border-sand-200"
                }`}
              >
                <Image src={image} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-sand-600">
            رفع الصور الحقيقي بيحتاج تخزين ملفات — غير مفعّل في هذه النسخة.
          </p>
        </div>
      </div>
    </Modal>
  );
}
