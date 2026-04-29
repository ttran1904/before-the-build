"use client";

import {
  FaPaintRoller,
  FaScrewdriverWrench,
  FaHammer,
  FaCompass,
  FaBath,
  FaShower,
  FaToilet,
  FaCrown,
  FaCalendarDays,
  FaClock,
  FaWandMagicSparkles,
  FaWheelchair,
  FaChildReaching,
  FaLeaf,
  FaWrench,
  FaChartLine,
  FaUpRightAndDownLeftFromCenter,
  FaCircleQuestion,
  FaLock,
  FaArrowsRotate,
  FaArrowsUpDownLeftRight,
} from "react-icons/fa6";

import { TileSelect, PillSelect, ChipMulti, LongText, PhotoUpload } from "@/components/wizard/answers";
import type { QuestionNode, WizardTab } from "@/components/wizard/types";
import {
  useGroundworkStore,
  type ProjectType,
  type BathroomKind,
  type Urgency,
  type BudgetTier,
  type FixtureChange,
  type WallChange,
  type ElectricalChange,
  type LayoutChange,
} from "./store";

export const GROUNDWORK_TABS: WizardTab[] = [
  { id: "project", label: "Project" },
  { id: "scope", label: "Scope" },
  { id: "photos", label: "Photos" },
];

/** Build the node list. We capture the store via getState() inside
 *  callbacks so we don't depend on React hooks here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildGroundworkBathroomTree(): QuestionNode<any>[] {
  const get = () => useGroundworkStore.getState();
  const setKey = useGroundworkStore.getState().set;

  /* ── Project tab ───────────────────────────────────────────── */
  const projectType: QuestionNode<ProjectType | null> = {
    id: "project-type",
    tab: "project",
    question: "What best describes your bathroom project?",
    initial: () => get().projectType,
    commit: (v) => v && setKey("projectType", v),
    next: () => "bathroom-kind",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as ProjectType)}
        options={[
          { id: "cosmetic_refresh", label: "Cosmetic Refresh", icon: FaPaintRoller },
          { id: "pull_and_replace", label: "Pull & Replace", icon: FaScrewdriverWrench },
          { id: "full_gut", label: "Full Gut", icon: FaHammer },
          { id: "layout_change", label: "Layout Change", icon: FaCompass },
        ]}
      />
    ),
  };

  const bathroomKind: QuestionNode<BathroomKind | null> = {
    id: "bathroom-kind",
    tab: "project",
    question: "Which bathroom is this?",
    helper: "Size and use influence the realistic cost range.",
    initial: () => get().bathroomKind,
    commit: (v) => v && setKey("bathroomKind", v),
    next: () => "goals",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as BathroomKind)}
        options={[
          { id: "half_bath", label: "Half Bath", icon: FaToilet },
          { id: "three_quarter", label: "3/4 Bath", icon: FaShower },
          { id: "full_bath", label: "Full Bath", icon: FaBath },
          { id: "primary", label: "Primary Suite", icon: FaCrown },
        ]}
      />
    ),
  };

  const goals: QuestionNode<string[]> = {
    id: "goals",
    tab: "project",
    question: "What are your main goals for this project?",
    helper: "Select as many as you'd like.",
    initial: () => get().goals,
    commit: (v) => setKey("goals", v),
    next: () => "urgency",
    isValid: (v) => Array.isArray(v) && v.length > 0,
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        options={[
          { id: "update_style", label: "Update Style", icon: FaPaintRoller },
          { id: "fix_problems", label: "Fix Problems", icon: FaWrench },
          { id: "increase_value", label: "Increase Home Value", icon: FaChartLine },
          { id: "more_space", label: "More Space", icon: FaUpRightAndDownLeftFromCenter },
          { id: "energy_efficient", label: "Energy Efficient", icon: FaLeaf },
          { id: "accessibility", label: "Improve Accessibility", icon: FaWheelchair },
          { id: "family_friendly", label: "Family-Friendly", icon: FaChildReaching },
        ]}
      />
    ),
  };

  const urgency: QuestionNode<Urgency | null> = {
    id: "urgency",
    tab: "project",
    question: "When do you need this done?",
    initial: () => get().urgency,
    commit: (v) => v && setKey("urgency", v),
    next: () => "budget",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as Urgency)}
        options={[
          { id: "asap", label: "ASAP", icon: FaWandMagicSparkles },
          { id: "soonish", label: "Soonish", icon: FaCalendarDays },
          { id: "no_rush", label: "No Rush", icon: FaClock },
        ]}
      />
    ),
  };

  const budget: QuestionNode<BudgetTier | null> = {
    id: "budget",
    tab: "project",
    question: "What's your approximate budget range?",
    helper: "We use this to flag scope that might push past it.",
    initial: () => get().budgetTier,
    commit: (v) => v && setKey("budgetTier", v),
    next: () => "vanity",
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as BudgetTier)}
        options={[
          { id: "above_100k", label: "Above $100,000" },
          { id: "50_to_100k", label: "$50,000 – $100,000" },
          { id: "25_to_50k", label: "$25,000 – $50,000" },
          { id: "10_to_25k", label: "$10,000 – $25,000" },
          { id: "under_10k", label: "Under $10,000" },
        ]}
      />
    ),
  };

  /* ── Scope tab — what's changing ───────────────────────────── */

  const fixtureOptions = [
    { id: "keep", label: "Keep", icon: FaLock },
    { id: "replace", label: "Replace", icon: FaArrowsRotate },
    { id: "relocate", label: "Relocate", icon: FaArrowsUpDownLeftRight },
    { id: "unsure", label: "Unsure", icon: FaCircleQuestion },
  ];

  const fixtureNode = (
    id: string,
    question: string,
    _icon: typeof FaBath,
    storeKey:
      | "vanity"
      | "toilet"
      | "showerTub"
      | "flooring"
      | "lighting",
    nextId: string
  ): QuestionNode<FixtureChange | null> => ({
    id,
    tab: "scope",
    question,
    initial: () => get()[storeKey],
    commit: (v) => v && setKey(storeKey, v),
    next: () => nextId,
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as FixtureChange)}
        options={fixtureOptions}
      />
    ),
  });

  const vanity = fixtureNode("vanity", "What about the vanity?", FaScrewdriverWrench, "vanity", "toilet");
  // ^ id collision with key — fix:
  vanity.id = "vanity";

  const toilet = fixtureNode("toilet", "And the toilet?", FaToilet, "toilet", "shower-tub");
  const showerTub = fixtureNode("shower-tub", "Shower or tub?", FaShower, "showerTub", "flooring");
  const flooring = fixtureNode("flooring", "Flooring?", FaPaintRoller, "flooring", "walls");

  const walls: QuestionNode<WallChange | null> = {
    id: "walls",
    tab: "scope",
    question: "What's happening to the walls?",
    initial: () => get().walls,
    commit: (v) => v && setKey("walls", v),
    next: () => "lighting",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as WallChange)}
        options={[
          { id: "paint_only", label: "Paint Only", icon: FaPaintRoller },
          { id: "new_tile", label: "New Tile", icon: FaScrewdriverWrench },
          { id: "wallpaper", label: "Wallpaper", icon: FaWandMagicSparkles },
          { id: "structural", label: "Structural", icon: FaHammer },
          { id: "unsure", label: "Unsure", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const lighting = fixtureNode("lighting", "Lighting?", FaWandMagicSparkles, "lighting", "electrical");

  const electrical: QuestionNode<ElectricalChange | null> = {
    id: "electrical",
    tab: "scope",
    question: "Any electrical work?",
    helper: "New outlets, switches, fan, or panel changes.",
    initial: () => get().electrical,
    commit: (v) => v && setKey("electrical", v),
    next: () => "layout",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as ElectricalChange)}
        options={[
          { id: "none", label: "None", icon: FaWandMagicSparkles },
          { id: "new_outlets", label: "New Outlets", icon: FaScrewdriverWrench },
          { id: "new_fixtures", label: "New Fixtures", icon: FaPaintRoller },
          { id: "major", label: "Major Work", icon: FaHammer },
          { id: "unsure", label: "Unsure", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const layout: QuestionNode<LayoutChange | null> = {
    id: "layout",
    tab: "scope",
    question: "Are you moving any walls or doors?",
    initial: () => get().layout,
    commit: (v) => v && setKey("layout", v),
    next: () => "photos-current",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as LayoutChange)}
        options={[
          { id: "none", label: "No Changes", icon: FaWandMagicSparkles },
          { id: "door", label: "Door Only", icon: FaScrewdriverWrench },
          { id: "wall", label: "One Wall", icon: FaHammer },
          { id: "full_layout", label: "Full Layout", icon: FaCompass },
          { id: "unsure", label: "Unsure", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  /* ── Photos tab ────────────────────────────────────────────── */

  const photosCurrent: QuestionNode<string[]> = {
    id: "photos-current",
    tab: "photos",
    question: "Upload photos of your current bathroom.",
    helper: "We need every wall and a few angles. You can add more later.",
    initial: () => get().photos,
    commit: (v) => setKey("photos", v),
    next: () => "floor-plan",
    render: ({ value, onChange }) => (
      <PhotoUpload value={value} onChange={onChange} />
    ),
  };

  const floorPlan: QuestionNode<string[]> = {
    id: "floor-plan",
    tab: "photos",
    question: "Upload a floor plan or rough sketch.",
    helper: "A photo of a hand-drawn sketch with rough dimensions is fine.",
    initial: () => get().floorPlan,
    commit: (v) => setKey("floorPlan", v),
    next: () => "notes",
    render: ({ value, onChange }) => (
      <PhotoUpload value={value} onChange={onChange} />
    ),
  };

  const notes: QuestionNode<string> = {
    id: "notes",
    terminal: true,
    tab: "photos",
    question: "Anything else the contractor should know?",
    helper: "Constraints, history, things you've already had quoted — anything.",
    initial: () => get().notes,
    commit: (v) => setKey("notes", v),
    next: () => null,
    render: ({ value, onChange }) => (
      <LongText
        value={value}
        onChange={onChange}
        placeholder="e.g. The exhaust fan was replaced last year and we want to keep it."
      />
    ),
  };

  return [
    projectType,
    bathroomKind,
    goals,
    urgency,
    budget,
    vanity,
    toilet,
    showerTub,
    flooring,
    walls,
    lighting,
    electrical,
    layout,
    photosCurrent,
    floorPlan,
    notes,
  ];
}
