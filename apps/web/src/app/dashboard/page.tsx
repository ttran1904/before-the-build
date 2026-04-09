"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBookOpen, FaCompass, FaTableCellsLarge, FaPlus, FaPinterest } from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";

export default function DashboardPage() {
  const boards = useMoodboardStore((s) => s.boards);
  const items = useMoodboardStore((s) => s.items);
  const getBoardItems = useMoodboardStore((s) => s.getBoardItems);

  // Boards sorted by newest first
  const sortedBoards = [...boards]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  // Items not assigned to any board
  const unsortedItems = items.filter((i) => i.boardIds.length === 0);
  const hasAnyBoardData = boards.length > 0 || items.length > 0;

  // Pinterest connection check
  const [pinterestConnected, setPinterestConnected] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/pinterest/status").then((r) => r.json()).then((d) => {
      setPinterestConnected(d.connected);
    }).catch(() => setPinterestConnected(false));
  }, []);

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Build Books</h2>
          <Link href="/dashboard/build-books" className="text-sm font-medium text-[#2d5a3d] hover:underline">
            View All →
          </Link>
        </div>
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-8 text-center">
          <FaBookOpen className="mx-auto text-3xl text-[#d5d3cd]" />
          <p className="mt-3 text-sm text-[#9a9aaa]">No build books yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a31]"
          >
            <FaPlus className="text-xs" /> Start Your First Build Book
          </Link>
        </div>
      </div>

      {/* Pinterest Connect Banner */}
      {pinterestConnected === false && (
        <div className="flex items-center gap-4 rounded-xl border border-[#e8e6e1] bg-white p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E60023]/10">
            <FaPinterest className="text-xl text-[#E60023]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#1a1a2e]">Import ideas from Pinterest</p>
            <p className="mt-0.5 text-sm text-[#6a6a7a]">
              Connect your Pinterest account to bring in your saved boards and pins.
            </p>
          </div>
          <a
            href="/api/pinterest/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-[#E60023] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ad081b]"
          >
            <FaPinterest className="text-sm" /> Connect Pinterest
          </a>
        </div>
      )}

      {/* Idea Boards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Idea Boards</h2>
          <Link href="/dashboard/moodboards" className="text-sm font-medium text-[#2d5a3d] hover:underline">
            View All →
          </Link>
        </div>

        {hasAnyBoardData ? (
          <div className="space-y-5">
            {sortedBoards.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedBoards.map((board) => {
                  const boardItems = getBoardItems(board.id);
                  const preview = boardItems.slice(0, 3);
                  return (
                    <Link
                      key={board.id}
                      href={`/dashboard/moodboards/${board.id}`}
                      className="group overflow-hidden rounded-xl border border-[#e8e6e1] bg-white transition hover:border-[#d5d3cd] hover:shadow-md"
                    >
                      <BoardCollage images={preview} />
                      <div className="p-3.5">
                        <p className="font-semibold text-[#1a1a2e] group-hover:text-[#2d5a3d]">
                          {board.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#9a9aaa]">
                          {boardItems.length} idea{boardItems.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
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
    </div>
  );
}

/* Pinterest-style 3-image collage: 1 large left, 2 stacked right */
function BoardCollage({ images }: { images: { id: string; imageUrl: string; title?: string }[] }) {
  if (images.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center bg-[#f0ede8]">
        <FaTableCellsLarge className="text-3xl text-[#d5d3cd]" />
      </div>
    );
  }
  if (images.length === 1) {
    return (
      <div className="relative h-48 bg-[#f0ede8]">
        <Image src={images[0].imageUrl} alt={images[0].title || ""} fill className="object-cover" sizes="360px" unoptimized />
      </div>
    );
  }
  if (images.length === 2) {
    return (
      <div className="grid h-48 grid-cols-2 gap-0.5 bg-[#f0ede8]">
        {images.map((img) => (
          <div key={img.id} className="relative overflow-hidden">
            <Image src={img.imageUrl} alt={img.title || ""} fill className="object-cover" sizes="180px" unoptimized />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-48 grid-cols-[1.2fr_1fr] gap-0.5 bg-[#f0ede8]">
      <div className="relative row-span-2 overflow-hidden">
        <Image src={images[0].imageUrl} alt={images[0].title || ""} fill className="object-cover" sizes="220px" unoptimized />
      </div>
      <div className="relative overflow-hidden">
        <Image src={images[1].imageUrl} alt={images[1].title || ""} fill className="object-cover" sizes="140px" unoptimized />
      </div>
      <div className="relative overflow-hidden">
        <Image src={images[2].imageUrl} alt={images[2].title || ""} fill className="object-cover" sizes="140px" unoptimized />
      </div>
    </div>
  );
}
