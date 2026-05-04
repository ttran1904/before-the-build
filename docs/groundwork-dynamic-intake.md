# Groundwork Dynamic Intake — Architecture & Revamp Plan

> Branch: `feat/groundwork-dynamic-intake`
> Status: in progress — context document, not a finished spec.

## 1. Goal

Turn the Groundwork intake from a **mostly-linear questionnaire** into a
**dynamic, by-case decision tree** whose ultimate output is a
**narrow, defensible budget range** for the user''s specific project.

When the user gives a vague answer, the tree should ask a focused
clarifying question instead of moving on.

## 2. What Already Exists (do not rebuild)

### 2.1 Wizard engine — `apps/web/src/components/wizard/`
Already supports a graph of questions:

```ts
interface QuestionNode<V> {
  id: string;
  tab: string;
  question: string;
  helper?: string;
  initial: () => V;
  commit?: (v: V) => void;
  next: (value: V) => string | null;     // ← branching
  render: (props) => ReactNode;
  skip?: () => boolean;                   // ← skip irrelevant nodes
  isValid?: (v: V) => boolean;
  hideNext?: boolean;
  terminal?: boolean;
}
```

`WizardEngine.tsx` walks the graph by id. **No engine changes are
needed** for dynamic flow — the tree definition is the only thing
that is currently linear.

### 2.2 Store — `apps/web/src/lib/groundwork/store.ts`
- `useGroundworkStore` (Zustand, persisted to `localStorage`)
- `GroundworkBathroomState` — flat answer record
- Selectors: `getOpenItems`, `getAssumptions`, `getRealisticCostRange`,
  `projectTypeLabel`

### 2.3 Tree — `apps/web/src/lib/groundwork/bathroom-tree.tsx`
Currently 16 nodes, each `next: () => "<fixed-id>"`. This is what
we are rewriting.

### 2.4 Cost — `apps/web/src/lib/groundwork/cost-breakdown.ts`
`getCostBreakdown(state)` returns line items + subtotal/contingency/
total bands. Used as the explanation for the realistic range.

### 2.5 Server — `supabase/migrations/20260428171742_groundwork_scopes.sql`
- `public.groundwork_scopes` (1:1 with `projects` via unique `project_id`)
- Full state stored in `data jsonb` → schema-free growth
- Mirrored columns (`project_type`, `bathroom_kind`, `budget_tier`,
  `has_content`, `completed_at`) for dashboard filtering
- RLS enabled

### 2.6 Sync — `apps/web/src/lib/groundwork/sync.ts`
Upsert by `project_id`, plus list/load/delete helpers.

## 3. Schema Verdict

**The current Supabase schema is fully adequate for a dynamic-by-case
flow.** Reasoning:

- All answer state lives in `data jsonb`, so adding new question nodes,
  clarifier nodes, or whole new branches requires **zero migrations**.
- The mirrored columns we need to filter the dashboard
  (`project_type`, `bathroom_kind`, `budget_tier`) are already there.
- `has_content` + `completed_at` already let the UI distinguish drafts
  vs finished briefs.
- `unique (project_id)` keeps each project''s scope to a single row,
  matching the product story.

When we would revisit the schema (NOT now, only if these emerge):
- We start needing **server-side budget filtering / sorting** (e.g.
  "show me scopes with estimated low ≥ $25k") → add mirrored
  `estimated_low`, `estimated_high` columns + a backfill.
- We add a **second project type** beyond bathrooms (kitchens, etc.) →
  rename / generalize `bathroom_kind` (additive: new column + backfill,
  keep old until cutover).
- We want **answer-level audit history** → add a
  `groundwork_scope_events` append-only table.

None of these are blockers for the revamp.

## 4. Revamp Plan

### Phase A — Branchable tree skeleton
1. Replace the linear `buildGroundworkBathroomTree` with a
   `case`-style router driven by `projectType` and `bathroomKind`:
   - `cosmetic_refresh` → skip plumbing relocation, skip layout
   - `pull_and_replace` → keep fixtures questions, skip layout/framing
   - `full_gut` → ask all fixtures + permits + waterproofing
   - `layout_change` → add layout-specific questions before fixtures
2. Wire `skip()` for nodes that are irrelevant under the chosen
   `projectType` so a stale answer in the store does not resurface.

### Phase B — Clarifiers
For every "vague" answer, add a `*-clarify` node and route to it from
`next()`. Initial set:

| Trigger                                | Clarifier asks                                  |
|----------------------------------------|--------------------------------------------------|
| any fixture `= "unsure"`               | "Want help deciding? Pick a goal for this item." |
| `walls = "structural"`                 | which walls, load-bearing?                       |
| `walls = "new_tile"` + primary kind    | full height vs wainscot, niche?                  |
| `electrical = "major"`                 | new circuits / panel upgrade / heated floor?     |
| `layout = "wall" \| "full_layout"`     | does plumbing wall move? door wider for ADA?     |
| `showerTub = "replace"` + primary      | tub + separate shower or shower-only?            |
| `budgetTier` < realistic low           | which scope items can we descope?                |

Each clarifier writes to a new key on `GroundworkBathroomState`
(no migration) and feeds into `cost-breakdown.ts`.

### Phase C — Budget tightening pass
- Refactor `getRealisticCostRange` so it **starts wide** from
  `projectType + bathroomKind`, then **multiplies down** as each
  clarifier resolves.
- Surface the live range in the wizard chrome (it is the literal goal
  of the flow — the user should see it narrow as they answer).
- When the user''s chosen `budgetTier` falls outside the live range,
  show the descope clarifier instead of just rendering a warning.

### Phase D — Persistence + dashboard
- Update `groundworkHasContent` to include any new scalar fields.
- Keep `saveGroundworkScope` as-is (the JSON blob absorbs the new
  fields). Only add a new mirrored column + migration if we decide to
  filter on the new field server-side.
- Refresh `import-from-legacy.ts` to map any old key names to new ones
  defensively (do not break existing drafts).

### Phase E — QA
- Manually walk every projectType × bathroomKind combo end-to-end.
- `npm run lint && npm run build:web`.
- Smoke test: load an existing draft from before the revamp and
  confirm it still opens and saves.

## 5. Conventions

- New node ids: kebab-case, suffix `-clarify` for clarifiers.
- New store fields: camelCase, default `null` or `[]`.
- New cost lines: add via `add(category, item, description, low, high)`
  in `cost-breakdown.ts`. No magic numbers outside that file.
- Do not introduce a new project type column without a migration plan
  and a backfill strategy.

## 6. Open Questions (resolve as we go)

- Do we surface the live budget range *during* the wizard, or only at
  the end? (Recommendation: during — it is the whole point.)
- For the descope clarifier, do we let the user *raise* their budget
  tier as an alternative? (Probably yes, as a secondary action.)
- Should clarifier answers be stored under a nested `clarifiers: {}`
  object in the JSON blob, or flat? (Recommendation: flat — simpler
  selectors, JSON absorbs either way.)

## 7. Pointers

- Engine: `apps/web/src/components/wizard/WizardEngine.tsx`
- Tree: `apps/web/src/lib/groundwork/bathroom-tree.tsx`
- Store: `apps/web/src/lib/groundwork/store.ts`
- Cost: `apps/web/src/lib/groundwork/cost-breakdown.ts`
- Sync: `apps/web/src/lib/groundwork/sync.ts`
- Migration: `supabase/migrations/20260428171742_groundwork_scopes.sql`
- Domain knowledge: `BATHROOM_KNOWLEDGE_GRAPH.md`
- Pricing model: `BUDGET_ESTIMATOR_README.md`, `BUDGET_ESTIMATOR_GRAPH.md`
- Agent rules: `.github/instructions/Groundwork Intake.instructions.md`