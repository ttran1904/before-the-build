# Budget Estimator Model — Visual Guide

## Overview

The budget estimator is a **deterministic DAG (Directed Acyclic Graph)** that computes bathroom renovation cost estimates using lookup tables — no LLM required for the core calculation. An optional LLM engine can provide a second opinion.

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Inputs["🏠 User Inputs"]
        RS[Room Size<br/>half-bath / three-quarter / full-bath / primary]
        SC[Scope<br/>cosmetic / partial / full / addition]
        MH[Must-Haves<br/>e.g. New tile, Vanity, Shower]
        NH[Nice-to-Haves<br/>e.g. Heated floors, LED mirror]
        CB[Customer Budget<br/>self-reported dollar amount]
        MB[Moodboard Selections<br/>real product prices]
    end

    subgraph Engine["⚙️ Budget Computation Graph"]
        N1[Node 1<br/>Base Cost Lookup]
        N2[Node 2<br/>Scope Multiplier]
        N3[Node 3<br/>Per-Item Costs]
        N3B[Node 3b<br/>Price Overrides]
        N4[Node 4<br/>Category Breakdown]
        N5[Node 5<br/>Budget Warning]
    end

    subgraph Outputs["📊 Results"]
        EL[Estimated Low]
        EH[Estimated High]
        EM[Estimated Mid]
        IB[Item Breakdown<br/>per-item material + labor]
        CAT[Category Breakdown<br/>Materials / Labor / Permits / Contingency / Design]
        BW[Budget Warning<br/>over/under/in-range]
        RAT[Rationale<br/>2-3 sentence explanation]
    end

    RS --> N1
    SC --> N2
    MH --> N3
    NH --> N3
    MB --> N3B
    N1 --> N4
    N2 --> N4
    N3 --> N3B
    N3B --> N4
    N4 --> N5
    CB --> N5

    N4 --> EL
    N4 --> EH
    N4 --> EM
    N3B --> IB
    N4 --> CAT
    N5 --> BW
    N4 --> RAT
```

---

## 2. The 5-Node Computation Graph

```mermaid
flowchart LR
    subgraph N1["Node 1: Base Cost"]
        direction TB
        N1A["Room Size → Base Range"]
        N1B["half-bath: $3k–$8k<br/>three-quarter: $6k–$15k<br/>full-bath: $10k–$25k<br/>primary: $18k–$45k"]
    end

    subgraph N2["Node 2: Scope Multiplier"]
        direction TB
        N2A["Scope → Multiplier"]
        N2B["cosmetic: ×0.35<br/>partial: ×0.65<br/>full: ×1.0<br/>addition: ×1.6"]
    end

    subgraph MERGE["Scaled Base"]
        M1["baseLow × multiplier<br/>baseHigh × multiplier"]
    end

    N1 --> MERGE
    N2 --> MERGE

    subgraph N3["Node 3: Item Costs"]
        direction TB
        N3A["Must-Haves + Nice-to-Haves"]
        N3B2["Sum per-item installed costs<br/>from 23-item catalog"]
    end

    subgraph N4["Node 4: Category Aggregation"]
        direction TB
        N4A["construction = base + items"]
        N4B["+ Permits 5%<br/>+ Contingency 10%<br/>+ Design 5%"]
        N4C["→ estimatedLow / High / Mid<br/>rounded to $100"]
    end

    MERGE --> N4
    N3 --> N4

    subgraph N5["Node 5: Budget Check"]
        direction TB
        N5A["Compare customer budget<br/>vs estimated range"]
        N5B["Below → ⚠️ Warning<br/>Above → 💡 Suggestion<br/>In range → ✅ OK"]
    end

    N4 --> N5
```

---

## 3. Item Cost Catalog (23 Items)

Each item has an **installed cost range** and a **material:labor split ratio**.

```mermaid
graph LR
    subgraph Fixtures["Fixtures"]
        A["🚿 Walk-in shower<br/>$2,500–$6,000<br/>45% mat / 55% labor"]
        B["🛁 Freestanding tub<br/>$1,500–$5,000<br/>60% mat / 40% labor"]
        C["🚽 Toilet<br/>$400–$1,500<br/>55% mat / 45% labor"]
        D["🚰 Single vanity<br/>$800–$2,500<br/>55% mat / 45% labor"]
        E["🚰🚰 Double vanity<br/>$1,500–$4,500<br/>55% mat / 45% labor"]
    end

    subgraph Surfaces["Surfaces"]
        F["🔲 New tile floor<br/>$1,200–$3,500<br/>45% mat / 55% labor"]
        G["🧱 New tile walls<br/>$1,500–$4,000<br/>45% mat / 55% labor"]
        H["🪨 Countertop<br/>$600–$2,500<br/>55% mat / 45% labor"]
    end

    subgraph Mechanical["Mechanical"]
        I["🔧 Plumbing rough-in<br/>$1,200–$3,500<br/>25% mat / 75% labor"]
        J["⚡ Electrical upgrade<br/>$800–$2,500<br/>30% mat / 70% labor"]
        K["🌬️ Exhaust fan<br/>$600–$1,800<br/>50% mat / 50% labor"]
    end

    subgraph Upgrades["Upgrades & Accents"]
        L["🪞 LED mirror<br/>$300–$1,200<br/>65% mat / 35% labor"]
        M["🔥 Heated floors<br/>$1,000–$3,000<br/>45% mat / 55% labor"]
        N["🚿 Frameless glass door<br/>$800–$2,500<br/>55% mat / 45% labor"]
        O["💡 Lighting<br/>$300–$1,200<br/>55% mat / 45% labor"]
    end
```

---

## 4. Moodboard Price Override Flow

When a user picks a **real product** from the moodboard, the estimated range for that item is replaced with the actual price.

```mermaid
sequenceDiagram
    participant User
    participant Moodboard
    participant Store as Zustand Store
    participant Graph as Budget Graph

    User->>Moodboard: Selects "Porcelain Tile @ $4.50/sqft"
    Moodboard->>Store: setPriceOverride({<br/>  itemLabel: "New tile (floor)",<br/>  materialCost: $1,260,<br/>  laborCost: $1,540<br/>})
    Store->>Graph: computeBudgetGraph(input)
    
    Note over Graph: Before override:<br/>New tile (floor): $1,200–$3,500
    Note over Graph: After override:<br/>New tile (floor): $2,800 (fixed)
    
    Graph->>Store: Updated BudgetGraphResult
    Store->>User: Budget sidebar updates instantly<br/>(no API call needed)
```

---

## 5. Category Breakdown Calculation

```mermaid
graph TB
    subgraph ItemLevel["Per-Item Aggregation"]
        I1["Item 1: mat=$540, labor=$660"]
        I2["Item 2: mat=$440, labor=$360"]
        I3["Item 3: mat=$1,125, labor=$1,375"]
        SUM["materialTotal = Σ mat<br/>laborTotal = Σ labor"]
    end

    I1 --> SUM
    I2 --> SUM
    I3 --> SUM

    subgraph Construction["Construction Subtotal"]
        CS["constructionLow = materialLow + laborLow<br/>constructionHigh = materialHigh + laborHigh"]
    end

    SUM --> CS

    subgraph Categories["5 Budget Categories"]
        C1["📦 Materials: 45%<br/>(item materials + 30% overhead)"]
        C2["👷 Labor: 35%<br/>(item labor + 70% overhead)"]
        C3["📋 Permits & Fees: 5%<br/>(construction × 0.05)"]
        C4["🛡️ Contingency: 10%<br/>(construction × 0.10)"]
        C5["📐 Design & Planning: 5%<br/>(construction × 0.05)"]
    end

    CS --> C1
    CS --> C2
    CS --> C3
    CS --> C4
    CS --> C5

    subgraph Final["Final Estimate"]
        FE["estimatedLow = round100(construction + permits + contingency + design)<br/>estimatedHigh = round100(construction + permits + contingency + design)<br/>estimatedMid = (low + high) / 2"]
    end

    C1 --> FE
    C2 --> FE
    C3 --> FE
    C4 --> FE
    C5 --> FE
```

---

## 6. Dual Engine Strategy

```mermaid
graph TD
    API["POST /api/ai/budget-estimate"]
    
    API --> LLM["LLM Engine<br/>(Claude Sonnet)"]
    API --> DET["Deterministic Engine<br/>(Lookup Tables)"]
    
    LLM -->|"Success"| RESULT["Return LLM estimate"]
    LLM -->|"Failure / No API key"| FALLBACK["Fallback"]
    FALLBACK --> DET
    DET --> RESULT2["Return deterministic estimate"]
    
    subgraph LLM_Detail["LLM Engine Details"]
        direction TB
        P["Bathroom renovation prompt<br/>with 20+ years expertise context"]
        C["Calls Claude Sonnet API"]
        R["Returns independent estimate<br/>with rationale"]
    end

    subgraph DET_Detail["Deterministic Engine Details"]
        direction TB
        D1["Base cost table lookup"]
        D2["Scope multiplier"]
        D3["Item cost catalog (23 items)"]
        D4["Category % allocation"]
        D5["Returns instant, no API needed"]
    end
```

---

## 7. Worked Example

**Input:** Full bathroom, full scope, 3 must-haves + 1 nice-to-have, $20k budget

```mermaid
graph TB
    subgraph Input["Input"]
        A["roomSize: full-bath<br/>scope: full<br/>mustHaves: tile, vanity, shower<br/>niceToHaves: exhaust fan<br/>budget: $20,000"]
    end

    subgraph Step1["Node 1 — Base Cost"]
        B["full-bath → $10,000 – $25,000"]
    end

    subgraph Step2["Node 2 — Scope"]
        C["full → ×1.0<br/>Scaled base: $10,000 – $25,000"]
    end

    subgraph Step3["Node 3 — Items"]
        D["New tile floor: $1,200–$3,500<br/>Single vanity: $800–$2,500<br/>Walk-in shower: $2,500–$6,000<br/>Exhaust fan: $600–$1,800<br/>─────────────────<br/>Items total: $5,100–$13,800"]
    end

    subgraph Step4["Node 4 — Aggregate"]
        E["construction = $15,100–$38,800<br/>+ permits 5%: $755–$1,940<br/>+ contingency 10%: $1,510–$3,880<br/>+ design 5%: $755–$1,940<br/>─────────────────<br/>estimatedLow: $18,100<br/>estimatedHigh: $46,600<br/>estimatedMid: $32,350"]
    end

    subgraph Step5["Node 5 — Budget Warning"]
        F["$20,000 is within<br/>$18,100–$46,600 range<br/>✅ No warning"]
    end

    Input --> Step1 --> Step2 --> Step3 --> Step4 --> Step5
```

---

## 8. Data Types (TypeScript)

```typescript
// ─── Inputs ──────────────────────────────────────────
interface BudgetGraphInput {
  roomSize:  "half-bath" | "three-quarter" | "full-bath" | "primary";
  scope:     "cosmetic" | "partial" | "full" | "addition" | null;
  mustHaves:          string[];     // item labels from catalog
  niceToHaves:        string[];
  includeNiceToHaves: boolean;
  customerBudget:     number | null;
  priceOverrides?:    PriceOverride[];
}

interface PriceOverride {
  itemLabel:    string;   // must match catalog label
  materialCost: number;   // actual price from moodboard product
  laborCost:    number;   // estimated labor
}

// ─── Outputs ─────────────────────────────────────────
interface BudgetGraphResult {
  estimatedLow:  number;   // rounded to $100
  estimatedHigh: number;
  estimatedMid:  number;
  breakdown:     BudgetGraphBreakdownItem[];  // 5 categories
  itemBreakdown: ItemCostBreakdown[];         // per-item detail
  budgetWarning: string | null;
  rationale:     string;
  nodes: {
    baseLow: number;  baseHigh: number;
    scopeMultiplier: number;
    itemsLow: number; itemsHigh: number;
    niceToHavesLow: number; niceToHavesHigh: number;
  };
}

interface ItemCostBreakdown {
  label:       string;
  materialLow: number;  materialHigh: number;
  laborLow:    number;  laborHigh:    number;
  totalLow:    number;  totalHigh:    number;
  overridden:  boolean;   // true = real moodboard price
  source:      "must-have" | "nice-to-have";
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/budget-engine/budget-graph.ts` | Core DAG computation, lookup tables, 23-item catalog |
| `apps/web/src/lib/budget-engine/types.ts` | Input/output TypeScript interfaces |
| `apps/web/src/lib/budget-engine/engines/estimate.ts` | LLM-based estimator (Claude Sonnet) |
| `apps/web/src/lib/budget-engine/engines/estimate-fallback.ts` | Deterministic lookup-table engine |
| `apps/web/src/lib/budget-engine/prompts/bathroom.ts` | LLM prompt with renovation expertise |
| `apps/web/src/lib/store.ts` | Zustand state management with price overrides |
| `apps/web/src/lib/room-sizes/bathroom.ts` | Room size definitions and sqft ranges |
| `apps/web/src/app/api/ai/budget-estimate/route.ts` | API route handler |
