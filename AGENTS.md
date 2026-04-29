# Before The Build Agent Instructions

## Scope
These instructions apply to the entire repository.

## Project Context
- Monorepo with npm workspaces and Turborepo.
- Web app: Next.js in apps/web.
- Mobile app: Expo React Native in apps/mobile.
- Shared package: packages/shared.
- Backend data and server logic: Supabase (migrations, storage, edge functions).

## Core Behavior
- Make small, targeted changes that match existing patterns.
- Preserve existing architecture and naming unless explicitly asked to refactor.
- When requirements are unclear, ask a focused clarifying question.
- Prefer concrete implementation over abstract advice when asked to build/fix.

## Planning And Execution
- For non-trivial tasks, create a short plan before editing.
- After code changes, run relevant checks where possible:
  - npm run lint
  - npm run build:web
  - npm run build
- If a full check is expensive, run the narrowest useful check and report what was not run.

## Supabase Access And Usage
- You are allowed to read, write, and look up resources in Supabase for this project.
- Supabase CLI is available and may be used for:
  - migrations and schema inspection
  - edge function deploy/test
  - local dev workflows
- Prefer safe, auditable operations:
  - inspect first, then modify
  - explain data-impacting changes before applying them
  - avoid destructive operations unless explicitly requested
- When changing schema or edge functions:
  - include migration files in supabase/migrations
  - keep TypeScript edge function code consistent with existing patterns
  - call out required env vars/secrets

## SerpAPI Usage
- You are allowed to use SerpAPI for web research and market lookups.
- Use SerpAPI when fresh external information is needed (vendors, pricing, trends, alternatives).
- Summarize findings with source links and date context.
- Do not hardcode API keys; use environment variables (for example SERPAPI_API_KEY).

## Git Workflow And Commits
- **Auto-commit policy:** whenever you finish a meaningful unit of work that touches files (a feature, a fix, a refactor, a doc update), commit it for me without waiting to be asked. Default to committing.
  - If the change is large, risky, touches many unrelated areas, or you are uncertain it is correct, do NOT auto-commit — instead summarize the diff and ask me to review before committing.
  - If lint/type-check/tests fail, do NOT commit. Fix or surface the failures first.
  - Never push unless I explicitly say so.
- You are allowed to stage files and create commits when asked.
- Use clear, scoped commit messages, preferably conventional style:
  - feat(scope): ...
  - fix(scope): ...
  - chore(scope): ...
  - docs(scope): ...
- Commit only files relevant to the task.
- Before commit:
  - summarize changed files
  - include a short rationale
- Never push unless explicitly requested.

## Code Quality Standards
- Keep functions focused and composable.
- Add or update types for changed public interfaces.
- Add brief comments only for non-obvious logic.
- Avoid introducing new dependencies unless necessary; justify when added.

## Testing Expectations
- Add/update tests for behavior changes when test infrastructure exists.
- For bug fixes, include at least one regression test when practical.
- If tests are not added, state why.

## File And Documentation Hygiene
- Update nearby docs when behavior or developer workflow changes.
- Keep README-level instructions in sync with actual commands.
- For new env vars, document where they are required (web, mobile, supabase functions).

## Monorepo Command Reference
- Install deps: npm install
- Web dev: npm run dev:web
- Mobile dev: npm run dev:mobile
- Lint all: npm run lint
- Build web: npm run build:web
- Build all: npm run build

## Security And Secrets
- Never commit secrets or tokens.
- Redact sensitive values in logs and examples.
- Prefer least-privilege guidance for API keys and database operations.

## Suggested Extra Instructions For Future Iterations
- Add file-scoped instructions in .github/instructions for:
  - apps/web/**: Next.js data fetching, route handlers, caching conventions
  - apps/mobile/**: Expo navigation, device permissions, offline behavior
  - packages/shared/**: strict backwards compatibility for shared types
  - supabase/functions/**: edge function runtime limits and error handling template
- Add PR/review checklist instructions:
  - list risks, migration impact, rollback plan, and test evidence
- Add UX constraints for consumer-facing pages:
  - accessibility minimums (labels, contrast, keyboard support)
  - responsive breakpoints and loading/empty/error states
