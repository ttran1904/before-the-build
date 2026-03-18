# Before The Build

A mobile app for home renovation design — plan, visualize, and budget your home projects.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Web | Next.js |
| UI | NativeWind (mobile) + shadcn/ui (web) |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | OpenAI API via Supabase Edge Functions |
| Monorepo | Turborepo + npm workspaces |

## Project Structure

    before-the-build/
    ├── apps/
    │   ├── mobile/        # Expo React Native app (iPhone)
    │   └── web/           # Next.js marketing site & dashboard
    ├── packages/
    │   └── shared/        # Shared types & utilities
    ├── supabase/          # DB migrations & Edge Functions
    ├── turbo.json         # Turborepo config
    └── package.json       # Root workspace config

## Getting Started

    # Install all dependencies
    npm install

    # Start web app
    npm run dev:web

    # Start mobile app
    npm run dev:mobile

## Environment Variables

Create .env.local in apps/web/ and apps/mobile/:

    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
