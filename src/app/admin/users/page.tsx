"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { townName } from "@/lib/data/towns";
import { useHirfa } from "@/lib/store";
import { useLocale, useT } from "@/lib/store/hooks";
import { formatDate } from "@/lib/format";
import { unique } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLE_ROWS: { role: Role; permissions: string }[] = [
  { role: "guest", permissions: "تصفّح المنتجات والمتاجر" },
  { role: "buyer", permissions: "حفظ المفضلة، إنشاء الطلبات ومتابعتها" },
  { role: "seller", permissions: "إدارة متجرها وطلباتها وبياناتها المالية — متجرها فقط" },
  { role: "admin", permissions: "إدارة المنصة والمتاجر والمحتوى والصلاحيات" },
  { role: "admin_assistant", permissions: "صلاحيات محدّدة تمنحها المديرة" },
];

export default function AdminUsersPage() {
  const t = useT();
  const locale = useLocale();

  const users = useHirfa((s) => s.users);
  const orders = useHirfa((s) => s.orders);
  const metrics = useHirfa((s) => s.metrics);

  const [query, setQuery] = useState("");

  const activeBuyerIds = useMemo(
    () => unique(orders.filter((o) => o.status === "completed").map((o) => o.buyerId)),
    [orders],
  );

  const rows = useMemo(
    () =>
      users.filter(
        (u) =>
          !query ||
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.users")} />

      <Notice tone="warning">{t("admin.metricsNotice")}</Notice>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("admin.registeredBuyers")}
          value={metrics.registeredBuyers}
          hint="تسجيل حساب فقط"
        />
        <StatCard
          label={t("admin.activeBuyers")}
          value={activeBuyerIds.length}
          tone="plum"
          hint="أتمّت طلبًا واحدًا على الأقل"
        />
        <StatCard
          label={t("admin.activeSellers")}
          value={users.filter((u) => u.roles.includes("seller")).length}
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

          {rows.length === 0 ? (
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
    </div>
  );
}
