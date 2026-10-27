/**
 * Domain model for منصة حِرفة.
 *
 * Mirrors the entity table in the PRD (Users, Sellers, Stores, Products,
 * Orders, OrderItems, Payments, Expenses, Reviews, Announcements,
 * DeliveryOffers, SupportTickets, AuditLogs).
 *
 * Every record carries the id of its owner so that the access rules in
 * `lib/auth/policy.ts` can be enforced per row: a seller may never read
 * another seller's revenue or customer names.
 */

export type Locale = "ar" | "he" | "en";

/** PRD §"نظام الصلاحيات والخصوصية" */
export type Role = "guest" | "buyer" | "seller" | "admin" | "admin_assistant";

export type CategorySlug =
  | "food"
  | "sweets"
  | "gifts"
  | "fashion"
  | "beauty"
  | "handicraft"
  | "events";

export interface Category {
  slug: CategorySlug;
  name: Record<Locale, string>;
  /** lucide-react icon name */
  icon: string;
}

export interface Town {
  id: string;
  name: Record<Locale, string>;
  region: Record<Locale, string>;
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  townId?: string;
  locale: Locale;
  /**
   * A single account can hold several roles at once — the PRD explicitly asks
   * for one account that is both buyer and seller rather than two logins.
   */
  roles: Role[];
  /** Separate, revocable consent — never bundled with account creation. */
  consents: {
    terms: boolean;
    privacy: boolean;
    marketingEmail: boolean;
    marketingWhatsapp: boolean;
    /** Required before a seller's photos or project details go public. */
    publishContent: boolean;
  };
  /** Paid subscription is distinct from a free account (PRD). */
  subscription: SubscriptionTier;
  createdAt: string;
}

export type SubscriptionTier = "free" | "premium";

/* -------------------------------------------------------------------------- */
/* Sellers & stores                                                           */
/* -------------------------------------------------------------------------- */

export type ApplicationStatus =
  | "new"
  | "under_review"
  | "needs_info"
  | "accepted"
  | "rejected";

export interface SellerApplication {
  id: string;
  userId?: string;
  ownerName: string;
  projectName: string;
  category: CategorySlug;
  townId: string;
  phone: string;
  email: string;
  description: string;
  deliveryOptions: DeliveryMethod[];
  sampleImages: string[];
  acceptedTerms: boolean;
  status: ApplicationStatus;
  /** Written whenever an admin accepts, rejects or asks for more detail. */
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
  submittedAt: string;
}

export type StoreStatus = "active" | "paused" | "needs_review" | "suspended";

export type DeliveryMethod = "pickup" | "local_delivery" | "shipping";

export interface WorkingDay {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  open: boolean;
  from?: string;
  to?: string;
}

export interface Store {
  id: string;
  slug: string;
  ownerId: string;
  name: string;
  tagline: string;
  description: string;
  story?: string;
  category: CategorySlug;
  townId: string;
  logo: string;
  cover: string;
  status: StoreStatus;
  /** "بائعة موثَّقة" badge from the deck — granted by admin, not self-claimed. */
  verified: boolean;
  featured: boolean;
  /** When false the storefront shows but the order button is disabled. */
  acceptingOrders: boolean;
  deliveryMethods: DeliveryMethod[];
  deliveryFee?: number;
  deliveryNote?: string;
  workingDays: WorkingDay[];
  /** Public contact only. The home address is never exposed. */
  publicPhone?: string;
  whatsapp?: string;
  instagram?: string;
  /** Derived from completed orders only — null until there is real data. */
  ratingAverage: number | null;
  ratingCount: number;
  suspensionReason?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export type PricingMode = "fixed" | "starting_from" | "on_request";

export interface ProductOption {
  id: string;
  label: string;
  choices: { id: string; label: string; priceDelta: number }[];
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  category: CategorySlug;
  /** Services (makeup, event design) may not have a single fixed price. */
  kind: "product" | "service";
  pricingMode: PricingMode;
  /** Null when pricingMode is "on_request" — never rendered as a real price. */
  price: number | null;
  images: string[];
  options: ProductOption[];
  /** Free text, e.g. "٣ أيام عمل". */
  preparationTime: string;
  available: boolean;
  hidden: boolean;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

/** PRD §"رحلة الطلب" — including the unhappy paths. */
export type OrderStatus =
  | "awaiting_response"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "rejected"
  | "issue";

export interface OrderItem {
  productId: string;
  name: string;
  /** Snapshot: the price at the time of ordering, not the live price. */
  unitPrice: number | null;
  quantity: number;
  selectedOptions: { label: string; choice: string; priceDelta: number }[];
  note?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  byRole: Role;
  note?: string;
}

export type PaymentState = "unpaid" | "partial" | "paid";

/**
 * A referral is an enquiry that left the platform (e.g. straight to WhatsApp).
 * It is never counted as a sale until the seller confirms the outcome.
 */
export type OrderOrigin = "platform" | "whatsapp_referral";

export interface Order {
  id: string;
  /** Human-facing reference, e.g. "1042". */
  reference: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  /** One order belongs to exactly one store (PRD: split multi-store carts). */
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  status: OrderStatus;
  origin: OrderOrigin;
  /** Recorded manually by the seller while there is no payment gateway. */
  paymentState: PaymentState;
  paidAmount: number;
  paymentMethod?: string;
  buyerNote?: string;
  sellerNote?: string;
  /** Visible to the seller only. */
  internalNote?: string;
  readyAt?: string;
  history: OrderStatusEvent[];
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Money                                                                      */
/* -------------------------------------------------------------------------- */

export type ExpenseCategory =
  | "materials"
  | "packaging"
  | "delivery"
  | "marketing"
  | "other";

export interface Expense {
  id: string;
  storeId: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  date: string;
}

/* -------------------------------------------------------------------------- */
/* Community                                                                  */
/* -------------------------------------------------------------------------- */

export interface Review {
  id: string;
  orderId: string;
  storeId: string;
  productId?: string;
  buyerId: string;
  buyerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  reported: boolean;
  hidden: boolean;
  createdAt: string;
}

export type AnnouncementCategory =
  | "looking_for"
  | "offering"
  | "collaboration"
  | "workshop";

export interface Announcement {
  id: string;
  authorStoreId: string;
  authorName: string;
  title: string;
  category: AnnouncementCategory;
  body: string;
  townId: string;
  expiresAt?: string;
  hidden: boolean;
  hiddenReason?: string;
  createdAt: string;
}

export interface DeliveryOffer {
  id: string;
  /** Opt-in only: a seller must choose to appear here. */
  providerStoreId?: string;
  providerName: string;
  areas: string[];
  availability: string;
  estimatedCost: string;
  /** Contact is revealed only after the provider accepts a request. */
  contact: string;
  active: boolean;
  createdAt: string;
}

export type DeliveryRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "delivered";

export interface DeliveryRequest {
  id: string;
  offerId: string;
  requesterStoreId: string;
  requesterName: string;
  orderReference?: string;
  fromTownId: string;
  toTownId: string;
  preferredDate: string;
  note?: string;
  status: DeliveryRequestStatus;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  summary: string;
  topic: "photography" | "pricing" | "marketing" | "finance" | "service";
  readingMinutes: number;
  body: string[];
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  seats: number;
  seatsTaken: number;
}

/* -------------------------------------------------------------------------- */
/* Operations                                                                 */
/* -------------------------------------------------------------------------- */

export type TicketType = "order_issue" | "store_report" | "review_report" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  type: TicketType;
  subject: string;
  body: string;
  reporterName: string;
  relatedStoreId?: string;
  relatedOrderId?: string;
  status: TicketStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  detail?: string;
  at: string;
}

/**
 * Platform traffic counters. Deliberately separate from order counts —
 * the PRD insists a WhatsApp click is not a sale and a registered buyer is
 * not an active buyer.
 */
export interface MetricsSnapshot {
  storeViews: number;
  productViews: number;
  whatsappClicks: number;
  registeredBuyers: number;
  activeBuyers: number;
}
