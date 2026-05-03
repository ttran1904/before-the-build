"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaCircleInfo, FaXmark } from "react-icons/fa6";

interface InfoPopoverProps {
  title?: string;
  body: string;
  image?: string;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
}

export function InfoPopover({
  title = "What is this?",
  body,
  image,
  ariaLabel = "More info",
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        aria-label={ariaLabel}
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[#9a9aaa] transition hover:bg-[#f0ede8] hover:text-[#1a1a2e]"
      >
        <FaCircleInfo className="text-base" />
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-8 z-30 w-72 rounded-2xl border border-[#ece9e3] bg-white p-4 text-left shadow-lg sm:w-80"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-serif text-base text-[#1a1a2e]">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mr-1 -mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-[#9a9aaa] hover:bg-[#f0ede8] hover:text-[#1a1a2e]"
            >
              <FaXmark className="text-sm" />
            </button>
          </div>
          {image && (
            <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#f0ede8]">
              <Image
                src={image}
                alt={title}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm leading-relaxed text-[#4a4a5a]">{body}</p>
        </div>
      )}
    </span>
  );
}
