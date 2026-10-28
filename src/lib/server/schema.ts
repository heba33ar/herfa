import type { Locale, Role, SubscriptionTier, User } from "@/lib/types";

/**
 * Shapes stored in the JSON database. These are server-side only — the
 * `passwordHash` must never cross into a client bundle, which is why
 * `toPublicUser()` exists and why every API route returns its result rather
 * than the raw record.
 */

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  townId?: string;
  locale: Locale;
  roles: Role[];
  consents: User["consents"];
  subscription: SubscriptionTier;
  /** `scrypt:<salt>:<hash>` — see lib/server/auth.ts */
  passwordHash: string;
  /** Set when an admin created the account rather than the person themselves. */
  createdByAdminId?: string;
  /** True until the invited person signs in for the first time. */
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type EmailStatus = "sent" | "recorded" | "failed";

/**
 * Every outgoing message is written here whether or not a provider is
 * configured, so the admin can always see what the platform tried to send.
 */
export interface DbEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  template:
    | "welcome"
    | "admin-invite"
    | "order-placed"
    | "order-status"
    | "application-submitted"
    | "application-decision";
  provider: string;
  status: EmailStatus;
  providerMessageId?: string;
  error?: string;
  createdAt: string;
}

export interface Db {
  version: number;
  users: DbUser[];
  sessions: DbSession[];
  emails: DbEmail[];
}

export const DB_VERSION = 1;

export function emptyDb(): Db {
  return { version: DB_VERSION, users: [], sessions: [], emails: [] };
}

/** Strips the password hash. The only shape that may reach the browser. */
export function toPublicUser(user: DbUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    townId: user.townId,
    locale: user.locale,
    roles: user.roles,
    consents: user.consents,
    subscription: user.subscription,
    createdAt: user.createdAt,
  };
}
