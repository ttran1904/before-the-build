# Before The Build — Implementation Plan: Bathroom Renovation MVP

> **Scope**: Bathroom renovation only. Other rooms are placeholders (greyed out / "Coming Soon").
> **Goal**: Scaffold visuals and functionality as much as possible, integrating real APIs to show what the product would look like.

---

## Current State Assessment

| Area | Status |
|------|--------|
| Marketing Homepage | ✅ Built — beautiful visuals, room showcase, Gantt preview, budget preview |
| Dashboard Layout | ✅ Built — sidebar nav with all major sections |
| Onboarding Wizard | ⚠️ Scaffolded — 5-step wizard UI exists but **no data persistence** |
| Explore Page | ⚠️ Scaffolded — search + source filters, empty content grid |
| Design Page | ⚠️ Scaffolded — 2D/3D toggle, side panel categories, all placeholders |
| Chat Page | ⚠️ Scaffolded — message UI works, sends placeholder responses |
| Build Book Page | ⚠️ Scaffolded — section layout, no real data |
| Projects List | ⚠️ Scaffolded — empty state only |
| Database Schema | ✅ Comprehensive — 2 migrations cover all tables |
| Edge Functions | ⚠️ Stubs only — ai-chat, ai-recommendations, generate-build-book |
| Shared Types | ✅ Well-defined — all models, enums, constants |
| Authentication | ❌ Not wired — Firebase Auth planned (not Supabase Auth) |

---

## Feature Implementation Plan (7 Features)

### Feature 1: Home Page — Room Selector + Bathroom Gallery + Moodboard

**What**: Horizontal room selector conveyor belt (like Houzz) at the top of the Explore/Home page. Only "Bathroom" is clickable. Then a Pinterest-style masonry gallery of bathroom inspiration images. Users can click to save images to a Moodboard.

#### 1A. Room Selector (Houzz-style Conveyor Belt)

| Task | Details |
|------|---------|
| **Build** | Horizontal scrollable bar with room category thumbnails |
| **Rooms** | Kitchen, Bathroom, Bedroom, Living Room, Dining Room, Garage, etc. |
| **Active** | Only **Bathroom** is selectable/clickable |
| **Others** | Greyed out with "Coming Soon" overlay or lock icon |
| **UI ref** | Houzz category bar — rounded thumbnail images, label below, scroll left/right |

**Component**: `RoomCategoryBar` — goes at top of `/explore` page or new `/` landing after login.

#### 1B. Pinterest-Style Image Gallery (Bathroom Inspiration)

| Task | Details |
|------|---------|
| **API** | Pinterest API v5 — `GET /pins` and `GET /search/pins` |
| **Auth** | OAuth2 → access token. Requires business account + trial approval |
| **Fallback** | If Pinterest approval pending: use static placeholder images until approved |
| **Layout** | Masonry grid (like Pinterest) — use CSS columns or `react-masonry-css` |
| **Images** | Search for: `bathroom remodel`, `bathroom renovation`, `modern bathroom`, `bathroom tiles`, `bathroom vanity` |
| **Interaction** | Hover → heart icon + "Save to Moodboard" button |

**API Strategy**:
```
PRIMARY:   Pinterest API v5 → GET /search/pins?query=bathroom+renovation
CACHE:     Supabase Storage + CDN (cache images to avoid rate limits)
```

**Env Vars Needed**:
```
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_ACCESS_TOKEN=
```

#### 1C. Moodboard (Save & Organize)

| Task | Details |
|------|---------|
| **DB** | `mood_boards` + `inspiration_items` tables already exist |
| **UI** | "My Moodboard" sidebar or separate `/moodboard` page |
| **Save action** | Click heart → save to `inspiration_items` with source, image_url, tags |
| **View** | Grid of saved images, option to add notes, remove |
| **Export** | Later feeds into Build Book and AI style analysis |

**Implementation Steps**:
1. Create Supabase Edge Function `pinterest-search` — proxy to Pinterest/Unsplash API
2. Build `RoomCategoryBar` component
3. Build `MasonryGallery` component with infinite scroll
4. Build `MoodboardPanel` component (slide-out sidebar)
5. Wire save/unsave to Supabase `inspiration_items` table
6. Add Moodboard view page

---

### Feature 2: Image Gallery Styles (Pinterest API Integration)

**What**: Full gallery browsing with style filters (Modern, Farmhouse, Coastal, etc.) pulling from Pinterest API.

| Task | Details |
|------|---------|
| **Extend** Feature 1B | Same API, but add **style filters** from `DESIGN_STYLE_LABELS` |
| **Search combos** | `"{style} bathroom"` → e.g. `"modern bathroom"`, `"farmhouse bathroom"` |
| **Filter UI** | Pill buttons for each style (already similar pattern in Explore page) |
| **Board creation** | Auto-create a Pinterest-style board per style the user likes |

**Pinterest API Endpoints**:
```
Search Pins:    GET /v5/search/pins?query={query}&bookmark={pagination}
Get Pin:        GET /v5/pins/{pin_id}
User Boards:    GET /v5/boards
Create Board:   POST /v5/boards (for moodboard sync)
Save Pin:       POST /v5/pins (save to board)
```

**Implementation Steps**:
1. Build `StyleFilterBar` component with all `DesignStyle` options
2. Update gallery search to combine room type + style
3. Add "bathroom + {style}" search with debounced query
4. Paginate with Pinterest bookmarks or Unsplash page numbers

---

### Feature 3: TurboTax-Style Questionnaire (Goal + Budget Wizard)

**What**: After selecting Bathroom, user goes through a guided multi-step questionnaire (like TurboTax) to define their renovation goal and budget.

#### 3A. Goal Questions

| Step | Question | Options |
|------|----------|---------|
| 1 | What's the main goal of your bathroom renovation? | • Increase home value → focus on ROI upgrades (vanity, tile, fixtures) |
| | | • Create more space → reconfigure layout, remove tub for walk-in shower |
| | | • Make it more energy efficient → low-flow fixtures, LED lighting, better ventilation |
| | | • Update the style → change aesthetic (modern, farmhouse, spa-like) |
| | | • Make it family/kid-friendly → non-slip floors, tub, storage, durability |
| | | • Improve accessibility → walk-in shower, grab bars, ADA compliance |
| | | • Fix existing problems → leaks, mold, outdated plumbing, broken tiles |
| | | • Increase storage → vanity with drawers, medicine cabinet, shelving |
| | | • Create a spa/luxury experience → soaking tub, rain shower, heated floors |
| 2 | What's the scope? | • Cosmetic refresh (paint, fixtures, hardware) |
| | | • Partial remodel (new vanity, flooring, paint) |
| | | • Full remodel (gut + rebuild everything) |
| | | • Addition (expand bathroom footprint) |
| 3 | Must-haves vs Nice-to-haves | Drag items into two columns |

**Common Bathroom Renovation Goals** (researched):
- **Increase home value**: Bathroom remodels recoup 60-70% ROI. Focus on vanity, fixtures, tile.
- **Create more space**: Remove tub → walk-in shower, wall-mounted vanity, recessed storage.
- **Energy efficient**: Low-flow toilets (1.28 GPF), LED lighting, tankless water heater, exhaust fan.
- **Modernize style**: Floating vanity, large-format tile, frameless glass shower, matte black fixtures.
- **Kid-friendly**: Non-slip tile, tub with handheld shower, rounded countertop edges, lots of storage.
- **Accessibility/aging-in-place**: Curbless shower, grab bars, comfort-height toilet, wider doorway.
- **Fix problems**: Plumbing/pipe repair, mold remediation, waterproofing, ventilation fixes.
- **Luxury/spa**: Freestanding soaking tub, rain showerhead, heated floors, towel warmer, steam shower.

#### 3B. Budget Wizard

| Range | Small Bath (35-45 sqft) | Medium Bath (45-75 sqft) | Large/Master (75+ sqft) |
|-------|------------------------|--------------------------|------------------------|
| **Basic** | $5,000 – $10,000 | $10,000 – $20,000 | $15,000 – $30,000 |
| **Mid-Range** | $10,000 – $20,000 | $20,000 – $35,000 | $30,000 – $50,000 |
| **High-End** | $20,000 – $40,000 | $35,000 – $60,000 | $50,000 – $100,000+ |

| Task | Details |
|------|---------|
| **UI** | Slider + preset buttons (Basic / Mid / High) |
| **Contingency** | Auto-add 10% contingency line item |
| **Breakdown** | Show estimated split: Materials (40-50%), Labor (30-40%), Permits (5%), Contingency (10%) |
| **AI assist** | Claude generates budget breakdown based on scope + goal + size |

**Budget Data Sources** (for realistic estimates):
```
Remodeling Magazine Cost vs Value Report: industry standard data
HomeAdvisor / Angi cost guides: bathroom remodel averages
National Kitchen & Bath Association (NKBA): fixture cost ranges
```

#### 3C. Implementation

| Task | Details |
|------|---------|
| **New route** | `/dashboard/projects/new/bathroom` — bathroom-specific questionnaire |
| **State mgmt** | React context or Zustand store for wizard state |
| **Persistence** | Save answers to Supabase `projects` table (goals, budget, must_haves, nice_to_haves) |
| **AI summary** | After wizard → call Claude to generate project summary + recommendations |

**Implementation Steps**:
1. Create `BathroomWizard` component with steps: Goal → Scope → Must-Haves → Budget → Summary
2. Build each step as a sub-component with animated transitions
3. Create Supabase Edge Function `bathroom-budget-estimate` — Claude generates budget breakdown
4. Save wizard results to projects table
5. Generate AI summary of the renovation plan
6. Route to dashboard with project populated

---

### Feature 4: 2D Room Visualizations (AI-Generated)

**What**: After the user completes the questionnaire and moodboard, generate 2D images of how the remodeled bathroom would look from different angles.

#### API Options (Researched)

| Tool | What It Does | API | Cost | Best For |
|------|-------------|-----|------|----------|
| **OpenAI DALL-E 3** | Text-to-image generation | `POST /v1/images/generations` | $0.040-0.080/image | Quick concept images |
| **OpenAI GPT-4o (Vision + Generation)** | Edit existing photos, generate from reference | Images API | $0.040-0.080/image | Photo-realistic edits of user's actual bathroom |
| **Stability AI (Stable Diffusion)** | High quality architectural renders | REST API | $0.002-0.006/image | Cost-effective batch generation |
| **Replicate (ControlNet)** | Transform room photos while preserving layout | REST API | ~$0.02/image | Take user photo → restyle it |
| **RoomGPT / DecorAI** | Specialized room redesign | REST API | Varies | Purpose-built for room redesign |

**Recommended Strategy**:
```
TIER 1: OpenAI DALL-E 3 or GPT Image Generation
  - Generate "bathroom remodel" images based on user's style + scope
  - Prompt engineering with: room dimensions, style, color palette, fixtures

TIER 2: Replicate ControlNet (for photo uploads)
  - User uploads current bathroom photo
  - AI preserves layout/structure but applies new style
  - Multiple angle views from one reference

TIER 3: Stability AI for batch generation (cost optimization)
  - Generate multiple concepts per style at lower cost
```

**Prompt Template**:
```
"Professional interior design photograph of a {scope} bathroom remodel.
Style: {style}. Features: {must_haves}.
Budget level: {budget_tier}. Room size: {dimensions}.
Angle: {angle}. Natural lighting, high resolution, award-winning design."
```

**Angles to Generate**:
1. Full room view (from doorway)
2. Vanity/sink area close-up
3. Shower/tub area close-up
4. Detail shot (fixtures, tile, lighting)

**Env Vars Needed**:
```
OPENAI_API_KEY=
STABILITY_API_KEY= (optional)
REPLICATE_API_TOKEN= (optional)
```

**Implementation Steps**:
1. Create Supabase Edge Function `generate-room-images` 
2. Build prompt from user's wizard answers + moodboard style analysis
3. Call OpenAI Images API with prompt
4. Store generated images in Supabase Storage
5. Build `RoomVisualization` component with image carousel/gallery
6. Add "Regenerate" and "Try different angle" buttons
7. Show loading states with progress animation

---

### Feature 5: Materials & Furniture Side Panel (Product Search)

**What**: Next to the 2D room visualization, show a side panel with actual products (vanity, tiles, fixtures, etc.) from Wayfair, Home Depot, and Pinterest, with real prices and store logos.

#### API Reality Check

| Retailer | Public Product Search API? | Alternative |
|----------|---------------------------|-------------|
| **Wayfair** | ❌ No — supplier-only GraphQL API for inventory/catalog management | Use **SerpAPI** Google Shopping or **web scraping via Oxylabs/ScraperAPI** |
| **Home Depot** | ❌ No public API — affiliate program only | Use **RapidAPI Home Depot endpoint** or **SerpAPI** |
| **Pinterest** | ✅ Pin search — but for inspiration, not product listings with prices | Use for visual inspiration only |

**Recommended Approach**: Use **SerpAPI Google Shopping** to get real product data across all retailers.

```
SerpAPI Google Shopping:
  GET https://serpapi.com/search?engine=google_shopping&q=bathroom+vanity&tbs=mr:1,merchagg:m114978529 (Wayfair)
  GET https://serpapi.com/search?engine=google_shopping&q=bathroom+vanity&tbs=mr:1,merchagg:m7815328441 (Home Depot)

Returns: title, price, link, thumbnail, source, rating, reviews
```

**Alternative**: **RapidAPI** has dedicated endpoints:
```
RapidAPI - Home Depot:     GET /products/search?query=bathroom+vanity
RapidAPI - Wayfair:        GET /products/search?keyword=bathroom+vanity
RapidAPI - Real-Time:      Google Shopping API wrapper
```

#### Product Categories for Bathroom Renovation

| Category | Search Queries | Budget Ranges |
|----------|---------------|---------------|
| **Vanity/Sink** | "bathroom vanity", "bathroom sink" | Basic $200-500, Mid $500-1500, High $1500-5000 |
| **Toilet** | "toilet", "comfort height toilet" | Basic $150-300, Mid $300-600, High $600-2000 |
| **Shower/Tub** | "walk-in shower kit", "bathtub", "shower door" | Basic $300-800, Mid $800-2500, High $2500-8000 |
| **Tile/Flooring** | "bathroom floor tile", "shower tile" | Basic $2-5/sqft, Mid $5-15/sqft, High $15-50/sqft |
| **Fixtures** | "bathroom faucet", "showerhead", "towel bar" | Basic $50-150, Mid $150-400, High $400-1500 |
| **Lighting** | "bathroom vanity light", "recessed light" | Basic $30-100, Mid $100-300, High $300-800 |
| **Mirror/Cabinet** | "bathroom mirror", "medicine cabinet" | Basic $50-150, Mid $150-500, High $500-2000 |
| **Accessories** | "towel rack", "toilet paper holder", "soap dispenser" | Basic $20-50, Mid $50-150, High $150-500 |

#### Side Panel UI

```
┌─────────────────────────┐
│  💰 Budget: Mid-Range   │
│  🎨 Style: Modern       │
│  📐 Scope: Full Remodel │
│─────────────────────────│
│  ▸ Vanity & Sink        │
│    ┌─────────────────┐  │
│    │ [img] Wayfair    │  │
│    │ Modern 36" Vanity│  │
│    │ ★★★★☆  $849     │  │
│    └─────────────────┘  │
│    ┌─────────────────┐  │
│    │ [img] HomeDepot  │  │
│    │ Glacier Bay 30"  │  │
│    │ ★★★★★  $399     │  │
│    └─────────────────┘  │
│  ▸ Toilet               │
│  ▸ Shower/Tub           │
│  ▸ Tile & Flooring      │
│  ▸ Fixtures             │
│  ▸ Lighting             │
│  ▸ Mirror & Cabinet     │
│  ▸ Accessories          │
│─────────────────────────│
│  TOTAL: $8,450 - $12,300│
│  [Add to Build Book]    │
└─────────────────────────┘
```

**Env Vars Needed**:
```
SERPAPI_KEY=
# OR
RAPIDAPI_KEY=
```

**Implementation Steps**:
1. Create Supabase Edge Function `product-search` — proxies to SerpAPI/RapidAPI
2. Build `ProductCard` component (image, name, price, store logo, rating, link)
3. Build `MaterialsSidePanel` component with accordion categories
4. Filter products by budget range (Basic/Mid/High)
5. Match products to user's style from moodboard
6. Show 3 budget tiers for each category
7. Add "Add to project" functionality → save to `furniture_items` table
8. Calculate running total
9. Store logos: Wayfair, Home Depot, Pinterest (as static assets)

---

### Feature 6: Time Management (Asana Integration — Kanban + Gantt)

**What**: Use Asana API to create and manage renovation tasks. Display in Kanban and Gantt views. Claude AI helps determine task order and dependencies.

#### Asana API Integration

| Feature | Asana Endpoint | Purpose |
|---------|---------------|---------|
| Create Project | `POST /projects` | Create "Bathroom Renovation" project |
| Create Sections | `POST /sections` | To Do, In Progress, Done, Blocked |
| Create Tasks | `POST /tasks` | Individual renovation tasks |
| Set Dependencies | `POST /tasks/{id}/addDependencies` | Task ordering |
| Update Task | `PUT /tasks/{id}` | Move between sections, update dates |
| Get Tasks | `GET /tasks?project={id}` | Fetch all tasks for display |

**Auth**: Personal Access Token (PAT) for MVP, OAuth for production.

#### Task Generation (Claude AI)

Based on the user's goal, scope, and budget, Claude generates a bathroom renovation task list:

**Example Generated Tasks for Full Bathroom Remodel**:

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **1. Planning** | Finalize design + select materials | 1-2 weeks | — |
| | Get permits | 1-3 weeks | Design finalized |
| | Order materials (long-lead items first) | 1-2 weeks | Design finalized |
| **2. Demolition** | Protect adjacent areas | 1 day | Permits approved |
| | Remove old fixtures, tile, vanity | 2-3 days | Protection done |
| | Inspect plumbing & electrical | 1 day | Demo complete |
| **3. Rough Work** | Plumbing rough-in | 2-3 days | Inspection done |
| | Electrical rough-in | 1-2 days | Inspection done |
| | Waterproofing/moisture barrier | 1-2 days | Plumbing done |
| **4. Installation** | Install tub/shower base | 1 day | Rough work done |
| | Install tile (floor + walls) | 3-5 days | Waterproofing cured |
| | Install vanity + sink | 1 day | Tile done |
| | Install toilet | 0.5 day | Tile done |
| | Install fixtures (faucets, showerhead) | 1 day | Vanity + tub done |
| **5. Finishing** | Paint | 1-2 days | All installs done |
| | Install mirror, lighting, accessories | 1 day | Paint dried |
| | Final plumbing connections | 0.5 day | Everything installed |
| | Clean up + final inspection | 1 day | All work done |

**Est. Total Duration**: 4-8 weeks (depending on scope)

#### Kanban View

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   TO DO      │ IN PROGRESS  │    DONE      │   BLOCKED    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Get permits  │ Select tiles │ Finalize     │              │
│ Order vanity │              │ design       │              │
│ Order tile   │              │              │              │
│ Schedule     │              │              │              │
│ contractor   │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Gantt View

Use **frappe-gantt** (free, open source) or **@bryntum/gantt** (paid, more features).

**Recommendation**: `frappe-gantt` for MVP — simple, free, good enough.

```
npm install frappe-gantt
```

**Env Vars Needed**:
```
ASANA_PAT= (Personal Access Token)
ASANA_WORKSPACE_ID=
```

**Implementation Steps**:
1. Create Supabase Edge Function `generate-tasks` — Claude generates task list from project data
2. Create Supabase Edge Function `asana-sync` — syncs tasks to/from Asana
3. Build `KanbanBoard` component (drag-and-drop columns)
4. Build `GanttChart` component (using frappe-gantt)
5. Build toggle between Kanban and Gantt views
6. Add task creation/editing modal
7. Wire drag-and-drop to update Asana tasks
8. Show task dependencies as arrows in Gantt view
9. Create new page `/dashboard/projects/[id]/timeline`

---

### Feature 7: Connect to Contractor (Thumbtack Integration)

**What**: Search for bathroom renovation contractors via Thumbtack. Show pricing estimation. Do NOT enable booking/ordering — display only.

#### Thumbtack Developer API (developers.thumbtack.com)

Thumbtack now offers a **Partner Platform API** with endpoints for homeowners and professionals.

**API for Homeowners** (what we use):

| Feature | Endpoint | Purpose |
|---------|----------|--------|
| **Businesses Search** | `GET /businesses/search` | Find top businesses by location + service category |
| **Popular Categories** | `GET /categories` | Discover trending service categories by zip code |
| **Autocomplete** | `GET /keywords/autocomplete` | Smart search suggestions |
| **Messaging** | `POST /messages` | Chat directly with contractors |

**Low-code Widgets** (bonus options):
- **Pro List Widget (PLW)** — embeddable contractor search by zip code
- **Service Page Widget (SPW)** — detailed business pages with reviews, photos
- **Request Flow Widget (RFW)** — enter project details, get quotes from multiple businesses

**Auth**: Request access at developers.thumbtack.com/request-access → approval required.

**Status**: Access requested, awaiting approval.

#### Contractor Card UI
```
┌─────────────────────────────────────────────┐
│ [Photo]  ★★★★★ (127 reviews)               │
│ ABC Bathroom Remodeling                      │
│ 📍 2.3 miles away • San Jose, CA            │
│ 💰 Typical range: $8,000 - $25,000          │
│ ✅ Licensed • ✅ Insured • ✅ Background Check │
│                                              │
│ "Specializing in modern bathroom renovations │
│  for over 15 years..."                       │
│                                              │
│ [View Profile]  [View on Thumbtack ↗]        │
│ ⚠️ Contact contractor directly — we don't   │
│    handle bookings                           │
└─────────────────────────────────────────────┘
```

**Price Estimation** (Claude AI):
Based on the user's scope + budget, Claude generates a price range estimation for contractor labor specifically (separate from materials):

| Scope | Labor Cost Estimate |
|-------|-------------------|
| Cosmetic refresh | $1,000 – $3,000 |
| Partial remodel | $3,000 – $8,000 |
| Full remodel | $8,000 – $20,000 |
| Addition | $15,000 – $40,000+ |

**Env Vars Needed**:
```
THUMBTACK_CLIENT_ID=
THUMBTACK_CLIENT_SECRET=
```

**Implementation Steps**:
1. Create Supabase Edge Function `contractor-search` — proxies to Thumbtack Businesses Search API
2. Build `ContractorCard` component
3. Build `ContractorList` page with ZIP code input + sort/filter
4. Add Claude-generated labor cost estimate
5. Optionally embed Thumbtack Pro List Widget for quick integration
6. Create new page `/dashboard/projects/[id]/contractors`
7. Add disclaimer: "We don't handle bookings"

---

## Complete Environment Variables Needed

```env
# === Supabase (Database, Storage, Realtime) ===
NEXT_PUBLIC_SUPABASE_URL=         # ✅ Configured
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # ✅ Configured
SUPABASE_SERVICE_ROLE_KEY=

# === Authentication ===
# Using Firebase Authentication (not Supabase Auth)
# Firebase config vars TBD during auth setup

# === AI ===
ANTHROPIC_API_KEY=                # ✅ Configured — Claude for chat, recommendations, task generation, budget estimates
OPENAI_API_KEY=                   # DALL-E / GPT-4o for room image generation

# === Inspiration / Gallery ===
PINTEREST_APP_ID=                 # Pinterest API (requires approval) — applying last
PINTEREST_APP_SECRET=
PINTEREST_ACCESS_TOKEN=

# === Product Search ===
SERPAPI_KEY=                      # ✅ Configured — Google Shopping search for products (Wayfair, Home Depot)

# === Project Management ===
ASANA_PAT=                        # ✅ Configured — Personal Access Token
ASANA_WORKSPACE_ID=               # ✅ Configured
ASANA_PROJECT_ID=                 # "Before The Build" project

# === Contractor Search ===
THUMBTACK_CLIENT_ID=              # ⏳ Awaiting approval — developers.thumbtack.com
THUMBTACK_CLIENT_SECRET=

# === Optional / Future ===
STABILITY_API_KEY=                # Stability AI for cheaper image generation
REPLICATE_API_TOKEN=              # ControlNet for photo-to-render
```

---

## New Files / Routes to Create

### Web App Pages
```
apps/web/src/app/
  dashboard/
    projects/
      [id]/
        page.tsx              # Project overview
        questionnaire/
          page.tsx            # TurboTax-style wizard (Feature 3)
        visualize/
          page.tsx            # 2D room images + materials panel (Features 4+5)
        timeline/
          page.tsx            # Kanban + Gantt view (Feature 6)
        contractors/
          page.tsx            # Contractor search (Feature 7)
        moodboard/
          page.tsx            # Saved inspiration images (Feature 1C)
```

### Components
```
apps/web/src/components/
  RoomCategoryBar.tsx         # Houzz-style horizontal room selector
  MasonryGallery.tsx          # Pinterest-style image grid
  MoodboardPanel.tsx          # Slide-out moodboard sidebar
  StyleFilterBar.tsx          # Design style pill filters
  BathroomWizard/
    GoalStep.tsx              # Renovation goal selection
    ScopeStep.tsx             # Scope selection
    MustHavesStep.tsx         # Must-haves vs nice-to-haves
    BudgetStep.tsx            # Budget slider + tier selection
    SummaryStep.tsx           # AI-generated summary
  RoomVisualization.tsx       # AI-generated room images carousel
  ProductCard.tsx             # Product item with price + store logo
  MaterialsSidePanel.tsx      # Accordion of product categories
  KanbanBoard.tsx             # Drag-and-drop task board
  GanttChart.tsx              # frappe-gantt wrapper
  ContractorCard.tsx          # Contractor listing card
  ContractorList.tsx          # Filtered contractor search results
```

### Supabase Edge Functions
```
supabase/functions/
  pinterest-search/index.ts   # Proxy to Pinterest/Unsplash API
  product-search/index.ts     # Proxy to SerpAPI for Wayfair/HomeDepot products
  generate-room-images/index.ts  # OpenAI DALL-E image generation
  generate-tasks/index.ts     # Claude generates renovation task list
  asana-sync/index.ts         # Sync tasks to/from Asana
  contractor-search/index.ts  # Proxy to Thumbtack Businesses Search API
  bathroom-budget-estimate/index.ts # Claude generates budget breakdown
```

### New Dependencies
```json
{
  "react-masonry-css": "^1.0.16",
  "frappe-gantt": "^0.6.1",
  "@hello-pangea/dnd": "^16.6.0",
  "zustand": "^4.5.0",
  "recharts": "^2.12.0"
}
```

---

## Implementation Order (Build Phases)

### Phase 0: Foundation (Do First)
- [ ] Wire up Firebase Auth (sign up / sign in / session)
- [ ] Create auth context + protected routes
- [ ] Create project CRUD operations
- [ ] Set up environment variables

### Phase 1: Gallery + Moodboard (Features 1 + 2)
- [ ] Build `RoomCategoryBar` (only Bathroom active)
- [ ] Apply for Pinterest API trial access
- [ ] Build `MasonryGallery` with infinite scroll
- [ ] Build `StyleFilterBar`
- [ ] Build `MoodboardPanel` + save to Supabase
- [ ] Create `pinterest-search` edge function

### Phase 2: Questionnaire (Feature 3)
- [ ] Build `BathroomWizard` multi-step form
- [ ] Create goal, scope, must-haves, budget steps
- [ ] Save answers to projects table
- [ ] Build `bathroom-budget-estimate` edge function (Claude)
- [ ] Generate AI project summary

### Phase 3: Room Visualization + Products (Features 4 + 5)
- [ ] Create `generate-room-images` edge function (OpenAI)
- [ ] Build `RoomVisualization` component
- [ ] Set up SerpAPI for product search
- [ ] Build `ProductCard` + `MaterialsSidePanel`
- [ ] Create `product-search` edge function
- [ ] Wire budget filtering to product search
- [ ] Calculate running totals

### Phase 4: Timeline + Contractors (Features 6 + 7)
- [ ] Create `generate-tasks` edge function (Claude)
- [ ] Set up Asana API with PAT ✅
- [ ] Build `KanbanBoard` + `GanttChart`
- [ ] Create `asana-sync` edge function
- [ ] Integrate Thumbtack Businesses Search API (once approved)
- [ ] Build `ContractorCard` + `ContractorList`
- [ ] Create `contractor-search` edge function
- [ ] Optionally embed Thumbtack Pro List Widget

### Phase 5: Build Book + Polish
- [ ] Wire `generate-build-book` edge function to compile all data
- [ ] Build Book page pulls real data from all features
- [ ] PDF export (react-pdf or server-side Puppeteer)
- [ ] Polish UI, loading states, error handling

---

## API Signup Checklist

| API | URL | Free Tier | Status |
|-----|-----|-----------|--------|
| **Anthropic Claude** | https://console.anthropic.com | Pay-per-use | ✅ Key configured |
| **SerpAPI** | https://serpapi.com | 100 searches/mo | ✅ Key configured |
| **Asana** | https://app.asana.com/0/developer-console | Free | ✅ PAT + Workspace ID configured |
| **Thumbtack** | https://developers.thumbtack.com | Partner access | ⏳ Access requested, awaiting approval |
| **Pinterest** | https://developers.pinterest.com | Trial access | 📋 Applying last — needs business account |
| **OpenAI** | https://platform.openai.com | $5 free credit | 📋 Sign up when ready for image generation |

---

## Summary

This plan transforms the app from scaffolded UI to a functional bathroom renovation planner by integrating:

1. **Pinterest** → Inspiration gallery + moodboard
2. **Pinterest + Style Filters** → Curated style browsing
3. **Claude AI** → TurboTax-style questionnaire with smart budget estimation
4. **OpenAI DALL-E** → AI-generated bathroom visualization from multiple angles
5. **SerpAPI (Google Shopping)** → Real products from Wayfair + Home Depot with prices
6. **Asana API + Claude** → Task management in Kanban/Gantt views
7. **Thumbtack API** → Contractor discovery with pricing

All other rooms show "Coming Soon" — the architecture is designed so adding a new room type is just unlocking the room selector + adjusting search queries and task templates.
