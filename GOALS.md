# Before The Build — Product Plan

Home renovation planning app. Homeowners scan rooms, explore styles, design in 3D, manage budgets and timelines, and produce a **Build Book** — a shareable document for contractors, vendors, and household members.

**Target**: Homeowners + Contractors | **Platforms**: iOS, Android, Web | **AI**: Anthropic Claude

---

## Features Overview

### 1. Onboarding (Collect Info)
- Who's in the house (adults, kids, pets, habits)
- Which rooms to renovate
- Pick design styles (modern, farmhouse, japandi, etc.)
- Set goals (increase home value, more space, energy efficient, etc.)
- Define must-haves vs nice-to-haves
- Scan rooms with iPhone (or upload photos on Android/web)

### 2. Explore (Inspiration)
- Browse ideas from Pinterest, Instagram, Etsy, Google Images, house tours, resorts, magazines
- Save to mood boards
- AI analyzes saved images → builds your style profile

### 3. Room Scanning
- **iPhone**: Apple RoomPlan API (LiDAR) — captures walls, doors, windows, existing furniture, accurate dimensions
- **Android/Web fallback**: Photo upload → Claude Vision analyzes layout + dimensions; manual input as backup

### 4. AI Chat
- Renovation-expert chatbot (Claude) with full context: your rooms, style, budget, goals
- Ask questions, get suggestions, refine designs conversationally

### 5. Interactive 2D & 3D Room Design
- Main screen: 2D/3D view of rooms built from scan data
- Side panel: furniture marketplace with suggestions (IKEA, Wayfair, Amazon affiliate products)
- Drag-and-drop furniture placement with snap/collision
- Toggle 2D floor plan ↔ 3D walkthrough
- AI recommends items matching your style + budget

### 6. Budget Management
| Sub-feature | Description |
|-------------|-------------|
| **Must-Haves vs Nice-to-Haves** | Every item tagged priority. Two-tab view: locked must-have total + toggleable nice-to-haves |
| **Non-negotiables + Popular Fix Recs** | Flag items as non-negotiable. AI suggests common companion fixes: *"Replacing countertops? Add backsplash ($500-1200), under-cabinet lighting ($200-400)"* |
| **Material vs Labor split** | Every line item breaks into material cost + labor cost. Pie/bar chart per room + project total |
| **Material Price Trends** | Real-time pricing APIs (RSMeans, FRED commodity data, retailer APIs). Sparkline per material: *"Lumber ↑12% last 6mo"* |

### 7. Project Management (Asana-like)
| Sub-feature | Description |
|-------------|-------------|
| **Timeline + Gantt** | Milestones with dependencies. Drag-to-reschedule. AI generates suggested timeline per renovation type |
| **Task Board** | Kanban (To Do → In Progress → Done → Blocked). Filters by assignee, milestone, status |
| **People Management** | Invite contractors, vendors, household members by email. Role-based access: Owner (full), Contractor (tasks + designs), Vendor (supply items), Viewer (read-only) |
| **AI Assist** | Suggests milestones from scope. Flags risks: *"Task X overdue — blocks Milestone Y by 3 days"* |
| **Goal** | Empower homeowners as capable managers of their house project |

### 8. Build Book (Comprehensive Review)
The final deliverable — everything in one shareable document:

| Section | What's in it |
|---------|-------------|
| **Scope Description** | AI-generated summary of goals, household needs, design decisions |
| **Budget Summary** | Must-haves vs nice-to-haves breakdown, material vs labor split, trend charts, total cost |
| **2D Layouts** | Floor plans per room |
| **3D Layouts** | 3D renders per room |
| **Movement Flow** | Gaming-like simulation: people walking, children running, pets moving through the redesigned space |
| **Timeline & Milestones** | Project schedule overview, upcoming tasks, team assignments |
| **Items + Links** | All selected products with affiliate links, specs, pricing |

**Export**: PDF download + shareable web link
**Collaboration**: Real-time editing, comments on rooms/items, role-based access, approval workflows

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Web | Next.js + Tailwind |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| AI | Anthropic Claude (chat, recommendations, vision, build book generation) |
| 3D Engine | React Three Fiber (web), expo-three or WebView (mobile) |
| Furniture Data | Affiliate APIs (IKEA, Wayfair, Amazon) |
| Pricing Data | RSMeans, FRED API, retailer APIs |
| PM / Gantt | frappe-gantt or @bryntum/gantt |
| Monorepo | Turborepo + npm workspaces |

---

## Build Order

| Phase | What | Depends On |
|-------|------|-----------|
| **1. Foundation** | Auth, CRUD data layer, AI chat | — |
| **2. Room Intelligence** | Room scanning (RoomPlan + photo fallback), 3D design engine, furniture 3D models | Phase 1 |
| **3. Content Pipeline** | Explore/inspiration, furniture catalog + affiliates | Phase 1 |
| **4. Budget & Cost** | Budget management, must-have/nice-to-have, material trends, AI popular fix recs | Phase 1 + 3 |
| **5. Project Management** | Gantt/timeline, task board, people/roles, AI PM assist | Phase 1 |
| **6. Build Book & Collab** | Build book generation, PDF export, movement flow sim, live collaboration | All above |

---

## Research Needed

| Topic | Key Question |
|-------|-------------|
| RoomPlan API | Expo-compatible? USDZ → glTF conversion path? |
| 3D Engine | React Three Fiber vs Babylon.js? Shared WebView rendering on mobile? |
| 3D Model Pipeline | Source models from SketchFab / AI generation? Match to affiliate products? |
| Affiliate APIs | IKEA (community API?), Wayfair, Amazon — terms + rate limits? |
| Movement Simulation | A* pathfinding + agent state machines. Existing indoor sim libraries? |
| Material Price APIs | RSMeans vs FRED vs retailer APIs? Update frequency? |
| Gantt Library | frappe-gantt (free) vs @bryntum/gantt (paid)? Mobile Gantt options? |
| PDF Export | Server-side Puppeteer vs client-side @react-pdf/renderer? |

---

## Monetization Ideas

- **Affiliate commissions** on furniture/product purchases
- **Freemium**: Free = 1 project + basic Build Book; Pro = unlimited + 3D + collab + PDF
- **Contractor marketplace**: Contractors pay to be listed/matched with homeowners
- **White-label Build Books**: Contractors produce branded Build Books for clients
- **Premium AI**: Advanced recs, style transfer, cost optimization