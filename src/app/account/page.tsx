"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Modal, Notice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/misc";
import { PasswordCard } from "@/components/account/password-card";
import { useToast } from "@/components/ui/toast";
import { TOWNS } from "@/lib/data/towns";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useCurrentUser, useLocale, useT } from "@/lib/store/hooks";
import type { Locale } from "@/lib/types";

export default function AccountPage() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const user = useCurrentUser();
  const setSessionUser = useHirfa((s) => s.setSessionUser);
  const clearLocalAccountData = useHirfa((s) => s.clearLocalAccountData);
  const setLocale = useHirfa((s) => s.setLocale);
  const [pending, setPending] = useState(false);

  /**
   * Persists to the JSON database, then mirrors the result into the store.
   * Returns whether it worked so callers do not announce a save that failed.
   */
  async function patchProfile(patch: Parameters<typeof api.updateProfile>[0]) {
    setPending(true);
    const result = await api.updateProfile(patch);
    setPending(false);
    if (!result.ok) {
      toast(result.error === "unauthorized" ? t("common.sessionEnded") : t("common.error"), "error");
      return false;
    }
    setSessionUser(result.data.user);
    return true;
  }

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    townId: user?.townId ?? "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await patchProfile({
      name: form.name,
      phone: form.phone || undefined,
      townId: form.townId || undefined,
    });
    if (ok) toast(t("account.saved"), "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("account.title")}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <Badge key={role} tone={role === "admin" ? "plum" : "neutral"}>
                {t(`role.${role}`)}
              </Badge>
            ))}
          </div>
        }
      />

      {/* profile */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("account.profile")}</CardTitle>
            <CardDescription>
              بياناتك الشخصية. اسم المشروع فقط هو اللي بيظهر للجمهور إذا كنتِ بائعة.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("account.name")} required>
                {(id) => (
                  <Input
                    id={id}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                )}
              </Field>
              <Field
                label={t("account.email")}
                hint="البريد الإلكتروني هو معرّف الدخول ولا يمكن تعديله من هنا."
              >
                {(id) => <Input id={id} type="email" dir="ltr" value={form.email} readOnly />}
              </Field>
              <Field label={t("account.phone")}>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                )}
              </Field>
              <Field label={t("account.town")}>
                {(id) => (
                  <Select
                    id={id}
                    value={form.townId}
                    onChange={(e) => setForm({ ...form, townId: e.target.value })}
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
              <Field label={t("account.language")}>
                {(id) => (
                  <Select
                    id={id}
                    value={user!.locale}
                    onChange={(e) => {
                      const next = e.target.value as Locale;
                      setLocale(next);
                      void patchProfile({ locale: next });
                    }}
                  >
                    {LOCALES.map((code) => (
                      <option key={code} value={code}>
                        {LOCALE_META[code].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? t("common.loading") : t("account.save")}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* consents */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("account.notifications")}</CardTitle>
            <CardDescription>{t("account.consentNotice")}</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          <Switch
            label={t("account.notifEmail")}
            checked={user.consents.marketingEmail}
            onChange={(next) =>
              void patchProfile({ consents: { ...user.consents, marketingEmail: next } })
            }
          />
          <div className="h-px bg-sand-200" />
          <Switch
            label={t("account.notifWhatsapp")}
            checked={user.consents.marketingWhatsapp}
            onChange={(next) =>
              void patchProfile({ consents: { ...user.consents, marketingWhatsapp: next } })
            }
          />
        </CardBody>
      </Card>

      {/* subscription */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.subscription")}</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div
            className={`rounded-md border p-4 ${
              user.subscription === "free"
                ? "border-plum-300 bg-plum-50"
                : "border-sand-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-sand-900">{t("account.planFree")}</p>
              {user.subscription === "free" && <Badge tone="plum">{t("common.yes")}</Badge>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sand-600">
              {t("account.planFreeDesc")}
            </p>
          </div>

          <div className="rounded-md border border-sand-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-sand-900">
                <Crown className="size-4 text-gold-500" />
                {t("account.planPremium")}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sand-600">
              {t("account.planPremiumDesc")}
            </p>
          </div>
        </CardBody>
      </Card>

      <PasswordCard />

      {/* danger zone */}
      <Card className="border-danger-500/25">
        <CardHeader className="border-danger-500/15">
          <div>
            <CardTitle className="text-danger-700">{t("account.dangerZone")}</CardTitle>
            <CardDescription>{t("account.deleteDesc")}</CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            {t("account.deleteButton")}
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("account.dangerZone")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                const result = await api.deleteAccount();
                if (!result.ok) {
                  toast(
                    result.error === "last_admin"
                      ? t("account.lastAdmin")
                      : t("common.error"),
                    "error",
                  );
                  setConfirmDelete(false);
                  return;
                }
                clearLocalAccountData();
                router.push("/");
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Notice tone="danger" icon={TriangleAlert}>
          {t("account.deleteConfirm")}
        </Notice>
        <p className="mt-4 text-sm leading-relaxed text-sand-600">{t("account.deleteDesc")}</p>
      </Modal>
    </div>
  );
}
