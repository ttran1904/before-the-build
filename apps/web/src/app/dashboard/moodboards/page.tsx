"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaTableCellsLarge, FaPlus, FaPinterest, FaSpinner, FaCheck } from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";

interface PinterestPin {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
}

interface PinterestBoard {
  id: string;
  name: string;
  pinCount: number;
  pins: PinterestPin[];
}

export default function MoodboardsPage() {
  const boards = useMoodboardStore((s) => s.boards);
  const items = useMoodboardStore((s) => s.items);
  const getBoardItems = useMoodboardStore((s) => s.getBoardItems);
  const createBoard = useMoodboardStore((s) => s.createBoard);
  const saveItemToBoard = useMoodboardStore((s) => s.saveItemToBoard);
  const unsortedItems = items.filter((i) => i.boardIds.length === 0);
  const hasData = boards.length > 0 || items.length > 0;

  const sortedBoards = [...boards].sort((a, b) => b.createdAt - a.createdAt);

  // Pinterest state
  const [pinterestConnected, setPinterestConnected] = useState(false);
  const [pinterestBoards, setPinterestBoards] = useState<PinterestBoard[]>([]);
  const [pinterestLoading, setPinterestLoading] = useState(false);
  const [importingBoardId, setImportingBoardId] = useState<string | null>(null);
  const [importedBoardIds, setImportedBoardIds] = useState<Set<string>>(new Set());
  const [showPinterestModal, setShowPinterestModal] = useState(false);

  // Check Pinterest connection
  useEffect(() => {
    fetch("/api/pinterest/status").then((r) => r.json()).then((d) => {
      setPinterestConnected(d.connected);
    }).catch(() => {});
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

  const handleImportBoard = async (pBoard: PinterestBoard) => {
    setImportingBoardId(pBoard.id);
    try {
      // Create a local board
      const localBoardId = createBoard(pBoard.name);
      // Add each pin as an item
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
            localBoardId
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
      // Redirect to Pinterest OAuth
      window.location.href = "/api/pinterest/auth";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Idea Boards</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            Your saved inspiration collections. Link them to build books or browse for ideas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenPinterest}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e8e6e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#E60023] transition hover:bg-[#fef2f2]"
          >
            <FaPinterest className="text-base" />
            {pinterestConnected ? "Import from Pinterest" : "Connect Pinterest"}
          </button>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
          >
            <FaPlus className="text-xs" /> New Board
          </Link>
        </div>
      </div>

      {hasData ? (
        <div className="space-y-6">
          {sortedBoards.length > 0 && (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedBoards.map((board) => {
                const boardItems = getBoardItems(board.id);
                const thumb = boardItems[0];
                return (
                  <Link
                    key={board.id}
                    href={`/dashboard/moodboards/${board.id}`}
                    className="group"
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
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#1a1a2e] group-hover:text-[#2d5a3d]">
                      {board.name}
                    </p>
                    <p className="text-xs text-[#9a9aaa]">
                      {boardItems.length} idea{boardItems.length !== 1 ? "s" : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Unsorted saved items */}
          {unsortedItems.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1a1a2e]">
                Unsorted Ideas ({unsortedItems.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {unsortedItems.map((item) => (
                  <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Saved image"}
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
          <FaTableCellsLarge className="mx-auto text-4xl text-[#d5d3cd]" />
          <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">No idea boards yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
            Idea boards work like Pinterest boards — save inspiration images, colors, materials,
            and styles. You can link one or more boards to any build book.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
          >
            <FaPlus className="text-xs" /> Start Collecting Ideas
          </Link>
        </div>
      )}

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


