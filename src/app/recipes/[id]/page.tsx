"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChefHat,
  Clock,
  Copy,
  Pencil,
  Trash2,
  Snowflake,
  Archive,
  CalendarPlus,
  Share2,
  Check,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { Stepper } from "@/components/ui";
import MealSheet from "@/components/MealSheet";
import { scaleQuantity, fmtQty, fmtUnit } from "@/lib/units";
import { todayISO } from "@/lib/dates";
import { recipeToShareText, shareText } from "@/lib/share";

export default function RecipeDetailPage() {
  return (
    <ClientGate>
      <Detail />
    </ClientGate>
  );
}

function Detail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const recipe = useStore((s) => s.recipes.find((r) => r.id === id));
  const duplicateRecipe = useStore((s) => s.duplicateRecipe);
  const deleteRecipe = useStore((s) => s.deleteRecipe);

  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareStatus, setShareStatus] = useState<null | "copied" | "failed">(
    null
  );

  async function onShare() {
    if (!recipe) return;
    const text = recipeToShareText(recipe, servings);
    const outcome = await shareText(recipe.name, text);
    if (outcome === "copied") {
      setShareStatus("copied");
      setTimeout(() => setShareStatus(null), 2000);
    } else if (outcome === "failed") {
      setShareStatus("failed");
      setTimeout(() => setShareStatus(null), 2500);
    }
  }

  const factorIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      scaled: scaleQuantity(ing.quantity, servings, recipe.servings),
    }));
  }, [recipe, servings]);

  if (!recipe) {
    return (
      <div className="pt-10 text-center">
        <p className="text-ink-faint">This recipe no longer exists.</p>
        <Link href="/recipes" className="btn-ghost mt-4">
          Back to recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-3 flex items-center justify-between">
        <Link href="/recipes" className="btn-quiet !min-h-0 gap-1 !px-2 !py-1.5 text-sm">
          <ChevronLeft size={18} /> Recipes
        </Link>
        <div className="flex items-center gap-1">
          {shareStatus && (
            <span
              className={
                "readout mr-1 text-xs " +
                (shareStatus === "copied" ? "text-moss-ink" : "text-coral-ink")
              }
              role="status"
            >
              {shareStatus === "copied" ? (
                <span className="inline-flex items-center gap-1">
                  <Check size={14} /> Copied
                </span>
              ) : (
                "Share unavailable"
              )}
            </span>
          )}
          <button
            className="btn-quiet !min-h-0 !p-2"
            aria-label="Share"
            onClick={onShare}
          >
            <Share2 size={18} />
          </button>
          <Link
            href={`/recipes/${id}/edit`}
            className="btn-quiet !min-h-0 !p-2"
            aria-label="Edit"
          >
            <Pencil size={18} />
          </Link>
          <button
            className="btn-quiet !min-h-0 !p-2"
            aria-label="Duplicate"
            onClick={() => duplicateRecipe(id)}
          >
            <Copy size={18} />
          </button>
          <button
            className="btn-quiet !min-h-0 !p-2 hover:!bg-coral-soft hover:!text-coral"
            aria-label="Delete"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* hero */}
      <div className="card mb-4 overflow-hidden">
        <div className="flex items-center justify-center bg-surface-sunk py-8 text-7xl">
          {recipe.emoji}
        </div>
        <div className="p-4">
          <p className="eyebrow mb-1 capitalize">{recipe.mealType}</p>
          <h1 className="font-display text-2xl font-bold leading-tight text-ink">
            {recipe.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} className="text-ink-faint" />
              <span className="readout">{recipe.prepMinutes}m prep · {recipe.cookMinutes}m cook</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Archive size={15} className="text-ink-faint" />
              <span className="readout">keeps {recipe.storageDays}d</span>
            </span>
            {recipe.freezerFriendly && (
              <span className="inline-flex items-center gap-1.5 text-moss-ink">
                <Snowflake size={15} /> freezer-ok
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {recipe.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* primary actions */}
      <div className="mb-4 flex gap-2">
        <Link
          href={`/recipes/${id}/cook?servings=${servings}`}
          className="btn-amber flex-[2]"
        >
          <ChefHat size={18} /> Start cooking
        </Link>
        <button className="btn-ghost flex-1" onClick={() => setShowAdd(true)}>
          <CalendarPlus size={18} /> Plan
        </button>
      </div>

      {/* ingredients with scaling */}
      <section className="card mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Ingredients</p>
          <Stepper value={servings} onChange={setServings} min={1} max={20} label="Serves" />
        </div>
        <ul className="divide-y divide-line">
          {factorIngredients.map((ing) => (
            <li key={ing.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-ink">
                {ing.name}
                {ing.note && <span className="text-ink-faint"> · {ing.note}</span>}
              </span>
              <span className="readout shrink-0 font-medium text-ink">
                {fmtQty(ing.scaled)} {fmtUnit(ing.unit, ing.scaled)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* equipment */}
      {recipe.equipment.length > 0 && (
        <section className="card mb-4 p-4">
          <p className="eyebrow mb-2">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.equipment.map((e) => (
              <span key={e} className="chip">
                {e}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* steps */}
      <section className="card p-4">
        <p className="eyebrow mb-3">Instructions</p>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="readout flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-sm font-semibold text-ink">
                {i + 1}
              </span>
              <p className="pt-0.5 text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {showAdd && (
        <MealSheet date={todayISO()} onClose={() => setShowAdd(false)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5 shadow-card">
            <h3 className="font-display text-lg font-bold text-ink">Delete this recipe?</h3>
            <p className="mt-1 text-sm text-ink-faint">
              {recipe.name} will be removed. Planned meals using it become eat-out slots.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
              <button
                className="btn flex-1 bg-coral text-white hover:brightness-95"
                onClick={() => {
                  deleteRecipe(id);
                  router.push("/recipes");
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
