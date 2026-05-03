---
applyTo: "apps/web/src/**/*.tsx,apps/web/src/**/*.ts,apps/mobile/src/**/*.tsx,apps/mobile/src/**/*.ts"
---

# Customer Experience Instructions

These rules govern *how the product feels*, not just how it looks. Every screen, flow, deliverable, and microcopy choice should be filtered through them.

## The Feel (north star)
- **The customer is the main character.** We are the calm, knowledgeable companion sitting next to them - never the hero, never the expert showing off. Their decisions, their project, their report.
- **Handheld guidance, never hand-holding.** The path forward is always obvious without a tutorial. We never say "Click here next." Instead we *make the next step the visually loudest thing in the room.*
- **Quietly thorough.** Behind every simple-looking screen there is a lot of structure (assumption logs, responsibility matrices, sensitivity ranges, readiness scores). We surface depth *only when it helps*; we never overwhelm with everything at once.
- **Subtly anticipatory.** Give people what they will need next *before* they ask. If a number is shown, the "why" is one click away. If a decision is open, the consequence is already noted. The user should feel: *"Huh - they already thought of that."*
- **Calm, never clinical.** Warm neutrals, serif headings, generous whitespace. No corporate dashboard density. No status badges that shout. Information has *room to breathe*.
- **Trust over flash.** We never use animations, emoji, or excited copy to signal value. Value comes from accuracy, completeness, and the feeling of "someone careful made this for me."

## How to apply this in practice

### 1. Information layering
- **Overview first, depth on demand.** If a screen contains more than ~3 distinct categories of content, use tabs / segmented views with a clear default Overview that gives the gist in one viewport.
- **Three-second test.** A first-time user must understand *what this screen is and what they should do* within ~3 seconds. If not, simplify the headline + primary action.
- **One primary action per view.** Secondary paths exist but never compete visually with the primary one.

### 2. Anticipation patterns
- **Define-on-hover / define-inline.** Any jargon (rough-in, blocking, GFCI, schluter) gets a quiet inline definition the first time it appears, not a glossary on a different page.
- **"Why this matters" sidecars.** Numbers and ranges should be accompanied by a short, calm sentence explaining what drives them (e.g., *"Range is wide because two finish selections are still open."*).
- **Pre-answered questions.** When showing data, ask yourself: *"What is the user about to wonder?"* - and answer it adjacent to the data, not in a separate help doc.

### 3. Voice and microcopy
- **Second person, plain English.** "You", "your project", "your contractor". Never "the user", never "we recommend you should".
- **Verbs for actions, nouns for labels.** CTAs are verbs ("Open Build Book", "Confirm vanity"). Section labels are nouns ("Open Items", "Responsibilities").
- **No marketing fluff and no hype words.** Never "amazing", "unlock", "powerful", "AI-powered", "revolutionize". Replace with what it actually does.
- **Acknowledge uncertainty honestly.** If something is unknown or assumed, say so plainly. *"This estimate assumes..."* is more trustworthy than a single confident number.

### 4. Anti-patterns (do not ship)
- Walls of text without scannable structure (headings, tables, chips).
- Tooltips as the *only* way to access important context.
- Loud status pills (DONE!, WARNING!) - prefer quiet typographic labels (`DEFINED`, `ASSUMED`, `EXCLUDED`).
- Multiple competing primary CTAs in the same viewport.
- Gamification (progress bars that congratulate, badges, streaks).
- Onboarding tours / coachmarks. The UI itself should teach.
- Telling the user what to *feel* ("Awesome!", "You''re crushing it!").

### 5. Density and pacing
- A long deliverable (e.g., scope report, build book) should be paginated by *meaning* (Overview, Scope, Budget, Decisions, Roles, Readiness) - not by length.
- Within a tab/section, lead with the most actionable artifact (the table, the matrix, the price block). Supporting prose is *below* the artifact, not above.
- White space is content. Resist the urge to fill it.

### 6. The "silent gift" test
Before shipping a screen, ask:
> *Did we give the user something they didn''t ask for, that they''ll be quietly grateful for the moment they notice it?*

Examples that pass:
- A responsibility matrix the user never asked for, but will need the day before demo starts.
- An assumption log auto-derived from their answers, so they walk into a builder conversation already armed.
- A "why the range is wide" sentence next to the price band.

If the answer is "no", the screen is still just functional - push it further.

## When in doubt
Match the tone and structure of the Groundwork Scope Report and the `/dashboard/guide` page. Those are the canonical implementations of this feel.
