"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBookOpen, FaPlus, FaTrash, FaCheck, FaSpinner } from "react-icons/fa6";
import { loadBuildBooks, deleteBuildBook } from "@/lib/supabase-sync";

interface BuildBookEntry {
  id: string;
  projectId: string;
  name: string;
  updatedAt: string;
  totalCost: number;
  currentStep: number;
  mockupImage?: string;
}

/* Timeline progress milestones based on wizard steps:
   Goal (steps 0-2), Items & Materials (steps 3-4), Visualize (steps 5-6), Done (steps 7-9 complete) */
const MILESTONES = [
  { label: "Goal", minStep: 0 },
  { label: "Items & Materials", minStep: 3 },
  { label: "Visualize", minStep: 5 },
  { label: "Done", minStep: 10 },
];

function ProgressTimeline({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {MILESTONES.map((m, i) => {
        const reached = currentStep >= m.minStep;
        const isLast = i === MILESTONES.length - 1;
        return (
          <div key={m.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] ${reached ? "bg-[#2d5a3d] text-white" : "bg-[#e8e6e1] text-[#9a9aaa]"}`}>
                {reached ? <FaCheck /> : <span>{i + 1}</span>}
              </div>
              <span className={`mt-1 text-[9px] leading-tight ${reached ? "text-[#2d5a3d] font-semibold" : "text-[#9a9aaa]"}`}>
                {m.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 w-4 rounded-full mb-4 ${currentStep > m.minStep ? "bg-[#2d5a3d]" : "bg-[#e8e6e1]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BuildBooksPage() {
  const [buildBooks, setBuildBooks] = useState<BuildBookEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchBooks = useCallback(() => {
    loadBuildBooks()
      .then((books) => {
        setBuildBooks(books);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteBuildBook(id);
    if (ok) {
      setBuildBooks((prev) => prev.filter((b) => b.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Build Books</h1>
          <p className="mt-1 text-sm text-[#6a6a7a]">
            All your renovation build books in one place. Click one to view or edit.
          </p>
        </div>
        <Link
          href="/renovate/bathroom"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
        >
          <FaPlus className="text-xs" /> New Build Book
        </Link>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-2xl text-[#2d5a3d]" />
        </div>
      ) : buildBooks.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-[#d5d3cd] bg-white p-16 text-center">
          <FaBookOpen className="mx-auto text-4xl text-[#d5d3cd]" />
          <h3 className="mt-4 text-lg font-semibold text-[#1a1a2e]">No build books yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6a6a7a]">
            Build books are contractor-ready documents with your designs, budgets, timelines,
            and product selections. Start by exploring ideas and creating your first one!
          </p>
          <Link
            href="/renovate/bathroom"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234a31]"
          >
            <FaPlus className="text-xs" /> Create Your First Build Book
          </Link>
        </div>
      ) : (
        /* Build book cards grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buildBooks.map((book) => (
            <div
              key={book.id}
              className="group relative rounded-2xl border border-[#e8e6e1] bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Thumbnail */}
              <Link href={`/renovate/bathroom`}>
                <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-[#f0ede8]">
                  {book.mockupImage ? (
                    <Image
                      src={book.mockupImage}
                      alt={book.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FaBookOpen className="text-4xl text-[#d5d3cd]" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Delete button */}
              {confirmDeleteId === book.id ? (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-white/95 p-1.5 shadow-lg backdrop-blur-sm border border-red-200">
                  <button
                    onClick={() => handleDelete(book.id)}
                    disabled={deletingId === book.id}
                    className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {deletingId === book.id ? <FaSpinner className="animate-spin text-xs" /> : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-md bg-[#e8e6e1] px-2.5 py-1 text-[10px] font-semibold text-[#4a4a5a] transition hover:bg-[#d5d3cd]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(book.id)}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#9a9aaa] opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Delete build book"
                >
                  <FaTrash className="text-xs" />
                </button>
              )}

              {/* Info */}
              <div className="p-4">
                <Link href={`/renovate/bathroom`}>
                  <h3 className="text-sm font-semibold text-[#1a1a2e] transition hover:text-[#2d5a3d]">
                    {book.name}
                  </h3>
                </Link>
                <p className="mt-0.5 text-xs text-[#9a9aaa]">
                  Updated {new Date(book.updatedAt).toLocaleDateString()}
                  {book.totalCost > 0 && (
                    <> · ${book.totalCost.toLocaleString()}</>
                  )}
                </p>

                {/* Progress timeline */}
                <ProgressTimeline currentStep={book.currentStep} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
