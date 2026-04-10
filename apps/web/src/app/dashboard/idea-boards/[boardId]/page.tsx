"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaTableCellsLarge, FaTrashCan, FaPinterest, FaPen } from "react-icons/fa6";
import { useIdeaBoardStore } from "@/lib/store";

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = use(params);
  const router = useRouter();
  const boards = useIdeaBoardStore((s) => s.boards);
  const getBoardItems = useIdeaBoardStore((s) => s.getBoardItems);
  const removeItemFromBoard = useIdeaBoardStore((s) => s.removeItemFromBoard);
  const removeBoard = useIdeaBoardStore((s) => s.removeBoard);
  const renameBoard = useIdeaBoardStore((s) => s.renameBoard);

  const board = boards.find((b) => b.id === boardId);
  const boardItems = getBoardItems(boardId);

  // Inline rename state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const startRename = () => {
    if (!board) return;
    setEditing(true);
    setEditName(board.name);
  };

  const confirmRename = () => {
    if (editName.trim() && board) {
      renameBoard(board.id, editName.trim());
    }
    setEditing(false);
    setEditName("");
  };

  const handleDeleteBoard = () => {
    removeBoard(boardId);
    router.push("/dashboard");
  };

  if (!board) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-12 text-center">
          <FaTableCellsLarge className="mx-auto text-3xl text-[#d5d3cd]" />
          <p className="mt-3 text-sm text-[#9a9aaa]">Board not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            {editing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="rounded border border-[#2d5a3d] px-2 py-0.5 text-2xl font-bold text-[#1a1a2e] outline-none"
              />
            ) : (
              <button
                onClick={startRename}
                className="group/name flex items-center gap-2"
              >
                <h1 className="text-2xl font-bold text-[#1a1a2e]">{board.name}</h1>
                <FaPen className="text-xs text-[#9a9aaa] opacity-0 transition group-hover/name:opacity-100" />
              </button>
            )}
            {board.source === "pinterest" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E60023]/10 px-3 py-1 text-xs font-semibold text-[#E60023]">
                <FaPinterest className="text-sm" /> From Pinterest
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            {boardItems.length} idea{boardItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleDeleteBoard}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:border-red-300"
          title="Delete board"
        >
          <FaTrashCan className="text-xs" /> Delete Board
        </button>
      </div>

      {/* Image collage grid */}
      {boardItems.length > 0 ? (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {boardItems.map((item) => (
            <div
              key={item.id}
              className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-[#e8e6e1] bg-white"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Saved idea"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
              </div>
              <button
                onClick={() => removeItemFromBoard(item.id, boardId)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                title="Remove from board"
              >
                <FaTrashCan className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d5d3cd] bg-white p-12 text-center">
          <FaTableCellsLarge className="mx-auto text-3xl text-[#d5d3cd]" />
          <p className="mt-3 text-sm text-[#9a9aaa]">No ideas saved to this board yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
          >
            Explore Ideas
          </Link>
        </div>
      )}
    </div>
  );
}
