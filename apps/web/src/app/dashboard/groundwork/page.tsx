"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaClipboardList,
  FaArrowRight,
  FaCircleCheck,
} from "react-icons/fa6";

import {
  useGroundworkStore,
  projectTypeLabel,
  type GroundworkBathroomState,
} from "@/lib/groundwork/store";

/** Heuristic: a groundwork "draft" exists if the user has answered
 *  at least one question. Local-only for v1 — we don't have a
 *  multi-project Groundwork registry yet, so this surfaces the
 *  one in-progress draft. */
function hasDraft(s: GroundworkBathroomState): boolean {
  return (
    s.projectType !== null ||
    s.bathroomKind !== null ||
    s.budgetTier !== null ||
    s.goals.length > 0 ||
    s.photos.length > 0
  );
}

function useHydratedGroundwork() {
  const hydrated = useSyncExternalStore(
    (cb) => useGroundworkStore.persist.onFinishHydration(cb),
    () => useGroundworkStore.persist.hasHydrated(),
    () => false
  );
  const state = useGroundworkStore();
  return { hydrated, state };
}

export default function GroundworkDashboardPage() {
  const router = useRouter();
  const reset = useGroundworkStore((s) => s.reset);
  const { hydrated, state } = useHydratedGroundwork();

  const startNew = () => {
    reset();
    router.push("/groundwork/bathroom");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Groundwork</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            Scope every project end-to-end before talking to a contractor.
            Each Groundwork is a contractor-ready brief.
          </p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c08a5a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a87445]"
        >
          <FaPlus className="text-xs" /> New Groundwork
        </button>
      </div>

      {!hydrated ? (
        <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center text-sm text-[#9a9aaa]">
          Loading…
        </div>
      ) : !hasDraft(state) ? (
        <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
          <FaClipboardList className="mx-auto text-4xl text-[#d5d3cd]" />
          <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">
            No groundwork yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
            Groundwork captures everything a contractor needs to bid your
            project — scope, budget range, fixtures, photos, open items.
            Start one to get a clean brief in a few minutes.
          </p>
          <button
            onClick={startNew}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c08a5a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a87445]"
          >
            <FaPlus className="text-xs" /> Start Your First Groundwork
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <GroundworkCard state={state} />
          <button
            onClick={startNew}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] bg-white p-8 text-center transition hover:border-[#c08a5a]/40 hover:shadow-sm"
          >
            <FaPlus className="text-xl text-[#9a9aaa]" />
            <span className="text-sm font-medium text-[#6a6a7a]">
              New Groundwork
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function GroundworkCard({ state }: { state: GroundworkBathroomState }) {
  const title = projectTypeLabel(state.projectType) ?? "Bathroom Groundwork";
  const complete = state.completedAt !== null;
  const photo = state.photos[0];

  return (
    <Link
      href={
        complete
          ? "/groundwork/bathroom/summary"
          : "/groundwork/bathroom"
      }
      className="group relative overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-sm transition hover:border-[#c08a5a]/40 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-[#f6f3ed]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FaClipboardList className="text-4xl text-[#d5d3cd]" />
          </div>
        )}
        {complete && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#3a3a4a] shadow-sm">
            <FaCircleCheck className="text-[#c08a5a]" /> Ready for contractor
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#1a1a2e] transition group-hover:text-[#c08a5a]">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-[#9a9aaa]">
          {complete
            ? `Completed ${new Date(state.completedAt!).toLocaleDateString()}`
            : "In progress"}
        </p>
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c08a5a]">
          {complete ? "View brief" : "Continue"}{" "}
          <FaArrowRight className="text-[10px]" />
        </p>
      </div>
    </Link>
  );
}