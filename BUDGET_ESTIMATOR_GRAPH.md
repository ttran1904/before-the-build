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
        REAL["Moodboard Selection<br/>Porcelain Tile @ $4.50/tile<br/>───────────<br/>1. Parse tile size from specs<br/>(e.g. 12&quot; × 24&quot;)<br/>2. Calc floor area from room dims<br/>(room W×L − bathtub footprint)<br/>3. Compute quantity with 10% waste<br/>→ 40 tiles × $4.50 = $180 material<br/>→ 33 sq ft × $12/sqft = $396 labor<br/>→ Total: $576"]
    end

    EST -->|"No product selected"| USE_EST["Use estimated range"]
    REAL -->|"Product selected"| USE_REAL["Use real price × quantity"]

    USE_EST --> TOTAL["Item Total<br/>$1,200 – $3,500"]
    USE_REAL --> TOTAL2["Item Total<br/>$576 (fixed)<br/>40 tiles @ 12&quot;×24&quot;"]

    style MustHave fill:#f0f7f4,stroke:#2d5a3d
    style USE_REAL fill:#fff8e1,stroke:#d4a24c
```

## Tile Estimation — Smart Quantity Calculation

```mermaid
flowchart TB
    subgraph Inputs["Tile Calculation Inputs"]
        ROOM["Room Dimensions<br/><i>Width × Length × Height<br/>(from Goal step)</i>"]
        SHOWER["Shower Dimensions<br/><i>Width × Depth<br/>(from Goal step)</i>"]
        PROD["Product Specs<br/><i>Tile size parsed from<br/>product listing specs</i>"]
        ITEMS["Must-Haves<br/><i>Bathtub? Walk-in shower?<br/>Affects area subtraction</i>"]
    end

    subgraph Parse["Step 1: Parse Tile Size"]
        direction TB
        SPECS["Read product.specs<br/>Look for: Size, Dimensions,<br/>Tile Size, Format, etc."]
        DIM["Parsed: width × height (inches)<br/>Supports: in, cm, mm<br/>e.g. 12&quot; × 24&quot; = 2 sq ft/tile"]
        FALLBACK["Fallback defaults:<br/>Floor: 12&quot; × 12&quot;<br/>Wall: 3&quot; × 6&quot; (subway)"]
    end

    subgraph FloorCalc["Step 2a: Floor Tile Area"]
        FLOOR_AREA["Room Width × Room Length<br/>= Gross floor area"]
        SUBTRACT["Subtract: Bathtub footprint<br/>(60&quot; × 30&quot; = 12.5 sq ft)<br/>Walk-in shower: NO subtraction<br/>(shower floor needs tiles too!)"]
        NET_FLOOR["Net floor area (sq ft)"]
    end

    subgraph WallCalc["Step 2b: Wall Tile Area"]
        WALL_AREA["Shower perimeter × wall height<br/>= (back + 2 sides) × height<br/>3 walls for alcove shower"]
        FIXTURE_CUT["Subtract: ~6 sq ft<br/>for fixture cutouts"]
        NET_WALL["Net wall area (sq ft)"]
    end

    subgraph Quantity["Step 3: Quantity + Cost"]
        QTY["Tiles needed = area ÷ tile area<br/>× 1.10 (10% waste factor)<br/>Rounded up to whole tiles"]
        MAT_COST["Material = unit price × quantity"]
        LAB_COST["Labor = net sq ft × $12/sqft"]
    end

    ROOM --> FLOOR_AREA
    ROOM --> WALL_AREA
    SHOWER --> WALL_AREA
    PROD --> SPECS
    SPECS --> DIM
    SPECS -.->|"No specs found"| FALLBACK
    ITEMS --> SUBTRACT

    FLOOR_AREA --> SUBTRACT --> NET_FLOOR
    WALL_AREA --> FIXTURE_CUT --> NET_WALL

    DIM --> QTY
    NET_FLOOR --> QTY
    NET_WALL --> QTY

    QTY --> MAT_COST
    QTY --> LAB_COST

    style Inputs fill:#f0f7f4,stroke:#2d5a3d
    style Parse fill:#e3f2fd,stroke:#1565c0
    style FloorCalc fill:#e8f5e9,stroke:#2d5a3d
    style WallCalc fill:#fff8e1,stroke:#d4a24c
    style Quantity fill:#fce4ec,stroke:#c0392b
```

### Tile Size Reference

| Tile Format | Dimensions | Area per Tile | Tiles per sq ft |
|-------------|-----------|---------------|-----------------|
| Mosaic | 1" × 1" | 0.007 sq ft | ~144 |
| Small mosaic | 2" × 2" | 0.028 sq ft | ~36 |
| Subway (classic) | 3" × 6" | 0.125 sq ft | 8 |
| Small square | 4" × 4" | 0.111 sq ft | 9 |
| Medium square | 6" × 6" | 0.25 sq ft | 4 |
| Standard square | 12" × 12" | 1.0 sq ft | 1 |
| Standard rectangle | 12" × 24" | 2.0 sq ft | 0.5 |
| Large format | 18" × 18" | 2.25 sq ft | 0.44 |
| Large rectangle | 6" × 24" | 1.0 sq ft | 1 |
| Extra large | 24" × 24" | 4.0 sq ft | 0.25 |

### Area Subtraction Rules

| Fixture | Floor Area Subtracted | Wall Area Subtracted |
|---------|----------------------|---------------------|
| Bathtub (standard) | 12.5 sq ft (60" × 30") | N/A |
| Walk-in shower | **None** (floor still tiled) | N/A |
| Toilet | Negligible (tiled under) | N/A |
| Vanity | Negligible (tiled under) | N/A |
| Fixture cutouts (walls) | N/A | ~6 sq ft |

## Data Flow: Moodboard → Budget Update (Tile-Aware)

```mermaid
sequenceDiagram
    participant User
    participant Moodboard as Moodboard Step
    participant TileCalc as Tile Calculator
    participant Store as Zustand Store
    participant Engine as Budget Graph Engine
    participant Sidebar as Budget Sidebar

    User->>Moodboard: Select tile product for "Floor Tile"
    Moodboard->>TileCalc: parseTileDimensions(product.specs)
    TileCalc-->>Moodboard: { widthIn: 12, heightIn: 24, label: '12" × 24"' }
    Moodboard->>TileCalc: calcFloorTileArea(roomDims, tileDims)
    TileCalc-->>Moodboard: { netSqft: 55, quantity: 34, breakdown: "..." }
    Moodboard->>Store: setPriceOverride({ itemLabel, materialCost: $4.50×34, laborCost: 55×$12, tileInfo })
    Store->>Engine: computeBudgetGraph({ ...inputs, priceOverrides })
    Engine->>Engine: Replace "Floor Tile" estimate with quantity-based price
    Engine->>Sidebar: Updated BudgetGraphResult (with tileInfo on itemBreakdown)
    Sidebar->>Sidebar: Show "34 tiles @ 12"×24" · 55 sq ft" + animate totals
    Note over Sidebar: Total updates instantly,<br/>tile details visible everywhere
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
