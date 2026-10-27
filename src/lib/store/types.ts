import type {
  Announcement,
  AnnouncementCategory,
  AuditLogEntry,
  DeliveryMethod,
  DeliveryOffer,
  DeliveryRequest,
  Expense,
  ExpenseCategory,
  Locale,
  MetricsSnapshot,
  Order,
  OrderStatus,
  PaymentState,
  Product,
  Review,
  SellerApplication,
  Store,
  SupportTicket,
  User,
  Workshop,
} from "@/lib/types";

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions: { label: string; choice: string; priceDelta: number }[];
  note?: string;
}

/** One cart holds one store at a time — see PRD §"سلة المشتريات بنطاق محدود". */
export interface CartState {
  storeId: string | null;
  items: CartItem[];
}

export interface CheckoutDetails {
  name: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  note?: string;
}

export interface HirfaData {
  locale: Locale;
  currentUserId: string | null;
  users: User[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  expenses: Expense[];
  announcements: Announcement[];
  deliveryOffers: DeliveryOffer[];
  deliveryRequests: DeliveryRequest[];
  applications: SellerApplication[];
  tickets: SupportTicket[];
  workshops: Workshop[];
  workshopRegistrations: string[];
  favoriteProductIds: string[];
  favoriteStoreIds: string[];
  cart: CartState;
  auditLogs: AuditLogEntry[];
  metrics: MetricsSnapshot;
  orderCounter: number;
}

export interface HirfaActions {
  setLocale: (locale: Locale) => void;

  /* auth */
  login: (email: string, password: string) => { ok: boolean; error?: "credentials" };
  loginAs: (userId: string) => void;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    townId?: string;
  }) => { ok: boolean; error?: "email_taken" };
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  deleteAccount: () => void;

  /* favourites */
  toggleFavoriteProduct: (productId: string) => void;
  toggleFavoriteStore: (storeId: string) => void;

  /* cart */
  addToCart: (
    productId: string,
    item: Omit<CartItem, "productId">,
    options?: { replaceStore?: boolean },
  ) => { ok: boolean; conflictStoreId?: string };
  setCartQuantity: (index: number, quantity: number) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;

  /* buyer orders */
  placeOrder: (details: CheckoutDetails) => { ok: boolean; orderId?: string };
  cancelOrder: (orderId: string, note?: string) => void;
  reportOrderIssue: (orderId: string, body: string) => void;
  submitReview: (input: {
    orderId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
  }) => void;
  reportReview: (reviewId: string) => void;

  /* seller — orders */
  acceptOrder: (orderId: string, readyAt?: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  setOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  setOrderPayment: (orderId: string, state: PaymentState, paidAmount: number, method?: string) => void;
  setOrderInternalNote: (orderId: string, note: string) => void;

  /* seller — catalogue & store */
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  toggleProductHidden: (productId: string) => void;
  toggleProductAvailable: (productId: string) => void;
  updateStore: (storeId: string, patch: Partial<Store>) => void;

  /* seller — money */
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (expenseId: string) => void;

  /* community */
  publishAnnouncement: (input: {
    title: string;
    category: AnnouncementCategory;
    body: string;
    expiresAt?: string;
  }) => void;
  deleteAnnouncement: (announcementId: string) => void;
  createDeliveryOffer: (input: Omit<DeliveryOffer, "id" | "createdAt" | "active">) => void;
  requestDelivery: (input: Omit<DeliveryRequest, "id" | "createdAt" | "status">) => void;
  respondToDeliveryRequest: (requestId: string, status: DeliveryRequest["status"]) => void;
  toggleWorkshopRegistration: (workshopId: string) => void;

  /* seller onboarding */
  submitApplication: (
    input: Omit<SellerApplication, "id" | "status" | "submittedAt">,
  ) => { ok: boolean; applicationId: string };

  /* admin */
  decideApplication: (
    applicationId: string,
    status: SellerApplication["status"],
    note: string,
  ) => void;
  setStoreFeatured: (storeId: string, featured: boolean) => void;
  setStoreVerified: (storeId: string, verified: boolean) => void;
  suspendStore: (storeId: string, reason: string) => void;
  reactivateStore: (storeId: string) => void;
  setReviewHidden: (reviewId: string, hidden: boolean) => void;
  setTicketStatus: (ticketId: string, status: SupportTicket["status"], note?: string) => void;

  /* analytics */
  trackWhatsappClick: () => void;
  trackStoreView: () => void;

  /* demo */
  resetData: () => void;
}

export type HirfaStore = HirfaData & HirfaActions;

export type { Expense, ExpenseCategory, Workshop };
