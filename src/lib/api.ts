"use client";

import type { Role, User } from "@/lib/types";

/**
 * Thin client for the account API. Every call returns a discriminated result
 * rather than throwing, so pages can render a message without try/catch.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });

    // A missing route returns the HTML 404 page, which would blow up
    // response.json() with a confusing parse error.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return { ok: false, error: `unexpected_response_${response.status}` };
    }

    const payload = await response.json();
    if (!response.ok) {
      return { ok: false, error: String(payload?.error ?? `http_${response.status}`) };
    }
    return { ok: true, data: payload as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "network_error" };
  }
}

export interface EmailOutcome {
  status: "sent" | "recorded" | "failed";
  provider: string;
  error?: string;
}

export const api = {
  status: () =>
    call<{
      db: { driver: string; persistent: boolean; blobConfigured: boolean };
      email: { configured: boolean; provider: string; from: string };
    }>("/api/status"),

  me: () => call<{ user: User | null }>("/api/auth/me"),

  login: (email: string, password: string) =>
    call<{ user: User }>("/api/auth/login", { method: "POST", body: { email, password } }),

  demoLogin: (userId: string) =>
    call<{ user: User }>("/api/auth/demo", { method: "POST", body: { userId } }),

  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    townId?: string;
    locale?: string;
    marketingEmail?: boolean;
  }) =>
    call<{ user: User; email: EmailOutcome }>("/api/auth/register", {
      method: "POST",
      body: input,
    }),

  logout: () => call<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  updateProfile: (patch: Partial<User>) =>
    call<{ user: User }>("/api/auth/profile", { method: "PATCH", body: patch }),

  deleteAccount: () => call<{ ok: true }>("/api/auth/profile", { method: "DELETE" }),

  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: true }>("/api/auth/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  /**
   * Fire-and-forget notification. Orders still live in the client store, so
   * the client tells the server an event happened; the server resolves who to
   * mail from the database.
   */
  notify: (payload: Record<string, unknown>) =>
    call<{ status?: string; skipped?: string; notified?: number }>("/api/notify", {
      method: "POST",
      body: payload,
    }),

  decideApplication: (input: {
    status: "accepted" | "rejected" | "needs_info";
    note: string;
    ownerName: string;
    projectName: string;
    email: string;
    phone?: string;
    townId?: string;
  }) =>
    call<{
      ownerId?: string;
      credentials?: { email: string; password: string };
      email: EmailOutcome;
    }>("/api/admin/applications", { method: "POST", body: input }),

  adminListUsers: () => call<{ users: User[] }>("/api/admin/users"),

  adminCreateUser: (input: {
    name: string;
    email: string;
    roles: Role[];
    phone?: string;
    townId?: string;
    password?: string;
  }) =>
    call<{ user: User; password: string; email: EmailOutcome }>("/api/admin/users", {
      method: "POST",
      body: input,
    }),

  adminEmails: () =>
    call<{
      emails: {
        id: string;
        to: string;
        subject: string;
        text: string;
        template: string;
        provider: string;
        status: EmailOutcome["status"];
        error?: string;
        createdAt: string;
      }[];
      provider: { configured: boolean; provider: string; from: string };
    }>("/api/admin/emails"),
};
