"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaXmark, FaTrash, FaArrowRight, FaHeart,
  FaChevronLeft, FaPen, FaLayerGroup, FaFolderOpen,
} from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";
import Link from "next/link";

interface MoodboardPanelProps {
  open: boolean;
  onClose: () => void;
}

type PanelView = "collections" | "board";

export default function MoodboardPanel({ open, onClose }: MoodboardPanelProps) {
  const {
    items,
    boards,
    removeItem,
    removeBoard,
    renameBoard,
    removeItemFromBoard,
    getBoardItems,
  } = useMoodboardStore();

  const [view, setView] = useState<PanelView>("collections");
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const activeBoardItems = activeBoardId ? getBoardItems(activeBoardId) : [];

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

  // Get cover image (first item) for a board
  const getBoardCover = (boardId: string): string | null => {
    const boardItem = items.find((i) => i.boardIds.includes(boardId));
    return boardItem?.imageUrl || null;
  };

  const getBoardItemCount = (boardId: string): number => {
    return items.filter((i) => i.boardIds.includes(boardId)).length;
  };

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
            <FaLayerGroup className="text-[#2d5a3d]" />
            <h2 className="text-lg font-bold text-[#1a1a2e]">
              {view === "collections"
                ? "My Collections"
                : activeBoard?.name || "Board"}
            </h2>
            <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-semibold text-[#2d5a3d]">
              {view === "collections" ? boards.length : activeBoardItems.length}
            </span>
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
                  const cover = getBoardCover(board.id);
                  const count = getBoardItemCount(board.id);
                  const boardItems = items.filter((i) =>
                    i.boardIds.includes(board.id)
                  );
                  // Show up to 4 thumbnail previews
                  const previews = boardItems.slice(0, 4);

                  return (
                    <div
                      key={board.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#e8e6e1] transition hover:border-[#2d5a3d]/30 hover:shadow-md"
                    >
                      {/* Board cover mosaic */}
                      <button
                        onClick={() => openBoard(board.id)}
                        className="w-full text-left"
                      >
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
                              <h3 className="text-sm font-bold text-[#1a1a2e]">
                                {board.name}
                              </h3>
                            )}
                            <p className="text-xs text-[#9a9aaa]">
                              {count} {count === 1 ? "pin" : "pins"}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Hover actions */}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(board.id, board.name);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
                        >
                          <FaPen className="text-[10px] text-[#4a4a5a]" />
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
                    {item.title && (
                      <p className="mt-1 truncate text-xs text-[#4a4a5a]">
                        {item.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className="border-t border-[#e8e6e1] p-4">
            <Link
              href="/renovate/bathroom"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d5a3d] py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              Plan Your Renovation
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
