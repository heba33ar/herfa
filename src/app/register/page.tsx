"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/feedback";
import { Logo } from "@/components/layout/logo";
import { TOWNS } from "@/lib/data/towns";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";

export default function RegisterPage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const setSessionUser = useHirfa((s) => s.setSessionUser);
  const [pending, setPending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    townId: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t("common.required");
    if (!form.email.trim()) next.email = t("common.required");
    if (form.password.length < 6) next.password = t("account.passwordTooShort");
    if (!accepted) next.terms = t("common.required");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await api.register({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      townId: form.townId || undefined,
      locale,
    });
    setPending(false);

    if (!result.ok) {
      setErrors({
        email: result.error === "email_taken" ? t("auth.emailTaken") : result.error,
      });
      return;
    }
    setSessionUser(result.data.user);
    router.push("/");
  }

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-lg border border-sand-200 bg-white p-7">
          <h1 className="text-xl font-bold text-sand-900">{t("auth.registerTitle")}</h1>
          <p className="mt-1.5 text-sm text-sand-600">{t("auth.registerDesc")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label={t("account.name")} required error={errors.name}>
              {(id) => (
                <Input id={id} value={form.name} onChange={(e) => set("name", e.target.value)} />
              )}
            </Field>

            <Field label={t("account.email")} required error={errors.email}>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              )}
            </Field>

            <Field label={t("auth.password")} required error={errors.password}>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("account.phone")}>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="050-000-0000"
                  />
                )}
              </Field>
              <Field label={t("account.town")}>
                {(id) => (
                  <Select
                    id={id}
                    value={form.townId}
                    onChange={(e) => set("townId", e.target.value)}
                  >
                    <option value="">—</option>
                    {TOWNS.map((town) => (
                      <option key={town.id} value={town.id}>
                        {town.name[locale]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Checkbox
              label={t("auth.acceptTerms")}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            {errors.terms && (
              <p className="text-xs font-medium text-danger-700">{errors.terms}</p>
            )}

            <Notice tone="neutral">{t("account.consentNotice")}</Notice>

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? t("common.loading") : t("auth.registerTitle")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-sand-600">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="font-semibold text-plum-500 hover:text-plum-700">
              {t("nav.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
