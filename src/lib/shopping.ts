import { MealEntry, PantryItem, Recipe, ShoppingItem, Unit } from "./types";
import { compatible, scaleQuantity, sumCompatible, round } from "./units";

// Normalize names so "Chicken Breast" and "chicken breast " consolidate.
function canonical(name: string): string {
  return name.trim().toLowerCase();
}

interface Demand {
  name: string;
  unit: Unit;
  quantity: number;
  section: ShoppingItem["section"];
  fromMeals: Set<string>;
}

// Build raw demand from every meal entry that will actually be cooked.
function collectDemand(
  entries: MealEntry[],
  recipes: Record<string, Recipe>
): Demand[] {
  const lines: Demand[] = [];

  for (const entry of entries) {
    if (entry.status !== "cook" || !entry.recipeId) continue;
    const recipe = recipes[entry.recipeId];
    if (!recipe) continue;

    const portions = entry.servings + entry.extraPortions;
    for (const ing of recipe.ingredients) {
      lines.push({
        name: ing.name,
        unit: ing.unit,
        quantity: scaleQuantity(ing.quantity, portions, recipe.servings),
        section: ing.section,
        fromMeals: new Set([recipe.name]),
      });
    }
  }
  return lines;
}

// Merge only when canonical name matches AND units are compatible.
function consolidate(lines: Demand[]): Demand[] {
  const groups: Demand[][] = [];

  for (const line of lines) {
    const match = groups.find((g) => {
      const head = g[0];
      return canonical(head.name) === canonical(line.name) && compatible(head.unit, line.unit);
    });
    if (match) match.push(line);
    else groups.push([line]);
  }

  return groups.map((g) => {
    const summed = sumCompatible(g.map((l) => ({ quantity: l.quantity, unit: l.unit })));
    const fromMeals = new Set<string>();
    g.forEach((l) => l.fromMeals.forEach((m) => fromMeals.add(m)));
    return {
      name: g[0].name,
      unit: summed.unit,
      quantity: summed.quantity,
      section: g[0].section,
      fromMeals,
    };
  });
}

// Optional pantry subtraction. Approximate pantry amounts flag the result.
function subtractPantry(
  demand: Demand[],
  pantry: PantryItem[]
): { demand: Demand[]; estimated: Set<string> } {
  const estimated = new Set<string>();
  const result: Demand[] = [];

  for (const d of demand) {
    const match = pantry.find(
      (p) => canonical(p.name) === canonical(d.name) && compatible(p.unit, d.unit)
    );
    if (!match) {
      result.push(d);
      continue;
    }
    const after = sumCompatible([
      { quantity: d.quantity, unit: d.unit },
      { quantity: -Math.abs(match.quantity), unit: match.unit },
    ]);
    if (match.approximate) estimated.add(canonical(d.name));
    if (after.quantity > 0.001) {
      result.push({ ...d, quantity: round(after.quantity, 2), unit: after.unit });
    }
    // fully covered -> dropped from the list
  }
  return { demand: result, estimated };
}

export function buildShoppingList(
  entries: MealEntry[],
  recipes: Record<string, Recipe>,
  pantry: PantryItem[],
  usePantry: boolean,
  manualItems: ShoppingItem[],
  checkedIds: Record<string, boolean>
): ShoppingItem[] {
  const raw = collectDemand(entries, recipes);
  const merged = consolidate(raw);

  const { demand, estimated } = usePantry
    ? subtractPantry(merged, pantry)
    : { demand: merged, estimated: new Set<string>() };

  const generated: ShoppingItem[] = demand.map((d) => {
    const id = `gen:${canonical(d.name)}:${d.unit}`;
    return {
      id,
      name: d.name,
      quantity: round(d.quantity, 2),
      unit: d.unit,
      section: d.section,
      fromMeals: Array.from(d.fromMeals),
      estimated: estimated.has(canonical(d.name)),
      manual: false,
    };
  });

  return [...generated, ...manualItems].sort((a, b) =>
    a.section === b.section
      ? a.name.localeCompare(b.name)
      : a.section.localeCompare(b.section)
  );
}
