# Galley — a local-first cooking routine

A weekly meal planner, recipe book, and auto-built grocery list for people who want
to **decide less and cook more**. Plan your week, adjust servings, cook a little
extra for leftovers, and let the shopping list build itself.

Everything runs on your device — no accounts, no backend, no API keys. It installs
to your Home Screen and works offline.

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
`persist` → `localStorage`). Hand-rolled service worker + web manifest for offline
/ installable PWA behavior. Fonts are self-hosted, so there are no external requests
at build or runtime.

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build a production bundle:

```bash
npm run build
npm run start
```

## Deploy: GitHub → Vercel

There are **no environment variables** to configure. Push the repo and connect it.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Galley: local-first cooking routine PWA"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to <https://vercel.com/new>.
2. Import the GitHub repo you just pushed.
3. Vercel auto-detects Next.js — leave every setting at its default and click
   **Deploy**.
4. When it finishes you'll get a live URL. Open it on your phone and use the
   browser's **Add to Home Screen** to install it as an app.

That's it. Each `git push` to `main` redeploys automatically.

## Your data

All data lives in this browser's `localStorage` under the key
`cooking-routine-store-v1`. It never leaves your device. Clearing site data, or the
**Reset all data** button in Settings, restores the starter recipes and an empty
plan.

> Because data is per-device, your phone and laptop won't see each other's plans.
> If you later want them in sync, the data layer is isolated in
> `src/lib/store.ts` — swapping the `persist` storage for a small cloud backend
> (e.g. Supabase) is a clean, self-contained next step that won't touch the UI.

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
