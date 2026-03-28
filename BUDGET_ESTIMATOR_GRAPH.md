# Budget Estimator — Knowledge Graph

> Visual representation of how the deterministic budget engine computes renovation cost estimates.

## Computation Flow

```mermaid
flowchart TB
    subgraph Inputs["🏗️ User Inputs"]
        RS["Room Size<br/><i>half-bath | three-quarter<br/>full-bath | primary</i>"]
        SC["Scope<br/><i>cosmetic | partial<br/>full | addition</i>"]
        MH["Must-Haves<br/><i>Selected items list</i>"]
        NH["Nice-to-Haves<br/><i>Optional items list</i>"]
        CB["Customer Budget<br/><i>Self-reported $</i>"]
        MB["Moodboard Selections<br/><i>Real product prices</i>"]
    end

    subgraph Node1["Node 1: Base Cost"]
        BC["Base Cost Range<br/>───────────<br/>half-bath: $3k–$8k<br/>three-quarter: $6k–$15k<br/>full-bath: $10k–$25k<br/>primary: $18k–$45k"]
    end

    subgraph Node2["Node 2: Scope Multiplier"]
        SM["Scope Multiplier<br/>───────────<br/>cosmetic: ×0.35<br/>partial: ×0.65<br/>full: ×1.0<br/>addition: ×1.6"]
    end

    subgraph Node3["Node 3: Item Costs"]
        direction TB
        IC["Per-Item Installed Cost<br/><i>material + labor range</i>"]

        subgraph Items["Item Breakdown"]
            direction LR
            FT["Floor Tile<br/>$1,200–$3,500"]
            WT["Wall Tile<br/>$1,500–$4,000"]
            VN["Vanity<br/>$800–$4,000"]
            TL["Toilet<br/>$400–$1,200"]
            SH["Shower<br/>$2,500–$6,000"]
            OT["+ 17 more items"]
        end

        IC --> Items
    end

    subgraph Node3b["Node 3b: Price Overrides"]
        PO["Moodboard Price Override<br/>───────────<br/>When a real product is selected,<br/>replace estimated range with<br/>actual price + labor estimate"]
    end

    subgraph Aggregation["⚙️ Aggregation"]
        AGG["Total = Base × Scope + Σ Items<br/>───────────<br/>estimatedLow = (baseLow × scope + itemsLow) → round to $100<br/>estimatedHigh = (baseHigh × scope + itemsHigh) → round to $100"]
    end

    subgraph Node4["Node 4: Category Breakdown"]
        direction LR
        MAT["Materials<br/>45%"]
        LAB["Labor<br/>35%"]
        PF["Permits & Fees<br/>5%"]
        CON["Contingency<br/>10%"]
        DP["Design & Planning<br/>5%"]
    end

    subgraph Node5["Node 5: Budget Warning"]
        BW["Compare customer budget<br/>vs estimated range<br/>───────────<br/>Below range → ⚠️ warning<br/>Above range → 💡 upgrade hint<br/>In range → ✅ no warning"]
    end

    subgraph Output["📊 Result"]
        RES["BudgetGraphResult<br/>───────────<br/>• estimatedLow / High / Mid<br/>• itemBreakdown[] per item<br/>• categoryBreakdown[]<br/>• budgetWarning<br/>• rationale"]
    end

    RS --> BC
    SC --> SM
    MH --> IC
    NH --> IC
    MB --> PO

    BC --> AGG
    SM --> AGG
    IC --> AGG
    PO --> AGG

    AGG --> Node4
    AGG --> Node5
    CB --> Node5

    Node4 --> RES
    Node5 --> RES
    AGG --> RES

    style Inputs fill:#f0f7f4,stroke:#2d5a3d,color:#1a1a2e
    style Node1 fill:#e8f5e9,stroke:#2d5a3d,color:#1a1a2e
    style Node2 fill:#e8f5e9,stroke:#2d5a3d,color:#1a1a2e
    style Node3 fill:#e8f5e9,stroke:#2d5a3d,color:#1a1a2e
    style Node3b fill:#fff8e1,stroke:#d4a24c,color:#1a1a2e
    style Aggregation fill:#e3f2fd,stroke:#1565c0,color:#1a1a2e
    style Node4 fill:#fce4ec,stroke:#c0392b,color:#1a1a2e
    style Node5 fill:#fff3e0,stroke:#e65100,color:#1a1a2e
    style Output fill:#f3e5f5,stroke:#6a1b9a,color:#1a1a2e
```

## Item-Level Breakdown Flow

```mermaid
flowchart LR
    subgraph MustHave["Must-Have: Floor Tile"]
        EST["Estimated Range<br/>$1,200 – $3,500"]
        REAL["Moodboard Selection<br/>Porcelain Tile @ $4.50/sqft<br/>→ Material: $540<br/>→ Labor: $720<br/>→ Total: $1,260"]
    end

    EST -->|"No product selected"| USE_EST["Use estimated range"]
    REAL -->|"Product selected"| USE_REAL["Use real price + labor"]

    USE_EST --> TOTAL["Item Total<br/>$1,200 – $3,500"]
    USE_REAL --> TOTAL2["Item Total<br/>$1,260 (fixed)"]

    style MustHave fill:#f0f7f4,stroke:#2d5a3d
    style USE_REAL fill:#fff8e1,stroke:#d4a24c
```

## Data Flow: Moodboard → Budget Update

```mermaid
sequenceDiagram
    participant User
    participant Moodboard as Moodboard Step
    participant Store as Zustand Store
    participant Engine as Budget Graph Engine
    participant Sidebar as Budget Sidebar

    User->>Moodboard: Select product for "Floor Tile"
    Moodboard->>Store: setPriceOverride("New tile (floor)", $4.50/sqft)
    Store->>Engine: computeBudgetGraph({ ...inputs, priceOverrides })
    Engine->>Engine: Replace "Floor Tile" estimate with real price + labor
    Engine->>Sidebar: Updated BudgetGraphResult
    Sidebar->>Sidebar: Animate slot numbers to new total
    Note over Sidebar: Total updates instantly,<br/>no API calls needed
```

## Item Cost Table

| Item | Material Low | Material High | Labor Low | Labor High | Total Low | Total High |
|------|-------------|---------------|-----------|------------|-----------|------------|
| New tile (floor) | $540 | $1,575 | $660 | $1,925 | $1,200 | $3,500 |
| New tile (shower walls) | $675 | $1,800 | $825 | $2,200 | $1,500 | $4,000 |
| Single vanity | $360 | $1,125 | $440 | $1,375 | $800 | $2,500 |
| Walk-in shower | $1,125 | $2,700 | $1,375 | $3,300 | $2,500 | $6,000 |
| Bathtub | $540 | $1,800 | $660 | $2,200 | $1,200 | $4,000 |
| Double vanity | $675 | $1,800 | $825 | $2,200 | $1,500 | $4,000 |
| Glass shower door | $360 | $1,125 | $440 | $1,375 | $800 | $2,500 |
| Heated floors | $675 | $1,575 | $825 | $1,925 | $1,500 | $3,500 |
| Comfort-height toilet | $180 | $540 | $220 | $660 | $400 | $1,200 |
