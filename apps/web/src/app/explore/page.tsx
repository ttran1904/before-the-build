"use client";

import { useState } from "react";
import {
  INSPIRATION_SOURCE_LABELS,
  DESIGN_STYLE_LABELS,
} from "@before-the-build/shared";
import type { InspirationSource, DesignStyle } from "@before-the-build/shared";

export default function ExplorePage() {
  const [activeSource, setActiveSource] = useState<InspirationSource | "all">("all");
  const [search, setSearch] = useState("");

  const sources = Object.entries(INSPIRATION_SOURCE_LABELS) as [InspirationSource, string][];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Explore Inspiration
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Discover ideas from Pinterest, Instagram, Etsy, house tours, and more.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search for inspiration..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
      />

      {/* Source filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSource("all")}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            activeSource === "all"
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          All
        </button>
        {sources.map(([source, label]) => (
          <button
            key={source}
            onClick={() => setActiveSource(source)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              activeSource === source
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 p-20 dark:border-zinc-700">
        <span className="text-5xl">🔍</span>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Discover Ideas
        </h3>
        <p className="max-w-sm text-center text-sm text-zinc-500">
          Search across multiple sources to build your mood board and find the
          perfect aesthetic for your space.
        </p>
      </div>
    </div>
  );
}
