"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_SETTINGS,
  Leftover,
  MealEntry,
  PantryItem,
  Recipe,
  Settings,
  ShoppingItem,
} from "./types";
import { SEED_RECIPES } from "./seed";
import { todayISO } from "./dates";

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

interface State {
  hydrated: boolean;
  recipes: Recipe[];
  entries: MealEntry[];
  leftovers: Leftover[];
  pantry: PantryItem[];
  manualShopping: ShoppingItem[];
  checked: Record<string, boolean>;
  settings: Settings;

  // recipes
  addRecipe: (r: Omit<Recipe, "id" | "createdAt">) => string;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  duplicateRecipe: (id: string) => void;
  markCooked: (id: string) => void;

  // planner
  addEntry: (e: Omit<MealEntry, "id">) => void;
  updateEntry: (id: string, patch: Partial<MealEntry>) => void;
  removeEntry: (id: string) => void;
  moveEntry: (id: string, date: string) => void;

  // leftovers
  addLeftover: (l: Omit<Leftover, "id">) => void;
  updateLeftover: (id: string, patch: Partial<Leftover>) => void;
  removeLeftover: (id: string) => void;

  // pantry
  addPantry: (p: Omit<PantryItem, "id">) => void;
  updatePantry: (id: string, patch: Partial<PantryItem>) => void;
  removePantry: (id: string) => void;

  // shopping
  addManualItem: (i: Omit<ShoppingItem, "id" | "manual">) => void;
  removeManualItem: (id: string) => void;
  toggleChecked: (id: string) => void;
  clearChecked: () => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      recipes: SEED_RECIPES,
      entries: [],
      leftovers: [],
      pantry: [],
      manualShopping: [],
      checked: {},
      settings: DEFAULT_SETTINGS,

      addRecipe: (r) => {
        const id = uid();
        set((s) => ({ recipes: [...s.recipes, { ...r, id, createdAt: Date.now() }] }));
        return id;
      },
      updateRecipe: (id, patch) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRecipe: (id) =>
        set((s) => ({
          recipes: s.recipes.filter((r) => r.id !== id),
          entries: s.entries.map((e) =>
            e.recipeId === id ? { ...e, recipeId: undefined, status: "eat-out" } : e
          ),
        })),
      duplicateRecipe: (id) =>
        set((s) => {
          const src = s.recipes.find((r) => r.id === id);
          if (!src) return s;
          const copy: Recipe = {
            ...src,
            id: uid(),
            name: `${src.name} (copy)`,
            createdAt: Date.now(),
            lastCookedAt: undefined,
            ingredients: src.ingredients.map((i) => ({ ...i, id: uid() })),
          };
          return { recipes: [...s.recipes, copy] };
        }),
      markCooked: (id) =>
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === id ? { ...r, lastCookedAt: Date.now() } : r
          ),
        })),

      addEntry: (e) => set((s) => ({ entries: [...s.entries, { ...e, id: uid() }] })),
      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      moveEntry: (id, date) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, date } : e)),
        })),

      addLeftover: (l) => set((s) => ({ leftovers: [...s.leftovers, { ...l, id: uid() }] })),
      updateLeftover: (id, patch) =>
        set((s) => ({
          leftovers: s.leftovers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      removeLeftover: (id) =>
        set((s) => ({ leftovers: s.leftovers.filter((l) => l.id !== id) })),

      addPantry: (p) => set((s) => ({ pantry: [...s.pantry, { ...p, id: uid() }] })),
      updatePantry: (id, patch) =>
        set((s) => ({
          pantry: s.pantry.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePantry: (id) =>
        set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),

      addManualItem: (i) =>
        set((s) => ({
          manualShopping: [...s.manualShopping, { ...i, id: uid(), manual: true }],
        })),
      removeManualItem: (id) =>
        set((s) => ({
          manualShopping: s.manualShopping.filter((i) => i.id !== id),
          checked: Object.fromEntries(
            Object.entries(s.checked).filter(([k]) => k !== id)
          ),
        })),
      toggleChecked: (id) =>
        set((s) => ({ checked: { ...s.checked, [id]: !s.checked[id] } })),
      clearChecked: () => set({ checked: {} }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetAll: () =>
        set({
          recipes: SEED_RECIPES,
          entries: [],
          leftovers: [],
          pantry: [],
          manualShopping: [],
          checked: {},
          settings: DEFAULT_SETTINGS,
        }),
    }),
    {
      name: "cooking-routine-store-v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

export { uid, todayISO };
