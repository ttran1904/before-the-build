"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { WizardChrome } from "./WizardChrome";
import { InfoPopover } from "./InfoPopover";
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
  const [finishing, setFinishing] = useState(false);

  const map = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const [stack, setStack] = useState<string[]>([startId]);
  const currentId = stack[stack.length - 1];
  const node = map[currentId];

  // Tabs the user has reached (anywhere on the stack, in order).
  const visitedTabs = useMemo(() => {
    const seen: string[] = [];
    for (const id of stack) {
      const t = map[id]?.tab;
      if (t && !seen.includes(t)) seen.push(t);
    }
    return seen;
  }, [stack, map]);

  if (!node) return null;

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
      setFinishing(true);
      return;
    }
    setStack([...stack, next]);
  };

  const goBack = () => {
    if (stack.length > 1) setStack(stack.slice(0, -1));
    else router.push(backHref);
  };

  useEffect(() => {
    if (!finishing) return;
    const t = setTimeout(() => onFinish(), 1400);
    return () => clearTimeout(t);
  }, [finishing, onFinish]);  /** Jump to a previously-visited tab by truncating the stack to the
   *  last node belonging to that tab. */
  const jumpToTab = (tabId: string) => {
    if (tabId === node.tab) return;
    if (!visitedTabs.includes(tabId)) return;
    let lastIdx = -1;
    for (let i = 0; i < stack.length; i++) {
      if (map[stack[i]]?.tab === tabId) lastIdx = i;
    }
    if (lastIdx >= 0) setStack(stack.slice(0, lastIdx + 1));
  };

  return (
    <NodeView
      key={currentId}
      node={node}
      tabs={tabs}
      visitedTabs={visitedTabs}
      onTabClick={jumpToTab}
      brandTitle={brandTitle}
      backHref={backHref}
      onBack={goBack}
      onAdvance={advance}
      finishing={finishing}
    />
  );
}

function NodeView({
  node,
  tabs,
  visitedTabs,
  onTabClick,
  brandTitle,
  backHref,
  onBack,
  onAdvance,
  finishing,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: QuestionNode<any>;
  tabs: WizardTab[];
  visitedTabs: string[];
  onTabClick: (tabId: string) => void;
  brandTitle?: string;
  backHref: string;
  onBack: () => void;
  onAdvance: (v: unknown) => void;
  finishing?: boolean;
}) {
  const [value, setValue] = useState<unknown>(() => node.initial());
  const [showWarn, setShowWarn] = useState(false);
  const isValid = node.isValid ? node.isValid(value) : hasAnswer(value);

  const handleNext = () => {
    if (!isValid) {
      setShowWarn(true);
      return;
    }
    setShowWarn(false);
    onAdvance(value);
  };

  return (
    <WizardChrome
      tabs={tabs}
      activeTab={node.tab}
      visitedTabs={visitedTabs}
      onTabClick={onTabClick}
      brandTitle={brandTitle}
      backHref={backHref}
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
      hideNext={node.hideNext === true}
      nextLabel={node.terminal ? "Generate Scope" : "Next"}
      nextWarning={showWarn && !isValid ? "Pick an answer to continue." : undefined}
      finishing={finishing}
      wide={node.wide === true}
      topAlign={node.topAlign === true}
    >
      <div>
        {/* Compact top Back/Next — handy on tall pages so the user doesn't
            have to scroll to the footer. Right-aligned above the title so
            it never competes with content. */}
        {!finishing && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ece9e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#4a4a5a] transition hover:bg-[#f7f5f1] hover:text-[#1a1a2e]"
              aria-label="Back"
            >
              <FaArrowLeft className="text-[10px]" />
              Back
            </button>
            {node.hideNext !== true && (
              <button
                onClick={handleNext}
                aria-disabled={!isValid}
                className={`inline-flex items-center gap-1.5 rounded-full bg-[#c08a5a] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445] ${
                  !isValid ? "opacity-40" : ""
                }`}
              >
                {node.terminal ? "Generate" : "Next"}
                <FaArrowRight className="text-[10px]" />
              </button>
            )}
          </div>
        )}
        <h1 className="font-serif text-3xl leading-snug text-[#1a1a2e] sm:text-[34px]">
          {node.question}
          {node.info && (
            <InfoPopover
              title={node.info.title}
              body={node.info.body}
              image={node.info.image}
            />
          )}
        </h1>
        {node.helper && (
          <p className="mt-2 text-sm text-[#6a6a7a]">{node.helper}</p>
        )}
        {node.render({
          value,
          onChange: (v: unknown) => {
            setValue(v);
            if (showWarn) setShowWarn(false);
          },
          onAdvance,
        })}
      </div>
    </WizardChrome>
  );
}

function hasAnswer(v: unknown): boolean {
  // Default: only block when the value is literally null/undefined
  // (i.e. a single-select question hasn't been picked yet).
  // Optional free-text and photo screens use "" or [] and should pass.
  return v !== null && v !== undefined;
}