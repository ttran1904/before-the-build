---
description: Use when editing Supabase migrations, edge functions, or app-side Supabase clients and sync logic.
applyTo: "supabase/**,apps/web/src/lib/supabase*.ts,apps/web/src/lib/*supabase*.ts,apps/mobile/src/lib/supabase*.ts,apps/mobile/src/lib/*supabase*.ts"
---

# Data Infrastructure Instructions

## Schema And Migrations
- Never edit historical migration files after they are committed.
- Add a new migration for every schema change in supabase/migrations.
- Prefer additive, backward-compatible schema changes where possible.
- If a change is potentially destructive (drop/rename), call out risk and rollback steps before applying.

## Edge Functions
- Keep edge functions in TypeScript and match existing folder patterns in supabase/functions.
- Validate all request inputs and return structured error responses.
- Keep external API calls timeout-aware and handle partial failures explicitly.
- Document required env vars/secrets when adding new integrations.

## App-Side Supabase Access
- Reuse existing client utilities in apps/web/src/lib and apps/mobile/src/lib.
- Keep auth/session behavior consistent with existing app context/store patterns.
- Avoid duplicating query logic; centralize shared operations in reusable helpers when practical.

## Data Safety
- Inspect current schema/state first, then modify.
- For data backfills, prefer idempotent scripts and clear logging.
- Never log secrets, tokens, or sensitive user data.

## Verification
- For schema changes, verify dependent types and query usage compile.
- For edge function changes, validate request/response contracts and expected failure paths.