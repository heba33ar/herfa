import type {
  CategorySlug,
  DeliveryMethod,
  Order,
  Product,
  Review,
  Store,
} from "@/lib/types";
import { monthKey, sum } from "@/lib/utils";

/** Everything a visitor is allowed to see in the catalogue. */
export function publicStores(stores: Store[]) {
  return stores.filter((s) => s.status === "active" || s.status === "paused");
}

export function publicProducts(products: Product[], stores: Store[]) {
  const visible = new Set(publicStores(stores).map((s) => s.id));
  return products.filter((p) => !p.hidden && visible.has(p.storeId));
}

export interface ProductFilters {
  query?: string;
  category?: CategorySlug | "all";
  townId?: string | "all";
  minPrice?: number | null;
  maxPrice?: number | null;
  delivery?: DeliveryMethod | "all";
  availableOnly?: boolean;
  sort?: "relevance" | "newest" | "price_asc" | "price_desc";
}

function matchesText(haystack: string[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((value) => value.toLowerCase().includes(needle));
}

export function filterProducts(
  products: Product[],
  stores: Store[],
  filters: ProductFilters,
): Product[] {
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const base = publicProducts(products, stores);

  const result = base.filter((product) => {
    const store = storeById.get(product.storeId);
    if (!store) return false;

    if (!matchesText([product.name, product.description, store.name], filters.query ?? "")) {
      return false;
    }
    if (filters.category && filters.category !== "all" && product.category !== filters.category) {
      return false;
    }
    if (filters.townId && filters.townId !== "all" && store.townId !== filters.townId) {
      return false;
    }
    if (filters.availableOnly && !product.available) return false;
    if (
      filters.delivery &&
      filters.delivery !== "all" &&
      !store.deliveryMethods.includes(filters.delivery)
    ) {
      return false;
    }
    // Products priced on request are never excluded by a price range —
    // they have no price to compare against.
    if (product.price !== null) {
      if (filters.minPrice != null && product.price < filters.minPrice) return false;
      if (filters.maxPrice != null && product.price > filters.maxPrice) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "newest":
      return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price_asc":
      return [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    case "price_desc":
      return [...result].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    default:
      // Relevance: available first, then verified stores, then newest.
      return [...result].sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }
}

export function filterStores(
  stores: Store[],
  filters: Pick<ProductFilters, "query" | "category" | "townId">,
): Store[] {
  return publicStores(stores).filter((store) => {
    if (!matchesText([store.name, store.tagline, store.description], filters.query ?? "")) {
      return false;
    }
    if (filters.category && filters.category !== "all" && store.category !== filters.category) {
      return false;
    }
    if (filters.townId && filters.townId !== "all" && store.townId !== filters.townId) {
      return false;
    }
    return true;
  });
}

export function storeReviews(reviews: Review[], storeId: string) {
  return reviews
    .filter((r) => r.storeId === storeId && !r.hidden)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Money                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A sale counts only once the seller has confirmed completion. The PRD is
 * explicit that a WhatsApp conversation or an open order is not revenue.
 */
export function completedOrders(orders: Order[], storeId: string) {
  return orders.filter((o) => o.storeId === storeId && o.status === "completed");
}

export interface FinanceSummary {
  recordedSales: number;
  collected: number;
  outstanding: number;
  expenses: number;
  net: number;
  orderCount: number;
}

export function financeSummary(
  orders: Order[],
  expenses: { storeId: string; amount: number; date: string }[],
  storeId: string,
  month: string | "all",
): FinanceSummary {
  const completed = completedOrders(orders, storeId).filter(
    (o) => month === "all" || monthKey(o.createdAt) === month,
  );
  const relevantExpenses = expenses.filter(
    (e) => e.storeId === storeId && (month === "all" || monthKey(e.date) === month),
  );

  const recordedSales = sum(completed, (o) => o.total);
  const collected = sum(completed, (o) => o.paidAmount);
  const expenseTotal = sum(relevantExpenses, (e) => e.amount);

  return {
    recordedSales,
    collected,
    outstanding: recordedSales - collected,
    expenses: expenseTotal,
    net: collected - expenseTotal,
    orderCount: completed.length,
  };
}

export function availableMonths(
  orders: Order[],
  expenses: { storeId: string; date: string }[],
  storeId: string,
): string[] {
  const keys = new Set<string>();
  orders.filter((o) => o.storeId === storeId).forEach((o) => keys.add(monthKey(o.createdAt)));
  expenses.filter((e) => e.storeId === storeId).forEach((e) => keys.add(monthKey(e.date)));
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

/* -------------------------------------------------------------------------- */
/* Order flow                                                                 */
/* -------------------------------------------------------------------------- */

export const ORDER_FLOW: Order["status"][] = [
  "awaiting_response",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

export const TERMINAL_STATUSES: Order["status"][] = ["cancelled", "rejected", "issue"];

/** The next status a seller may move an order to, or null at the end. */
export function nextStatus(status: Order["status"]): Order["status"] | null {
  const index = ORDER_FLOW.indexOf(status);
  if (index < 0 || index >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[index + 1];
}

export function isOpenOrder(order: Order) {
  return !TERMINAL_STATUSES.includes(order.status) && order.status !== "completed";
}
