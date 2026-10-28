"use client";

import { useEffect, useState } from "react";
import { Database, TriangleAlert } from "lucide-react";
import { Notice } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { useT } from "@/lib/store/hooks";

/**
 * Says plainly where the data is going.
 *
 * On Vercel the function filesystem is read-only, so without a Blob store the
 * database falls back to memory and every account created in the demo is lost
 * when the instance recycles. That is survivable, but it must not be silent.
 */
export function StorageNotice() {
  const t = useT();
  const [state, setState] = useState<{ driver: string; persistent: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.status().then((result) => {
      if (!cancelled && result.ok) setState(result.data.db);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || state.persistent) return null;

  return (
    <Notice tone="warning" icon={TriangleAlert}>
      {t("storage.memoryWarning")}
    </Notice>
  );
}

export function StorageBadge({ driver }: { driver: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-sand-600">
      <Database className="size-3.5" />
      {driver}
    </span>
  );
}
