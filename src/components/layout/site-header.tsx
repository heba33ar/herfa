"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store as StoreIcon,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { Button, ButtonLink } from "@/components/ui/button";
import { useHirfa } from "@/lib/store";
import { useCartCount, useCurrentUser, useHydrated, useT } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const cartCount = useCartCount();
  const logout = useHirfa((s) => s.logout);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close both menus when the route changes. Adjusting state during render is
  // React's documented alternative to an effect that only resets state.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  const isSeller = Boolean(user?.roles.includes("seller"));
  const isAdmin = Boolean(user?.roles.includes("admin"));

  const navLinks = [
    { href: "/stores", label: t("nav.stores") },
    { href: "/search", label: t("nav.products") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand-900/15 bg-sand-50/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-3">
        <button
          type="button"
          className="-ms-2 inline-grid size-10 place-items-center rounded-md text-sand-700 transition-colors hover:bg-sand-200/70 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label={t("nav.menu")}
        >
          <Menu className="size-5" />
        </button>

        <Logo />

        {!compact && (
          <nav className="ms-6 hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  pathname === link.href
                    ? "bg-plum-50 text-plum-600"
                    : "text-sand-700 hover:bg-sand-200/70 hover:text-sand-900",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!compact && (
          <form onSubmit={submitSearch} className="mx-auto hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-sand-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("home.searchPlaceholder")}
                aria-label={t("home.search")}
                className="h-10 w-full border border-sand-300 bg-white ps-10 pe-4 text-sm text-sand-900 placeholder:text-sand-500 transition-colors hover:border-sand-400 focus:border-plum-400 focus:outline-2 focus:outline-plum-300"
              />
            </div>
          </form>
        )}

        <div className={cn("flex items-center gap-1", compact && "ms-auto")}>
          <LanguageSwitcher />

          <Link
            href="/account/favorites"
            className="hidden size-10 place-items-center rounded-md text-sand-700 transition-colors hover:bg-sand-200/70 sm:grid"
            aria-label={t("nav.favorites")}
          >
            <Heart className="size-[1.125rem]" />
          </Link>

          <Link
            href="/cart"
            className="relative grid size-10 place-items-center rounded-md text-sand-700 transition-colors hover:bg-sand-200/70"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag className="size-[1.125rem]" />
            {hydrated && cartCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-plum-500 px-1 text-[0.625rem] font-bold text-white tabular-nums">
                {cartCount}
              </span>
            )}
          </Link>

          {!hydrated ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-sand-200" />
          ) : user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-sand-800 transition-colors hover:bg-sand-200/70"
              >
                <span className="grid size-7 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-600">
                  {user.name.charAt(0)}
                </span>
                <span className="hidden max-w-24 truncate lg:inline">{user.name}</span>
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="animate-rise absolute end-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-md border border-sand-200 bg-white p-1 shadow-[0_12px_32px_-12px_rgb(51_35_43/0.25)]"
                >
                  <MenuLink href="/account" icon={UserIcon} label={t("nav.account")} />
                  <MenuLink href="/account/orders" icon={Package} label={t("nav.orders")} />
                  <MenuLink href="/account/favorites" icon={Heart} label={t("nav.favorites")} />
                  {isSeller && (
                    <>
                      <Divider />
                      <MenuLink
                        href="/seller"
                        icon={LayoutDashboard}
                        label={t("nav.sellerDashboard")}
                      />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Divider />
                      <MenuLink
                        href="/admin"
                        icon={ShieldCheck}
                        label={t("nav.adminDashboard")}
                      />
                    </>
                  )}
                  <Divider />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xs px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50"
                  >
                    <LogOut className="size-4" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t("nav.login")}
              </ButtonLink>
              <ButtonLink href="/seller/apply" size="sm">
                {t("nav.joinAsSeller")}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          isSeller={isSeller}
          isAdmin={isAdmin}
          signedIn={Boolean(user)}
        />
      )}
    </header>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-sand-200" />;
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xs px-3 py-2 text-sm text-sand-800 transition-colors hover:bg-sand-100"
    >
      <Icon className="size-4 text-sand-500" />
      {label}
    </Link>
  );
}

function MobileMenu({
  onClose,
  isSeller,
  isAdmin,
  signedIn,
}: {
  onClose: () => void;
  isSeller: boolean;
  isAdmin: boolean;
  signedIn: boolean;
}) {
  const t = useT();

  const links = [
    { href: "/", label: t("nav.home"), icon: StoreIcon },
    { href: "/stores", label: t("nav.stores"), icon: StoreIcon },
    { href: "/search", label: t("nav.products"), icon: Search },
    { href: "/account", label: t("nav.account"), icon: UserIcon },
    { href: "/account/orders", label: t("nav.orders"), icon: Package },
    { href: "/account/favorites", label: t("nav.favorites"), icon: Heart },
    ...(isSeller
      ? [{ href: "/seller", label: t("nav.sellerDashboard"), icon: LayoutDashboard }]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: t("nav.adminDashboard"), icon: ShieldCheck }] : []),
    { href: "/about", label: t("nav.about"), icon: Settings2 },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label={t("nav.close")}
        onClick={onClose}
        className="absolute inset-0 bg-plum-900/35 backdrop-blur-[2px]"
      />
      <div className="animate-rise absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <Logo />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("nav.close")}>
            <X className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-sand-800 transition-colors hover:bg-sand-100"
            >
              <link.icon className="size-4 text-sand-500" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sand-200 p-4">
          {signedIn ? (
            <ButtonLink href="/seller/apply" className="w-full">
              {t("nav.joinAsSeller")}
            </ButtonLink>
          ) : (
            <div className="grid gap-2">
              <ButtonLink href="/login" variant="outline" className="w-full">
                {t("nav.login")}
              </ButtonLink>
              <ButtonLink href="/seller/apply" className="w-full">
                {t("nav.joinAsSeller")}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
