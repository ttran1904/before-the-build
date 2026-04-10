"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaTableCellsLarge, FaTrashCan, FaPinterest } from "react-icons/fa6";
import { useIdeaBoardStore } from "@/lib/store";

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = use(params);
  const boards = useIdeaBoardStore((s) => s.boards);
  const getBoardItems = useIdeaBoardStore((s) => s.getBoardItems);
  const removeItemFromBoard = useIdeaBoardStore((s) => s.removeItemFromBoard);

  const board = boards.find((b) => b.id === boardId);
  const boardItems = getBoardItems(boardId);

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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">{board.name}</h1>
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
