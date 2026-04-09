"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaTableCellsLarge } from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = use(params);
  const boards = useMoodboardStore((s) => s.boards);
  const getBoardItems = useMoodboardStore((s) => s.getBoardItems);

  const board = boards.find((b) => b.id === boardId);
  const boardItems = getBoardItems(boardId);

  if (!board) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/moodboards"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2d5a3d] hover:underline"
        >
          <FaArrowLeft className="text-xs" /> Back to Idea Boards
        </Link>
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
        <Link
          href="/dashboard/moodboards"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2d5a3d] hover:underline"
        >
          <FaArrowLeft className="text-xs" /> Back to Idea Boards
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#1a1a2e]">{board.name}</h1>
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
              className="mb-3 break-inside-avoid overflow-hidden rounded-xl border border-[#e8e6e1] bg-white"
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
