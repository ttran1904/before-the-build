---
applyTo: "apps/web/src/lib/groundwork/**,apps/web/src/app/dashboard/groundwork/**,apps/web/src/components/wizard/**,supabase/migrations/*groundwork*"
---

# Groundwork Intake Instructions

These rules apply to every change inside the Groundwork intake flow (the
contractor-brief wizard) and the supporting wizard engine.

## What Groundwork Is
Groundwork is the **standalone scope-definition product**. Its only job is
to produce a clear contractor brief and a **realistic budget range**
for one bathroom project. It is intentionally separate from the design
wizard, mood boards, and Build Book.

The intake is a **dynamic decision tree**, not a fixed form. Two users
giving the same first answer should be able to see different follow-up
questions.

## North Star For The Flow
1. **Narrow the budget range with every answer.** Every question should
   measurably tighten `getRealisticCostRange` / `getCostBreakdown`. If a
   question does not change the range or the brief, it does not belong.
2. **Ask clarifying questions at any vague point.** When an answer is
   `"unsure"`, missing photos, or a high-variance choice (e.g.
   `walls = "structural"`, `electrical = "major"`, `layout = "full_layout"`),
   the next node MUST be a focused clarifier — not the next default node.
3. **Skip what is not relevant.** Use `QuestionNode.skip` and per-answer
   `next()` branching to drop questions that the user''s prior answers
   already implied (e.g. a `cosmetic_refresh` should never ask about
   plumbing relocation).
4. **Never block on uncertainty.** `"unsure"` is always a valid answer.
   It routes the user to a clarifier first; if still unsure, it is
   recorded into `getOpenItems` so the contractor can resolve it later.

## Engine Contracts (do not break)
The wizard engine in `apps/web/src/components/wizard/` already supports
dynamic graphs via `QuestionNode`:

- `next: (value) => string | null` — branch by the answer.
- `skip: () => boolean` — read store to decide if the node is irrelevant.
- `terminal: true` — marks the final node (Generate Scope).
- `isValid`, `hideNext` — control button state.

When extending the tree:
- Keep node `id`s **kebab-case** and **stable** (they show up in URLs,
  analytics, and the Supabase `data` blob). Renaming an id is a breaking
  change.
- Always provide `initial()` from the store and `commit()` back to it,
  so refresh / autosave keep working.
- Branching belongs in `next()`, **not** in `render()`.

## Clarifier Pattern
A clarifier is a normal `QuestionNode` whose `id` ends with `-clarify`,
lives in the same `tab` as the question that triggered it, and whose
`next()` rejoins the main path.

Triggers (non-exhaustive — extend as new vague cases appear):
- `*: "unsure"` on any fixture / wall / electrical / layout question
- `walls === "structural"` → ask which walls + load-bearing?
- `electrical === "major"` → ask new circuits / panel upgrade / EV?
- `layout === "wall" | "full_layout"` → ask whether plumbing wall moves
- `projectType === "full_gut"` with `bathroomKind === "primary"` → ask
  about double vanity / separate shower & tub / heated floor
- `budgetTier` clearly below `getRealisticCostRange().low` → ask which
  scope items the user is willing to descope

## Budget Estimator Coupling
- Every new answer field MUST be reflected in `cost-breakdown.ts` either
  as a new `add(...)` line or as a multiplier. Otherwise the question
  has no effect on the range and violates the North Star.
- The realistic range is the **source of truth** shown to the user;
  the breakdown is the explanation. Keep them consistent.
- Do not show a single point estimate. Always a low–high band.

## Data Model Rules
- The single source of truth for an in-progress intake is the
  `useGroundworkStore` Zustand store, persisted to `localStorage` under
  `btb:groundwork:bathroom`.
- The server source of truth is the `groundwork_scopes` row keyed on
  `project_id` (1:1 with `projects`). The full state lives in `data jsonb`.
- **Adding new answer fields requires NO schema migration.** Extend the
  `GroundworkBathroomState` interface, add the node, and the JSON blob
  absorbs it. Old rows simply have the field undefined — handle that
  gracefully in selectors.
- The mirrored columns (`project_type`, `bathroom_kind`, `budget_tier`)
  exist for dashboard filtering only. Update `saveGroundworkScope` if
  you add a new mirrored column (and write an additive migration).
- `has_content` is computed by `groundworkHasContent` — keep it in sync
  when you add fields, otherwise empty drafts pollute the dashboard.

## When Renaming Or Restructuring
- Treat existing `data` blobs as legacy. Add a small reader/migrator in
  `import-from-legacy.ts` rather than dropping fields silently.
- Never rename `groundwork_scopes` columns in place — add new, backfill,
  then remove in a later migration with explicit rollback notes.

## Testing And Verification
- Manually walk every branch you add (each `next()` outcome) before
  committing. The engine has no automated tree coverage today — say so
  in the PR description if a branch was not exercised.
- After changes run: `npm run lint` and `npm run build:web`.

## Anti-patterns
- Linear `next: () => "nextId"` for every node — defeats the purpose of
  the engine.
- Asking the same question twice across tabs.
- Adding cost-irrelevant questions for "completeness".
- Hiding ambiguity instead of clarifying it (e.g. silently treating
  `"unsure"` as `"keep"`).
- Forcing the user to a numeric budget input — keep tiers, then narrow
  with scope answers.

## Reference Documents
- `docs/groundwork-dynamic-intake.md` — current architecture + the plan
  for the dynamic-by-case revamp.
- `BATHROOM_KNOWLEDGE_GRAPH.md` — domain knowledge driving branches.
- `BUDGET_ESTIMATOR_README.md` / `BUDGET_ESTIMATOR_GRAPH.md` — pricing
  model the intake feeds.