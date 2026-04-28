"use client";

import {
  FaPaintRoller,
  FaScrewdriverWrench,
  FaHammer,
  FaLeaf,
  FaWandMagicSparkles,
  FaSwatchbook,
  FaImages,
  FaCamera,
  FaCartShopping,
  FaLink,
} from "react-icons/fa6";
import Link from "next/link";

import { TileSelect, ChipMulti, PhotoUpload, LongText } from "@/components/wizard/answers";
import type { QuestionNode, WizardTab } from "@/components/wizard/types";

export const BUILD_BOOK_TABS: WizardTab[] = [
  { id: "style", label: "Style" },
  { id: "items", label: "Items" },
  { id: "visualize", label: "Visualize" },
];

/** Lightweight v1 design intake. Persists nothing yet — answers
 *  are passed downstream to the existing build-book deliverable
 *  page and to existing components (catalogue, moodboard, mockup)
 *  via query params or the existing wizard store in a follow-up.
 *  Today we just collect the high-level direction. */

interface DesignDraft {
  styles: string[];
  inspirationLinks: string;
  photos: string[];
  itemSource: string | null;
}

const draft: DesignDraft = {
  styles: [],
  inspirationLinks: "",
  photos: [],
  itemSource: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildBookBathroomTree(): QuestionNode<any>[] {
  const styles: QuestionNode<string[]> = {
    id: "styles",
    tab: "style",
    question: "Which design styles speak to you?",
    helper: "Select as many as you'd like.",
    initial: () => draft.styles,
    commit: (v) => { draft.styles = v; },
    next: () => "inspiration-links",
    isValid: (v) => Array.isArray(v) && v.length > 0,
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        options={[
          { id: "modern", label: "Modern", icon: FaWandMagicSparkles },
          { id: "minimalist", label: "Minimalist", icon: FaPaintRoller },
          { id: "scandinavian", label: "Scandinavian", icon: FaLeaf },
          { id: "japandi", label: "Japandi", icon: FaSwatchbook },
          { id: "industrial", label: "Industrial", icon: FaHammer },
          { id: "farmhouse", label: "Farmhouse", icon: FaScrewdriverWrench },
          { id: "traditional", label: "Traditional", icon: FaPaintRoller },
          { id: "coastal", label: "Coastal", icon: FaLeaf },
        ]}
      />
    ),
  };

  const inspirationLinks: QuestionNode<string> = {
    id: "inspiration-links",
    tab: "style",
    question: "Share links to designs that align with your vision.",
    helper: "Pinterest, Instagram, blogs — paste anything. Optional.",
    initial: () => draft.inspirationLinks,
    commit: (v) => { draft.inspirationLinks = v; },
    next: () => "item-source",
    render: ({ value, onChange }) => (
      <LongText
        value={value}
        onChange={onChange}
        placeholder="https://..."
      />
    ),
  };

  const itemSource: QuestionNode<string | null> = {
    id: "item-source",
    tab: "items",
    question: "How do you want to find items for your bathroom?",
    helper: "We'll open the right tool for you next.",
    initial: () => draft.itemSource,
    commit: (v) => { draft.itemSource = v; },
    next: () => "photos",
    hideNext: true,
    render: ({ value, onAdvance }) => (
      <TileSelect
        value={value}
        onAdvance={(v) => onAdvance(v)}
        options={[
          { id: "ideas", label: "From My Ideas", icon: FaImages },
          { id: "catalogue", label: "Browse Catalogue", icon: FaSwatchbook },
          { id: "shopping", label: "Paste Shopping Links", icon: FaLink },
        ]}
      />
    ),
  };

  const photos: QuestionNode<string[]> = {
    id: "photos",
    tab: "visualize",
    question: "Upload a photo of your current bathroom.",
    helper: "We use this to render your design over your real space.",
    initial: () => draft.photos,
    commit: (v) => { draft.photos = v; },
    next: () => null,
    render: ({ value, onChange }) => (
      <PhotoUpload value={value} onChange={onChange} />
    ),
  };

  return [styles, inspirationLinks, itemSource, photos];
}

/** Final-screen renderer used when the wizard finishes — kept here
 *  so the page route file stays a thin shell. */
export function BuildBookFinishCard() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-[#ece9e3] bg-white p-8 text-center shadow-sm">
      <FaCamera className="mx-auto mb-4 text-3xl text-[#c08a5a]" />
      <h2 className="font-serif text-2xl text-[#1a1a2e]">Design intake captured</h2>
      <p className="mt-2 text-sm text-[#6a6a7a]">
        Open your Build Book to keep going — moodboard, real-photo mockup, and
        the items checklist live there.
      </p>
      <Link
        href="/build-book"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c08a5a] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a87445]"
      >
        <FaCartShopping /> Open Build Book
      </Link>
    </div>
  );
}
