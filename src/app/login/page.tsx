"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { Logo } from "@/components/layout/logo";
import { useHirfa } from "@/lib/store";
import { useT } from "@/lib/store/hooks";
import { DEMO_PASSWORD } from "@/lib/data/seed";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const login = useHirfa((s) => s.login);
  const loginAs = useHirfa((s) => s.loginAs);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(t("auth.invalidCredentials"));
      return;
    }
    router.push("/");
  }

  const demoAccounts = [
    { id: "u-buyer-1", label: t("auth.demoBuyer"), icon: ShoppingBag, href: "/account/orders" },
    { id: "u-seller-1", label: t("auth.demoSeller"), icon: LayoutDashboard, href: "/seller" },
    { id: "u-admin-1", label: t("auth.demoAdmin"), icon: ShieldCheck, href: "/admin" },
  ];

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-lg border border-sand-200 bg-white p-7">
          <h1 className="text-xl font-bold text-sand-900">{t("auth.loginTitle")}</h1>
          <p className="mt-1.5 text-sm text-sand-600">{t("auth.loginDesc")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label={t("account.email")} required>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              )}
            </Field>

            <Field label={t("auth.password")} required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>

            {error && <Notice tone="danger">{error}</Notice>}

            <Button type="submit" size="lg" className="w-full">
              {t("auth.loginTitle")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-sand-600">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-semibold text-plum-500 hover:text-plum-700">
              {t("nav.register")}
            </Link>
          </p>
        </div>

        {/* Demo shortcuts — this build has no real authentication service. */}
        <div className="mt-6 rounded-lg border border-dashed border-sand-300 bg-sand-100/60 p-5">
          <h2 className="text-sm font-bold text-sand-900">{t("auth.demoTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-sand-600">{t("auth.demoDesc")}</p>
          <div className="mt-4 grid gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.id}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  loginAs(account.id);
                  router.push(account.href);
                }}
              >
                <account.icon className="size-4 text-sand-500" />
                {account.label}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-[0.6875rem] text-sand-500" dir="ltr">
            buyer@hirfa.app · seller@hirfa.app · admin@hirfa.app — {DEMO_PASSWORD}
          </p>
        </div>
      </div>
    </div>
  );
}
