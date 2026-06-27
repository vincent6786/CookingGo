import type { Recipe } from "./types";
import { scaleQuantity, fmtQty, fmtUnit } from "./units";

export function recipeToShareText(recipe: Recipe, servings: number): string {
  const scaled = recipe.ingredients.map((ing) => {
    const q = scaleQuantity(ing.quantity, servings, recipe.servings);
    const note = ing.note ? ` (${ing.note})` : "";
    return `• ${fmtQty(q)} ${fmtUnit(ing.unit, q)} ${ing.name}${note}`;
  });

  const steps = recipe.steps.map((s, i) => `${i + 1}. ${s}`);

  return [
    `${recipe.emoji} ${recipe.name}`,
    "",
    `Serves ${servings} · ${recipe.prepMinutes}m prep · ${recipe.cookMinutes}m cook`,
    "",
    "Ingredients:",
    ...scaled,
    "",
    "Steps:",
    ...steps,
    "",
    "— Shared from Galley",
  ].join("\n");
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareText(
  title: string,
  text: string
): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      // User cancelled — treat as no-op, not a failure.
      if ((err as Error)?.name === "AbortError") return "shared";
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }
  return "failed";
}
