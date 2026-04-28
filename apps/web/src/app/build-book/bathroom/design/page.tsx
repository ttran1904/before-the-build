"use client";

import { useRouter } from "next/navigation";
import { WizardEngine } from "@/components/wizard/WizardEngine";
import {
  BUILD_BOOK_TABS,
  buildBookBathroomTree,
} from "@/lib/build-book/bathroom-design-tree";

export default function BuildBookBathroomDesignPage() {
  const router = useRouter();
  const nodes = buildBookBathroomTree();

  return (
    <WizardEngine
      tabs={BUILD_BOOK_TABS}
      nodes={nodes}
      startId="styles"
      brandTitle="Build Book · Bathroom"
      backHref="/dashboard"
      onFinish={() => router.push("/build-book")}
    />
  );
}
