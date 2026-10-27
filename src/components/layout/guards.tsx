"use client";

import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import type { Role } from "@/lib/types";
import { useCurrentUser, useHydrated, useT } from "@/lib/store/hooks";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";

/** Shown while the persisted session is still rehydrating. */
export function LoadingBlock() {
  return (
    <div className="container-page space-y-4 py-16">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const t = useT();
  const hydrated = useHydrated();
  const user = useCurrentUser();

  if (!hydrated) return <LoadingBlock />;

  if (!user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={LockKeyhole}
          title={t("auth.loginRequired")}
          description={t("auth.loginRequiredDesc")}
          action={
            <div className="flex gap-3">
              <ButtonLink href="/login">{t("nav.login")}</ButtonLink>
              <ButtonLink href="/register" variant="outline">
                {t("nav.register")}
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const t = useT();
  const hydrated = useHydrated();
  const user = useCurrentUser();

  if (!hydrated) return <LoadingBlock />;

  if (!user) {
    return <RequireAuth>{children}</RequireAuth>;
  }

  // Admins reach the seller console only through their own store, so role
  // checks stay strict rather than cascading.
  if (!user.roles.includes(role)) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldAlert}
          title={t("common.noPermission")}
          description={t("common.noPermissionDesc")}
          action={
            <ButtonLink href="/" variant="outline">
              {t("common.backHome")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-sand-600">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-sand-400">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-plum-500">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-sand-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
