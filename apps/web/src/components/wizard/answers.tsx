"use client";

import type { AnswerOption } from "./types";

/* ────────────────────────────────────────────────────────────────
 * Havenly-style single-select tile row. Big circular tiles with
 * an icon and a short label. Clicking auto-advances.
 * ──────────────────────────────────────────────────────────────── */
export function TileSelect({
  options,
  value,
  onAdvance,
}: {
  options: AnswerOption[];
  value: string | null;
  onAdvance: (v: string) => void;
}) {
  return (
    <div className="mt-12 flex flex-wrap justify-end gap-8">
      {options.map((o) => {
        const Icon = o.icon;
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onAdvance(o.id)}
            className={`group flex h-32 w-32 flex-col items-center justify-center rounded-full border transition ${
              selected
                ? "border-[#1a1a2e] bg-[#f1ede5]"
                : "border-transparent bg-[#f6f3ed] hover:bg-[#ece8df]"
            }`}
          >
            {Icon && (
              <Icon className="mb-2 text-2xl text-[#3a3a4a] transition group-hover:text-[#1a1a2e]" />
            )}
            <span className="px-2 text-center text-xs font-medium leading-tight text-[#3a3a4a]">
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Vertical stack of pill-shaped single-select buttons (used for
 * budget ranges where icons don't help). Auto-advances.
 * ──────────────────────────────────────────────────────────────── */
export function PillSelect({
  options,
  value,
  onAdvance,
}: {
  options: AnswerOption[];
  value: string | null;
  onAdvance: (v: string) => void;
}) {
  return (
    <div className="mt-10 flex flex-col items-end gap-3">
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onAdvance(o.id)}
            className={`w-72 rounded-md px-6 py-5 text-sm transition ${
              selected
                ? "bg-[#1a1a2e] text-white"
                : "bg-[#f3efe7] text-[#3a3a4a] hover:bg-[#e8e3d8]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Multi-select chips (rounded outlined). User taps to toggle, no
 * auto-advance — uses the bottom Next button.
 * ──────────────────────────────────────────────────────────────── */
export function ChipMulti({
  options,
  value,
  onChange,
}: {
  options: AnswerOption[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {options.map((o) => {
        const Icon = o.icon;
        const selected = value.includes(o.id);
        return (
          <button
            key={o.id}
            onClick={() => toggle(o.id)}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition ${
              selected
                ? "border-[#1a1a2e] bg-[#1a1a2e] text-white"
                : "border-[#d8d4ca] text-[#3a3a4a] hover:border-[#1a1a2e]"
            }`}
          >
            {Icon && <Icon className="text-base" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Long-form free text (used for "anything else we should know").
 * ──────────────────────────────────────────────────────────────── */
export function LongText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={6}
      className="mt-8 w-full rounded-md border border-[#cfcabe] px-4 py-3 text-sm text-[#1a1a2e] outline-none transition focus:border-[#1a1a2e]"
    />
  );
}

/* ────────────────────────────────────────────────────────────────
 * File / photo upload list (multi). Stores base64 data URLs.
 * ──────────────────────────────────────────────────────────────── */
export function PhotoUpload({
  value,
  onChange,
  helper,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  helper?: string;
}) {
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const reads = Array.from(files).map(
      (f) =>
        new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(f);
        })
    );
    const next = await Promise.all(reads);
    onChange([...value, ...next]);
  };

  return (
    <div className="mt-8">
      {helper && (
        <p className="mb-3 text-center text-xs text-[#6a6a7a]">{helper}</p>
      )}
      <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-[#cfcabe] px-6 py-10 text-sm text-[#6a6a7a] transition hover:border-[#1a1a2e] hover:text-[#1a1a2e]">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        Drop your image here, or <span className="ml-1 underline">choose files</span> to upload
      </label>
      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {value.map((src, i) => (
            <div key={i} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`upload-${i}`}
                className="h-28 w-full rounded-md object-cover"
              />
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
