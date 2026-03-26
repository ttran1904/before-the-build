# Bathroom Renovation Knowledge Graph

> **Purpose**: Map simple user-facing diagnostic questions to hidden conditions, required tasks, cost/time impacts, and task dependencies — so the app can generate accurate, personalized renovation estimates instead of generic "cosmetic refresh" plans.

---

## Table of Contents

1. [Graph Structure](#1-graph-structure)
2. [The 5 Building Systems & Components](#2-the-5-building-systems--components)
3. [Diagnostic Questions](#3-diagnostic-questions)
   - [Group A: Home Age](#group-a-home-age)
   - [Group B: Observable Symptoms](#group-b-observable-symptoms)
   - [Group C: Scope & Intent](#group-c-scope--intent)
4. [Hidden Conditions Registry](#4-hidden-conditions-registry)
5. [Condition → Task Trigger Map](#5-condition--task-trigger-map)
6. [Full Task Dependency Graph](#6-full-task-dependency-graph)
7. [The "I Don't Know" Engine](#7-the-i-dont-know-engine)
8. [Cross-Question Signal Boosting](#8-cross-question-signal-boosting)
9. [Live Estimate Update Model](#9-live-estimate-update-model)
10. [Data Model (TypeScript)](#10-data-model-typescript)
11. [UX Mockup](#11-ux-mockup)

---

## 1. Graph Structure

The graph has **5 node types** and **6 edge types**:

```
┌──────────────┐     diagnoses     ┌──────────────┐     triggers     ┌──────────────┐
│   QUESTION   │ ──────────────▶   │  CONDITION   │ ──────────────▶  │     TASK     │
│  (user-facing)│                   │  (hidden)    │                  │  (work item) │
└──────────────┘                   └──────────────┘                  └──────────────┘
                                         │                                │
                                    affects ▼                        depends_on ▼
                                   ┌──────────────┐                 ┌──────────────┐
                                   │  COMPONENT   │ ◀── part_of ── │    SYSTEM    │
                                   │ (pipe, joist) │                │(plumbing,elec)│
                                   └──────────────┘                └──────────────┘
```

### Edge Types

| Edge | From → To | Meaning |
|------|-----------|---------|
| **diagnoses** | Question → Condition | An answer reveals the probability of a hidden condition |
| **triggers** | Condition → Task(s) | A confirmed/probable condition adds required work |
| **affects** | Condition → Component | The condition damages or involves a physical component |
| **part_of** | Component → System | The component belongs to a building system |
| **depends_on** | Task → Task | One task must complete before another can start |
| **impacts** | Condition → Estimate | Cost delta + time delta applied to the running estimate |

---

## 2. The 5 Building Systems & Components

### PLUMBING
```
├── Supply Lines
│   ├── Pipe Material (galvanized / copper / PEX / CPVC / polybutylene)
│   ├── Shut-off Valves (per fixture)
│   └── Water Pressure
├── Drain / Waste / Vent (DWV)
│   ├── Drain Pipe Material (cast iron / PVC / ABS)
│   ├── Toilet Flange (height, material, condition)
│   ├── Vent Stack (connection point, routing)
│   ├── P-Traps (per fixture, accessibility)
│   └── Drain Slope (1/4" per foot to drain)
├── Fixtures
│   ├── Shower Valve (pressure-balancing / thermostatic)
│   ├── Toilet (flange connection)
│   └── Faucets (supply connections)
└── Water Heater
    └── Capacity (adequate for new fixtures?)
```

### ELECTRICAL
```
├── Circuits
│   ├── Bathroom Receptacle Circuit (dedicated 20A required by code)
│   ├── Fan/Lighting Circuit
│   └── Heated Floor Circuit (often 240V, dedicated)
├── Wiring
│   ├── Type (Romex / knob-and-tube / aluminum)
│   ├── GFCI Protection (all outlets within 6ft of water)
│   └── Bonding (metal pipes, tub, shower)
├── Outlets & Fixtures
│   ├── Outlet Count & Positions
│   ├── Vanity Light Junction Box (height: 78-80" AFF)
│   └── Recessed Lighting (IC-rated if near insulation)
└── Panel
    └── Capacity / Available Spaces
```

### STRUCTURAL
```
├── Subfloor
│   ├── Material (plywood)
│   ├── Thickness (3/4" minimum for tile)
│   └── Condition (rot, especially near toilet + shower)
├── Joists
│   ├── Size & Spacing
│   ├── Condition (water damage, sagging)
│   └── Load Capacity (freestanding tub = 500+ lbs filled)
├── Framing
│   ├── Wall Studs
│   ├── Blocking (grab bars, wall-mount vanity, shower niche, bench)
│   └── Load-Bearing Walls (structural engineer if moving)
└── Foundation
    ├── Type (concrete slab vs. raised/crawlspace/basement)
    └── Condition
```

### WATERPROOFING
```
├── Shower Pan Membrane
│   ├── Type (sheet membrane / liquid membrane / traditional liner)
│   └── Condition (failed = leaks to structure below)
├── Wall Membrane
│   └── Coverage (must go full height to ceiling in shower)
├── Curb Seal
│   └── (Most common leak location in a shower)
├── Cement Board Substrate
│   └── (NOT greenboard drywall — must be cement board)
└── Caulk / Grout Joints
    └── Change-of-plane joints use silicone, NOT grout
```

### VENTILATION
```
├── Exhaust Fan
│   ├── CFM Rating (1 CFM/sq ft minimum; 50 CFM minimum)
│   └── Presence (many old bathrooms have none)
├── Duct Routing
│   └── Termination (must exit to exterior, NOT into attic)
└── Makeup Air
    └── (Tight houses may need supply air consideration)
```

---

## 3. Diagnostic Questions

### Group A: Home Age

**Single question that activates multiple conditions based on the year range.**

> **"What year was your home built?"**
>
> _(Dropdown or free text: pre-1950 / 1950-1969 / 1970-1979 / 1980-1999 / 2000+ / I don't know)_

| Home Year | Conditions Activated | Probability | Cost Impact | Time Impact |
|-----------|---------------------|-------------|-------------|-------------|
| **Before 1950** | Knob-and-tube wiring | 70% | +$3,000–8,000 | +3 days |
| | Galvanized supply pipes | 85% | +$2,000–5,000 | +3 days |
| | Cast iron drain pipes | 90% | +$1,000–4,000 | +2 days |
| | Lead paint | 80% | +$1,000–3,000 | +2 days |
| | Asbestos (floor/insulation) | 60% | +$2,000–8,000 | +5 days |
| | No ground wiring | 90% | +$500 | +1 day |
| **1950–1969** | Galvanized supply pipes | 60% | +$2,000–5,000 | +3 days |
| | Cast iron drain pipes | 70% | +$1,000–4,000 | +2 days |
| | Asbestos floor tiles (9x9) | 40% | +$2,000–8,000 | +5 days |
| | Undersized electrical panel | 50% | +$1,500–3,000 | +1 day |
| | Lead paint | 70% | +$1,000–3,000 | +2 days |
| **1965–1973** | Aluminum wiring | 30% | +$2,000–5,000 | +2 days |
| **1970–1979** | Lead paint | 40% | +$1,000–3,000 | +2 days |
| | Asbestos (some materials) | 20% | +$2,000–8,000 | +5 days |
| | Cast iron drain pipes | 40% | +$1,000–4,000 | +2 days |
| **1980–1999** | Polybutylene pipes (PB) | 20% | +$2,000–4,000 | +2 days |
| | Inadequate waterproofing | 30% | +$1,000–2,000 | +1 day |
| **2000+** | (Mostly code-compliant) | Low | Minimal | Minimal |

---

### Group B: Observable Symptoms

**Yes / No / I Don't Know** — these detect current hidden conditions.

| ID | Question | YES → Condition | Cost Impact | Time Impact | IDK Flag |
|----|----------|-----------------|-------------|-------------|----------|
| **B1** | "Is there a soft or spongy spot on the bathroom floor?" | Subfloor rot | +$500–2,000 | +1–2 days | ⚠️ |
| **B2** | "Do you see water stains on the ceiling below the bathroom?" | Active leak / failed waterproofing | +$1,000–5,000 | +1–3 days | ⚠️ |
| **B3** | "Do drains gurgle or drain slowly?" | Venting issue | +$500–1,500 | +1 day | |
| **B4** | "Is the water pressure noticeably low in this bathroom?" | Corroded/galvanized pipes | +$2,000–5,000 | +2–3 days | |
| **B5** | "Do you see any mold or black spots on walls/ceiling, or smell must?" | Mold behind walls | +$1,000–5,000 | +1–3 days | ⚠️ |
| **B6** | "Does the toilet rock or wobble when you sit on it?" | Failed wax ring / rotted flange / subfloor rot | +$200–1,500 | +0.5–1 day | |
| **B7** | "Do lights dim when you use a hair dryer or space heater?" | Undersized circuit / shared circuit | +$500–1,500 | +0.5–1 day | |
| **B8** | "Does the exhaust fan feel weak, or is there no fan at all?" | Inadequate ventilation / improper ducting | +$300–1,000 | +0.5 day | |
| **B9** | "Do you see any cracked or loose tiles in the shower area?" | Failed waterproofing / moisture behind walls | +$500–3,000 | +1–2 days | ⚠️ |
| **B10** | "Is there discolored or missing grout in the shower?" | Water infiltration / substrate damage | +$500–2,000 | +1 day | |

**IDK Flag Legend:**
- ⚠️ = "I don't know" → recommend professional inspection before finalizing estimate
- No flag = "I don't know" → use age-based probability as weighted contingency

---

### Group C: Scope & Intent

**These determine the base scope of work (what the user _wants_ to do), which then interacts with what the home _needs_.**

| ID | Question | Answer → Effect |
|----|----------|-----------------|
| **C1** | "Are you moving the toilet to a different location?" | YES → Major plumbing reroute: +$2,000–6,000, +3–5 days. If slab foundation → +$3,000–8,000 (concrete breaking) |
| **C2** | "Are you changing the shower/tub location or converting tub → shower?" | YES → Plumbing + drain reroute: +$1,500–4,000, +2–3 days |
| **C3** | "Do you want heated floors?" | YES → Dedicated electrical circuit + heating mat: +$800–2,500, +1 day |
| **C4** | "Is the bathroom on a concrete slab or above a crawlspace/basement?" | SLAB → All underground plumbing changes require concrete cutting. Multiplies plumbing move costs 2–3× |
| **C5** | "Do you want a freestanding or large soaking tub?" | YES → Joist load check required: +$500–2,000 if reinforcement needed |
| **C6** | "Are you adding or moving any outlets or light fixtures?" | YES → New electrical runs: +$200–800 per fixture, +0.5–1 day |
| **C7** | "Do you want to move or remove any walls?" | YES → Structural engineer needed if load-bearing: +$2,000–10,000, +3–5 days |
| **C8** | "Are you keeping the same vanity or getting a new one?" | NEW → Supply + drain hookup. Wall-mount → blocking needed in framing phase |

---

## 4. Hidden Conditions Registry

Every hidden condition that the knowledge graph can activate:

| ID | Condition | System | Base Probability | Cost Range | Time Range | Severity |
|----|-----------|--------|-----------------|------------|------------|----------|
| `GALV_PIPES` | Galvanized supply pipes (corroded internally) | Plumbing | Age-based | $2,000–5,000 | 2–3 days | High |
| `CAST_IRON_DRAIN` | Cast iron drain pipes (rusting from inside) | Plumbing | Age-based | $1,000–4,000 | 1–2 days | High |
| `POLYBUTYLENE` | Polybutylene supply pipes (failure-prone) | Plumbing | Age-based | $2,000–4,000 | 2 days | High |
| `SUBFLOOR_ROT` | Rotted plywood subfloor | Structural | 30% (remodels) | $500–2,000 | 1–2 days | Medium |
| `JOIST_DAMAGE` | Water-damaged or undersized joists | Structural | 10% | $1,000–3,000 | 1–2 days | High |
| `FLANGE_ROT` | Rotted toilet flange / surrounding subfloor | Structural | 25% | $200–500 | 0.5 day | Low |
| `MOLD` | Mold growth behind walls/under floor | Waterproofing | 20% | $1,000–5,000 | 1–3 days | High |
| `FAILED_WATERPROOF` | Failed or absent shower waterproofing | Waterproofing | 25% (older) | $1,000–3,000 | 1–2 days | High |
| `KNOB_AND_TUBE` | Knob-and-tube wiring (pre-1950) | Electrical | Age-based | $3,000–8,000 | 3 days | Critical |
| `ALUMINUM_WIRING` | Aluminum wiring (1965–1973) | Electrical | Age-based | $2,000–5,000 | 2 days | High |
| `UNDERSIZED_PANEL` | Electrical panel at capacity | Electrical | 10–50% | $1,500–3,000 | 1 day | Medium |
| `SHARED_CIRCUIT` | Bathroom shares circuit with other rooms | Electrical | 40% (older) | $500–1,500 | 0.5–1 day | Medium |
| `ASBESTOS` | Asbestos in floor tiles, insulation, or mastic | Hazmat | Age-based | $2,000–8,000 | 3–5 days | Critical |
| `LEAD_PAINT` | Lead-based paint (pre-1978) | Hazmat | Age-based | $1,000–3,000 | 2 days | High |
| `BAD_VENTING` | Missing or inadequate DWV vent | Plumbing | 25% | $500–1,500 | 1 day | Medium |
| `NO_EXHAUST` | No exhaust fan or fan vents into attic | Ventilation | 35% (older) | $300–1,000 | 0.5 day | Medium |
| `THIN_SUBFLOOR` | Subfloor too thin for tile (deflection failure) | Structural | 20% | $500–1,500 | 1 day | Medium |
| `LOAD_BEARING_WALL` | Wall targeted for removal is load-bearing | Structural | 10% (of wall removals) | $2,000–10,000 | 3–5 days | Critical |

---

## 5. Condition → Task Trigger Map

When a condition is activated (confirmed or high probability), it inserts these tasks into the plan:

### Plumbing Conditions

**`GALV_PIPES` → Galvanized Supply Pipes**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Replace supply lines with PEX | 2 days | Plumber | Fixture install |
| Install new per-fixture shut-off valves | 0.5 day | Plumber | Fixture install |
| Pressure test new lines | 0.5 day | Plumber | Rough-in inspection |

**`CAST_IRON_DRAIN` → Cast Iron Drain Failure**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Cut out failed cast iron sections | 1 day | Plumber | New drain install |
| Replace with PVC drain pipe | 1 day | Plumber | Waterproofing |
| Re-connect to vent stack | 0.5 day | Plumber | Rough-in inspection |

**`BAD_VENTING` → Inadequate DWV Venting**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Run new vent pipe to stack or roof | 0.5–1 day | Plumber | Drain connections |
| _or_ Install AAV (if local code allows) | 0.25 day | Plumber | Drain connections |

### Structural Conditions

**`SUBFLOOR_ROT` → Rotted Subfloor**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Cut out rotted subfloor sections | 0.5 day | GC / Carpenter | Subfloor replacement |
| Inspect joists beneath for damage | 0.25 day | GC / Carpenter | Joist repair (if needed) |
| Sister new plywood to existing subfloor | 0.5–1 day | Carpenter | Cement board install |

**`JOIST_DAMAGE` → Damaged or Undersized Joists**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Sister / double affected joists | 1 day | Carpenter | Subfloor |
| Add blocking between joists | 0.5 day | Carpenter | Subfloor |

**`THIN_SUBFLOOR` → Subfloor Too Thin for Tile**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Add 1/4" or 1/2" plywood layer | 0.5 day | Carpenter | Cement board install |
| Verify L/360 deflection standard met | 0.25 day | Carpenter / Engineer | Tile install |

**`LOAD_BEARING_WALL` → Load-Bearing Wall in Removal Plan**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Structural engineer assessment | 1 day (+ wait) | Engineer | Header design |
| Install engineered header/beam | 2–3 days | Carpenter | All framing |
| Temporary shoring during work | 0.5 day | Carpenter | Wall removal |

### Electrical Conditions

**`KNOB_AND_TUBE` → Knob-and-Tube Wiring**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Full bathroom rewire (Romex) | 2 days | Electrician | Insulation, drywall |
| Run new circuit(s) from panel | 1 day | Electrician | All electrical trim |

**`ALUMINUM_WIRING` → Aluminum Wiring**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Pigtail with COPALUM connectors _or_ replace | 1–2 days | Electrician | Outlets/switches |

**`UNDERSIZED_PANEL` → Panel at Capacity**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Upgrade panel or add sub-panel | 1 day | Electrician | New circuit runs |

**`SHARED_CIRCUIT` → No Dedicated Bathroom Circuit**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Run dedicated 20A bathroom circuit | 0.5 day | Electrician | Outlet install |

### Waterproofing Conditions

**`MOLD` → Mold Behind Walls**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Mold remediation (containment + removal) | 1–2 days | Remediation specialist | Framing |
| Replace affected drywall and/or studs | 0.5–1 day | Carpenter | Cement board |
| Treat framing with antimicrobial | 0.25 day | GC | Waterproofing |

**`FAILED_WATERPROOF` → Failed Shower Waterproofing**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Full tear-out of shower substrate | 0.5 day | GC | Rebuild |
| Install new cement board + membrane | 1 day | Tile installer | Tile |
| Flood test (24–48 hours, code-required) | 1–2 days (wait) | GC / Inspector | Tile |

### Hazmat Conditions

**`ASBESTOS` → Asbestos Present**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Certified asbestos testing | 0.5 day (+ lab wait) | Testing firm | Abatement decision |
| Licensed asbestos abatement | 3–5 days | Abatement contractor | ALL demolition |
| Air monitoring during/after | Concurrent | Testing firm | Clearance |
| Proper disposal (regulated waste) | Included | Abatement contractor | — |

**`LEAD_PAINT` → Lead Paint**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| EPA RRP-certified containment setup | 0.5 day | RRP-certified contractor | Demolition |
| Lead-safe work practices during demo | Concurrent | RRP-certified contractor | — |
| Post-work clearance testing | 0.25 day | Testing firm | Occupancy |

### Ventilation Conditions

**`NO_EXHAUST` → No Exhaust Fan or Bad Ducting**
| Triggered Task | Duration | Assignee | Blocks |
|----------------|----------|----------|--------|
| Install exhaust fan (sized for room) | 0.25 day | Electrician / GC | Finishing |
| Run insulated duct to exterior | 0.25 day | GC | Finishing |
| Install roof cap or soffit termination | 0.25 day | Roofer / GC | Finishing |

---

## 6. Full Task Dependency Graph

Phases run top-to-bottom. Tasks within a phase may run in parallel (marked `∥`).
**Bold** = hidden/structural work that competitors don't model.

```
PHASE 0: ASSESSMENT & PERMITS
│
├── User answers diagnostic questions (this knowledge graph)
├── Generate scope of work from graph
├── Submit permit applications (building + plumbing + electrical)
└── ⏳ WAIT for permits (1–4 weeks) ← longest lead time item
│
▼
PHASE 1: DEMOLITION
│
├── Protect adjacent areas (dust barriers, floor protection)
├── ⚠️ Asbestos abatement (if ASBESTOS active) ← MUST happen first
├── ⚠️ Lead-safe containment (if LEAD_PAINT active) ← MUST happen first
├── Remove fixtures (toilet, vanity, tub/shower)
├── Remove tile (walls + floor)
├── Remove substrate (cement board / greenboard / mud bed)
│
├── 🔍 CRITICAL INSPECTION POINT
│   Inspect what was hidden:
│   ├── Subfloor condition → may activate SUBFLOOR_ROT
│   ├── Pipe material & condition → may confirm GALV_PIPES, CAST_IRON_DRAIN
│   ├── Wiring type → may confirm KNOB_AND_TUBE, ALUMINUM_WIRING
│   ├── Joist condition → may activate JOIST_DAMAGE
│   ├── Mold presence → may activate MOLD
│   └── Waterproofing state → may confirm FAILED_WATERPROOF
│
│   ⚡ ESTIMATE UPDATE: New conditions discovered here are applied
│   to the running estimate. User is notified of changes.
│
▼
PHASE 2: STRUCTURAL REPAIR (if any conditions active)
│
├── 🔧 Mold remediation (if MOLD)                             ┐
├── 🔧 Replace rotted subfloor sections (if SUBFLOOR_ROT)     │ Can be
├── 🔧 Sister/reinforce joists (if JOIST_DAMAGE)              │ partially
├── 🔧 Install structural header (if LOAD_BEARING_WALL)       │ parallel
├── 🔧 Add additional plywood layer (if THIN_SUBFLOOR)        ┘
│
├── Add blocking for:
│   ├── Grab bars (2x6 or 3/4" plywood, 33–36" height)
│   ├── Wall-mount vanity
│   ├── Shower niche(s)
│   ├── Shower bench
│   └── Heavy mirror
│
▼
PHASE 3: ROUGH-INS (Plumbing ∥ Electrical — can run in parallel)
│
├── PLUMBING ROUGH-IN                    ∥  ELECTRICAL ROUGH-IN
│   ├── 🔧 Replace supply pipes          │  ├── 🔧 Full rewire (if K&T)
│   │   (if GALV_PIPES / POLYBUTYLENE)   │  ├── 🔧 New 20A dedicated circuit
│   ├── 🔧 Replace drain pipes           │  │   (if SHARED_CIRCUIT)
│   │   (if CAST_IRON_DRAIN)             │  ├── 🔧 Panel upgrade
│   ├── 🔧 Fix/add vent connections      │  │   (if UNDERSIZED_PANEL)
│   │   (if BAD_VENTING)                 │  ├── Fan wiring
│   ├── Shower valve rough-in            │  ├── Heated floor wiring (if C3)
│   │   (at correct depth for wall)      │  ├── Recessed light boxes
│   ├── Toilet flange (on TOP of tile    │  ├── Vanity light junction box
│   │   level, not under)                │  └── GFCI circuit/outlets
│   ├── Supply lines to fixture          │
│   │   locations                        │
│   ├── Drain slope (1/4" per foot)      │
│   └── Shut-off valves (per fixture)    │
│                                        │
├── 🔍 ROUGH-IN INSPECTION (city inspector)
│   Inspector must approve ALL plumbing + electrical
│   before walls can be closed. CANNOT proceed without this.
│
▼
PHASE 4: WATERPROOFING
│
├── Install cement board on walls (1/2") + floor (1/4")
├── Tape joints with alkali-resistant mesh + thin-set
├── Apply waterproof membrane:
│   ├── Shower pan (sheet or liquid membrane)
│   ├── Shower walls (full height to ceiling)
│   ├── Curb (top + both sides — #1 leak location)
│   ├── Niche interior (sloped bottom)
│   └── Bench top (sloped away from wall)
│
├── 🔍 FLOOD TEST (code-required in many jurisdictions)
│   Fill shower pan to top of curb, wait 24–48 hours,
│   check for ANY leaks below. CANNOT tile until passed.
│
▼
PHASE 5: INSTALLATION
│
├── Heated floor mat (if C3) — must go BEFORE floor tile
├── Floor tile (maintain slope in shower area)
│   └── Shower floor: small mosaic or linear drain for large format
├── Wall tile
├── Grout (epoxy for shower floor; cement-based elsewhere)
│
│   ⏳ ORDER POINT: Measure for shower glass NOW
│   Custom glass = 2–4 week fabrication lead time
│
├── Vanity install → plumb supply + drain connections
├── Toilet set → wax ring, closet bolts, level, silicone
├── Shower trim → valve trim plate, shower head, handles
├── Glass enclosure install (when fabrication complete)
├── Mirror, lighting, accessories → into blocking (not drywall anchors)
│
▼
PHASE 6: FINISHING
│
├── Paint / touch-up
├── Exhaust fan duct connected + verified venting to exterior
├── Silicone caulk at ALL change-of-plane joints:
│   ├── Wall-to-floor
│   ├── Wall-to-wall corners
│   ├── Around fixtures
│   └── (NOT grout — grout cracks at movement joints)
├── Final plumbing connections checked (every joint, under pressure)
├── Final electrical (cover plates, test all GFCI)
│
├── 🔍 FINAL INSPECTION (city inspector)
│   Inspects plumbing, electrical, general construction
│
└── Cleanup + punch list
```

---

## 7. The "I Don't Know" Engine

When users answer "I don't know," the system uses home age + other observable answers to compute a **weighted contingency** instead of ignoring the risk.

### Example: Question B1 — "Is there a soft spot on the floor?"

**Answer: YES**
```
├── Activate SUBFLOOR_ROT at 100% probability (confirmed)
├── Add tasks: Cut rotted section, Sister plywood, Inspect joists
├── Add to estimate: +$500–2,000 cost, +1–2 days
└── Trigger follow-up: "Is the soft spot near the toilet?"
    └── YES → also activate FLANGE_ROT (+$200–500)
```

**Answer: NO**
```
├── Set SUBFLOOR_ROT at 5% probability (possible but unlikely)
├── Add weighted contingency: 5% × $1,000 midpoint = +$50
└── Note: "Will verify during demolition inspection"
```

**Answer: I DON'T KNOW**
```
├── Use age-based probability:
│   ├── Home < 20 years old → 10% → +$100 contingency
│   ├── Home 20–40 years old → 25% → +$250 contingency
│   └── Home 40+ years old → 40% → +$400 contingency
│
├── Cross-reference with other answers:
│   ├── B2 (ceiling stains) = YES → boost to 70%
│   ├── B6 (wobbly toilet) = YES → boost to 60%
│   └── B9 (cracked tiles) = YES → boost to 50%
│
└── Flag: ⚠️ "Recommend professional inspection before finalizing"
```

---

## 8. Cross-Question Signal Boosting

Answers to one question change the probability of conditions from _other_ questions. This makes the assessment smarter than isolated yes/no checks.

| If this answer... | ...then boost these conditions: | Boost amount |
|---|---|---|
| B2 (ceiling stains) = YES | Subfloor rot | +30% |
| | Mold | +40% |
| | Failed waterproofing | +60% |
| B4 (low pressure) = YES AND home < 1970 | Galvanized pipes | → 95% |
| B6 (wobbly toilet) = YES | Subfloor rot near toilet | +50% |
| | Flange failure | +70% |
| B3 (gurgling drains) = YES | Venting issue | +80% |
| | Partial drain blockage | +40% |
| B5 (mold visible) = YES | Failed waterproofing | +50% |
| | Subfloor rot | +30% |
| B9 (cracked tiles) = YES AND B10 (bad grout) = YES | Failed waterproofing | +70% |
| | Mold behind walls | +40% |
| B1 (soft floor) = YES AND B6 (wobbly toilet) = YES | Subfloor rot (extensive) | → 95% |
| | Joist damage | +30% |
| B7 (dimming lights) = YES AND home < 1970 | Knob-and-tube / aluminum | +30% |
| | Undersized panel | +40% |

---

## 9. Live Estimate Update Model

As the user answers each question, the estimate updates in real time:

### Example Walkthrough

```
BASE ESTIMATE (cosmetic refresh, small bathroom, no hidden issues):
  Cost:     $8,000 – $15,000
  Timeline: 3 – 4 weeks
  Contingency: $0
```

**User answers: "Home built 1955"**
```
  + Galvanized pipe risk (60%):      +$1,200–$3,000 weighted
  + Cast iron drain risk (70%):      +$700–$2,800 weighted
  + Lead paint risk (70%):           +$700–$2,100 weighted
  + Asbestos risk (40%):             +$800–$3,200 weighted
  ──────────────────────────────────────────────────────────
  RUNNING:  $11,400 – $26,100  |  4.5 – 7 weeks
```

**User answers B1: "Yes, soft spot on floor"**
```
  + Subfloor rot (confirmed):       +$500–$2,000 (100%)
  ──────────────────────────────────────────────────────────
  RUNNING:  $11,900 – $28,100  |  5 – 7.5 weeks
```

**User answers B5: "Yes, I see mold"**
```
  + Mold remediation (confirmed):   +$1,000–$5,000 (100%)
  + Waterproofing failure (boosted): +$500–$1,500 weighted (now 50%)
  ──────────────────────────────────────────────────────────
  RUNNING:  $13,400 – $34,600  |  5.5 – 8.5 weeks
```

**User answers C1: "Yes, moving toilet" + C4: "Concrete slab"**
```
  + Concrete saw-cut + re-route:     +$3,000–$8,000 (confirmed)
  ──────────────────────────────────────────────────────────
  RUNNING:  $16,400 – $42,600  |  7 – 10 weeks
```

**Final estimate display includes:**
```
  Confirmed costs:    $X,XXX – $XX,XXX  (from YES answers)
  Probable costs:     $X,XXX – $X,XXX   (from age + signal boosts)
  Contingency:        $X,XXX            (from IDK answers × probability)
  ──────────────────────────────────────────────────────────
  TOTAL RANGE:        $XX,XXX – $XX,XXX
  TIMELINE:           X – X weeks
  ⚠️ FLAGS:           X items recommend professional inspection
```

---

## 10. Data Model (TypeScript)

```typescript
// ─── Node Types ───

type QuestionGroup = "home_age" | "symptoms" | "scope";
type AnswerType = "year" | "yes_no_idk" | "choice";
type System = "plumbing" | "electrical" | "structural" | "waterproofing" | "ventilation" | "hazmat";
type Severity = "low" | "medium" | "high" | "critical";
type Phase = "assessment" | "demolition" | "structural" | "rough_in" | "waterproofing" | "installation" | "finishing";

interface DiagnosticQuestion {
  id: string;                     // "A1", "B1", "C4"
  group: QuestionGroup;
  text: string;                   // User-facing question text
  answerType: AnswerType;
  options?: string[];             // For "choice" type
  followUpQuestionId?: string;    // Conditional follow-up
  followUpCondition?: string;     // When to show follow-up (e.g., "yes")
}

interface HiddenCondition {
  id: string;                     // "SUBFLOOR_ROT", "GALV_PIPES"
  name: string;                   // Human-readable name
  description: string;            // Explanation for user
  system: System;
  severity: Severity;
  baseProbability: number;        // Default probability (0–1) before any question
  costRange: [number, number];    // [min, max] in USD
  timeImpactDays: [number, number]; // [min, max] additional days
}

interface RenovationTask {
  id: string;
  name: string;
  phase: Phase;
  durationDays: number;
  assignee: string;               // Trade: "Plumber", "Electrician", "GC", etc.
  dependsOn: string[];            // Task IDs that must complete first
  blocksPhase?: Phase;            // What downstream phase this blocks
  isInspection?: boolean;         // Cannot proceed without passing
  isConditional: boolean;         // Only added if a condition is active
  triggeredByCondition?: string;  // Condition ID that adds this task
}

// ─── Edge Types ───

interface DiagnosesEdge {
  questionId: string;
  answer: "yes" | "no" | "idk" | { yearBefore: number } | { yearRange: [number, number] };
  conditionId: string;
  probabilityOverride: number;    // Sets condition probability when this answer is given
}

interface SignalBoost {
  sourceQuestionId: string;
  sourceAnswer: "yes";
  targetConditionId: string;
  probabilityBoost: number;       // Added to current probability (capped at 1.0)
}

interface TaskTrigger {
  conditionId: string;
  taskIds: string[];              // Tasks added when condition is active
  probabilityThreshold: number;   // Minimum probability to trigger (e.g., 0.5 = 50%)
}

// ─── Live State ───

interface ConditionState {
  conditionId: string;
  probability: number;            // Current probability (0–1), updated by answers + boosts
  confirmed: boolean;             // True if user said YES to a direct diagnostic
  source: string;                 // Which question(s) activated this
  weightedCostImpact: number;     // probability × midpoint of cost range
  weightedTimeImpact: number;     // probability × midpoint of time range
}

interface RenovationAssessment {
  projectId: string;
  answers: Record<string, any>;   // questionId → answer value
  activeConditions: ConditionState[];
  triggeredTasks: RenovationTask[];
  estimate: {
    confirmedCostRange: [number, number];   // From YES answers (100% probability)
    probableCostRange: [number, number];    // From age-based + signal boosts
    contingency: number;                    // From IDK answers × probability
    totalRange: [number, number];           // Sum of all
    timelineWeeks: [number, number];
  };
  flags: {
    message: string;
    severity: "info" | "warning" | "critical";
    relatedConditionId: string;
  }[];
}
```

---

## 11. UX Mockup

### Question Screen (with live sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  🛁 Bathroom Assessment                        Step 5/14   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │   "Do you see water stains on the ceiling              │ │
│  │    below your bathroom?"                               │ │
│  │                                                        │ │
│  │   💡 Why we ask: Water stains suggest a slow leak      │ │
│  │   from the shower pan or supply lines — this often     │ │
│  │   means the waterproofing has failed and needs to      │ │
│  │   be fully replaced during your remodel.               │ │
│  │                                                        │ │
│  │   ┌──────────┐  ┌──────────┐  ┌────────────────┐      │ │
│  │   │   Yes    │  │    No    │  │  I don't know  │      │ │
│  │   └──────────┘  └──────────┘  └────────────────┘      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                             │
│  📊 Your Estimate (updates live)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Cost Range:     $13,400 ─── $34,600                   │ │
│  │  Timeline:       5.5 – 8.5 weeks                       │ │
│  │  Contingency:    $1,800 (for unknowns)                 │ │
│  │                                                        │ │
│  │  ⚠️ 2 items recommend professional inspection          │ │
│  │                                                        │ │
│  │  Systems affected:                                     │ │
│  │  ▓▓▓▓▓▓▓▓░░  Plumbing       2 probable issues         │ │
│  │  ▓▓▓░░░░░░░  Electrical     1 probable issue          │ │
│  │  ▓▓▓▓▓░░░░░  Structural     1 confirmed               │ │
│  │  ▓▓▓▓▓▓░░░░  Waterproofing  1 confirmed + 1 probable  │ │
│  │  ░░░░░░░░░░  Ventilation    not yet assessed           │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ◀ Back                                          Next ▶    │
└─────────────────────────────────────────────────────────────┘
```

### Post-Assessment Summary Screen

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Assessment Complete                                     │
│                                                             │
│  YOUR BATHROOM RENOVATION SCOPE                             │
│                                                             │
│  ┌─ Confirmed Work ──────────────────────────────────────┐  │
│  │  ✅ Subfloor repair (soft spot confirmed)             │  │
│  │  ✅ Mold remediation (visible mold confirmed)         │  │
│  │  ✅ Moving toilet on concrete slab (your request)     │  │
│  │  ✅ Full waterproofing (shower rebuild)               │  │
│  │  ✅ Standard tile, vanity, fixture installation       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Probable Work (based on 1955 home) ──────────────────┐  │
│  │  🟡 60% — Galvanized pipe replacement ($2K–5K)        │  │
│  │  🟡 70% — Cast iron drain replacement ($1K–4K)        │  │
│  │  🟡 70% — Lead paint safe removal ($1K–3K)            │  │
│  │  🟡 40% — Asbestos testing + abatement ($2K–8K)       │  │
│  │                                                       │  │
│  │  💡 These will be confirmed during demolition.        │  │
│  │     Your estimate includes weighted costs for these.  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Total Estimate ──────────────────────────────────────┐  │
│  │                                                       │  │
│  │   Low End          Most Likely          High End       │  │
│  │   $16,400    ────── $29,500 ──────    $42,600         │  │
│  │                                                       │  │
│  │   Timeline: 7 – 10 weeks                              │  │
│  │   Contingency: $2,400 built in                        │  │
│  │                                                       │  │
│  │   ⚠️ We recommend a professional inspection for:      │  │
│  │      • Subfloor extent (how far does the rot go?)     │  │
│  │      • Pipe material confirmation (behind walls)      │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  View Full Plan  │  │  Generate Timeline & Tasks ▶  │  │
│  └──────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix: The Hidden Cost/Time Drivers — Frequency Table

| Hidden Issue | Cost Impact | Time Impact | How Often It Occurs |
|---|---|---|---|
| Rotted subfloor (near toilet) | +$500–2,000 | +1–2 days | ~30% of remodels |
| Galvanized pipes need replacement | +$2,000–5,000 | +2–3 days | ~40% in pre-1970 homes |
| Inadequate venting (gurgling) | +$500–1,500 | +1 day | ~25% |
| Mold behind existing tile | +$1,000–5,000 | +1–3 days | ~20% |
| Asbestos tile/mastic | +$2,000–8,000 | +3–5 days | ~15% in pre-1980 homes |
| Subfloor too thin for tile | +$500–1,500 | +1 day | ~20% |
| No exhaust vent to exterior | +$300–1,000 | +0.5 day | ~35% in older homes |
| Undersized electrical panel | +$1,500–3,000 | +1 day | ~10% |
| Cast iron drain pipe failure | +$1,000–4,000 | +1–2 days | ~25% in pre-1970 homes |
| Load-bearing wall in reconfig | +$2,000–10,000 | +3–5 days | ~10% of wall removals |
| Polybutylene pipe failure | +$2,000–4,000 | +2 days | ~20% in 1980–1999 homes |
| Knob-and-tube wiring | +$3,000–8,000 | +3 days | ~70% in pre-1950 homes |
| Aluminum wiring | +$2,000–5,000 | +2 days | ~30% in 1965–1973 homes |
