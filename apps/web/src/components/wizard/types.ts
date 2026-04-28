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
}
