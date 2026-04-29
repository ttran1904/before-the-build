"use client";

import { useRouter } from "next/navigation";
import { WizardEngine } from "@/components/wizard/WizardEngine";
import { useGroundworkStore } from "@/lib/groundwork/store";
import {
  GROUNDWORK_TABS,
  buildGroundworkBathroomTree,
} from "@/lib/groundwork/bathroom-tree";
import { GroundworkAutosave } from "@/lib/groundwork/Autosave";

export default function GroundworkBathroomPage() {
  const router = useRouter();
  const markComplete = useGroundworkStore((s) => s.markComplete);

  const nodes = buildGroundworkBathroomTree();

  return (
    <>
      <GroundworkAutosave />
      <WizardEngine
        tabs={GROUNDWORK_TABS}
        nodes={nodes}
        startId="project-type"
        brandTitle="Groundwork Scope · Bathroom"
        backHref="/dashboard"
        onFinish={() => {
          markComplete();
          router.push("/groundwork/bathroom/summary");
        }}
      />
    </>
  );
}