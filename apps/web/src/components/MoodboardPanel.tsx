"use client";

import { useState } from "react";
import Image from "next/image";
import { FaXmark, FaTrash, FaBookmark, FaArrowRight, FaHeart } from "react-icons/fa6";
import { useMoodboardStore } from "@/lib/store";
import Link from "next/link";

interface MoodboardPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function MoodboardPanel({ open, onClose }: MoodboardPanelProps) {
  const { items, removeItem } = useMoodboardStore();

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
            <FaBookmark className="text-[#2d5a3d]" />
            <h2 className="text-lg font-bold text-[#1a1a2e]">My Moodboard</h2>
            <span className="rounded-full bg-[#2d5a3d]/10 px-2 py-0.5 text-xs font-semibold text-[#2d5a3d]">
              {items.length}
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
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FaHeart className="text-4xl text-[#d4956a]" />
              <h3 className="text-base font-semibold text-[#4a4a5a]">
                No saved images yet
              </h3>
              <p className="text-sm text-[#7a7a8a]">
                Click the heart icon on any image to save it to your moodboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-lg">
                  <div className="relative aspect-square">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Saved image"}
                      fill
                      className="object-cover"
                      sizes="180px"
                      unoptimized
                    />
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
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
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#e8e6e1] p-4">
            <Link
              href="/dashboard/projects/new/bathroom"
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
