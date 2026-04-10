# Before The Build

A mobile app for home renovation design — plan, visualize, and budget your home projects.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo (SDK 55) |
| Web | Next.js 14 (App Router) |
| UI | React Native core (mobile) + Tailwind CSS (web) |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | OpenAI API via Supabase Edge Functions |
| State | Zustand (AsyncStorage on mobile, localStorage on web) |
| Monorepo | Turborepo + npm workspaces |

## Project Structure

```
before-the-build/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   └── src/
│   │       ├── components/    # Reusable mobile components
│   │       ├── lib/           # Store, theme, supabase client
│   │       ├── navigation/    # React Navigation stacks & tabs
│   │       └── screens/       # Screen components (main/, onboarding/, renovate/)
│   └── web/             # Next.js marketing site & dashboard
│       └── src/
│           ├── app/           # Next.js App Router pages
│           ├── components/    # React components
│           └── lib/           # Store, supabase, utilities
├── packages/
│   └── shared/          # Shared types, budget engine, room sizes, units
│       └── src/
│           ├── budget-engine/ # DAG-based budget computation
│           ├── moodboard/     # Moodboard types
│           ├── room-sizes/    # Room size definitions
│           ├── types.ts       # Shared TypeScript types
│           ├── constants.ts   # Shared constants
│           └── units.ts       # Unit conversion utilities
├── supabase/            # DB migrations & Edge Functions
├── turbo.json           # Turborepo config
└── package.json         # Root workspace config
```

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9 (ships with Node 18+)
- **Expo Go** app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Supabase** project (for auth, database, edge functions)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/ttran1904/before-the-build.git
cd before-the-build

# Install all dependencies (runs across all workspaces)
npm install
```

### Environment Variables

Create `.env.local` in **apps/web/**:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Create `.env` in **apps/mobile/**:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running the Web App

```bash
npm run dev:web
# Opens at http://localhost:3000
```

## Running the Mobile App

### Option 1 — Same WiFi (local development)

If you're on **native macOS/Linux** (not WSL), LAN mode works out of the box:

```bash
npm run dev:mobile
# Scan the QR code with your phone camera (iOS) or Expo Go app (Android)
```

### Option 2 — Tunnel mode (WSL or different networks)

If you're on **WSL** or your phone is on a different network, use tunnel mode:

```bash
cd apps/mobile
npx expo start --tunnel
# Scan the QR code — works from anywhere with internet
```

> **Note:** Tunnel mode requires `@expo/ngrok` (already installed as a dev dependency).

### Option 3 — EAS Build (for teammates / cloud builds)

For teammates who don't have the repo running locally, create a development build with [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
# One-time setup: install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS for the project (run from apps/mobile/)
cd apps/mobile
eas build:configure

# Create a development build for iOS
eas build --profile development --platform ios

# Create a development build for Android
eas build --profile development --platform android
```

Once built, teammates install the dev build on their device and connect to your dev server via `--tunnel`, or use [EAS Update](https://docs.expo.dev/eas-update/introduction/) to push OTA updates without rebuilding.

### Quick Reference

| Scenario | Command |
|----------|---------|
| Local dev (native OS, same WiFi) | `npm run dev:mobile` |
| Local dev (WSL or cross-network) | `cd apps/mobile && npx expo start --tunnel` |
| Cloud build for teammates | `eas build --profile development --platform ios` |
| Push OTA update | `eas update --branch preview` |

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable trunk — all merged work lands here |
| `mobile` | Mobile scaffold & feature development |
| `feature/*` | Short-lived feature branches, PR back to `main` |
