import { Suspense } from "react";
import { LoadingBlock } from "@/components/layout/guards";
import { SearchView } from "./search-view";

export const metadata = { title: "نتائج البحث" };

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <SearchView />
    </Suspense>
  );
}
