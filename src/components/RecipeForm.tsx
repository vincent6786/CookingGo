"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import {
  ALL_UNITS,
  GROCERY_SECTIONS,
  GrocerySection,
  MealType,
  Recipe,
  RecipeIngredient,
  RECIPE_TAGS,
  RecipeTag,
  Unit,
} from "@/lib/types";
import { useStore, uid } from "@/lib/store";
import { Stepper } from "./ui";
import clsx from "clsx";

const EMOJIS = ["🍚", "🍝", "🥩", "🌯", "🍳", "🥣", "🥗", "🍲", "🌮", "🍜", "🥘", "🍛"];

function blankIngredient(): RecipeIngredient {
  return { id: uid(), name: "", quantity: 1, unit: "g", section: "Produce" };
}

export default function RecipeForm({
  existing,
  defaults,
}: {
  existing?: Recipe;
  defaults?: Partial<Omit<Recipe, "id" | "createdAt">>;
}) {
  const router = useRouter();
  const addRecipe = useStore((s) => s.addRecipe);
  const updateRecipe = useStore((s) => s.updateRecipe);

  // `existing` wins (edit mode); otherwise fall through to `defaults` (prefill
  // for a new recipe — e.g. coming from URL import).
  const seed = existing ?? defaults;

  const [name, setName] = useState(seed?.name ?? "");
  const [emoji, setEmoji] = useState(seed?.emoji ?? "🍲");
  const [mealType, setMealType] = useState<MealType>(seed?.mealType ?? "dinner");
  const [servings, setServings] = useState(seed?.servings ?? 2);
  const [prepMinutes, setPrep] = useState(seed?.prepMinutes ?? 10);
  const [cookMinutes, setCook] = useState(seed?.cookMinutes ?? 20);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(seed?.difficulty ?? 1);
  const [storageDays, setStorage] = useState(seed?.storageDays ?? 3);
  const [freezerFriendly, setFreezer] = useState(seed?.freezerFriendly ?? false);
  const [tags, setTags] = useState<RecipeTag[]>(seed?.tags ?? []);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    seed?.ingredients?.length ? seed.ingredients : [blankIngredient()]
  );
  const [steps, setSteps] = useState<string[]>(
    seed?.steps?.length ? seed.steps : [""]
  );
  const [equipment, setEquipment] = useState((seed?.equipment ?? []).join(", "));

  const setIng = (id: string, patch: Partial<RecipeIngredient>) =>
    setIngredients((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const valid = name.trim().length > 0 && ingredients.some((i) => i.name.trim());

  function save() {
    if (!valid) return;
    const payload = {
      name: name.trim(),
      emoji,
      mealType,
      servings,
      prepMinutes,
      cookMinutes,
      difficulty,
      storageDays,
      freezerFriendly,
      tags,
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      equipment: equipment.split(",").map((e) => e.trim()).filter(Boolean),
    };
    if (existing) {
      updateRecipe(existing.id, payload);
      router.push(`/recipes/${existing.id}`);
    } else {
      const id = addRecipe(payload);
      router.push(`/recipes/${id}`);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* identity */}
      <section className="card space-y-4 p-4">
        <div className="flex gap-3">
          <div>
            <label className="field-label">Icon</label>
            <select
              className="field !w-20 text-center text-2xl"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            >
              {EMOJIS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="field-label">Recipe name</label>
            <input
              className="field"
              value={name}
              placeholder="Chicken rice bowl"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Meal</label>
            <select
              className="field"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="flex items-end">
            <Stepper label="Serves" value={servings} onChange={setServings} min={1} max={20} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <NumField label="Prep (min)" value={prepMinutes} onChange={setPrep} />
          <NumField label="Cook (min)" value={cookMinutes} onChange={setCook} />
          <NumField label="Keeps (days)" value={storageDays} onChange={setStorage} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="field-label">Difficulty</label>
            <div className="flex gap-1">
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={clsx(
                    "h-10 w-10 rounded-xl border text-sm font-semibold",
                    difficulty === d
                      ? "border-ink bg-ink text-surface"
                      : "border-line bg-surface-raised text-ink-faint"
                  )}
                >
                  {"●".repeat(d)}
                </button>
              ))}
            </div>
          </div>
          <label className="mt-6 inline-flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="h-5 w-5 accent-moss"
              checked={freezerFriendly}
              onChange={(e) => setFreezer(e.target.checked)}
            />
            Freezer-friendly
          </label>
        </div>
      </section>

      {/* tags */}
      <section className="card p-4">
        <p className="eyebrow mb-3">Tags</p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setTags((arr) => (on ? arr.filter((x) => x !== t) : [...arr, t]))
                }
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on
                    ? "border-amber bg-amber-soft text-amber-ink"
                    : "border-line bg-surface text-ink-faint hover:text-ink"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </section>

      {/* ingredients */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Ingredients</p>
          <span className="text-xs text-ink-faint">for {servings} servings</span>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div key={ing.id} className="rounded-xl border border-line bg-surface p-2.5">
              <div className="flex gap-2">
                <input
                  className="field flex-1"
                  placeholder="chicken breast"
                  value={ing.name}
                  onChange={(e) => setIng(ing.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="remove ingredient"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-coral-soft hover:text-coral"
                  onClick={() =>
                    setIngredients((arr) =>
                      arr.length > 1 ? arr.filter((i) => i.id !== ing.id) : arr
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="any"
                  className="field readout"
                  value={ing.quantity}
                  onChange={(e) => setIng(ing.id, { quantity: Number(e.target.value) })}
                />
                <select
                  className="field"
                  value={ing.unit}
                  onChange={(e) => setIng(ing.id, { unit: e.target.value as Unit })}
                >
                  {ALL_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u === "floz" ? "fl oz" : u === "piece" ? "whole" : u}
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={ing.section}
                  onChange={(e) =>
                    setIng(ing.id, { section: e.target.value as GrocerySection })
                  }
                >
                  {GROCERY_SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost mt-3 w-full"
          onClick={() => setIngredients((arr) => [...arr, blankIngredient()])}
        >
          <Plus size={18} /> Add ingredient
        </button>
      </section>

      {/* steps */}
      <section className="card p-4">
        <p className="eyebrow mb-3">Instructions</p>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="readout mt-3 w-6 shrink-0 text-right text-sm text-ink-faint">
                {idx + 1}
              </span>
              <textarea
                className="field min-h-[44px] flex-1 resize-y py-2.5"
                rows={2}
                value={step}
                placeholder="Describe this step…"
                onChange={(e) =>
                  setSteps((arr) => arr.map((s, i) => (i === idx ? e.target.value : s)))
                }
              />
              <button
                type="button"
                aria-label="remove step"
                className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl text-ink-faint hover:bg-coral-soft hover:text-coral"
                onClick={() =>
                  setSteps((arr) => (arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr))
                }
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost mt-3 w-full"
          onClick={() => setSteps((arr) => [...arr, ""])}
        >
          <Plus size={18} /> Add step
        </button>
      </section>

      {/* equipment */}
      <section className="card p-4">
        <label className="field-label">Equipment (comma separated)</label>
        <input
          className="field"
          value={equipment}
          placeholder="Skillet, Rice cooker"
          onChange={(e) => setEquipment(e.target.value)}
        />
      </section>

      <div className="sticky bottom-[84px] z-10 flex gap-3">
        <button className="btn-ghost flex-1" type="button" onClick={() => router.back()}>
          Cancel
        </button>
        <button
          className="btn-primary flex-[2] disabled:opacity-40"
          type="button"
          onClick={save}
          disabled={!valid}
        >
          {existing ? "Save changes" : "Save recipe"}
        </button>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        className="field readout"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
