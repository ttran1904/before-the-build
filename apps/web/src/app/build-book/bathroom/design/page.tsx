"use client";

import { useRouter } from "next/navigation";
import { WizardEngine } from "@/components/wizard/WizardEngine";
import { useBuildBookStore } from "@/lib/build-book/store";
import {
  BUILD_BOOK_TABS,
  buildBookBathroomTree,
} from "@/lib/build-book/bathroom-design-tree";

export default function BuildBookBathroomDesignPage() {
  const router = useRouter();
  const markComplete = useBuildBookStore((s) => s.markComplete);
  const nodes = buildBookBathroomTree();

  return (
    <WizardEngine
      tabs={BUILD_BOOK_TABS}
      nodes={nodes}
      startId="styles"
      brandTitle="Build Book · Bathroom"
      backHref="/dashboard"
      onFinish={() => { markComplete(); router.push("/build-book"); }}
    />
  );
}
