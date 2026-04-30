"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaBookOpen, FaCompass, FaTableCellsLarge, FaPlus, FaClipboardList, FaPinterest, FaSpinner, FaCheck, FaCircleCheck, FaArrowRight, FaTrashCan, FaPen, FaTrash } from "react-icons/fa6";
import { useIdeaBoardStore, useWizardStore } from "@/lib/store";
import { useGroundworkStore, projectTypeLabel } from "@/lib/groundwork/store";
import { loadAllGroundworkScopes, deleteGroundworkScope, type GroundworkScopeRow } from "@/lib/groundwork/sync";
import { formatDateTime } from "@/lib/datetime";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { SkeletonTileRow } from "@/components/SkeletonTileRow";

import { loadBuildBooks, loadWizardState, deleteBuildBook, cleanupEmptyBuildBooks } from "@/lib/supabase-sync";

interface BuildBookEntry {
  id: string;
  projectId: string;
  name: string;
  updatedAt: string;
  totalCost: number;
  currentStep: number;
  mockupImage?: string;
  moodboardThumbnails: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const boards = useIdeaBoardStore((s) => s.boards);
  const items = useIdeaBoardStore((s) => s.items);
  const getBoardItems = useIdeaBoardStore((s) => s.getBoardItems);
  const createBoard = useIdeaBoardStore((s) => s.createBoard);
  const saveItemToBoard = useIdeaBoardStore((s) => s.saveItemToBoard);
  const removeBoard = useIdeaBoardStore((s) => s.removeBoard);
  const renameBoard = useIdeaBoardStore((s) => s.renameBoard);
  const resetWizard = useWizardStore((s) => s.reset);

  // Uploaded bathroom photos from wizard store (base64, client-only)
  const uploadedPhotos = useWizardStore((s) => s.mockupBathroomPhotos);

  // Inline rename state
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startRename = (boardId: string, currentName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBoardId(boardId);
    setEditName(currentName);
  };

  const confirmRename = () => {
    if (editingBoardId && editName.trim()) {
      renameBoard(editingBoardId, editName.trim());
    }
    setEditingBoardId(null);
    setEditName("");
  };

  // Build books from Supabase
  const [buildBooks, setBuildBooks] = useState<BuildBookEntry[]>([]);
  const [buildBooksLoaded, setBuildBooksLoaded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Clean up empty build books first, then load
      await cleanupEmptyBuildBooks().catch(() => {});
      const books = await loadBuildBooks().catch(() => [] as BuildBookEntry[]);
      setBuildBooks(books);
      setBuildBooksLoaded(true);
    })();
  }, []);

  // Boards sorted by newest first
  const sortedBoards = [...boards]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  // Items not assigned to any board
  const unsortedItems = items.filter((i) => i.boardIds.length === 0);
  const hasAnyBoardData = boards.length > 0 || items.length > 0;

  // Pinterest connection check
  const [pinterestConnected, setPinterestConnected] = useState<boolean | null>(null);
  const [pinterestBoards, setPinterestBoards] = useState<{ id: string; name: string; pinCount: number; pins: { id: string; title: string; imageUrl: string; sourceUrl: string }[] }[]>([]);
  const [pinterestLoading, setPinterestLoading] = useState(false);
  const [importingBoardId, setImportingBoardId] = useState<string | null>(null);
  const [importedBoardIds, setImportedBoardIds] = useState<Set<string>>(new Set());
  const [showPinterestModal, setShowPinterestModal] = useState(false);

  useEffect(() => {
    fetch("/api/pinterest/status").then((r) => r.json()).then((d) => {
      setPinterestConnected(d.connected);
    }).catch(() => setPinterestConnected(false));
  }, []);

  /** Start a brand-new build book (reset wizard state, navigate) */
  const handleNewBuildBook = () => {
    resetWizard();
    router.push("/start");
  };

  /** Open an existing build book (load its project data into the store, navigate) */
  const handleOpenBuildBook = async (projectId: string) => {
    const remote = await loadWizardState(projectId);
    if (remote) {
      // Reset first to clear stale data, then apply loaded state
      resetWizard();
      useWizardStore.setState(remote);
    }
    router.push("/build-book");
  };

  /** Delete a build book */
  const handleDeleteBuildBook = async (id: string) => {
    setDeletingId(id);
    const snapshot = buildBooks;
    setBuildBooks((prev) => prev.filter((b) => b.id !== id));
    setConfirmDeleteId(null);
    const ok = await deleteBuildBook(id);
    if (!ok) {
      setBuildBooks(snapshot);
      console.warn("Failed to delete build book; restored.");
    }
    setDeletingId(null);
  };

  const fetchPinterestBoards = useCallback(async () => {
    setPinterestLoading(true);
    try {
      const res = await fetch("/api/pinterest/boards");
      const data = await res.json();
      if (data.connected) {
        setPinterestConnected(true);
        setPinterestBoards(data.boards || []);
      } else if (data.expired) {
        setPinterestConnected(false);
      }
    } catch {
      // ignore
    } finally {
      setPinterestLoading(false);
    }
  }, []);

  const handleImportBoard = async (pBoard: typeof pinterestBoards[0]) => {
    setImportingBoardId(pBoard.id);
    try {
      const localBoardId = createBoard(pBoard.name, "pinterest");
      for (const pin of pBoard.pins) {
        if (pin.imageUrl) {
          saveItemToBoard(
            {
              id: `pinterest_${pin.id}`,
              imageUrl: pin.imageUrl,
              sourceUrl: pin.sourceUrl || "",
              source: "pinterest",
              tags: ["pinterest", pBoard.name.toLowerCase()],
              title: pin.title,
            },
            localBoardId,
          );
        }
      }
      setImportedBoardIds((prev) => new Set(prev).add(pBoard.id));
    } finally {
      setImportingBoardId(null);
    }
  };

  const handleOpenPinterest = async () => {
    if (pinterestConnected) {
      setShowPinterestModal(true);
      await fetchPinterestBoards();
    } else {
      window.location.href = "/api/pinterest/auth";
    }
  };

  return (
    <div className="space-y-8">
      <WelcomeModal />
      {/* Header row with action cluster */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">Welcome back!</h1>
          <p className="mt-1 max-w-xl text-[#6a6a7a]">
            Two simple steps to a renovation you&apos;ll love — pick up wherever you left off.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <Link
            href="/dashboard/guide"
            className="inline-flex items-center gap-2 rounded-full border border-[#e0d9c9] bg-[#fdfaf2] px-4 py-2.5 text-sm font-semibold text-[#6b5733] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c08a5a]/50 hover:bg-[#f9f3e3] hover:text-[#1a1a2e] hover:shadow"
            title="New here? Read the 2-minute guide"
          >
            <span aria-hidden>✨</span>
            <span className="hidden md:inline">2-minute guide</span>
            <span className="md:hidden">Guide</span>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#234a31] hover:shadow"
          >
            <FaCompass className="text-sm" /> Explore Ideas
          </Link>
        </div>
      </div>

      {/* Product hero — first-time orientation */}
      <ProductHeroStrip />

      {/* Two-column work area: Groundwork (left) + Build Books (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GroundworkHomeSection />

      {/* Build Books */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1a1a2e]">Build Books</h2>
            <Link
              href="/dashboard/build-books"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ede8] px-3 py-1 text-xs font-medium text-[#6a6a7a] transition hover:bg-[#e8e6e1] hover:text-[#1a1a2e]"
            >
              See all <FaArrowRight className="text-[8px]" />
            </Link>
          </div>
          {buildBooksLoaded && (
            <button
              onClick={handleNewBuildBook}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2d5a3d] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#234a31] hover:shadow"
            >
              <FaPlus className="text-[10px]" /> New Build Book
            </button>
          )}
        </div>
        {!buildBooksLoaded ? (
          <SkeletonTileRow count={2} className="grid grid-cols-1 gap-5 sm:grid-cols-2" />
        ) : buildBooksLoaded && buildBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {buildBooks.slice(0, 4).map((bb) => {
              // Build collage images: Render > uploaded original > Moodboard
              // If render exists, exclude moodboard
              const renderImg = bb.mockupImage;
              const uploadedImg = uploadedPhotos[0];
              const moodboardImg = bb.moodboardThumbnails[0];
              const collageImages: string[] = [];
              if (renderImg) collageImages.push(renderImg);
              if (uploadedImg) collageImages.push(uploadedImg);
              if (!renderImg && moodboardImg) collageImages.push(moodboardImg);

              return (
              <div
                key={bb.id}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#d5d3cd] hover:shadow-md"
              >
                {/* Delete button */}
                {confirmDeleteId === bb.id ? (
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBuildBook(bb.id); }}
                      disabled={deletingId === bb.id}
                      className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingId === bb.id ? <FaSpinner className="animate-spin text-xs" /> : "Delete"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="rounded-md bg-[#e8e6e1] px-2.5 py-1 text-[10px] font-semibold text-[#4a4a5a] transition hover:bg-[#d5d3cd]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(bb.id); }}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#9a9aaa] opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete build book"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
                <div onClick={() => handleOpenBuildBook(bb.projectId)}>
                {collageImages.length >= 2 ? (
                  <div className="flex h-52 w-full gap-0.5 overflow-hidden bg-[#f0ede8]">
                    {/* Largest image (Render if available, else first) */}
                    <div className="relative h-full flex-[3] overflow-hidden">
                      <Image
                        src={collageImages[0]}
                        alt={bb.name}
                        fill
                        className="object-cover"
                        sizes="300px"
                        unoptimized
                      />
                    </div>
                    {/* Smaller image(s) stacked on the right */}
                    <div className="flex flex-[2] flex-col gap-0.5">
                      <div className="relative min-h-0 flex-1 overflow-hidden">
                        <Image
                          src={collageImages[1]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                          unoptimized
                        />
                      </div>
                      {collageImages[2] && (
                        <div className="relative min-h-0 flex-1 overflow-hidden">
                          <Image
                            src={collageImages[2]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : collageImages.length === 1 ? (
                  <div className="relative h-52 w-full overflow-hidden bg-[#f0ede8]">
                    <Image
                      src={collageImages[0]}
                      alt={bb.name}
                      fill
                      className="object-cover"
                      sizes="400px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-[#f0ede8]">
                    <FaBookOpen className="text-3xl text-[#d5d3cd]" />
                  </div>
                )}
                <div className="p-3.5">
                  <p className="font-semibold text-[#1a1a2e] group-hover:text-[#2d5a3d]">
                    {bb.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9a9aaa]">
                    Updated {formatDateTime(bb.updatedAt)}
                  </p>
                </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <button
              onClick={handleNewBuildBook}
              className="group flex h-[19rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] bg-white p-6 text-center transition hover:border-[#2d5a3d]/40 hover:shadow-sm"
            >
              <FaBookOpen className="text-2xl text-[#d5d3cd] transition group-hover:text-[#2d5a3d]" />
              <span className="text-sm font-semibold text-[#1a1a2e]">Start your first Build Book</span>
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Idea Boards */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Ideas</h2>
          <Link
            href="/dashboard/idea-boards"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ede8] px-3 py-1 text-xs font-medium text-[#6a6a7a] transition hover:bg-[#e8e6e1] hover:text-[#1a1a2e]"
          >
            See all <FaArrowRight className="text-[8px]" />
          </Link>
          {pinterestConnected !== null && (
            <button
              onClick={handleOpenPinterest}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                pinterestConnected
                  ? "bg-[#E60023]/5 text-[#E60023] hover:bg-[#E60023]/10"
                  : "bg-[#E60023] text-white hover:bg-[#ad081b]"
              }`}
            >
              <FaPinterest className="text-[10px]" />
              {pinterestConnected ? "Import Boards" : "Connect Pinterest"}
            </button>
          )}
        </div>

        {hasAnyBoardData ? (
          <div className="space-y-5">
            {sortedBoards.length > 0 && (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedBoards.map((board) => {
                  const boardItems = getBoardItems(board.id);
                  const thumb = boardItems[0];
                  return (
                    <div key={board.id} className="group relative">
                      <Link
                        href={`/dashboard/idea-boards/${board.id}`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f0ede8]">
                          {thumb ? (
                            <Image
                              src={thumb.imageUrl}
                              alt={board.name}
                              fill
                              className="object-cover transition group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <FaTableCellsLarge className="text-3xl text-[#d5d3cd]" />
                            </div>
                          )}
                        {/* Pinterest badge */}
                        {board.source === "pinterest" && (
                          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
                              <FaPinterest className="text-sm text-[#E60023]" />
                            </div>
                          )}
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeBoard(board.id);
                            }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                            title="Delete board"
                          >
                            <FaTrashCan className="text-[10px]" />
                          </button>
                        </div>
                      </Link>
                      {/* Board name with inline rename */}
                      {editingBoardId === board.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={confirmRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename();
                            if (e.key === "Escape") setEditingBoardId(null);
                          }}
                          className="mt-2 w-full rounded border border-[#2d5a3d] px-1.5 py-0.5 text-sm font-semibold text-[#1a1a2e] outline-none"
                        />
                      ) : (
                        <button
                          onClick={(e) => startRename(board.id, board.name, e)}
                          className="group/name mt-2 flex w-full items-center gap-1 text-left"
                        >
                          <p className="text-sm font-semibold text-[#1a1a2e] group-hover/name:text-[#2d5a3d]">
                            {board.name}
                          </p>
                          <FaPen className="shrink-0 text-[9px] text-[#9a9aaa] opacity-0 transition group-hover/name:opacity-100" />
                        </button>
                      )}
                      <p className="text-xs text-[#9a9aaa]">
                        {boardItems.length} idea{boardItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unsorted saved items */}
            {unsortedItems.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-[#6a6a7a]">
                  Unsorted ideas ({unsortedItems.length})
                </p>
                <div className="flex gap-2 overflow-x-auto rounded-xl border border-[#e8e6e1] bg-white p-3">
                  {unsortedItems.slice(0, 8).map((item) => (
                    <div key={item.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Saved image"}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  ))}
                  {unsortedItems.length > 8 && (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[#f0ede8] text-xs font-semibold text-[#6a6a7a]">
                      +{unsortedItems.length - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center">
            <FaTableCellsLarge className="mx-auto text-3xl text-[#d5d3cd]" />
            <p className="mt-3 text-sm text-[#9a9aaa]">No idea boards yet. Save inspiration to get started!</p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
            >
              <FaCompass className="text-xs" /> Explore Ideas
            </Link>
          </div>
        )}
      </div>

      {/* Pinterest Import Modal */}
      {showPinterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a2e]">
                <FaPinterest className="text-[#E60023]" />
                Import from Pinterest
              </h2>
              <button
                onClick={() => setShowPinterestModal(false)}
                className="rounded-lg p-1.5 text-[#9a9aaa] transition hover:bg-[#f0ede8] hover:text-[#1a1a2e]"
              >
                ✕
              </button>
            </div>

            {pinterestLoading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-2xl text-[#2d5a3d]" />
                <span className="ml-3 text-sm text-[#6a6a7a]">Loading your Pinterest boards…</span>
              </div>
            ) : pinterestBoards.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[#6a6a7a]">No boards found on your Pinterest account.</p>
              </div>
            ) : (
              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {pinterestBoards.map((pBoard) => {
                  const isImported = importedBoardIds.has(pBoard.id);
                  const isImporting = importingBoardId === pBoard.id;
                  const firstPin = pBoard.pins[0];
                  return (
                    <div
                      key={pBoard.id}
                      className="flex items-center gap-4 rounded-xl border border-[#e8e6e1] p-3 transition hover:bg-[#f8f7f4]"
                    >
                      {firstPin?.imageUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={firstPin.imageUrl}
                            alt={pBoard.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f0ede8]">
                          <FaPinterest className="text-[#d5d3cd]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1a1a2e]">
                          {pBoard.name}
                        </p>
                        <p className="text-xs text-[#9a9aaa]">
                          {pBoard.pinCount} pin{pBoard.pinCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleImportBoard(pBoard)}
                        disabled={isImported || isImporting}
                        className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                          isImported
                            ? "bg-[#2d5a3d]/10 text-[#2d5a3d]"
                            : isImporting
                            ? "bg-[#f0ede8] text-[#9a9aaa]"
                            : "bg-[#2d5a3d] text-white hover:bg-[#234a31]"
                        }`}
                      >
                        {isImported ? (
                          <span className="flex items-center gap-1"><FaCheck className="text-[10px]" /> Imported</span>
                        ) : isImporting ? (
                          <span className="flex items-center gap-1"><FaSpinner className="animate-spin text-[10px]" /> Importing…</span>
                        ) : (
                          "Import"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPinterestModal(false)}
                className="rounded-lg bg-[#f0ede8] px-4 py-2 text-sm font-medium text-[#4a4a5a] transition hover:bg-[#e8e6e1]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




function GroundworkHomeSection() {
  const router = useRouter();
  const loadFrom = useGroundworkStore((st) => st.loadFrom);
  const resetGroundwork = useGroundworkStore((st) => st.reset);

  const [scopes, setScopes] = useState<GroundworkScopeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDeleteScopeId, setConfirmDeleteScopeId] = useState<string | null>(null);
  const [deletingScopeId, setDeletingScopeId] = useState<string | null>(null);

  const handleDeleteScope = async (id: string) => {
    setDeletingScopeId(id);
    // Optimistic remove so the UI updates immediately.
    const snapshot = scopes;
    setScopes((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteScopeId(null);
    const ok = await deleteGroundworkScope(id);
    if (!ok) {
      // Revert on failure
      setScopes(snapshot);
      console.warn("Failed to delete groundwork scope; restored.");
    } else {
      // Re-sync from server to be safe.
      void refresh();
    }
    setDeletingScopeId(null);
  };

  const refresh = React.useCallback(async () => {
    const rows = await loadAllGroundworkScopes().catch(() => [] as GroundworkScopeRow[]);
    setScopes(rows);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Re-fetch when the user comes back to the tab (covers post-edit returns).
  useEffect(() => {
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const startNew = () => {
    resetGroundwork();
    router.push("/groundwork/bathroom");
  };

  const openScope = (row: GroundworkScopeRow) => {
    loadFrom(row.data, row.project_id);
    router.push(row.completed_at ? "/groundwork/bathroom/summary" : "/groundwork/bathroom");
  };

  // Draft state lives in localStorage and auto-saves to Supabase via
  // GroundworkAutosave. The dashboard only renders rows from Supabase.

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Groundwork Scope</h2>
          <Link
            href="/dashboard/groundwork"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ede8] px-3 py-1 text-xs font-medium text-[#6a6a7a] transition hover:bg-[#e8e6e1] hover:text-[#1a1a2e]"
          >
            See all <FaArrowRight className="text-[8px]" />
          </Link>
        </div>
        {loaded && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#c08a5a] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#a8754a] hover:shadow"
          >
            <FaPlus className="text-[10px]" /> New Groundwork
          </button>
        )}
      </div>
      {!loaded ? (
        <SkeletonTileRow count={2} className="grid grid-cols-1 gap-5 sm:grid-cols-2" />
      ) : scopes.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <button
            onClick={startNew}
            className="group flex h-[19rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] bg-white p-6 text-center transition hover:border-[#c08a5a]/40 hover:shadow-sm"
          >
            <FaClipboardList className="text-2xl text-[#d5d3cd] transition group-hover:text-[#c08a5a]" />
            <span className="text-sm font-semibold text-[#1a1a2e]">Start your first Groundwork Scope</span>
            <span className="text-xs text-[#9a9aaa]">Contractor-ready brief in a few minutes</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {scopes.slice(0, 4).map((row) => (
            <GroundworkScopeCard
              key={row.id}
              row={row}
              onOpen={() => openScope(row)}
              isConfirming={confirmDeleteScopeId === row.id}
              isDeleting={deletingScopeId === row.id}
              onRequestDelete={() => setConfirmDeleteScopeId(row.id)}
              onCancelDelete={() => setConfirmDeleteScopeId(null)}
              onDelete={() => handleDeleteScope(row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroundworkScopeCard({
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
    <div className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#c08a5a]/40 hover:shadow-md">
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
        <div className="relative h-52 w-full overflow-hidden bg-[#f6f3ed]">
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FaClipboardList className="text-3xl text-[#d5d3cd]" />
            </div>
          )}
          {complete && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#3a3a4a] shadow-sm">
              <FaCircleCheck className="text-[#c08a5a]" /> Ready for contractor
            </span>
          )}
        </div>
        <div className="p-3.5">
          <p className="font-semibold text-[#1a1a2e] group-hover:text-[#c08a5a]">{title}</p>
          <p className="mt-0.5 text-xs text-[#9a9aaa]">
            {complete ? "Completed " + formatDateTime(row.completed_at!) : "Updated " + formatDateTime(row.updated_at)}
          </p>
        </div>
      </button>
    </div>
  );
}


function ProductHeroStrip() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Link
        href="/dashboard/groundwork"
        className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[#ece9e3] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c08a5a]/40 hover:shadow-md"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c08a5a] to-[#e0b585]" />
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#f6f3ed]">
          <FaClipboardList className="text-xl text-[#c08a5a]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f6f3ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c08a5a]">
              Step 1
            </span>
            <h3 className="text-sm font-bold text-[#1a1a2e]">Groundwork Scope</h3>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6a6a7a]">
            Lock in the must-haves so every contractor bids on the <em>same</em> project — no surprises later.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c08a5a] transition group-hover:gap-2">
            Open Groundwork <FaArrowRight className="text-[10px]" />
          </span>
        </div>
      </Link>
      <Link
        href="/dashboard/build-books"
        className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[#ece9e3] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2d5a3d]/40 hover:shadow-md"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2d5a3d] to-[#5a8a6a]" />
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#eef3ee]">
          <FaBookOpen className="text-xl text-[#2d5a3d]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eef3ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2d5a3d]">
              Step 2
            </span>
            <h3 className="text-sm font-bold text-[#1a1a2e]">Build Book</h3>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6a6a7a]">
            Picture the finished room — moodboard, a mockup of <em>your</em> bathroom, items list, all in one shareable book.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2d5a3d] transition group-hover:gap-2">
            Open Build Book <FaArrowRight className="text-[10px]" />
          </span>
        </div>
      </Link>
    </div>
  );
}
