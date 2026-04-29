"use client";

import { useEffect, useState, useCallback } from "react";
import { SkeletonTileRow } from "@/components/SkeletonTileRow";
import { formatDateTime } from "@/lib/datetime";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaClipboardList,
  FaArrowRight,
  FaCircleCheck,
  FaTrash,
  FaSpinner,
} from "react-icons/fa6";

import {
  useGroundworkStore,
  projectTypeLabel,
} from "@/lib/groundwork/store";
import {
  loadAllGroundworkScopes,
  deleteGroundworkScope,
  type GroundworkScopeRow,
} from "@/lib/groundwork/sync";

export default function GroundworkDashboardPage() {
  const router = useRouter();
  const reset = useGroundworkStore((s) => s.reset);
  const loadFrom = useGroundworkStore((s) => s.loadFrom);
  const localProjectId = useGroundworkStore((s) => s.projectId);

  const [scopes, setScopes] = useState<GroundworkScopeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteGroundworkScope(id);
    if (ok) {
      setScopes((prev) => prev.filter((r) => r.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const refresh = useCallback(async () => {
    const rows = await loadAllGroundworkScopes().catch(() => [] as GroundworkScopeRow[]);
    setScopes(rows);
    setLoaded(true);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const startNew = () => {
    reset();
    router.push("/groundwork/bathroom");
  };

  const openScope = (row: GroundworkScopeRow) => {
    loadFrom(row.data, row.project_id);
    router.push(row.completed_at ? "/groundwork/bathroom/summary" : "/groundwork/bathroom");
  };

  const localState = useGroundworkStore.getState();
  const hasLocalDraft =
    !localProjectId &&
    (localState.projectType !== null ||
      localState.bathroomKind !== null ||
      localState.budgetTier !== null ||
      localState.goals.length > 0 ||
      localState.photos.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Groundwork Scope</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            Scope every project end-to-end before talking to a contractor.
            Each Groundwork Scope is a contractor-ready brief.
          </p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c08a5a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a87445]"
        >
          <FaPlus className="text-xs" /> New Groundwork Scope
        </button>
      </div>

      {!loaded ? (
        <SkeletonTileRow count={3} />
      ) : scopes.length === 0 && !hasLocalDraft ? (
        <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
          <FaClipboardList className="mx-auto text-4xl text-[#d5d3cd]" />
          <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">
            No Groundwork Scope yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
            Groundwork Scope captures everything a contractor needs to bid your
            project — scope, budget range, fixtures, photos, open items.
            Start one to get a clean brief in a few minutes.
          </p>
          <button
            onClick={startNew}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#c08a5a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a87445]"
          >
            <FaPlus className="text-xs" /> Start Your First Groundwork Scope
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scopes.map((row) => (
            <ScopeCard
              key={row.id}
              row={row}
              onOpen={() => openScope(row)}
              isConfirming={confirmDeleteId === row.id}
              isDeleting={deletingId === row.id}
              onRequestDelete={() => setConfirmDeleteId(row.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={() => handleDelete(row.id)}
            />
          ))}
          {hasLocalDraft && (
            <button
              onClick={() => router.push("/groundwork/bathroom")}
              className="group relative overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white text-left shadow-sm transition hover:border-[#c08a5a]/40 hover:shadow-md"
            >
              <div className="relative h-40 w-full overflow-hidden bg-[#f6f3ed]">
                {localState.photos[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={localState.photos[0]} alt="Draft" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FaClipboardList className="text-4xl text-[#d5d3cd]" />
                  </div>
                )}
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#c08a5a] shadow-sm">
                  Draft
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[#1a1a2e] group-hover:text-[#c08a5a]">
                  {projectTypeLabel(localState.projectType) ?? "Bathroom Groundwork Scope"}
                </h3>
                <p className="mt-0.5 text-xs text-[#9a9aaa]">In progress · not yet saved</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c08a5a]">
                  Continue <FaArrowRight className="text-[10px]" />
                </p>
              </div>
            </button>
          )}
          <button
            onClick={startNew}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d5d3cd] bg-white p-8 text-center transition hover:border-[#c08a5a]/40 hover:shadow-sm"
          >
            <FaPlus className="text-xl text-[#9a9aaa]" />
            <span className="text-sm font-medium text-[#6a6a7a]">
              New Groundwork Scope
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function ScopeCard({
  row,
  onOpen,
  onDelete,
  isConfirming,
  isDeleting,
  onRequestDelete,
  onCancelDelete,
}: {
  row: GroundworkScopeRow;
  onOpen: () => void;
  onDelete: () => void;
  isConfirming: boolean;
  isDeleting: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  const title = projectTypeLabel(row.data.projectType) ?? "Bathroom Groundwork Scope";
  const complete = row.completed_at !== null;
  const photo = row.data.photos?.[0];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white shadow-sm transition hover:border-[#c08a5a]/40 hover:shadow-md">
      {isConfirming ? (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? <FaSpinner className="animate-spin text-xs" /> : "Delete"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}
            className="rounded-md bg-[#e8e6e1] px-2.5 py-1 text-[10px] font-semibold text-[#4a4a5a] transition hover:bg-[#d5d3cd]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRequestDelete(); }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#9a9aaa] opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          title="Delete groundwork scope"
        >
          <FaTrash className="text-xs" />
        </button>
      )}
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative h-40 w-full overflow-hidden bg-[#f6f3ed]">
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FaClipboardList className="text-4xl text-[#d5d3cd]" />
            </div>
          )}
          {complete && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#3a3a4a] shadow-sm">
              <FaCircleCheck className="text-[#c08a5a]" /> Ready for contractor
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-[#1a1a2e] group-hover:text-[#c08a5a]">{title}</h3>
          <p className="mt-0.5 text-xs text-[#9a9aaa]">
            {complete ? "Completed " + formatDateTime(row.completed_at!) : "Updated " + formatDateTime(row.updated_at)}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c08a5a]">
            {complete ? "View brief" : "Continue"} <FaArrowRight className="text-[10px]" />
          </p>
        </div>
      </button>
    </div>
  );
}
