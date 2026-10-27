"use client";

import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useT } from "@/lib/store/hooks";

export default function NotFound() {
  const t = useT();
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={Compass}
        title={t("common.notFound")}
        description={t("common.notFoundDesc")}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">{t("common.backHome")}</ButtonLink>
            <ButtonLink href="/stores" variant="outline">
              {t("nav.stores")}
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
