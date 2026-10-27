"use client";

import { Check, CircleAlert, Clock, Package, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentState, StoreStatus } from "@/lib/types";
import { useT } from "@/lib/store/hooks";
import { ORDER_FLOW } from "@/lib/store/selectors";
import { formatDateTime } from "@/lib/format";
import { useHirfa } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

const ORDER_TONE: Record<OrderStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  awaiting_response: "warning",
  confirmed: "info",
  preparing: "plum",
  ready: "clay",
  completed: "success",
  cancelled: "neutral",
  rejected: "danger",
  issue: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  return <Badge tone={ORDER_TONE[status]}>{t(`status.${status}`)}</Badge>;
}

const PAYMENT_TONE: Record<PaymentState, React.ComponentProps<typeof Badge>["tone"]> = {
  unpaid: "neutral",
  partial: "warning",
  paid: "success",
};

export function PaymentBadge({ state }: { state: PaymentState }) {
  const t = useT();
  return <Badge tone={PAYMENT_TONE[state]}>{t(`payment.${state}`)}</Badge>;
}

const STORE_TONE: Record<StoreStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  active: "success",
  paused: "warning",
  needs_review: "info",
  suspended: "danger",
};

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  const t = useT();
  return <Badge tone={STORE_TONE[status]}>{t(`storeStatus.${status}`)}</Badge>;
}

const STEP_ICONS = [Clock, Check, Package, Truck, Check];

/**
 * The happy path as a rail, with any terminal event (cancelled, rejected,
 * issue) appended so the buyer sees why a journey stopped.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const t = useT();
  const locale = useHirfa((s) => s.locale);
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const terminal = currentIndex === -1;

  const reachedAt = (status: OrderStatus) =>
    order.history.find((event) => event.status === status)?.at;

  return (
    <ol className="space-y-0">
      {ORDER_FLOW.map((status, index) => {
        const at = reachedAt(status);
        const done = Boolean(at);
        const active = !terminal && index === currentIndex;
        const Icon = STEP_ICONS[index];
        const last = index === ORDER_FLOW.length - 1;

        return (
          <li key={status} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  done
                    ? "border-plum-500 bg-plum-500 text-white"
                    : active
                      ? "border-plum-400 bg-white text-plum-500"
                      : "border-sand-300 bg-white text-sand-400",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              {!last && (
                <span
                  className={cn("w-0.5 flex-1 min-h-6", done ? "bg-plum-300" : "bg-sand-200")}
                />
              )}
            </div>
            <div className={cn("pb-6", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  done || active ? "text-sand-900" : "text-sand-500",
                )}
              >
                {t(`status.${status}`)}
              </p>
              {at && (
                <p className="mt-0.5 text-xs text-sand-500">{formatDateTime(at, locale)}</p>
              )}
            </div>
          </li>
        );
      })}

      {terminal && (
        <li className="flex gap-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-danger-500 bg-danger-50 text-danger-700">
            {order.status === "issue" ? (
              <CircleAlert className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-danger-700">{t(`status.${order.status}`)}</p>
            {order.history.at(-1)?.note && (
              <p className="mt-0.5 text-xs leading-relaxed text-sand-600">
                {order.history.at(-1)?.note}
              </p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
