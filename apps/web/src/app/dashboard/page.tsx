"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBookOpen, FaCompass, FaTableCellsLarge, FaPlus, FaPinterest, FaSpinner, FaCheck, FaCircleCheck, FaArrowRight, FaTrashCan, FaPen } from "react-icons/fa6";
import { useIdeaBoardStore, useWizardStore } from "@/lib/store";
import { loadBuildBooks } from "@/lib/supabase-sync";

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
  const boards = useIdeaBoardStore((s) => s.boards);
  const items = useIdeaBoardStore((s) => s.items);
  const getBoardItems = useIdeaBoardStore((s) => s.getBoardItems);
  const createBoard = useIdeaBoardStore((s) => s.createBoard);
  const saveItemToBoard = useIdeaBoardStore((s) => s.saveItemToBoard);
  const removeBoard = useIdeaBoardStore((s) => s.removeBoard);
  const renameBoard = useIdeaBoardStore((s) => s.renameBoard);

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

  useEffect(() => {
    loadBuildBooks().then((books) => {
      setBuildBooks(books);
      setBuildBooksLoaded(true);
    }).catch(() => setBuildBooksLoaded(true));
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
      {/* Header row with Explore Ideas button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">Welcome back!</h1>
          <p className="mt-1 text-[#6a6a7a]">Your renovation journey at a glance.</p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaCompass className="text-sm" /> Explore Ideas
        </Link>
      </div>

      {/* Build Books */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Build Books</h2>
          <Link
            href="/dashboard/build-books"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ede8] px-3 py-1 text-xs font-medium text-[#6a6a7a] transition hover:bg-[#e8e6e1] hover:text-[#1a1a2e]"
          >
            See all <FaArrowRight className="text-[8px]" />
          </Link>
        </div>
        {buildBooksLoaded && buildBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {buildBooks.map((bb) => {
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
              <Link
                key={bb.id}
                href="/build-book"
                className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#d5d3cd] hover:shadow-md"
              >
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
                    Updated {new Date(bb.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              );
            })}
            <Link
              href="/renovate/bathroom"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d5d3cd] bg-white p-8 text-center transition hover:border-[#2d5a3d]/30 hover:shadow-sm"
            >
              <FaPlus className="text-lg text-[#9a9aaa]" />
              <span className="text-sm font-medium text-[#6a6a7a]">New Build Book</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center">
            <FaBookOpen className="mx-auto text-3xl text-[#d5d3cd]" />
            <p className="mt-3 text-sm text-[#9a9aaa]">No build books yet.</p>
            <Link
              href="/renovate/bathroom"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
            >
              <FaPlus className="text-xs" /> Start Your First Build Book
            </Link>
          </div>
        )}
      </div>

      {/* Idea Boards */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Idea Boards</h2>
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


