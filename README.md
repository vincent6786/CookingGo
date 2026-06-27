# Galley — a local-first cooking routine

A weekly meal planner, recipe book, and auto-built grocery list for people who want
to **decide less and cook more**. Plan your week, adjust servings, cook a little
extra for leftovers, and let the shopping list build itself.

Your plan, recipes, and pantry sync across devices via a Supabase-backed account
(email magic-link sign-in — no passwords). The app installs to your Home Screen
and the UI is fully client-rendered.

## What it does

- **Today** — your day at a glance: what's on the menu, prep cues (e.g. "defrost
  chicken for tomorrow"), leftovers that need eating, and what's left to buy.
- **Plan** — a week view. Drop a recipe on a day, set portions, and cook extra for
  future leftovers. Weeknight time budget flags anything too slow for a school night.
- **Recipes** — a searchable, taggable recipe book. Open one and scale the servings;
  every ingredient quantity rescales live.
- **Cook mode** — a fullscreen, step-by-step cooking flow with a mise-en-place
  checklist, built-in timers, and a screen-wake lock. When you finish, save the
  extra portions straight to your leftovers.
- **Shop** — a consolidated grocery list grouped by aisle, built automatically from
  the week's planned meals. It can subtract what's already in your pantry, and you
  can check things off as you go.
- **Pantry & leftovers** — track staples (with optional expiry) and cooked leftovers
  with a use-by countdown.
- **Settings** — your name, units, weeknight time budget, batch-cook days, and a
  reset.

## Tech

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Zustand (with
`persist` → Supabase JSONB). Supabase Auth (magic link) + Postgres with Row-Level
Security. Hand-rolled service worker + web manifest for installable PWA behavior.
Fonts are self-hosted.

## Set up Supabase (one-time)

1. Create a project at <https://supabase.com> (free tier is plenty).
2. **SQL Editor → New Query** → paste `supabase/migrations/0001_user_state.sql`
   from this repo → **Run**. That creates the `user_state` table and its
   Row-Level-Security policies.
3. **Authentication → URL Configuration**: add your deployment origin to the
   Redirect URLs allowlist (e.g. `https://cooking-go.vercel.app/` and
   `http://localhost:3000/` for local dev).
4. **Settings → API**: copy **Project URL** and the **anon / public** key.

## Run it locally

```bash
cp .env.example .env.local
# Paste the Project URL and anon key into .env.local

npm install
npm run dev
# open http://localhost:3000
```

## Deploy: GitHub → Vercel

1. Push the repo to GitHub.
2. <https://vercel.com/new> → import the repo. Framework Preset: **Next.js**.
3. **Environment Variables**: add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview, and Development.
4. **Deploy**. Each push to `main` redeploys automatically.

## Your data

Your plan, recipes, pantry, and settings live in a single JSONB blob in your
Supabase `user_state` row. Row-Level Security means nobody but you (and
Postgres-level admins on your Supabase project) can read it. Sign out clears the
session locally; your data stays in the cloud and is restored on next sign-in.

## Project layout

```
src/
  app/                 # routes (Today, Plan, Recipes, Shop, Pantry, Settings, Cook)
    fonts/             # self-hosted variable fonts
    globals.css        # design tokens + component classes
    layout.tsx
  components/          # BottomNav, MealSheet, RecipeForm, shared UI
  lib/
    types.ts           # domain model
    store.ts           # Zustand store (all persistence lives here)
    units.ts           # unit math: scaling + compatible-unit merging
    shopping.ts        # builds the consolidated grocery list
    dates.ts           # local-date helpers (Monday-start weeks)
    seed.ts            # starter recipes
public/
  manifest.webmanifest
  sw.js                # offline app-shell service worker
  icon-*.png
```
