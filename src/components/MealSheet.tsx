"use client";

import { useState } from "react";
import { X, UtensilsCrossed } from "lucide-react";
import { MealEntry, MealType } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Stepper } from "./ui";
import { monthDayLabel } from "@/lib/dates";
import clsx from "clsx";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function MealSheet({
  date,
  mealType: initialMeal,
  editing,
  onClose,
}: {
  date: string;
  mealType?: MealType;
  editing?: MealEntry;
  onClose: () => void;
}) {
  const recipes = useStore((s) => s.recipes);
  const addEntry = useStore((s) => s.addEntry);
  const updateEntry = useStore((s) => s.updateEntry);
  const settings = useStore((s) => s.settings);

  const [mealType, setMealType] = useState<MealType>(
    editing?.mealType ?? initialMeal ?? "dinner"
  );
  const [recipeId, setRecipeId] = useState<string | undefined>(editing?.recipeId);
  const [servings, setServings] = useState(editing?.servings ?? settings.defaultPortions);
  const [extra, setExtra] = useState(editing?.extraPortions ?? 0);
  const [eatOut, setEatOut] = useState(editing?.status === "eat-out");
  const [maxTime, setMaxTime] = useState(false);

  const list = recipes
    .filter((r) => (maxTime ? r.prepMinutes + r.cookMinutes <= settings.weekdayMaxCookMinutes : true))
    .sort((a, b) => a.name.localeCompare(b.name));

  function save() {
    const payload = {
      date,
      mealType,
      recipeId: eatOut ? undefined : recipeId,
      servings,
      extraPortions: eatOut ? 0 : extra,
      status: (eatOut ? "eat-out" : "cook") as MealEntry["status"],
    };
    if (editing) updateEntry(editing.id, payload);
    else addEntry(payload);
    onClose();
  }

  const canSave = eatOut || !!recipeId;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-card sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">{monthDayLabel(date)}</p>
            <h2 className="font-display text-xl font-bold">
              {editing ? "Edit meal" : "Add meal"}
            </h2>
          </div>
          <button className="btn-quiet !min-h-0 !p-2" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={clsx(
                "flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-colors",
                mealType === m
                  ? "border-ink bg-ink text-surface"
                  : "border-line bg-surface-raised text-ink-faint"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface-raised px-3.5 py-3">
          <span className="text-sm font-medium text-ink-soft">Eating out — no cooking</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-amber"
            checked={eatOut}
            onChange={(e) => setEatOut(e.target.checked)}
          />
        </label>

        {!eatOut && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">Choose a recipe</p>
              <label className="flex items-center gap-1.5 text-xs text-ink-faint">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber"
                  checked={maxTime}
                  onChange={(e) => setMaxTime(e.target.checked)}
                />
                ≤ {settings.weekdayMaxCookMinutes} min only
              </label>
            </div>

            <div className="mb-4 max-h-56 space-y-1.5 overflow-y-auto">
              {list.length === 0 && (
                <p className="rounded-xl bg-surface-sunk px-3 py-4 text-center text-sm text-ink-faint">
                  No recipes match. Loosen the time filter or add a recipe.
                </p>
              )}
              {list.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRecipeId(r.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    recipeId === r.id
                      ? "border-amber bg-amber-soft"
                      : "border-line bg-surface-raised hover:border-ink-faint"
                  )}
                >
                  <span className="text-xl">{r.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-medium text-ink">{r.name}</span>
                    <span className="readout text-xs text-ink-faint">
                      {r.prepMinutes + r.cookMinutes} min · serves {r.servings}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Stepper label="Portions" value={servings} onChange={setServings} min={1} max={20} />
              <Stepper label="Extra for leftovers" value={extra} onChange={setExtra} min={0} max={20} />
            </div>
          </>
        )}

        <button
          className="btn-amber w-full disabled:opacity-40"
          onClick={save}
          disabled={!canSave}
        >
          <UtensilsCrossed size={18} />
          {editing ? "Update meal" : "Add to plan"}
        </button>
      </div>
    </div>
  );
}
