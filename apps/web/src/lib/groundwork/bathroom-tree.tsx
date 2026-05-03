"use client";

import {
  FaPaintRoller,
  FaBath,
  FaShower,
  FaToilet,
  FaCrown,
  FaRulerCombined,
  FaCircleQuestion,
  FaLock,
  FaWind,
  FaTemperatureHigh,
  FaPlug,
  FaLightbulb,
  FaDroplet,
  FaSliders,
  FaHandsBubbles,
  FaHouse,
  FaTableCellsLarge,
  FaSquare,
  FaScrewdriverWrench,
  FaHammer,
  FaArrowsRotate,
  FaArrowsUpDownLeftRight,
  FaWandMagicSparkles,
  FaThumbtack,
  FaBorderAll,
  FaFaucet,
  FaFaucetDrip,
  FaSoap,
  FaCheck,
  FaFan,
  FaLocationDot,
  FaHand,
  FaToolbox,
  FaChessBoard,
  FaShield,
  FaPlus,
  FaBan,
} from "react-icons/fa6";

import type { IconBaseProps } from "react-icons";

const FaFaucetDouble = (props: IconBaseProps) => (
  <span
    style={{ display: "inline-flex", alignItems: "center", gap: "0.15em" }}
  >
    <FaFaucet {...props} />
    <FaFaucet {...props} />
  </span>
);

import {
  TileSelect,
  TileMulti,
  PillSelect,
  ChipMulti,
  LongText,
  PhotoUpload,
  ShortText,
  DimensionsInput,
} from "@/components/wizard/answers";
import { InspirationStep } from "@/components/wizard/InspirationStep";
import type { QuestionNode, WizardTab } from "@/components/wizard/types";
import {
  useGroundworkStore,
  type IntentChoice,
  type DemoChoice,
  type PlumbingChoice,
  type ShowerInScope,
  type ShowerUpdate,
  type ShowerSize,
  type DrainLocation,
  type TileHeight,
  type FixtureSetup,
  type FixtureStatus,
  type ShowerGlass,
  type VanityPlan,
  type VanitySize,
  type VanityStatus,
  type ToiletPlan,
  type TileStatus,
  type TileLook,
  type WallTileExtent,
  type ShowerFloorTile,
  type GroutChoice,
  type TileEdgeChoice,
  type ElectricalFan,
  type ElectricalFloor,
  type ElectricalOutlets,
  type PaintChoice,
  type AccessoriesChoice,
  type BathroomKind,
  type ProjectType,
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

/* Binding adapter so the inspiration question (rendered without props from
 * the wizard tree) can read/write the live store. Lives at module scope so
 * it can use hooks. */
function InspirationStepBinding() {
  const projectId = useGroundworkStore((s) => s.projectId);
  const items = useGroundworkStore((s) => s.inspirationItems);
  const photos = useGroundworkStore((s) => s.floorPlan);
  const link = useGroundworkStore((s) => s.inspirationLink);
  const setVal = useGroundworkStore((s) => s.set);
  return (
    <InspirationStep
      projectId={projectId}
      items={items.map((i) => ({
        clientId: i.id,
        imageUrl: i.imageUrl,
        sourceUrl: i.sourceUrl,
        source: i.source,
        title: i.title,
        tags: i.tags,
      }))}
      onItemsChange={(next) =>
        setVal(
          "inspirationItems",
          next.map((i) => ({
            id: i.clientId,
            imageUrl: i.imageUrl,
            sourceUrl: i.sourceUrl ?? undefined,
            source: i.source,
            title: i.title,
            tags: i.tags,
          })),
        )
      }
      photos={photos}
      onPhotosChange={(v) => setVal("floorPlan", v)}
      link={link}
      onLinkChange={(v) => setVal("inspirationLink", v)}
    />
  );
}

/* ── Helpers that derive the legacy roll-up fields from the new
 *    PDF-aligned answers. The summary page + cost-breakdown read the
 *    legacy fields, so we update them whenever a related new answer
 *    is committed. ─────────────────────────────────────────────── */

function deriveProjectType(
  intent: IntentChoice | null,
  demo: DemoChoice | null,
): ProjectType | null {
  if (demo === "full_gut") return "full_gut";
  if (intent === "rethink") return "layout_change";
  if (intent === "refresh") return "cosmetic_refresh";
  if (intent === "replace") return "pull_and_replace";
  if (demo === "cosmetic") return "cosmetic_refresh";
  if (demo === "standard") return "pull_and_replace";
  return null;
}

function deriveLayout(p: PlumbingChoice | null): LayoutChange | null {
  switch (p) {
    case "staying":
      return "none";
    case "sink_might_move":
      return "door";
    case "shower_might_move":
      return "wall";
    case "rethinking":
      return "full_layout";
    case "unsure":
      return "unsure";
    default:
      return null;
  }
}

function deriveShowerTub(
  inScope: ShowerInScope | null,
  update: ShowerUpdate | null,
): FixtureChange | null {
  if (inScope === "no") return "keep";
  if (!update) return null;
  if (update === "unsure") return "unsure";
  if (update === "tub_to_shower" || update === "walkin_curbless")
    return "relocate";
  return "replace";
}

function deriveVanity(p: VanityPlan | null): FixtureChange | null {
  switch (p) {
    case "keep":
      return "keep";
    case "single":
    case "double":
    case "pedestal":
      return "replace";
    case "unsure":
      return "unsure";
    default:
      return null;
  }
}

function deriveToilet(p: ToiletPlan | null): FixtureChange | null {
  switch (p) {
    case "keep":
      return "keep";
    case "owner_supplied":
    case "builder_supplied":
      return "replace";
    case "unsure":
      return "unsure";
    default:
      return null;
  }
}

function deriveWalls(
  extent: WallTileExtent | null,
  paint: PaintChoice | null,
): WallChange | null {
  if (extent && extent !== "unsure") return "new_tile";
  if (paint === "yes") return "paint_only";
  if (paint === "unsure" || extent === "unsure") return "unsure";
  if (paint === "no") return "paint_only";
  return null;
}

function deriveLighting(choices: string[]): FixtureChange | null {
  if (choices.length === 0) return null;
  if (choices.includes("none")) return "keep";
  if (choices.includes("not_sure")) return "unsure";
  return "replace";
}

function deriveElectrical(choices: string[]): ElectricalChange | null {
  if (choices.length === 0) return null;
  if (choices.includes("none")) return "none";
  if (choices.includes("not_sure")) return "unsure";
  const big = choices.filter((c) =>
    ["fan", "heated_floor", "outlets", "fixtures"].includes(c),
  );
  if (big.length >= 3) return "major";
  if (big.includes("outlets")) return "new_outlets";
  if (big.includes("fixtures")) return "new_fixtures";
  return "new_outlets";
}

/* ── Build the node list. Captures the store via getState() inside
 *    callbacks so we don't depend on React hooks here. ────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildGroundworkBathroomTree(): QuestionNode<any>[] {
  const get = () => useGroundworkStore.getState();
  const setKey = useGroundworkStore.getState().set;

  /* ── PART 2: Which room — Screens 02-03 ───────────────────── */

  const room: QuestionNode<"bathroom" | null> = {
    id: "room",
    tab: "project",
    question: "Which room are we working on?",
    helper: "We've built this specifically for bathrooms. More rooms coming soon.",
    initial: () => "bathroom",
    commit: () => {},
    next: () => "bath-type",
    render: ({ value, onAdvance }) => (
      <TileSelect
        value={value}
        onChange={() => onAdvance("bathroom")}
        options={[
          { id: "bathroom", label: "Bathroom", icon: FaBath },
          { id: "kitchen", label: "Kitchen (coming soon)", icon: FaHouse, disabled: true },
          { id: "primary_suite", label: "Primary Suite (coming soon)", icon: FaCrown, disabled: true },
          { id: "laundry", label: "Laundry (coming soon)", icon: FaDroplet, disabled: true },
          { id: "other", label: "Other (coming soon)", icon: FaCircleQuestion, disabled: true },
        ]}
      />
    ),
  };

  const bathType: QuestionNode<BathroomKind | null> = {
    id: "bath-type",
    tab: "project",
    question: "Which bathroom?",
    initial: () => get().bathroomKind,
    commit: (v) => v && setKey("bathroomKind", v),
    next: () => "intent",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as BathroomKind)}
        options={[
          { id: "primary", label: "Primary bath", icon: FaCrown },
          { id: "three_quarter", label: "Hall bath", icon: FaBath },
          { id: "half_bath", label: "Powder room", icon: FaHandsBubbles },
        ]}
      />
    ),
  };

  /* ── PART 3: Project intent + scope — Screens 04-06 ───────── */

  const intent: QuestionNode<IntentChoice | null> = {
    id: "intent",
    tab: "project",
    question: "What feels most true about this project?",
    helper: "Don't overthink it. Go with your gut.",
    initial: () => get().intent,
    commit: (v) => {
      if (!v) return;
      setKey("intent", v);
      const pt = deriveProjectType(v, get().demo);
      if (pt) setKey("projectType", pt);
    },
    next: () => "demo",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as IntentChoice)}
        options={[
          { id: "refresh", label: "Refresh the look", icon: FaPaintRoller },
          { id: "replace", label: "Replace everything", icon: FaArrowsRotate },
          { id: "rethink", label: "Rethink the layout", icon: FaWandMagicSparkles },
          { id: "unsure", label: "Still figuring it out", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const demo: QuestionNode<DemoChoice | null> = {
    id: "demo",
    tab: "project",
    question: "What's being removed?",
    helper: "Your best guess is enough. You can always adjust.",
    initial: () => get().demo,
    commit: (v) => {
      if (!v) return;
      setKey("demo", v);
      const pt = deriveProjectType(get().intent, v);
      if (pt) setKey("projectType", pt);
    },
    next: () => "plumbing",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as DemoChoice)}
        options={[
          { id: "cosmetic", label: "Surfaces only", icon: FaPaintRoller },
          { id: "standard", label: "Tile & fixtures out", icon: FaScrewdriverWrench },
          { id: "full_gut", label: "Full gut", icon: FaHammer },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const plumbing: QuestionNode<PlumbingChoice | null> = {
    id: "plumbing",
    tab: "project",
    question: "Are the big fixtures staying in the same places?",
    helper:
      "Moving plumbing is one of the biggest cost variables in a renovation.",
    initial: () => get().plumbing,
    commit: (v) => {
      if (!v) return;
      setKey("plumbing", v);
      const layout = deriveLayout(v);
      if (layout) setKey("layout", layout);
    },
    next: () => "shower-in-scope",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as PlumbingChoice)}
        options={[
          { id: "staying", label: "Everything stays", icon: FaLock },
          { id: "sink_might_move", label: "Sink might move", icon: FaDroplet },
          { id: "shower_might_move", label: "Shower might move", icon: FaShower },
          { id: "rethinking", label: "Moving lots of things", icon: FaArrowsUpDownLeftRight },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  /* ── PART 4: Shower / tub — Screens 07-14 (skipped if powder) ── */

  const isPowderRoom = () => get().bathroomKind === "half_bath";
  const showerNotInScope = () => get().showerInScope === "no";
  const isCurbless = () => get().showerUpdate === "walkin_curbless";

  const showerInScope: QuestionNode<ShowerInScope | null> = {
    id: "shower-in-scope",
    tab: "scope",
    question: "Is the shower or tub part of this renovation?",
    skip: isPowderRoom,
    initial: () => get().showerInScope,
    commit: (v) => {
      if (!v) return;
      setKey("showerInScope", v);
      const st = deriveShowerTub(v, get().showerUpdate);
      if (st) setKey("showerTub", st);
    },
    next: (v) => (v === "no" ? "vanity-plan" : "shower-update"),
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as ShowerInScope)}
        options={[
          { id: "yes", label: "Yes", icon: FaShower },
          { id: "no", label: "No", icon: FaLock },
        ]}
      />
    ),
  };

  const showerUpdate: QuestionNode<ShowerUpdate | null> = {
    id: "shower-update",
    tab: "scope",
    question: "What kind of update are you making?",
    helper:
      "Curbless showers are gorgeous but require drain confirmation before a builder can give a firm number — we'll flag it if you pick that.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().showerUpdate,
    commit: (v) => {
      if (!v) return;
      setKey("showerUpdate", v);
      const st = deriveShowerTub(get().showerInScope, v);
      if (st) setKey("showerTub", st);
    },
    next: () => "shower-size",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as ShowerUpdate)}
        options={[
          { id: "tub_surround", label: "Keep the tub", icon: FaBath },
          { id: "update_existing", label: "Update what's there", icon: FaShower },
          { id: "tub_to_shower", label: "Tub → shower", icon: FaArrowsRotate },
          { id: "walkin_curbed", label: "Walk-in (curbed)", icon: FaSquare },
          { id: "walkin_curbless", label: "Walk-in (curbless)", icon: FaWandMagicSparkles },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const showerSize: QuestionNode<ShowerSize | null> = {
    id: "shower-size",
    tab: "scope",
    question: "Do you know roughly how big the shower will be?",
    helper: "Approximate is completely fine.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().showerSize,
    commit: (v) => v && setKey("showerSize", v),
    next: (v) => {
      if (v === "known") return "shower-size-dim";
      if (isCurbless()) return "drain-location";
      return "tile-height";
    },
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as ShowerSize)}
        options={[
          { id: "small", label: "Small / standard (around 36\u201d × 36\u201d)" },
          { id: "medium", label: "Medium / common (around 36\u201d × 60\u201d)" },
          { id: "large", label: "Larger (48\u201d or bigger)" },
          { id: "known", label: "I know the dimensions" },
          { id: "unsure", label: "Not sure yet" },
        ]}
      />
    ),
  };

  const showerSizeDim: QuestionNode<{ width: string; depth: string }> = {
    id: "shower-size-dim",
    tab: "scope",
    question: "What are the shower dimensions?",
    helper: "Width × depth in inches.",
    skip: () =>
      isPowderRoom() || showerNotInScope() || get().showerSize !== "known",
    initial: () => ({ width: get().showerWidth, depth: get().showerDepth }),
    commit: ({ width, depth }) => {
      setKey("showerWidth", width);
      setKey("showerDepth", depth);
    },
    next: () => (isCurbless() ? "drain-location" : "tile-height"),
    isValid: (v) => v.width.trim().length > 0 && v.depth.trim().length > 0,
    render: ({ value, onChange }) => (
      <DimensionsInput
        width={value.width}
        depth={value.depth}
        onWidth={(w) => onChange({ ...value, width: w })}
        onDepth={(d) => onChange({ ...value, depth: d })}
      />
    ),
  };

  const drainLocation: QuestionNode<DrainLocation | null> = {
    id: "drain-location",
    tab: "scope",
    question: "Do you know where the drain is right now?",
    helper:
      "For a curbless shower, drain position affects structural scope. It doesn't have to be confirmed today — but it does need to be confirmed before you sign a contract.",
    skip: () => isPowderRoom() || showerNotInScope() || !isCurbless(),
    initial: () => get().drainLocation,
    commit: (v) => v && setKey("drainLocation", v),
    next: () => "tile-height",
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as DrainLocation)}
        options={[
          { id: "staying", label: "Yes — drain is staying in place" },
          { id: "unsure", label: "Not sure — haven't checked yet" },
          { id: "moving", label: "It needs to move" },
        ]}
      />
    ),
  };

  const tileHeight: QuestionNode<TileHeight | null> = {
    id: "tile-height",
    tab: "scope",
    question: "How high is the tile going in the shower?",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().tileHeight,
    commit: (v) => v && setKey("tileHeight", v),
    next: () => "shower-features",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as TileHeight)}
        options={[
          { id: "ceiling", label: "All the way to the ceiling", icon: FaRulerCombined },
          { id: "partway", label: "Partway up (standard height)", icon: FaSquare },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const showerFeatures: QuestionNode<string[]> = {
    id: "shower-features",
    tab: "scope",
    question: "Any built-in features in the shower?",
    helper: "Select everything you're thinking about — even if it's not final.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().showerFeatures,
    commit: (v) => setKey("showerFeatures", v),
    next: () => "fixture-setup",
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        exclusive={["none", "unsure"]}
        options={[
          { id: "niche", label: "Niche (recessed shelf)" },
          { id: "bench", label: "Bench" },
          { id: "multi_niche", label: "Multiple niches or custom shelving" },
          { id: "none", label: "Nothing" },
          { id: "unsure", label: "Not sure yet" },
        ]}
      />
    ),
  };

  const fixtureSetup: QuestionNode<FixtureSetup | null> = {
    id: "fixture-setup",
    tab: "scope",
    question: "What shower fixture setup are you imagining?",
    helper:
      "Think about the experience, not the product. We'll ask about the specific fixture next.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().fixtureSetup,
    commit: (v) => v && setKey("fixtureSetup", v),
    next: () => "fixture-status",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as FixtureSetup)}
        options={[
          { id: "standard", label: "Standard head", icon: FaShower },
          { id: "rain_hand", label: "Rain + hand", icon: FaDroplet },
          { id: "full_system", label: "Full spa system", icon: FaSliders },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const fixtureStatus: QuestionNode<FixtureStatus | null> = {
    id: "fixture-status",
    tab: "scope",
    question: "Have you found a specific fixture yet?",
    helper:
      "Shower fixtures range from $300 to $4,200+ depending on brand. Until a specific model is chosen, every builder is estimating differently.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().fixtureStatus,
    commit: (v) => v && setKey("fixtureStatus", v),
    next: (v) => (v === "selected" ? "fixture-brand" : "shower-glass"),
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as FixtureStatus)}
        options={[
          { id: "selected", label: "Yes — I have a specific fixture in mind" },
          { id: "not_yet", label: "Not yet — still looking" },
        ]}
      />
    ),
  };

  const fixtureBrand: QuestionNode<string> = {
    id: "fixture-brand",
    tab: "scope",
    question: "What fixture do you have in mind?",
    helper: "Optional — brand and model if you know it.",
    skip: () =>
      isPowderRoom() ||
      showerNotInScope() ||
      get().fixtureStatus !== "selected",
    initial: () => get().fixtureBrand,
    commit: (v) => setKey("fixtureBrand", v),
    next: () => "shower-glass",
    render: ({ value, onChange }) => (
      <ShortText
        value={value}
        onChange={onChange}
        label="Brand / model"
        placeholder="e.g. Kohler Artifacts, Moen Gibson"
      />
    ),
  };

  const showerGlass: QuestionNode<ShowerGlass | null> = {
    id: "shower-glass",
    tab: "scope",
    question: "What about a shower enclosure?",
    helper:
      "Glass enclosures are usually contracted separately — but your builder needs to know now whether to include blocking in the walls.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().showerGlass,
    commit: (v) => v && setKey("showerGlass", v),
    next: () => "vanity-plan",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as ShowerGlass)}
        options={[
          { id: "include", label: "Include glass", icon: FaBorderAll },
          { id: "later", label: "Maybe later", icon: FaThumbtack },
          { id: "open", label: "Open shower", icon: FaWind },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  /* ── PART 5: Vanity & sink — Screens 15-17 ────────────────── */

  const vanityPlan: QuestionNode<VanityPlan | null> = {
    id: "vanity-plan",
    tab: "scope",
    question: "What's happening with the vanity?",
    initial: () => get().vanityPlan,
    commit: (v) => {
      if (!v) return;
      setKey("vanityPlan", v);
      const fc = deriveVanity(v);
      if (fc) setKey("vanity", fc);
    },
    next: (v) => (v === "keep" ? "toilet-plan" : "vanity-size"),
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as VanityPlan)}
        options={[
          { id: "keep", label: "Keep existing", icon: FaLock },
          { id: "single", label: "Single vanity", icon: FaFaucet },
          { id: "double", label: "Double vanity", icon: FaFaucetDouble },
          { id: "pedestal", label: "Pedestal sink", icon: FaSoap },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const vanitySize: QuestionNode<VanitySize | null> = {
    id: "vanity-size",
    tab: "scope",
    question: "Do you know the vanity size yet?",
    helper:
      "Your builder sets the plumbing to match the vanity width. Once that's set, changing it is a change order.",
    skip: () => get().vanityPlan === "keep",
    initial: () => get().vanitySize,
    commit: (v) => v && setKey("vanitySize", v),
    next: (v) =>
      v === "known" || v === "roughly" ? "vanity-width" : "vanity-status",
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as VanitySize)}
        options={[
          { id: "known", label: "Yes — I know the width" },
          { id: "roughly", label: "Roughly" },
          { id: "not_yet", label: "Not yet" },
        ]}
      />
    ),
  };

  const vanityWidth: QuestionNode<string> = {
    id: "vanity-width",
    tab: "scope",
    question:
      "About how wide will the vanity be?",
    helper: "Inches. Even an approximation helps.",
    skip: () => {
      const v = get().vanitySize;
      return v !== "known" && v !== "roughly";
    },
    initial: () => get().vanityWidth,
    commit: (v) => setKey("vanityWidth", v),
    next: () => "vanity-status",
    isValid: (v) => v.trim().length > 0,
    render: ({ value, onChange }) => (
      <ShortText
        value={value}
        onChange={onChange}
        label="Width"
        inputMode="decimal"
        placeholder="36"
      />
    ),
  };

  const vanityStatus: QuestionNode<VanityStatus | null> = {
    id: "vanity-status",
    tab: "scope",
    question: "Have you already selected your vanity?",
    helper:
      "Once plumbing rough-in is set, changing the vanity size is a change order. You don't need it picked yet — just confirmed before construction.",
    skip: () => get().vanityPlan === "keep",
    initial: () => get().vanityStatus,
    commit: (v) => v && setKey("vanityStatus", v),
    next: () => "toilet-plan",
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as VanityStatus)}
        options={[
          { id: "selected", label: "Yes — vanity is selected and confirmed" },
          { id: "not_yet", label: "Not yet — still shopping" },
        ]}
      />
    ),
  };

  /* ── PART 6: Toilet — Screen 18 ───────────────────────────── */

  const toiletPlan: QuestionNode<ToiletPlan | null> = {
    id: "toilet-plan",
    tab: "scope",
    question: "What's happening with the toilet?",
    initial: () => get().toiletPlan,
    commit: (v) => {
      if (!v) return;
      setKey("toiletPlan", v);
      const tc = deriveToilet(v);
      if (tc) setKey("toilet", tc);
    },
    next: () => "tile-status",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as ToiletPlan)}
        options={[
          { id: "keep", label: "Keep it", icon: FaLock },
          { id: "owner_supplied", label: "I'll supply it", icon: FaToilet },
          { id: "builder_supplied", label: "Builder supplies", icon: FaScrewdriverWrench },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  /* ── PART 7: Tile & finishes — Screens 19-23 ─────────────── */

  const tileStatus: QuestionNode<TileStatus | null> = {
    id: "tile-status",
    tab: "scope",
    question: "Have you picked your tile yet?",
    helper:
      "Tile format — size and shape — affects labor as much as material cost. A general direction is enough.",
    initial: () => get().tileStatus,
    commit: (v) => v && setKey("tileStatus", v),
    next: (v) => {
      if (v === "know") return "tile-known-text";
      if (v === "kindof") return "tile-direction-text";
      return "tile-look";
    },
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as TileStatus)}
        layout="below"
        options={[
          { id: "know", label: "I know my tile", icon: FaCheck },
          { id: "kindof", label: "I have a direction", icon: FaWandMagicSparkles },
          { id: "not_yet", label: "Not yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const tileKnownText: QuestionNode<string> = {
    id: "tile-known-text",
    tab: "scope",
    question: "Tell us what you know.",
    helper: "e.g. large format matte porcelain, herringbone",
    skip: () => get().tileStatus !== "know",
    initial: () => get().tileKnownText,
    commit: (v) => setKey("tileKnownText", v),
    next: () => "tile-look",
    isValid: (v) => v.trim().length > 0,
    render: ({ value, onChange }) => (
      <LongText
        value={value}
        onChange={onChange}
        placeholder="Describe the tile you have in mind"
      />
    ),
  };

  const tileDirectionText: QuestionNode<string> = {
    id: "tile-direction-text",
    tab: "scope",
    question: "Describe the direction you're leaning.",
    skip: () => get().tileStatus !== "kindof",
    initial: () => get().tileDirectionText,
    commit: (v) => setKey("tileDirectionText", v),
    next: () => "tile-look",
    isValid: (v) => v.trim().length > 0,
    render: ({ value, onChange }) => (
      <LongText
        value={value}
        onChange={onChange}
        placeholder="e.g. warm neutrals, matte, organic textures"
      />
    ),
  };

  const tileLook: QuestionNode<TileLook | null> = {
    id: "tile-look",
    tab: "scope",
    question: "What size of tile are you leaning toward?",
    helper: "Tile size changes how much labor goes into the install. A general direction is plenty.",
    initial: () => get().tileLook,
    commit: (v) => v && setKey("tileLook", v),
    next: () => "wall-tile-extent",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as TileLook)}
        layout="below"
        options={[
          { id: "large", label: "Large tile", desc: "12×24 or bigger", icon: FaSquare, iconClass: "text-4xl" },
          { id: "medium", label: "Medium tile", desc: "around 12×12", icon: FaSquare, iconClass: "text-2xl" },
          { id: "small", label: "Small or mosaic", desc: "under 4×4", icon: FaSquare, iconClass: "text-sm" },
          { id: "patterned", label: "Patterned layout", icon: FaChessBoard },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const wallTileExtent: QuestionNode<WallTileExtent | null> = {
    id: "wall-tile-extent",
    tab: "scope",
    question: "Where do you want tile on the walls?",
    helper:
      'This is one of the most common reasons bids come back at different numbers. Every builder reads "tile throughout" differently.',
    initial: () => get().wallTileExtent,
    commit: (v) => {
      if (!v) return;
      setKey("wallTileExtent", v);
      const w = deriveWalls(v, get().paint);
      if (w) setKey("walls", w);
    },
    next: () => "shower-floor-tile",
    render: ({ value, onChange }) => (
      <TileSelect
        layout="below"
        value={value}
        onChange={(v) => onChange(v as WallTileExtent)}
        options={[
          { id: "shower_only", label: "Shower only", icon: FaShower },
          { id: "shower_vanity", label: "Shower & vanity wall", icon: FaTableCellsLarge },
          { id: "most_partway", label: "Most walls, partway", icon: FaBorderAll },
          { id: "most_full", label: "Most walls, full height", icon: FaRulerCombined },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const showerFloorTile: QuestionNode<ShowerFloorTile | null> = {
    id: "shower-floor-tile",
    tab: "scope",
    question: "Is the shower floor the same tile as the rest of the floor?",
    helper:
      "A different tile in the shower — like a mosaic or accent — affects both material and labor cost.",
    skip: () => isPowderRoom() || showerNotInScope(),
    initial: () => get().showerFloorTile,
    commit: (v) => v && setKey("showerFloorTile", v),
    next: () => "grout",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as ShowerFloorTile)}
        options={[
          { id: "same", label: "Same tile throughout", icon: FaTableCellsLarge },
          { id: "different", label: "Different tile (mosaic, accent)", icon: FaShower },
          { id: "unsure", label: "Not decided yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const grout: QuestionNode<GroutChoice | null> = {
    id: "grout",
    tab: "scope",
    question: "What kind of grout?",
    helper:
      "Standard grout works for most projects. Epoxy is more stain-resistant and costs more.",
    info: {
      title: "What's grout?",
      body: "Grout is the thin material that fills the gaps between tiles. It locks the tiles in place, keeps water from getting behind them, and is one of the first things people notice when a bathroom starts to look dated.",
      image: "/images/help/grout.jpg",
    },
    initial: () => get().grout,
    commit: (v) => v && setKey("grout", v),
    next: () => "tile-edge",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as GroutChoice)}
        layout="below"
        options={[
          { id: "standard", label: "Standard grout", icon: FaHandsBubbles },
          {
            id: "epoxy",
            label: "Epoxy grout",
            desc: "More durable, higher cost",
            icon: FaShield,
          },
          { id: "unsure", label: "Not decided yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const tileEdge: QuestionNode<TileEdgeChoice | null> = {
    id: "tile-edge",
    tab: "scope",
    question: "Tile edge treatment?",
    helper:
      "Where your tile meets paint or another surface. Some builders use a metal strip (Schluter), others a finished tile edge.",
    info: {
      title: "What's a tile edge?",
      body: "It's how the last row of tile is finished where it meets paint, drywall, or another material. The two common options are a thin metal strip (a Schluter trim) or a tile with a polished, rounded edge — both keep the corner clean and protected.",
      image: "/images/help/tile-edge.jpg",
    },
    initial: () => get().tileEdge,
    commit: (v) => v && setKey("tileEdge", v),
    next: (v) => (v === "selected" ? "tile-edge-text" : "lighting"),
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as TileEdgeChoice)}
        layout="below"
        options={[
          { id: "selected", label: "Already selected", icon: FaBorderAll },
          { id: "unsure", label: "Not decided yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const tileEdgeText: QuestionNode<string> = {
    id: "tile-edge-text",
    tab: "scope",
    question: "Describe the tile edge treatment.",
    skip: () => get().tileEdge !== "selected",
    initial: () => get().tileEdgeText,
    commit: (v) => setKey("tileEdgeText", v),
    next: () => "lighting",
    isValid: (v) => v.trim().length > 0,
    render: ({ value, onChange }) => (
      <ShortText
        value={value}
        onChange={onChange}
        placeholder="e.g. brushed-nickel Schluter strip"
      />
    ),
  };

  /* ── PART 8: Lighting & electrical — Screens 24-25D ─────── */

  const lighting: QuestionNode<string[]> = {
    id: "lighting",
    tab: "scope",
    question: "What lighting is changing?",
    initial: () => get().lightingChoices,
    commit: (v) => {
      setKey("lightingChoices", v);
      const lc = deriveLighting(v);
      if (lc) setKey("lighting", lc);
    },
    next: () => "electrical",
    isValid: (v) => v.length > 0,
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        exclusive={["none", "not_sure"]}
        options={[
          { id: "vanity_light", label: "Vanity light", icon: FaLightbulb },
          { id: "shower_recessed", label: "Recessed light in shower", icon: FaLightbulb },
          { id: "both", label: "Both", icon: FaLightbulb },
          { id: "none", label: "Nothing", icon: FaLock },
          { id: "not_sure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const electrical: QuestionNode<string[]> = {
    id: "electrical",
    tab: "scope",
    question: "Any electrical upgrades while you're in there?",
    helper:
      "Select everything that's on the table — even if it's not decided yet. We'll ask one follow-up on anything you select.",
    initial: () => get().electricalUpgrades,
    commit: (v) => {
      setKey("electricalUpgrades", v);
      const ec = deriveElectrical(v);
      if (ec) setKey("electrical", ec);
    },
    next: () => nextElectricalSub("electrical"),
    isValid: (v) => v.length > 0,
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        exclusive={["none", "not_sure"]}
        options={[
          { id: "fan", label: "New exhaust fan", icon: FaWind },
          { id: "heated_floor", label: "Heated floor", icon: FaTemperatureHigh },
          { id: "outlets", label: "New outlets", icon: FaPlug },
          { id: "fixtures", label: "New or updated light fixtures (beyond vanity & shower)", icon: FaLightbulb },
          { id: "none", label: "Nothing", icon: FaLock },
          { id: "not_sure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  // The follow-up screens (25A-25D) are conditional and ordered:
  // fan → heated floor → outlets → fixtures → paint
  function nextElectricalSub(after: string): string {
    const order: Array<[string, string]> = [
      ["fan", "electrical-fan"],
      ["heated_floor", "electrical-floor"],
      ["outlets", "electrical-outlets"],
      ["fixtures", "electrical-fixtures"],
    ];
    const upgrades = get().electricalUpgrades;
    const skipAll = upgrades.includes("none") || upgrades.length === 0;
    if (skipAll) return "paint";
    const startIdx = (() => {
      switch (after) {
        case "electrical":
          return 0;
        case "electrical-fan":
          return 1;
        case "electrical-floor":
          return 2;
        case "electrical-outlets":
          return 3;
        case "electrical-fixtures":
          return 4;
        default:
          return 4;
      }
    })();
    for (let i = startIdx; i < order.length; i++) {
      const [key, id] = order[i];
      if (upgrades.includes(key)) return id;
    }
    return "paint";
  }

  const electricalFan: QuestionNode<ElectricalFan[]> = {
    id: "electrical-fan",
    tab: "scope",
    question: "What's happening with the exhaust fan?",
    helper:
      "Pick everything that applies. A new duct run or a new spot is a different scope item — and a different cost.",
    skip: () => !get().electricalUpgrades.includes("fan"),
    initial: () => get().electricalFan,
    commit: (v) => setKey("electricalFan", v),
    next: () => nextElectricalSub("electrical-fan"),
    isValid: (v) => v.length > 0,
    render: ({ value, onChange }) => (
      <TileMulti
        value={value}
        onChange={(v) => onChange(v as ElectricalFan[])}
        exclusive={["none", "unsure"]}
        options={[
          { id: "simple_swap", label: "New fan, same spot", icon: FaArrowsRotate },
          { id: "new_duct", label: "New duct, same spot", icon: FaWind },
          { id: "new_location", label: "Move to a new spot", icon: FaLocationDot },
          { id: "new_install", label: "Brand-new install", desc: "No fan there today", icon: FaPlus },
          { id: "none", label: "Nothing", icon: FaBan },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const electricalFloor: QuestionNode<ElectricalFloor | null> = {
    id: "electrical-floor",
    tab: "scope",
    question: "Is heated floor confirmed or still being considered?",
    helper:
      "Heated floor has to be wired before the subfloor goes down. Once electrical rough-in is done, adding it later means tearing things back up.",
    skip: () => !get().electricalUpgrades.includes("heated_floor"),
    initial: () => get().electricalFloor,
    commit: (v) => v && setKey("electricalFloor", v),
    next: () => nextElectricalSub("electrical-floor"),
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as ElectricalFloor)}
        options={[
          { id: "confirmed", label: "Confirmed — include it in scope" },
          { id: "considering", label: "Still considering — flag it for me" },
        ]}
      />
    ),
  };

  const electricalOutlets: QuestionNode<ElectricalOutlets | null> = {
    id: "electrical-outlets",
    tab: "scope",
    question: "What kind of outlet work?",
    helper:
      "GFCI outlets are the safety outlets required near water. Adding brand new outlets where there aren't any is a different scope item.",
    skip: () => !get().electricalUpgrades.includes("outlets"),
    initial: () => get().electricalOutlets,
    commit: (v) => v && setKey("electricalOutlets", v),
    next: () => nextElectricalSub("electrical-outlets"),
    render: ({ value, onChange }) => (
      <PillSelect
        value={value}
        onChange={(v) => onChange(v as ElectricalOutlets)}
        options={[
          { id: "add_new", label: "Adding outlets where there aren't any currently" },
          { id: "gfci_update", label: "Updating existing outlets to GFCI" },
          { id: "both", label: "Both" },
          { id: "unsure", label: "Not sure — want the builder to assess" },
        ]}
      />
    ),
  };

  const electricalFixtures: QuestionNode<string[]> = {
    id: "electrical-fixtures",
    tab: "scope",
    question: "Which fixtures are being added or replaced?",
    helper:
      "Select all that apply. Vanity light and shower light were already covered — this is anything beyond those.",
    skip: () => !get().electricalUpgrades.includes("fixtures"),
    initial: () => get().electricalFixtures,
    commit: (v) => setKey("electricalFixtures", v),
    next: (v) =>
      v.includes("other")
        ? "electrical-fixtures-other"
        : nextElectricalSub("electrical-fixtures"),
    isValid: (v) => v.length > 0,
    render: ({ value, onChange }) => (
      <ChipMulti
        value={value}
        onChange={onChange}
        exclusive={["not_sure"]}
        options={[
          { id: "recessed_main", label: "Recessed lights in the main bathroom (outside the shower)", icon: FaLightbulb },
          { id: "sconces", label: "Sconces", icon: FaLightbulb },
          { id: "other", label: "Other", icon: FaSliders },
          { id: "not_sure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const electricalFixturesOther: QuestionNode<string> = {
    id: "electrical-fixtures-other",
    tab: "scope",
    question: "Describe the other fixture(s).",
    skip: () => !get().electricalFixtures.includes("other"),
    initial: () => get().electricalFixturesOther,
    commit: (v) => setKey("electricalFixturesOther", v),
    next: () => nextElectricalSub("electrical-fixtures"),
    isValid: (v) => v.trim().length > 0,
    render: ({ value, onChange }) => (
      <ShortText
        value={value}
        onChange={onChange}
        placeholder="e.g. statement pendant over the tub"
      />
    ),
  };

  /* ── PART 9: Paint & accessories — Screens 26-27 ───────── */

  const paint: QuestionNode<PaintChoice | null> = {
    id: "paint",
    tab: "scope",
    question: "Is painting part of this renovation?",
    initial: () => get().paint,
    commit: (v) => {
      if (!v) return;
      setKey("paint", v);
      const w = deriveWalls(get().wallTileExtent, v);
      if (w) setKey("walls", w);
    },
    next: () => "accessories",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as PaintChoice)}
        options={[
          { id: "yes", label: "Yes", icon: FaPaintRoller },
          { id: "no", label: "No", icon: FaLock },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  const accessories: QuestionNode<AccessoriesChoice | null> = {
    id: "accessories",
    tab: "scope",
    question: "What about mirrors, towel bars, and hooks?",
    initial: () => get().accessories,
    commit: (v) => v && setKey("accessories", v),
    next: () => "photos-current",
    render: ({ value, onChange }) => (
      <TileSelect
        value={value}
        onChange={(v) => onChange(v as AccessoriesChoice)}
        layout="below"
        options={[
          { id: "self", label: "I'll handle them", icon: FaHand },
          { id: "builder", label: "Builder installs", icon: FaToolbox },
          { id: "unsure", label: "Not sure yet", icon: FaCircleQuestion },
        ]}
      />
    ),
  };

  /* ── PART 10: Current state + inspiration — Screens 28-29 ── */

  const photosCurrent: QuestionNode<string[]> = {
    id: "photos-current",
    tab: "photos",
    question: "Got photos of the current bathroom?",
    helper:
      "Totally optional. If you have them handy, they're helpful context — but don't let this slow you down.",
    initial: () => get().photos,
    commit: (v) => setKey("photos", v),
    next: () => "inspiration",
    render: ({ value, onChange }) => (
      <PhotoUpload value={value} onChange={onChange} />
    ),
  };

  const inspiration: QuestionNode<null> = {
    id: "inspiration",
    tab: "photos",
    question: "Anything you've been drawn to?",
    wide: true,
    topAlign: true,
    initial: () => null,
    isValid: () => true,
    commit: () => {},
    next: () => "notes",
    render: () => <InspirationStepBinding />,
  };

  const notes: QuestionNode<string> = {
    id: "notes",
    terminal: true,
    tab: "photos",
    question: "Anything else we should know?",
    helper:
      "Constraints, history, things you've already had quoted — anything that helps your builder.",
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
    room,
    bathType,
    intent,
    demo,
    plumbing,
    showerInScope,
    showerUpdate,
    showerSize,
    showerSizeDim,
    drainLocation,
    tileHeight,
    showerFeatures,
    fixtureSetup,
    fixtureStatus,
    fixtureBrand,
    showerGlass,
    vanityPlan,
    vanitySize,
    vanityWidth,
    vanityStatus,
    toiletPlan,
    tileStatus,
    tileKnownText,
    tileDirectionText,
    tileLook,
    wallTileExtent,
    showerFloorTile,
    grout,
    tileEdge,
    tileEdgeText,
    lighting,
    electrical,
    electricalFan,
    electricalFloor,
    electricalOutlets,
    electricalFixtures,
    electricalFixturesOther,
    paint,
    accessories,
    photosCurrent,
    inspiration,
    notes,
  ];
}
