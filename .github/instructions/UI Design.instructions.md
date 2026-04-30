---
description: Visual design and UX rules for any Before the Build web/app UI work. Apply to all React/TSX components and Tailwind/CSS edits.
applyTo: "apps/web/src/**/*.tsx,apps/web/src/**/*.ts,apps/web/src/**/*.css,apps/mobile/src/**/*.tsx,apps/mobile/src/**/*.ts"
---

# UI Design Instructions

These rules apply to every UI change (new screens, sections, components, refactors). They exist so the product feels consistent, calm, and trustworthy — not just functional.

## Design North Star
- **Sleek and immediately understandable.** A first-time user should grasp what a screen is and what to do within ~3 seconds. No clever copy that hides intent.
- **Cozy, residential vibe — never corporate SaaS.** Soft warm neutrals, generous whitespace, rounded corners, gentle shadows. We are a renovation companion, not a dashboard tool.
- **Calm hierarchy.** One clear primary action per view. Secondary actions are quieter. Avoid stacking competing CTAs.
- **Show, then explain.** Lead with the visible artifact (card, mockup, deliverable preview) — supporting text comes second.

## Color Palette (canonical)
Use these tokens; do not introduce new accent colors without a reason.

| Role | Hex | Notes |
|---|---|---|
| Brand green (primary) | `#2d5a3d` | CTAs, active state, Build Book accent |
| Brand green (hover) | `#244a32` | Hover for primary green |
| Soft green tint | `#eef3ee` / `#bde0c0` | Backgrounds for green accents |
| Brand terracotta (Groundwork) | `#c08a5a` | Groundwork accent |
| Terracotta tint | `#f6f3ed` | Backgrounds for terracotta accents |
| Ink (primary text) | `#1a1a2e` | Headings, body emphasis |
| Body text | `#4a4a5a` / `#6a6a7a` | Paragraphs, secondary copy |
| Muted text | `#9a9aaa` | Captions, labels |
| Page surface (warm) | `#faf8f3` / `#f8f7f4` | Default page background |
| Card border | `#ece9e3` / `#e8e6e1` | Hairline borders on white cards |

## Typography
- **Section / hero / card titles** use the serif stack (the same family as "Two ways we help" / "Pricing" headings). In code that is `font-serif` (Tailwind) — keep that class on `h1`, `h2`, and product/plan card `h3`.
- **Body, labels, buttons, list items, captions** use the default sans (no class, or `font-sans`). Do **not** make body copy serif.
- **Eyebrow / tag labels:** `text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9aaa]` (or accent color when colored).
- Sizes: hero `text-4xl`/`text-5xl`, section title `text-3xl`/`text-4xl`, card title `text-2xl`/`text-3xl`, body `text-sm`/`text-base`.

## Layout Patterns
- Max content width: `max-w-7xl` for marketing sections, `max-w-5xl`–`max-w-6xl` for app/guide content.
- Section vertical rhythm: `py-20` to `py-24` on marketing sections.
- Cards: `rounded-2xl` (or `rounded-3xl` for marquee plan cards), `border border-[#ece9e3]`, white background, optional `shadow-sm`.
- Buttons: prefer pill shape (`rounded-full`) on marketing pages, `rounded-lg` inside the dashboard.

## Plan / Pricing Card Pattern (canonical)
Every pricing or product card must follow this order top-to-bottom:
1. **Header row:** square icon tile on the left (`h-12 w-12 rounded-xl`, accent bg + accent fg) + tag pill ("FOR YOUR …") immediately to its right.
2. **Title** (`font-serif text-2xl`/`3xl`).
3. **Subtitle** (one short sentence, sans).
4. **Price block — centered, mid-card.** Boxed (`rounded-2xl`), accent-tinted background, large serif price, small uppercase caption underneath. Never put price in the top-right corner.
5. **"What you get" / Deliverables** list with check icons.
6. **CTA button** at the bottom.

Highlight the recommended tier with a thicker accent border and a "Most popular" pill anchored above the card.

## Iconography
- Use `react-icons/fa6` (already in deps). Prefer outlined-feel solid icons; avoid mixing icon libraries.
- Icon color always matches the tile's accent foreground.

## Motion & Interaction
- Subtle `transition` on hover (color, shadow). No bouncy or attention-grabbing animations.
- Forms are conversational and one-question-at-a-time when possible (matches the Groundwork wizard tone).

## Copy Voice
- Plain, warm, second-person ("you / your project"). No jargon, no marketing fluff.
- Labels are nouns ("Deliverables", "What you get", "When to use"). CTAs are verbs ("Start Groundwork Scope", "Open Build Book").

## Anti-patterns (do not ship)
- Price floating in the top-right of a card.
- All-serif body copy (only titles are serif).
- Pure white page backgrounds for marketing — use the warm `#faf8f3` family.
- Hard black (`#000`) text — use `#1a1a2e`.
- Multiple competing primary buttons in the same viewport.
- Dense tables of features without grouping or accent.

## When in doubt
Match the look and structure of the dashboard `/guide` page and the homepage `#pricing` section. Those are the reference implementations.
