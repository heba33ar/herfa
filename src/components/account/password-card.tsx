"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useT } from "@/lib/store/hooks";

/**
 * Accounts an admin created start on a generated password, so a way to change
 * it is not optional — without this the temporary password stays forever.
 */
export function PasswordCard() {
  const t = useT();
  const toast = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!current) found.current = t("common.required");
    if (next.length < 6) found.next = t("account.passwordTooShort");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    const result = await api.changePassword(current, next);
    setPending(false);

    if (!result.ok) {
      setErrors({
        current:
          result.error === "wrong_password"
            ? t("account.wrongPassword")
            : result.error === "password_too_short"
              ? t("account.passwordTooShort")
              : result.error,
      });
      return;
    }

    setCurrent("");
    setNext("");
    toast(t("account.passwordChanged"), "success");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-plum-500" />
            {t("account.password")}
          </CardTitle>
          <CardDescription>
            إذا أنشأت الإدارة حسابك، غيّري كلمة المرور المؤقتة من هون.
          </CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("account.currentPassword")} required error={errors.current}>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("account.newPassword")} required error={errors.next}>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t("common.loading") : t("account.changePassword")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
