"use client";

import type { AnswerOption } from "./types";

/* ────────────────────────────────────────────────────────────────
 * Havenly-style single-select tile row. Big circular tiles with
 * an icon and a short label. Clicking auto-advances.
 * ──────────────────────────────────────────────────────────────── */
export function TileSelect({
  options,
  value,
  onChange,
  layout,
}: {
  options: AnswerOption[];
  value: string | null;
  onChange: (v: string) => void;
  /** "compact" = label inside the circle (default for short icon-only sets).
   *  "below"   = icon-only circle, bold label (and optional subtitle) below.
   *  When omitted, "below" is used if any option has `desc`. */
  layout?: "compact" | "below";
}) {
  const useBelow = layout ? layout === "below" : options.some((o) => !!o.desc);

  if (useBelow) {
    return (
      <div className="mt-10 flex w-full max-w-5xl flex-wrap justify-center gap-x-6 gap-y-10 px-2">
        {options.map((o) => {
          const Icon = o.icon;
          const selected = value === o.id;
          const disabled = o.disabled;
          return (
            <button
              key={o.id}
              onClick={() => !disabled && onChange(o.id)}
              disabled={disabled}
              aria-disabled={disabled}
              className={`group flex w-32 flex-col items-center text-center transition sm:w-36 ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <span
                className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full border transition ${
                  disabled
                    ? "border-transparent bg-[#f0ede8]"
                    : selected
                    ? "border-[#1a1a2e] bg-[#e8e6e1]"
                    : "border-transparent bg-[#f0ede8] group-hover:bg-[#e8e6e1]"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`text-2xl text-[#3a3a4a] transition ${
                      disabled ? "" : "group-hover:text-[#1a1a2e]"
                    }`}
                  />
                )}
              </span>
              <span className="block w-full px-1 text-center text-sm font-semibold leading-snug text-[#1a1a2e]">
                {o.label}
              </span>
              {o.desc && (
                <span className="mt-1 block w-full px-1 text-center text-xs leading-snug text-[#6a6a7a]">
                  {o.desc}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-12 flex flex-wrap justify-center gap-8">
      {options.map((o) => {
        const Icon = o.icon;
        const selected = value === o.id;
        const disabled = o.disabled;
        return (
          <button
            key={o.id}
            onClick={() => !disabled && onChange(o.id)}
            disabled={disabled}
            aria-disabled={disabled}
            className={`group flex h-32 w-32 flex-col items-center justify-center rounded-full border transition ${
              disabled
                ? "cursor-not-allowed border-transparent bg-[#f0ede8] opacity-50"
                : selected
                ? "border-[#1a1a2e] bg-[#e8e6e1]"
                : "border-transparent bg-[#f0ede8] hover:bg-[#e8e6e1]"
            }`}
          >
            {Icon && (
              <Icon className={`mb-2 text-2xl text-[#3a3a4a] transition ${disabled ? "" : "group-hover:text-[#1a1a2e]"}`} />
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
  onChange,
}: {
  options: AnswerOption[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      {options.map((o) => {
        const selected = value === o.id;
        const disabled = o.disabled;
        return (
          <button
            key={o.id}
            onClick={() => !disabled && onChange(o.id)}
            disabled={disabled}
            aria-disabled={disabled}
            className={`w-72 rounded-md px-6 py-5 text-sm transition ${
              disabled
                ? "cursor-not-allowed bg-[#f0ede8] text-[#1a1a2e] opacity-50"
                : selected
                ? "bg-[#1a1a2e] text-white"
                : "bg-[#f0ede8] text-[#1a1a2e] hover:bg-[#e8e6e1]"
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
        const disabled = o.disabled;
        return (
          <button
            key={o.id}
            onClick={() => !disabled && toggle(o.id)}
            disabled={disabled}
            aria-disabled={disabled}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition ${
              disabled
                ? "cursor-not-allowed border-[#d8d4ca] text-[#3a3a4a] opacity-50"
                : selected
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
 * Single-line free text input (used for short fields like brand,
 * model, link, edge-treatment description, dimensions reveal).
 * Inline label optional. Optional = renderer treats empty as valid.
 * ──────────────────────────────────────────────────────────────── */
export function ShortText({
  value,
  onChange,
  placeholder,
  label,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  inputMode?: "text" | "numeric" | "decimal" | "url";
}) {
  return (
    <div className="mt-8">
      {label && (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#cfcabe] px-4 py-3 text-sm text-[#1a1a2e] outline-none transition focus:border-[#1a1a2e]"
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Two paired short text inputs side-by-side (e.g. width × depth).
 * ──────────────────────────────────────────────────────────────── */
export function DimensionsInput({
  width,
  depth,
  onWidth,
  onDepth,
  unit = '"',
}: {
  width: string;
  depth: string;
  onWidth: (v: string) => void;
  onDepth: (v: string) => void;
  unit?: string;
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
          Width
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={width}
            onChange={(e) => onWidth(e.target.value)}
            placeholder="36"
            className="w-full rounded-md border border-[#cfcabe] px-4 py-3 text-sm text-[#1a1a2e] outline-none transition focus:border-[#1a1a2e]"
          />
          <span className="text-sm text-[#6a6a7a]">{unit}</span>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
          Depth
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={depth}
            onChange={(e) => onDepth(e.target.value)}
            placeholder="60"
            className="w-full rounded-md border border-[#cfcabe] px-4 py-3 text-sm text-[#1a1a2e] outline-none transition focus:border-[#1a1a2e]"
          />
          <span className="text-sm text-[#6a6a7a]">{unit}</span>
        </div>
      </div>
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
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {value.map((src, i) => (
            <div key={i} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`upload-${i}`}
                className="aspect-square w-full rounded-lg object-cover"
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
