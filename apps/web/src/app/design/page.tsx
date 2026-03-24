"use client";

import { useState } from "react";

type ViewMode = "2d" | "3d";

export default function DesignPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("2d");

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1a1a2e]">
          Room Designer
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("2d")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "2d"
                ? "bg-[#2d5a3d] text-white"
                : "bg-[#f3f2ef] text-[#4a4a5a] hover:bg-[#e8e6e1]"
            }`}
          >
            2D View
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "3d"
                ? "bg-[#2d5a3d] text-white"
                : "bg-[#f3f2ef] text-[#4a4a5a] hover:bg-[#e8e6e1]"
            }`}
          >
            3D View
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        {/* Main canvas */}
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#e8e6e1] bg-white">
          <div className="text-center">
            <p className="text-lg font-semibold text-[#9a9aaa]">
              {viewMode === "2d" ? "2D Floor Plan Canvas" : "3D Room View"}
            </p>
            <p className="mt-1 text-sm text-[#9a9aaa]">
              {viewMode === "2d"
                ? "Drag & drop furniture onto the floor plan"
                : "Rotate and explore your room in 3D"}
            </p>
          </div>
        </div>

        {/* Side panel — furniture & suggestions */}
        <aside className="w-72 space-y-4 overflow-y-auto rounded-2xl border border-[#e8e6e1] bg-white p-4">
          <h2 className="font-semibold text-[#1a1a2e]">
            Suggestions
          </h2>

          {["Furniture", "Tiles & Flooring", "Wall Colors", "Lighting", "Decor"].map(
            (category) => (
              <button
                key={category}
                className="flex w-full items-center gap-3 rounded-xl border border-[#e8e6e1] p-3 text-left transition hover:bg-[#f8f7f4]"
              >
                <div className="h-12 w-12 rounded-lg bg-[#f3f2ef]" />
                <span className="text-sm font-medium text-[#4a4a5a]">
                  {category}
                </span>
              </button>
            ),
          )}

          <div className="border-t border-[#e8e6e1] pt-4">
            <h2 className="font-semibold text-[#1a1a2e]">
              Marketplace
            </h2>
            <p className="mt-1 text-xs text-[#6a6a7a]">
              Browse real furniture and items to add to your design.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
