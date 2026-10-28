"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Mail, Plus, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Modal, Notice, Skeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { TOWNS, townName } from "@/lib/data/towns";
import { api, type EmailOutcome } from "@/lib/api";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate } from "@/lib/format";
import { unique } from "@/lib/utils";
import type { Role, User } from "@/lib/types";

const ASSIGNABLE: Role[] = ["buyer", "seller", "admin"];

const ROLE_ROWS: { role: Role; permissions: string }[] = [
  { role: "guest", permissions: "تصفّح المنتجات والمتاجر" },
  { role: "buyer", permissions: "حفظ المفضلة، إنشاء الطلبات ومتابعتها" },
  { role: "seller", permissions: "إدارة متجرها وطلباتها وبياناتها المالية — متجرها فقط" },
  { role: "admin", permissions: "إدارة المنصة والمتاجر والمحتوى والصلاحيات" },
  { role: "admin_assistant", permissions: "صلاحيات محدّدة تمنحها المديرة" },
];

interface Created {
  user: User;
  password: string;
  email: EmailOutcome;
}

export default function AdminUsersPage() {
  const t = useT();
  const locale = useLocale();
  const orders = useHirfa((s) => s.orders);

  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [query, setQuery] = useState("");
  /** Bumped after a create so the list refetches. */
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.adminListUsers().then((result) => {
      if (cancelled) return;
      if (result.ok) setUsers(result.data.users);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const activeBuyerIds = useMemo(
    () => unique(orders.filter((o) => o.status === "completed").map((o) => o.buyerId)),
    [orders],
  );

  const rows = useMemo(
    () =>
      (users ?? []).filter(
        (u) =>
          !query ||
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.users")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            {t("admin.createUser")}
          </Button>
        }
      />

      {error && <Notice tone="danger">{error}</Notice>}

      <Notice tone="warning">{t("admin.metricsNotice")}</Notice>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("admin.registeredBuyers")}
          value={users ? users.length : "—"}
          hint={t("admin.accountsInDb")}
        />
        <StatCard
          label={t("admin.activeBuyers")}
          value={activeBuyerIds.length}
          tone="plum"
          hint="أتمّت طلبًا واحدًا على الأقل"
        />
        <StatCard
          label={t("admin.activeSellers")}
          value={users ? users.filter((u) => u.roles.includes("seller")).length : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users")}</CardTitle>
        </CardHeader>
        <CardBody>
          <Field label={t("common.search")}>
            {(id) => (
              <Input
                id={id}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
          </Field>

          {!users ? (
            <div className="mt-5 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-5">
              <EmptyState icon={Users} title={t("search.empty")} />
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-sand-200">
              {rows.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-sand-900">{user.name}</p>
                    <p className="mt-0.5 text-xs text-sand-600" dir="ltr">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {user.townId && (
                      <span className="text-xs text-sand-600">
                        {townName(user.townId, locale)}
                      </span>
                    )}
                    {user.roles.map((role) => (
                      <Badge key={role} tone={role === "admin" ? "plum" : "neutral"}>
                        {t(`role.${role}`)}
                      </Badge>
                    ))}
                    <span className="text-xs text-sand-500">
                      {formatDate(user.createdAt, locale)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("admin.rolesTitle")}</CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-sand-600">
              بيانات كل متجر منفصلة تمامًا. بائعة ما بتقدر تشوف دخل بائعة ثانية ولا أسماء
              زبائنها، حتى لو تعاونتا في التوصيل.
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-xs text-sand-600">
                <th className="px-5 py-3 text-start font-semibold">المستخدم</th>
                <th className="px-5 py-3 text-start font-semibold">الصلاحيات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {ROLE_ROWS.map((row) => (
                <tr key={row.role}>
                  <td className="px-5 py-3">
                    <Badge tone={row.role === "admin" ? "plum" : "neutral"}>
                      {t(`role.${row.role}`)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-sand-700">{row.permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <CreateUserModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(result) => {
          setOpen(false);
          setCreated(result);
          setReloadToken((n) => n + 1);
        }}
      />

      <CreatedModal created={created} onClose={() => setCreated(null)} />
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Created) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();

  const [form, setForm] = useState({ name: "", email: "", phone: "", townId: "", password: "" });
  const [roles, setRoles] = useState<Role[]>(["buyer"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function submit() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t("common.required");
    if (!form.email.trim()) next.email = t("common.required");
    if (roles.length === 0) next.roles = t("admin.pickRole");
    if (form.password && form.password.length < 6)
      next.password = t("account.passwordTooShort");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    const result = await api.adminCreateUser({
      name: form.name.trim(),
      email: form.email.trim(),
      roles,
      phone: form.phone.trim() || undefined,
      townId: form.townId || undefined,
      password: form.password.trim() || undefined,
    });
    setPending(false);

    if (!result.ok) {
      setErrors({
        email: result.error === "email_taken" ? t("auth.emailTaken") : result.error,
      });
      return;
    }

    toast(t("admin.userCreated"), "success");
    setForm({ name: "", email: "", phone: "", townId: "", password: "" });
    setRoles(["buyer"]);
    onCreated(result.data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("admin.createUser")}
      description={t("admin.createUserDesc")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? t("common.loading") : t("admin.createUser")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("account.name")} required error={errors.name}>
            {(id) => (
              <Input
                id={id}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label={t("account.email")} required error={errors.email}>
            {(id) => (
              <Input
                id={id}
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
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
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-sand-800">
            {t("admin.userRoles")} <span className="text-danger-500">*</span>
          </p>
          <div className="space-y-2.5">
            {ASSIGNABLE.map((role) => (
              <Checkbox
                key={role}
                label={t(`role.${role}`)}
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
            ))}
          </div>
          {errors.roles && (
            <p className="mt-2 text-xs font-medium text-danger-700">{errors.roles}</p>
          )}
        </div>

        <Field
          label={t("admin.tempPassword")}
          hint={t("admin.passwordOptional")}
          error={errors.password}
        >
          {(id) => (
            <Input
              id={id}
              dir="ltr"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>

        {roles.includes("seller") && (
          <Notice tone="warning" icon={TriangleAlert}>
            إنشاء حساب بصلاحية بائعة بيعطي صلاحية الدخول للوحة البائعة، لكنه ما بينشئ متجرًا.
            المتجر بينفتح عند قبول طلب انضمام من صفحة طلبات الانضمام.
          </Notice>
        )}
      </div>
    </Modal>
  );
}

function CreatedModal({
  created,
  onClose,
}: {
  created: Created | null;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  if (!created) return null;

  const credentials = `${created.user.email}\n${created.password}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={t("admin.userCreated")}
      description={created.user.name}
      size="sm"
      footer={
        <Button onClick={onClose}>{t("common.close")}</Button>
      }
    >
      <div className="space-y-4">
        <dl className="space-y-2 border border-sand-300 bg-sand-100 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-sand-600">{t("account.email")}</dt>
            <dd className="font-semibold" dir="ltr">
              {created.user.email}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-sand-600">{t("admin.tempPassword")}</dt>
            <dd className="font-mono font-semibold" dir="ltr">
              {created.password}
            </dd>
          </div>
        </dl>

        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await navigator.clipboard.writeText(credentials);
            toast(t("store.linkCopied"), "success");
          }}
        >
          <Copy className="size-4" />
          {t("admin.copyCredentials")}
        </Button>

        {created.email.status === "sent" ? (
          <Notice tone="success" icon={Mail}>
            {t("emailStatus.sent")} → {created.user.email}
          </Notice>
        ) : created.email.status === "failed" ? (
          <Notice tone="danger" icon={TriangleAlert}>
            {t("emailStatus.failed")}: {created.email.error}
          </Notice>
        ) : (
          <Notice tone="neutral" icon={Mail}>
            {t("email.noProvider")}
          </Notice>
        )}
      </div>
    </Modal>
  );
}
