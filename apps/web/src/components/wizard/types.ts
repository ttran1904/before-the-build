import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface WizardTab {
  id: string;
  label: string;
}

export interface AnswerOption {
  id: string;
  label: string;
  desc?: string;
  icon?: IconType;
  /** Optional Tailwind class to override the default icon size, e.g. "text-4xl". */
  iconClass?: string;
  disabled?: boolean;
}

export interface QuestionRenderProps<V = unknown> {
  value: V;
  onChange: (v: V) => void;
  /** Commit + advance in one shot (used by tile/auto-advance answers). */
  onAdvance: (v: V) => void;
}

export interface QuestionNode<V = unknown> {
  id: string;
  /** Top-bar tab id this question belongs to. */
  tab: string;
  /** Big serif question text. */
  question: string;
  /** Optional one-line helper under the question. */
  helper?: string;
  /** Optional info popover shown via a small "i" button next to the question. */
  info?: {
    /** Title for the popover. Defaults to "What is this?". */
    title?: string;
    /** Plain-text explanation (1-3 short sentences). */
    body: string;
    /** Optional image URL (relative to /public). */
    image?: string;
  };
  /** Initial value for the local input from external store. */
  initial: () => V;
  /** Persist the answer to the external store. Called on Next or onAdvance. */
  commit?: (value: V) => void;
  /** Decide the next node id from this answer. Return null to finish the wizard. */
  next: (value: V) => string | null;
  /** Render the answer input. */
  render: (props: QuestionRenderProps<V>) => ReactNode;
  /** If true at navigation time, this node is skipped (engine calls next() with initial()). */
  skip?: () => boolean;
  /** True when the value alone is enough to enable the Next button. */
  isValid?: (value: V) => boolean;
  /** Hide the bottom Next button — the renderer will call onAdvance itself. */
  hideNext?: boolean;
  /** When true, this is the last question — render Generate Scope + loader on advance. */
  terminal?: boolean;
  /** Use a wider main column (max-w-6xl) for this question. */
  wide?: boolean;
  /** Top-align the question area (instead of vertical center) for this question. */
  topAlign?: boolean;
}
