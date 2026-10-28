"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuditLogEntry, Order, OrderStatus, Store } from "@/lib/types";
import {
  SEED_ANNOUNCEMENTS,
  SEED_APPLICATIONS,
  SEED_DELIVERY_OFFERS,
  SEED_DELIVERY_REQUESTS,
  SEED_EXPENSES,
  SEED_METRICS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_RESOURCES,
  SEED_REVIEWS,
  SEED_STORES,
  SEED_TICKETS,
  SEED_WORKSHOPS,
} from "@/lib/data/seed";
import { createId, slugify, sum } from "@/lib/utils";
import type { HirfaData, HirfaStore } from "./types";

export { SEED_RESOURCES };

const STORAGE_KEY = "hirfa.state.v1";

function initialData(): HirfaData {
  return {
    locale: "ar",
    currentUserId: null,
    sessionChecked: false,
    // Accounts live in the JSON database. This array holds the signed-in user
    // only, mirrored from /api/auth/me.
    users: [],
    stores: structuredClone(SEED_STORES),
    products: structuredClone(SEED_PRODUCTS),
    orders: structuredClone(SEED_ORDERS),
    reviews: structuredClone(SEED_REVIEWS),
    expenses: structuredClone(SEED_EXPENSES),
    announcements: structuredClone(SEED_ANNOUNCEMENTS),
    deliveryOffers: structuredClone(SEED_DELIVERY_OFFERS),
    deliveryRequests: structuredClone(SEED_DELIVERY_REQUESTS),
    applications: structuredClone(SEED_APPLICATIONS),
    tickets: structuredClone(SEED_TICKETS),
    workshops: structuredClone(SEED_WORKSHOPS),
    workshopRegistrations: [],
    favoriteProductIds: ["p-5", "p-14"],
    favoriteStoreIds: ["s-2"],
    cart: { storeId: null, items: [] },
    auditLogs: [],
    metrics: { ...SEED_METRICS },
    orderCounter: 1052,
  };
}

function nowIso() {
  return new Date().toISOString();
}

/** Recomputes a store's rating from its visible reviews only. */
function withRecalculatedRating(store: Store, reviews: { storeId: string; rating: number; hidden: boolean }[]) {
  const visible = reviews.filter((r) => r.storeId === store.id && !r.hidden);
  if (visible.length === 0) {
    return { ...store, ratingAverage: null, ratingCount: 0 };
  }
  const avg = sum(visible, (r) => r.rating) / visible.length;
  return { ...store, ratingAverage: Math.round(avg * 10) / 10, ratingCount: visible.length };
}

export const useHirfa = create<HirfaStore>()(
  persist(
    (set, get) => {
      /** Appends to the audit trail. Every admin and seller mutation calls it. */
      function audit(action: string, entity: string, entityId: string, detail?: string) {
        const state = get();
        const actor = state.users.find((u) => u.id === state.currentUserId);
        const entry: AuditLogEntry = {
          id: createId("log"),
          actorId: actor?.id ?? "anonymous",
          actorName: actor?.name ?? "زائرة",
          action,
          entity,
          entityId,
          detail,
          at: nowIso(),
        };
        set((s) => ({ auditLogs: [entry, ...s.auditLogs].slice(0, 300) }));
      }

      function patchOrder(orderId: string, patch: Partial<Order>, event?: { status: OrderStatus; note?: string }) {
        const state = get();
        const actor = state.users.find((u) => u.id === state.currentUserId);
        const byRole = actor?.roles.includes("admin")
          ? ("admin" as const)
          : actor?.roles.includes("seller")
            ? ("seller" as const)
            : ("buyer" as const);
        set((s) => ({
          orders: s.orders.map((order) => {
            if (order.id !== orderId) return order;
            const history = event
              ? [...order.history, { status: event.status, at: nowIso(), byRole, note: event.note }]
              : order.history;
            return { ...order, ...patch, history };
          }),
        }));
      }

      return {
        ...initialData(),

        setLocale: (locale) => set({ locale }),

        /* ------------------------------------------------------- session */
        setSessionUser: (user) =>
          // The locale is NOT adopted from the account here. This runs on
          // every page load, and doing so would silently undo whatever
          // language the visitor picked a moment earlier. Login sets it once,
          // and the switcher writes the choice back to the account.
          set({
            users: user ? [user] : [],
            currentUserId: user?.id ?? null,
            sessionChecked: true,
          }),

        setSessionChecked: (sessionChecked) => set({ sessionChecked }),

        clearLocalAccountData: () =>
          set((s) => ({
            // Orders live in this browser, so deleting the account on the
            // server is not enough — the name, phone and delivery address on
            // past orders would stay readable on this device.
            orders: s.orders.map((o) =>
              o.buyerId === s.currentUserId
                ? {
                    ...o,
                    buyerId: "deleted",
                    buyerName: "مستخدمة محذوفة",
                    buyerPhone: "—",
                    deliveryAddress: undefined,
                  }
                : o,
            ),
            favoriteProductIds: [],
            favoriteStoreIds: [],
            cart: { storeId: null, items: [] },
            users: [],
            currentUserId: null,
            sessionChecked: true,
          })),

        /* ---------------------------------------------------- favourites */
        toggleFavoriteProduct: (productId) =>
          set((s) => ({
            favoriteProductIds: s.favoriteProductIds.includes(productId)
              ? s.favoriteProductIds.filter((id) => id !== productId)
              : [...s.favoriteProductIds, productId],
          })),

        toggleFavoriteStore: (storeId) =>
          set((s) => ({
            favoriteStoreIds: s.favoriteStoreIds.includes(storeId)
              ? s.favoriteStoreIds.filter((id) => id !== storeId)
              : [...s.favoriteStoreIds, storeId],
          })),

        /* ---------------------------------------------------------- cart */
        addToCart: (productId, item, options) => {
          const state = get();
          const product = state.products.find((p) => p.id === productId);
          if (!product) return { ok: false };

          const cartStoreId = state.cart.storeId;
          if (cartStoreId && cartStoreId !== product.storeId && !options?.replaceStore) {
            return { ok: false, conflictStoreId: cartStoreId };
          }

          const base =
            cartStoreId && cartStoreId !== product.storeId ? [] : state.cart.items;

          // Merge identical lines (same product, same options, same note).
          const signature = (i: typeof item) =>
            `${i.selectedOptions.map((o) => o.choice).join("|")}::${i.note ?? ""}`;
          const existingIndex = base.findIndex(
            (line) => line.productId === productId && signature(line) === signature(item),
          );

          const items =
            existingIndex >= 0
              ? base.map((line, index) =>
                  index === existingIndex
                    ? { ...line, quantity: line.quantity + item.quantity }
                    : line,
                )
              : [...base, { productId, ...item }];

          set({ cart: { storeId: product.storeId, items } });
          return { ok: true };
        },

        setCartQuantity: (index, quantity) =>
          set((s) => ({
            cart: {
              ...s.cart,
              items: s.cart.items.map((line, i) =>
                i === index ? { ...line, quantity: Math.max(1, quantity) } : line,
              ),
            },
          })),

        removeCartItem: (index) =>
          set((s) => {
            const items = s.cart.items.filter((_, i) => i !== index);
            return { cart: { storeId: items.length ? s.cart.storeId : null, items } };
          }),

        clearCart: () => set({ cart: { storeId: null, items: [] } }),

        /* -------------------------------------------------- buyer orders */
        placeOrder: (details) => {
          const state = get();
          const { cart, products, stores, currentUserId, users } = state;
          if (!cart.storeId || cart.items.length === 0) return { ok: false };
          const store = stores.find((s) => s.id === cart.storeId);
          if (!store || !store.acceptingOrders) return { ok: false };

          const items = cart.items.map((line) => {
            const product = products.find((p) => p.id === line.productId)!;
            const optionsDelta = sum(line.selectedOptions, (o) => o.priceDelta);
            return {
              productId: line.productId,
              name: product.name,
              unitPrice: product.price === null ? null : product.price + optionsDelta,
              quantity: line.quantity,
              selectedOptions: line.selectedOptions,
              note: line.note,
            };
          });

          const subtotal = sum(items, (i) => (i.unitPrice ?? 0) * i.quantity);
          const deliveryFee =
            details.deliveryMethod === "pickup" ? 0 : (store.deliveryFee ?? 0);
          const reference = String(state.orderCounter + 1);
          const user = users.find((u) => u.id === currentUserId);

          const order: Order = {
            id: `o-${reference}`,
            reference,
            buyerId: currentUserId ?? "guest",
            buyerName: details.name || user?.name || "مشترية",
            buyerPhone: details.phone,
            storeId: store.id,
            items,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            deliveryMethod: details.deliveryMethod,
            deliveryAddress: details.address,
            status: "awaiting_response",
            origin: "platform",
            paymentState: "unpaid",
            paidAmount: 0,
            buyerNote: details.note,
            history: [{ status: "awaiting_response", at: nowIso(), byRole: "buyer" }],
            createdAt: nowIso(),
          };

          set((s) => ({
            orders: [order, ...s.orders],
            orderCounter: s.orderCounter + 1,
            cart: { storeId: null, items: [] },
          }));
          return { ok: true, orderId: order.id };
        },

        cancelOrder: (orderId, note) => {
          patchOrder(orderId, { status: "cancelled" }, { status: "cancelled", note });
          audit("cancel_order", "Order", orderId, note);
        },

        reportOrderIssue: (orderId, body) => {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order) return;
          set((s) => ({
            tickets: [
              {
                id: createId("t"),
                type: "order_issue",
                subject: `مشكلة في الطلب ${order.reference}`,
                body,
                reporterName: order.buyerName,
                relatedStoreId: order.storeId,
                relatedOrderId: order.id,
                status: "open",
                createdAt: nowIso(),
              },
              ...s.tickets,
            ],
          }));
          patchOrder(orderId, { status: "issue" }, { status: "issue", note: body });
        },

        submitReview: ({ orderId, rating, comment }) => {
          const state = get();
          const order = state.orders.find((o) => o.id === orderId);
          // Reviews exist only for completed orders (PRD).
          if (!order || order.status !== "completed") return;
          if (state.reviews.some((r) => r.orderId === orderId)) return;

          const review = {
            id: createId("r"),
            orderId,
            storeId: order.storeId,
            productId: order.items[0]?.productId,
            buyerId: order.buyerId,
            buyerName: order.buyerName,
            rating,
            comment,
            reported: false,
            hidden: false,
            createdAt: nowIso(),
          };
          const reviews = [review, ...state.reviews];
          set({
            reviews,
            stores: state.stores.map((s) =>
              s.id === order.storeId ? withRecalculatedRating(s, reviews) : s,
            ),
          });
        },

        reportReview: (reviewId) => {
          const review = get().reviews.find((r) => r.id === reviewId);
          if (!review) return;
          set((s) => ({
            reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, reported: true } : r)),
            tickets: [
              {
                id: createId("t"),
                type: "review_report",
                subject: "بلاغ على تقييم",
                body: review.comment ?? "بلا تعليق",
                reporterName: "مستخدمة",
                relatedStoreId: review.storeId,
                status: "open",
                createdAt: nowIso(),
              },
              ...s.tickets,
            ],
          }));
        },

        /* ------------------------------------------------- seller orders */
        acceptOrder: (orderId, readyAt) => {
          patchOrder(orderId, { status: "confirmed", readyAt }, { status: "confirmed" });
          audit("accept_order", "Order", orderId);
        },

        rejectOrder: (orderId, reason) => {
          patchOrder(
            orderId,
            { status: "rejected", sellerNote: reason },
            { status: "rejected", note: reason },
          );
          audit("reject_order", "Order", orderId, reason);
        },

        setOrderStatus: (orderId, status, note) => {
          patchOrder(orderId, { status, ...(note ? { sellerNote: note } : {}) }, { status, note });
          audit("set_order_status", "Order", orderId, status);
        },

        setOrderPayment: (orderId, paymentState, paidAmount, paymentMethod) => {
          patchOrder(orderId, { paymentState, paidAmount, paymentMethod });
          audit("set_order_payment", "Order", orderId, paymentState);
        },

        setOrderInternalNote: (orderId, internalNote) =>
          patchOrder(orderId, { internalNote }),

        /* --------------------------------------------- seller catalogue */
        saveProduct: (product) => {
          set((s) => {
            const exists = s.products.some((p) => p.id === product.id);
            return {
              products: exists
                ? s.products.map((p) => (p.id === product.id ? product : p))
                : [product, ...s.products],
            };
          });
          audit("save_product", "Product", product.id, product.name);
        },

        deleteProduct: (productId) => {
          set((s) => ({ products: s.products.filter((p) => p.id !== productId) }));
          audit("delete_product", "Product", productId);
        },

        toggleProductHidden: (productId) =>
          set((s) => ({
            products: s.products.map((p) =>
              p.id === productId ? { ...p, hidden: !p.hidden } : p,
            ),
          })),

        toggleProductAvailable: (productId) =>
          set((s) => ({
            products: s.products.map((p) =>
              p.id === productId ? { ...p, available: !p.available } : p,
            ),
          })),

        updateStore: (storeId, patch) => {
          set((s) => ({
            stores: s.stores.map((store) =>
              store.id === storeId
                ? {
                    ...store,
                    ...patch,
                    slug: patch.name ? slugify(patch.name) || store.slug : store.slug,
                  }
                : store,
            ),
          }));
          audit("update_store", "Store", storeId);
        },

        /* ------------------------------------------------- seller money */
        addExpense: (expense) =>
          set((s) => ({ expenses: [{ id: createId("e"), ...expense }, ...s.expenses] })),

        deleteExpense: (expenseId) =>
          set((s) => ({ expenses: s.expenses.filter((e) => e.id !== expenseId) })),

        /* ----------------------------------------------------- community */
        publishAnnouncement: ({ title, category, body, expiresAt }) => {
          const state = get();
          const store = state.stores.find((s) => s.ownerId === state.currentUserId);
          if (!store) return;
          set((s) => ({
            announcements: [
              {
                id: createId("a"),
                authorStoreId: store.id,
                authorName: store.name,
                title,
                category,
                body,
                townId: store.townId,
                expiresAt,
                hidden: false,
                createdAt: nowIso(),
              },
              ...s.announcements,
            ],
          }));
        },

        deleteAnnouncement: (announcementId) =>
          set((s) => ({
            announcements: s.announcements.filter((a) => a.id !== announcementId),
          })),

        createDeliveryOffer: (input) =>
          set((s) => ({
            deliveryOffers: [
              { id: createId("d"), active: true, createdAt: nowIso(), ...input },
              ...s.deliveryOffers,
            ],
          })),

        requestDelivery: (input) =>
          set((s) => ({
            deliveryRequests: [
              { id: createId("dr"), status: "pending", createdAt: nowIso(), ...input },
              ...s.deliveryRequests,
            ],
          })),

        respondToDeliveryRequest: (requestId, status) =>
          set((s) => ({
            deliveryRequests: s.deliveryRequests.map((r) =>
              r.id === requestId ? { ...r, status } : r,
            ),
          })),

        toggleWorkshopRegistration: (workshopId) =>
          set((s) => {
            const registered = s.workshopRegistrations.includes(workshopId);
            return {
              workshopRegistrations: registered
                ? s.workshopRegistrations.filter((id) => id !== workshopId)
                : [...s.workshopRegistrations, workshopId],
              workshops: s.workshops.map((w) =>
                w.id === workshopId
                  ? { ...w, seatsTaken: w.seatsTaken + (registered ? -1 : 1) }
                  : w,
              ),
            };
          }),

        /* --------------------------------------------- seller onboarding */
        submitApplication: (input) => {
          const application = {
            ...input,
            id: createId("app"),
            status: "new" as const,
            submittedAt: nowIso(),
          };
          set((s) => ({ applications: [application, ...s.applications] }));
          return { ok: true, applicationId: application.id };
        },

        /* --------------------------------------------------------- admin */
        decideApplication: (applicationId, status, note) => {
          const state = get();
          const application = state.applications.find((a) => a.id === applicationId);
          if (!application) return;

          set((s) => ({
            applications: s.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    status,
                    decisionNote: note,
                    decidedBy: s.currentUserId ?? undefined,
                    decidedAt: nowIso(),
                  }
                : a,
            ),
          }));

          // Acceptance creates the store the seller will manage — and only hers.
          if (status === "accepted" && !state.stores.some((s) => s.id === `s-${applicationId}`)) {
            const ownerId = application.userId ?? createId("u");
            const store: Store = {
              id: `s-${applicationId}`,
              slug: slugify(application.projectName) || applicationId,
              ownerId,
              name: application.projectName,
              tagline: "",
              description: application.description,
              category: application.category,
              townId: application.townId,
              logo: "/img/logo1.svg",
              cover: "/img/cover1.svg",
              status: "active",
              verified: false,
              featured: false,
              acceptingOrders: true,
              deliveryMethods: application.deliveryOptions,
              workingDays: Array.from({ length: 7 }, (_, day) => ({
                day,
                open: day <= 4,
                from: day <= 4 ? "09:00" : undefined,
                to: day <= 4 ? "18:00" : undefined,
              })),
              publicPhone: application.phone,
              ratingAverage: null,
              ratingCount: 0,
              createdAt: nowIso(),
            };
            set((s) => ({ stores: [...s.stores, store] }));
          }

          audit("decide_application", "SellerApplication", applicationId, `${status}: ${note}`);
        },

        setStoreFeatured: (storeId, featured) => {
          set((s) => ({
            stores: s.stores.map((store) =>
              store.id === storeId ? { ...store, featured } : store,
            ),
          }));
          audit(featured ? "feature_store" : "unfeature_store", "Store", storeId);
        },

        setStoreVerified: (storeId, verified) => {
          set((s) => ({
            stores: s.stores.map((store) =>
              store.id === storeId ? { ...store, verified } : store,
            ),
          }));
          audit(verified ? "verify_store" : "unverify_store", "Store", storeId);
        },

        suspendStore: (storeId, reason) => {
          set((s) => ({
            stores: s.stores.map((store) =>
              store.id === storeId
                ? { ...store, status: "suspended", acceptingOrders: false, suspensionReason: reason }
                : store,
            ),
          }));
          audit("suspend_store", "Store", storeId, reason);
        },

        reactivateStore: (storeId) => {
          set((s) => ({
            stores: s.stores.map((store) =>
              store.id === storeId
                ? { ...store, status: "active", acceptingOrders: true, suspensionReason: undefined }
                : store,
            ),
          }));
          audit("reactivate_store", "Store", storeId);
        },

        setReviewHidden: (reviewId, hidden) => {
          const state = get();
          const reviews = state.reviews.map((r) =>
            r.id === reviewId ? { ...r, hidden, reported: false } : r,
          );
          const review = state.reviews.find((r) => r.id === reviewId);
          set({
            reviews,
            stores: review
              ? state.stores.map((s) =>
                  s.id === review.storeId ? withRecalculatedRating(s, reviews) : s,
                )
              : state.stores,
          });
          audit(hidden ? "hide_review" : "unhide_review", "Review", reviewId);
        },

        setTicketStatus: (ticketId, status, resolutionNote) => {
          set((s) => ({
            tickets: s.tickets.map((t) =>
              t.id === ticketId ? { ...t, status, resolutionNote } : t,
            ),
          }));
          audit("set_ticket_status", "SupportTicket", ticketId, status);
        },

        /* ----------------------------------------------------- analytics */
        trackWhatsappClick: () =>
          set((s) => ({
            metrics: { ...s.metrics, whatsappClicks: s.metrics.whatsappClicks + 1 },
          })),

        trackStoreView: () =>
          set((s) => ({ metrics: { ...s.metrics, storeViews: s.metrics.storeViews + 1 } })),

        /* ---------------------------------------------------------- demo */
        // Resets the demo catalogue and orders. Accounts live on the server,
        // so the session is deliberately preserved — clearing it here would
        // log the UI out while the cookie stayed valid.
        resetData: () =>
          set((s) => ({
            ...initialData(),
            locale: s.locale,
            users: s.users,
            currentUserId: s.currentUserId,
            sessionChecked: s.sessionChecked,
          })),
      };
    },
    {
      name: STORAGE_KEY,
      // v1 persisted the whole account table and the session id. Those now
      // live on the server, so they are stripped on write and dropped from
      // any state an older build already saved in the browser.
      partialize: (state) => {
        const { users, currentUserId, sessionChecked, ...rest } = state;
        void users;
        void currentUserId;
        void sessionChecked;
        return rest as unknown as HirfaStore;
      },
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") {
          return persisted as unknown as HirfaStore;
        }
        const { users, currentUserId, sessionChecked, ...rest } =
          persisted as Record<string, unknown>;
        void users;
        void currentUserId;
        void sessionChecked;
        return rest as unknown as HirfaStore;
      },
      // The store is imported by server-rendered modules too; fall back to a
      // no-op store there so prerendering never touches localStorage.
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : localStorage,
      ),
      version: 2,
    },
  ),
);
