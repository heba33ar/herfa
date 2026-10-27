import { Suspense } from "react";
import { LoadingBlock } from "@/components/layout/guards";
import { SellerOrdersView } from "./orders-view";

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <SellerOrdersView />
    </Suspense>
  );
}
