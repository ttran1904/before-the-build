"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardChrome } from "./WizardChrome";
import type { QuestionNode, WizardTab } from "./types";

interface WizardEngineProps {
  tabs: WizardTab[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: QuestionNode<any>[];
  startId: string;
  brandTitle?: string;
  backHref?: string;
  /** Called when next() returns null (wizard finished). */
  onFinish: () => void;
}

export function WizardEngine({
  tabs,
  nodes,
  startId,
  brandTitle,
  backHref = "/dashboard",
  onFinish,
}: WizardEngineProps) {
  const router = useRouter();

  const map = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const [stack, setStack] = useState<string[]>([startId]);
  const currentId = stack[stack.length - 1];
  const node = map[currentId];

  if (!node) return null;

  /** Walk forward from `id` skipping anything `skip()` returns true for. */
  const resolveNext = (startNextId: string | null): string | null => {
    let id = startNextId;
    while (id && map[id]?.skip?.()) {
      const n = map[id];
      id = n.next(n.initial());
    }
    return id;
  };

  const advance = (v: unknown) => {
    node.commit?.(v);
    const next = resolveNext(node.next(v));
    if (!next) {
      onFinish();
      return;
    }
    setStack([...stack, next]);
  };

  const goBack = () => {
    if (stack.length > 1) setStack(stack.slice(0, -1));
    else router.push(backHref);
  };

  return (
    // `key={currentId}` forces NodeView to remount on each transition,
    // giving us a fresh `value` state per question without an effect.
    <NodeView
      key={currentId}
      node={node}
      tabs={tabs}
      brandTitle={brandTitle}
      backHref={backHref}
      onBack={goBack}
      onAdvance={advance}
    />
  );
}

function NodeView({
  node,
  tabs,
  brandTitle,
  backHref,
  onBack,
  onAdvance,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: QuestionNode<any>;
  tabs: WizardTab[];
  brandTitle?: string;
  backHref: string;
  onBack: () => void;
  onAdvance: (v: unknown) => void;
}) {
  const [value, setValue] = useState<unknown>(() => node.initial());
  const isValid = node.isValid ? node.isValid(value) : true;

  return (
    <WizardChrome
      tabs={tabs}
      activeTab={node.tab}
      brandTitle={brandTitle}
      backHref={backHref}
      onBack={onBack}
      onNext={() => onAdvance(value)}
      nextDisabled={!isValid}
      hideNext={node.hideNext === true}
    >
      <div>
        <h1 className="font-serif text-3xl leading-snug text-[#1a1a2e] sm:text-[34px]">
          {node.question}
        </h1>
        {node.helper && (
          <p className="mt-2 text-sm text-[#6a6a7a]">{node.helper}</p>
        )}
        {node.render({
          value,
          onChange: setValue,
          onAdvance,
        })}
      </div>
    </WizardChrome>
  );
}
