"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  FaPinterest,
  FaLink,
  FaImages,
  FaCloudArrowUp,
  FaSpinner,
  FaCheck,
  FaArrowUpRightFromSquare,
} from "react-icons/fa6";

import { PhotoUpload, ShortText } from "@/components/wizard/answers";
import {
  saveInspirationItem,
  removeInspirationItem,
  type InspirationItemInput,
} from "@/lib/inspiration/supabase";

type Tab = "gallery" | "upload" | "link" | "pinterest";

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  tags: string[];
}

interface PinterestPin {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
}
interface PinterestBoard {
  id: string;
  name: string;
  pinCount: number;
  pins: PinterestPin[];
}

export interface InspirationStepProps {
  /** The Supabase project_id this intake is bound to. May be null on the very
   *  first edit before the project row exists; we fall back to local-only save. */
  projectId: string | null;
  items: InspirationItemInput[];
  onItemsChange: (items: InspirationItemInput[]) => void;
  /** Photos uploaded as inspiration (separate from "current bathroom" photos). */
  photos: string[];
  onPhotosChange: (urls: string[]) => void;
  link: string;
  onLinkChange: (v: string) => void;
}

export function InspirationStep({
  projectId,
  items,
  onItemsChange,
  photos,
  onPhotosChange,
  link,
  onLinkChange,
}: InspirationStepProps) {
  const [tab, setTab] = useState<Tab>("gallery");

  const selectedUrls = useMemo(
    () => new Set(items.map((i) => i.imageUrl)),
    [items],
  );

  const toggleItem = useCallback(
    async (next: InspirationItemInput) => {
      if (selectedUrls.has(next.imageUrl)) {
        const existing = items.find((i) => i.imageUrl === next.imageUrl);
        onItemsChange(items.filter((i) => i.imageUrl !== next.imageUrl));
        if (existing) {
          await removeInspirationItem(projectId, existing);
        }
      } else {
        onItemsChange([...items, next]);
        await saveInspirationItem(projectId, next);
      }
    },
    [items, onItemsChange, projectId, selectedUrls],
  );

  return (
    <div className="mt-6 w-full max-w-5xl">
      <Tabs tab={tab} setTab={setTab} count={items.length} />

      <div className="mt-8">
        {tab === "gallery" && (
          <GalleryTab selectedUrls={selectedUrls} onToggle={toggleItem} />
        )}
        {tab === "upload" && (
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-center text-sm text-[#6a6a7a]">
              Got a screenshot or photo on your phone? Drop it here.
            </p>
            <PhotoUpload value={photos} onChange={onPhotosChange} />
          </div>
        )}
        {tab === "link" && (
          <LinkTab link={link} onLinkChange={onLinkChange} onAdd={toggleItem} />
        )}
        {tab === "pinterest" && (
          <PinterestTab selectedUrls={selectedUrls} onToggle={toggleItem} />
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-10 rounded-2xl border border-[#ece9e3] bg-white px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]">
              Saved to your idea board · {items.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {items.slice(0, 12).map((it) => (
              <div
                key={it.clientId}
                className="relative h-16 w-16 overflow-hidden rounded-md bg-[#f0ede8]"
                title={it.title || it.imageUrl}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- tabs ------------------------- */

function Tabs({ tab, setTab, count }: { tab: Tab; setTab: (t: Tab) => void; count: number }) {
  const items: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "gallery", label: "Browse gallery", icon: FaImages },
    { id: "upload", label: "Upload", icon: FaCloudArrowUp },
    { id: "link", label: "Paste a link", icon: FaLink },
    { id: "pinterest", label: "Pinterest", icon: FaPinterest },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#ece9e3] pb-3">
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-[#1a1a2e] text-white"
                : "text-[#3a3a4a] hover:bg-[#f0ede8]"
            }`}
          >
            <Icon className="text-base" />
            {it.label}
            {it.id === "gallery" && count > 0 && (
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                active ? "bg-white/20 text-white" : "bg-[#e8e6e1] text-[#3a3a4a]"
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------- gallery tab ------------------------- */

function GalleryTab({
  selectedUrls,
  onToggle,
}: {
  selectedUrls: Set<string>;
  onToggle: (item: InspirationItemInput) => void;
}) {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/inspiration?style=all")
      .then((r) => r.json())
      .then((d: { images?: GalleryImage[] }) => {
        if (!cancelled) setImages(d.images ?? []);
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[#6a6a7a]">
        <FaSpinner className="mr-2 animate-spin" /> Loading inspiration…
      </div>
    );
  }
  if (!images || images.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#6a6a7a]">
        We couldn&apos;t pull a gallery right now. Try the other tabs.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-center text-sm text-[#6a6a7a]">
        Tap anything that catches your eye — pick as many as you like.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => {
          const selected = selectedUrls.has(img.url);
          return (
            <button
              key={img.id}
              onClick={() =>
                onToggle({
                  clientId: `gallery_${img.id}`,
                  imageUrl: img.url,
                  source: "google",
                  title: img.title,
                  tags: img.tags,
                })
              }
              className={`group relative aspect-[4/5] overflow-hidden rounded-xl border-2 bg-[#f0ede8] transition ${
                selected
                  ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/40"
                  : "border-transparent hover:border-[#1a1a2e]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.title}
                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                loading="lazy"
              />
              {selected && (
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2d5a3d] text-white shadow">
                  <FaCheck className="text-xs" />
                </span>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5 text-left text-[11px] font-medium text-white">
                {img.title}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------- link tab ------------------------- */

function LinkTab({
  link,
  onLinkChange,
  onAdd,
}: {
  link: string;
  onLinkChange: (v: string) => void;
  onAdd: (item: InspirationItemInput) => void;
}) {
  const [adding, setAdding] = useState(false);

  const detectSource = (url: string): InspirationItemInput["source"] => {
    const u = url.toLowerCase();
    if (u.includes("pinterest.")) return "pinterest";
    if (u.includes("instagram.")) return "instagram";
    if (u.includes("etsy.")) return "etsy";
    if (u.includes("houzz.")) return "magazine";
    return "google";
  };

  const handleAdd = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    setAdding(true);
    onAdd({
      clientId: `link_${Date.now()}`,
      imageUrl: trimmed, // Use URL as both image + source. Best-effort.
      sourceUrl: trimmed,
      source: detectSource(trimmed),
      title: trimmed,
    });
    onLinkChange("");
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-3 text-center text-sm text-[#6a6a7a]">
        Pinterest, Instagram, Houzz, a blog post — paste a URL and we&apos;ll save it.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <ShortText
            value={link}
            onChange={onLinkChange}
            inputMode="url"
            placeholder="https://"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!link.trim() || adding}
          className={`flex items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
            link.trim() && !adding
              ? "bg-[#2d5a3d] text-white hover:bg-[#244a32]"
              : "cursor-not-allowed bg-[#e8e6e1] text-[#9a9aaa]"
          }`}
        >
          <FaArrowUpRightFromSquare className="text-xs" />
          Save
        </button>
      </div>
    </div>
  );
}

/* ------------------------- pinterest tab ------------------------- */

function PinterestTab({
  selectedUrls,
  onToggle,
}: {
  selectedUrls: Set<string>;
  onToggle: (item: InspirationItemInput) => void;
}) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [boards, setBoards] = useState<PinterestBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pinterest/status")
      .then((r) => r.json())
      .then((d: { connected: boolean }) => setConnected(!!d.connected))
      .catch(() => setConnected(false));
  }, []);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pinterest/boards");
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
        setBoards(data.boards || []);
      } else {
        setConnected(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) loadBoards();
  }, [connected, loadBoards]);

  if (connected === null) {
    return (
      <div className="flex h-32 items-center justify-center text-[#6a6a7a]">
        <FaSpinner className="mr-2 animate-spin" /> Checking Pinterest…
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#ece9e3] bg-white p-8 text-center">
        <FaPinterest className="mx-auto text-4xl text-[#e60023]" />
        <h3 className="mt-3 font-serif text-xl text-[#1a1a2e]">Connect Pinterest</h3>
        <p className="mt-2 text-sm text-[#6a6a7a]">
          Pull pins straight from your boards into your idea board. We&apos;ll only
          read your boards and pins — nothing is posted.
        </p>
        <button
          onClick={() => {
            const next = encodeURIComponent(window.location.pathname);
            window.location.href = `/api/pinterest/auth?next=${next}`;
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e60023] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c8001f]"
        >
          <FaPinterest /> Connect Pinterest
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-[#6a6a7a]">
        <FaSpinner className="mr-2 animate-spin" /> Loading your boards…
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#6a6a7a]">
        No boards found on your Pinterest account.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-center text-sm text-[#6a6a7a]">
        Tap a board to expand, then tap individual pins to save them.
      </p>
      <div className="space-y-4">
        {boards.map((b) => {
          const open = openBoardId === b.id;
          return (
            <div key={b.id} className="rounded-2xl border border-[#ece9e3] bg-white">
              <button
                onClick={() => setOpenBoardId(open ? null : b.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {b.pins[0]?.imageUrl && (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[#f0ede8]">
                      <Image src={b.pins[0].imageUrl} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#1a1a2e]">{b.name}</p>
                    <p className="text-xs text-[#6a6a7a]">{b.pinCount} pins</p>
                  </div>
                </div>
                <span className="text-xs text-[#6a6a7a]">{open ? "Hide" : "Browse"}</span>
              </button>
              {open && (
                <div className="grid grid-cols-3 gap-2 border-t border-[#ece9e3] p-4 sm:grid-cols-4 md:grid-cols-6">
                  {b.pins.map((pin) => {
                    const selected = selectedUrls.has(pin.imageUrl);
                    return (
                      <button
                        key={pin.id}
                        onClick={() =>
                          onToggle({
                            clientId: `pinterest_${pin.id}`,
                            imageUrl: pin.imageUrl,
                            sourceUrl: pin.sourceUrl,
                            source: "pinterest",
                            title: pin.title,
                            tags: ["pinterest", b.name.toLowerCase()],
                          })
                        }
                        className={`relative aspect-square overflow-hidden rounded-md border-2 bg-[#f0ede8] transition ${
                          selected ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/40" : "border-transparent hover:border-[#1a1a2e]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pin.imageUrl} alt={pin.title} className="h-full w-full object-cover" loading="lazy" />
                        {selected && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d5a3d] text-white shadow">
                            <FaCheck className="text-[10px]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
