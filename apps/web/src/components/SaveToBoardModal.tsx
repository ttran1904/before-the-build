"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FaXmark, FaPlus, FaMagnifyingGlass, FaCheck } from "react-icons/fa6";
import { useIdeaBoardStore } from "@/lib/store";

interface SaveToBoardModalProps {
  open: boolean;
  onClose: () => void;
  image: {
    id: string;
    url: string;
    title: string;
    tags: string[];
    source?: string;
    sourceUrl?: string;
  };
  /** Position to anchor the modal near the heart icon */
  anchorRect?: DOMRect | null;
}

export default function SaveToBoardModal({
  open,
  onClose,
  image,
  anchorRect,
}: SaveToBoardModalProps) {
  const {
    boards,
    items,
    createBoard,
    saveItemToBoard,
    removeItemFromBoard,
    getSuggestedBoardNames,
  } = useIdeaBoardStore();

  const [search, setSearch] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Which boards this image is already in
  const existingItem = items.find((i) => i.id === image.id);
  const savedBoardIds = existingItem?.boardIds || [];

  // Get suggestions based on image tags
  const suggestions = getSuggestedBoardNames(image.tags);

  // Filter boards by search
  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter suggestions — exclude ones that already exist as boards
  const filteredSuggestions = suggestions.filter(
    (s) =>
      !boards.some((b) => b.name.toLowerCase() === s.toLowerCase()) &&
      s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setSearch("");
    setCreatingNew(false);
    setNewBoardName("");
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveToBoard = (boardId: string) => {
    if (savedBoardIds.includes(boardId)) {
      removeItemFromBoard(image.id, boardId);
    } else {
      saveItemToBoard(
        {
          id: image.id,
          imageUrl: image.url,
          source: image.source || "curated",
          sourceUrl: image.sourceUrl,
          tags: image.tags,
          title: image.title,
        },
        boardId
      );
    }
  };

  const handleCreateAndSave = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const boardId = createBoard(trimmed);
    saveItemToBoard(
      {
        id: image.id,
        imageUrl: image.url,
        source: image.source || "curated",
        sourceUrl: image.sourceUrl,
        tags: image.tags,
        title: image.title,
      },
      boardId
    );
    setCreatingNew(false);
    setNewBoardName("");
  };

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      handleCreateAndSave(newBoardName);
    }
  };

  // Get the cover image for a board (first item in that board)
  const getBoardCover = (boardId: string): string | null => {
    const boardItem = items.find((i) => i.boardIds.includes(boardId));
    return boardItem?.imageUrl || null;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-[70] w-80 rounded-2xl border border-[#e8e6e1] bg-white shadow-2xl"
        style={{
          top: anchorRect
            ? Math.min(anchorRect.bottom + 8, window.innerHeight - 420)
            : "50%",
          left: anchorRect
            ? Math.min(anchorRect.left - 240, window.innerWidth - 340)
            : "50%",
          ...(anchorRect ? {} : { transform: "translate(-50%, -50%)" }),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-base font-bold text-[#1a1a2e]">Save to board</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#f3f2ef]"
          >
            <FaXmark className="text-sm text-[#4a4a5a]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#9a9aaa]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#e8e6e1] bg-white py-2 pl-9 pr-3 text-sm text-[#1a1a2e] outline-none transition focus:border-[#2d5a3d] focus:ring-2 focus:ring-[#2d5a3d]/20"
            />
          </div>
        </div>

        {/* Board list */}
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {/* Existing boards */}
          {filteredBoards.length > 0 && (
            <div className="mb-1">
              <p className="px-2 pb-1 text-xs font-semibold text-[#9a9aaa]">
                All boards
              </p>
              {filteredBoards.map((board) => {
                const cover = getBoardCover(board.id);
                const isInBoard = savedBoardIds.includes(board.id);
                return (
                  <button
                    key={board.id}
                    onClick={() => handleSaveToBoard(board.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[#f8f7f4]"
                  >
                    {/* Board thumbnail */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f3f2ef]">
                      {cover && (
                        <Image
                          src={cover}
                          alt={board.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      )}
                    </div>
                    <span className="flex-1 text-left text-sm font-semibold text-[#1a1a2e]">
                      {board.name}
                    </span>
                    {isInBoard && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d5a3d]">
                        <FaCheck className="text-[10px] text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="mb-1">
              <p className="px-2 pb-1 text-xs font-semibold text-[#9a9aaa]">
                Suggestions
              </p>
              {filteredSuggestions.map((name) => (
                <button
                  key={name}
                  onClick={() => handleCreateAndSave(name)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[#f8f7f4]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f3f2ef]">
                    <FaPlus className="text-sm text-[#9a9aaa]" />
                  </div>
                  <span className="flex-1 text-left text-sm font-semibold text-[#1a1a2e]">
                    {name}
                  </span>
                  <span className="rounded-full bg-[#e60023] px-3 py-1 text-xs font-bold text-white">
                    Create
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Create board */}
          {!creatingNew ? (
            <button
              onClick={() => {
                setCreatingNew(true);
                setTimeout(
                  () => document.getElementById("new-board-input")?.focus(),
                  100
                );
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[#f8f7f4]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f3f2ef]">
                <FaPlus className="text-sm text-[#9a9aaa]" />
              </div>
              <span className="text-sm font-semibold text-[#1a1a2e]">
                Create board
              </span>
            </button>
          ) : (
            <div className="rounded-xl border border-[#2d5a3d] bg-[#f8f7f4] p-3">
              <input
                id="new-board-input"
                type="text"
                placeholder='e.g. "Master bath ideas"'
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBoard();
                  if (e.key === "Escape") setCreatingNew(false);
                }}
                className="w-full rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-sm text-[#1a1a2e] outline-none focus:border-[#2d5a3d]"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setCreatingNew(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#6a6a7a] hover:bg-[#e8e6e1]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim()}
                  className="rounded-lg bg-[#2d5a3d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#234a31] disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
