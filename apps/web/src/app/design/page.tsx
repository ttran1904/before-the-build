"use client";

import { useState } from "react";

type ViewMode = "2d" | "3d";

export default function DesignPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("2d");

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Room Designer
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("2d")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "2d"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            2D View
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === "3d"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            3D View
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        {/* Main canvas */}
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-400">
              {viewMode === "2d" ? "2D Floor Plan Canvas" : "3D Room View"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {viewMode === "2d"
                ? "Drag & drop furniture onto the floor plan"
                : "Rotate and explore your room in 3D"}
            </p>
          </div>
        </div>

        {/* Side panel — furniture & suggestions */}
        <aside className="w-72 space-y-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Suggestions
          </h2>

          {["Furniture", "Tiles & Flooring", "Wall Colors", "Lighting", "Decor"].map(
            (category) => (
              <button
                key={category}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {category}
                </span>
              </button>
            ),
          )}

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Marketplace
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Browse real furniture and items to add to your design.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
