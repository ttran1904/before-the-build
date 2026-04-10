"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  FaXmark, FaTrash, FaArrowRight, FaHeart,
  FaChevronLeft, FaPen, FaFolderOpen, FaCircle, FaRegCircle,
  FaEye, FaPinterest,
} from "react-icons/fa6";
import { useIdeaBoardStore } from "@/lib/store";
import Link from "next/link";

interface IdeaBoardPanelProps {
  open: boolean;
  onClose: () => void;
}

type PanelView = "collections" | "board";

export default function IdeaBoardPanel({ open, onClose }: IdeaBoardPanelProps) {
  const {
    items,
    boards,
    removeItem,
    removeBoard,
    renameBoard,
    removeItemFromBoard,
    getBoardItems,
  } = useIdeaBoardStore();

  const [view, setView] = useState<PanelView>("collections");
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());

  // Default-select all boards when panel opens or boards change
  useEffect(() => {
    if (open) {
      setSelectedBoardIds(new Set(boards.map((b) => b.id)));
    }
  }, [open, boards]);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const activeBoardItems = activeBoardId ? getBoardItems(activeBoardId) : [];

  const toggleBoardSelection = (boardId: string) => {
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) {
        next.delete(boardId);
      } else {
        next.add(boardId);
      }
      return next;
    });
  };

  const openBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setView("board");
  };

  const goBackToCollections = () => {
    setView("collections");
    setActiveBoardId(null);
  };

  const startRename = (boardId: string, currentName: string) => {
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

  const getBoardItemCount = (boardId: string): number => {
    return items.filter((i) => i.boardIds.includes(boardId)).length;
  };

  const selectedCount = selectedBoardIds.size;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-[#e8e6e1] bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6e1] px-6 py-4">
          <div className="flex items-center gap-2">
            {view === "board" && (
              <button
                onClick={goBackToCollections}
                className="mr-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#f3f2ef]"
              >
                <FaChevronLeft className="text-xs text-[#4a4a5a]" />
              </button>
            )}
            {view === "collections" ? (
              <h2 className="text-lg font-bold text-[#1a1a2e]">My Collections</h2>
            ) : editingBoardId === activeBoardId ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setEditingBoardId(null);
                }}
                className="rounded border border-[#2d5a3d] px-2 py-0.5 text-lg font-bold text-[#1a1a2e] outline-none"
              />
            ) : (
              <button
                onClick={() => activeBoardId && startRename(activeBoardId, activeBoard?.name || "")}
                className="group/name flex items-center gap-1.5"
              >
                <h2 className="text-lg font-bold text-[#1a1a2e]">
                  {activeBoard?.name || "Board"}
                </h2>
                <FaPen className="text-[10px] text-[#9a9aaa] opacity-0 transition group-hover/name:opacity-100" />
              </button>
            )}
            <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-semibold text-[#2d5a3d]">
              {view === "collections" ? boards.length : activeBoardItems.length}
            </span>
            {view === "board" && activeBoard?.source === "pinterest" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E60023]/10 px-2 py-0.5 text-xs font-semibold text-[#E60023]">
                <FaPinterest className="text-[10px]" /> Pinterest
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f2ef]"
          >
            <FaXmark className="text-[#4a4a5a]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === "collections" ? (
            /* ── Collections View ── */
            boards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FaFolderOpen className="text-4xl text-[#d4956a]" />
                <h3 className="text-base font-semibold text-[#4a4a5a]">
                  No collections yet
                </h3>
                <p className="text-sm text-[#7a7a8a]">
                  Click the <FaHeart className="inline text-red-400" /> icon on
                  any image to save it to a collection.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {boards.map((board) => {
                  const count = getBoardItemCount(board.id);
                  const boardItems = items.filter((i) =>
                    i.boardIds.includes(board.id)
                  );
                  const previews = boardItems.slice(0, 4);
                  const isSelected = selectedBoardIds.has(board.id);

                  return (
                    <div
                      key={board.id}
                      onClick={() => toggleBoardSelection(board.id)}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition hover:shadow-md ${
                        isSelected
                          ? "border-[#2d5a3d] shadow-sm"
                          : "border-[#e8e6e1] hover:border-[#2d5a3d]/30"
                      }`}
                    >
                      {/* Selection circle */}
                      <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm">
                        {isSelected ? (
                          <FaCircle className="text-sm text-[#2d5a3d]" />
                        ) : (
                          <FaRegCircle className="text-sm text-[#9a9aaa]" />
                        )}
                      </div>

                      {/* Board cover mosaic */}
                      <div className="w-full text-left">
                        <div className="grid h-36 grid-cols-2 gap-0.5 overflow-hidden bg-[#f3f2ef]">
                          {previews.length > 0 ? (
                            previews.map((item, i) => (
                              <div
                                key={item.id}
                                className={`relative overflow-hidden ${
                                  previews.length === 1
                                    ? "col-span-2 row-span-2"
                                    : previews.length === 2
                                      ? "row-span-2"
                                      : previews.length === 3 && i === 0
                                        ? "row-span-2"
                                        : ""
                                }`}
                              >
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title || ""}
                                  fill
                                  className="object-cover"
                                  sizes="180px"
                                  unoptimized
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 flex items-center justify-center">
                              <FaFolderOpen className="text-2xl text-[#d5d3cd]" />
                            </div>
                          )}
                        </div>

                        {/* Board info */}
                        <div className="flex items-center justify-between px-4 py-3">
                          <div>
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
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border border-[#2d5a3d] px-2 py-0.5 text-sm font-semibold text-[#1a1a2e] outline-none"
                              />
                            ) : (
                              <span
                                className="group/name inline-flex cursor-text items-center gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(board.id, board.name);
                                }}
                              >
                                <h3 className="text-sm font-bold text-[#1a1a2e]">
                                  {board.name}
                                </h3>
                                <FaPen className="text-[9px] text-[#9a9aaa] opacity-0 transition group-hover/name:opacity-100" />
                              </span>
                            )}
                            <p className="text-xs text-[#9a9aaa]">
                              {count} {count === 1 ? "pin" : "pins"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBoard(board.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
                          title="View ideas"
                        >
                          <FaEye className="text-[10px] text-[#4a4a5a]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBoard(board.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm hover:bg-red-500 hover:text-white"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>

                      {/* Pinterest badge */}
                      {board.source === "pinterest" && (
                        <div className="absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
                          <FaPinterest className="text-xs text-[#E60023]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── Board Detail View ── */
            activeBoardItems.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FaHeart className="text-4xl text-[#d4956a]" />
                <h3 className="text-base font-semibold text-[#4a4a5a]">
                  Board is empty
                </h3>
                <p className="text-sm text-[#7a7a8a]">
                  Save images from the gallery to this board.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {activeBoardItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Saved image"}
                        fill
                        className="object-cover"
                        sizes="180px"
                        unoptimized
                      />
                      {/* Remove from board */}
                      <button
                        onClick={() =>
                          activeBoardId &&
                          removeItemFromBoard(item.id, activeBoardId)
                        }
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                      >
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer CTA */}
        {boards.length > 0 && (
          <div className="border-t border-[#e8e6e1] p-4">
            {view === "collections" && selectedCount > 0 && (
              <p className="mb-2 text-center text-xs text-[#6a6a7a]">
                {selectedCount} board{selectedCount !== 1 ? "s" : ""} selected
              </p>
            )}
            <Link
              href="/renovate/bathroom"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              Create a Build Book
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
