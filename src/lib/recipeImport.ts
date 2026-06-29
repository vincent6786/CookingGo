import type {
  GrocerySection,
  MealType,
  Recipe,
  RecipeIngredient,
  Unit,
} from "./types";

export type ImportedRecipe = Omit<Recipe, "id" | "createdAt">;

const UNIT_MAP: Record<string, Unit> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tbsp: "tbsp",
  tbs: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  cup: "cup",
  cups: "cup",
  c: "cup",
  floz: "floz",
  "fl-oz": "floz",
  clove: "clove",
  cloves: "clove",
  can: "can",
  cans: "can",
  pinch: "pinch",
  pinches: "pinch",
  dash: "pinch",
  dashes: "pinch",
  piece: "piece",
  pieces: "piece",
  whole: "piece",
};

function parseQty(s: string): number | null {
  const trimmed = s.trim();
  // Mixed number: "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  // Fraction: "1/2"
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  // Decimal or integer
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseIngredientLine(line: string): {
  name: string;
  quantity: number;
  unit: Unit;
  note?: string;
} {
  // Try: <qty> <unit> <name>[, <note>]
  // qty captures fractions, mixed numbers, decimals.
  const m = line.match(
    /^\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s+([a-zA-Z][a-zA-Z\s-]{0,12}?)\s+(.+)$/
  );
  if (m) {
    const qty = parseQty(m[1]);
    const unitWord = m[2].trim().toLowerCase().replace(/\s+/g, "");
    const unit = UNIT_MAP[unitWord];
    if (qty != null && unit) {
      const [name, ...noteParts] = m[3].split(",");
      return {
        name: name.trim(),
        quantity: qty,
        unit,
        note: noteParts.length ? noteParts.join(",").trim() : undefined,
      };
    }
  }
  // Try: <qty> <name> (no recognized unit) — fall back to "piece"
  const m2 = line.match(/^\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s+(.+)$/);
  if (m2) {
    const qty = parseQty(m2[1]);
    if (qty != null) {
      const [name, ...noteParts] = m2[2].split(",");
      return {
        name: name.trim(),
        quantity: qty,
        unit: "piece",
        note: noteParts.length ? noteParts.join(",").trim() : undefined,
      };
    }
  }
  // Last resort: whole line as the name, quantity=1, unit=piece
  return { name: line.trim(), quantity: 1, unit: "piece" };
}

function parseIsoDuration(d: unknown): number {
  if (typeof d !== "string") return 0;
  const m = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

function parseYield(y: unknown): number {
  if (typeof y === "number") return Math.max(1, Math.round(y));
  if (typeof y === "string") {
    const m = y.match(/\d+/);
    if (m) return Math.max(1, Number(m[0]));
  }
  if (Array.isArray(y)) {
    for (const item of y) {
      const n = parseYield(item);
      if (n > 0) return n;
    }
  }
  return 2;
}

function flattenInstructions(instructions: unknown): string[] {
  if (!instructions) return [];
  if (typeof instructions === "string") {
    return instructions
      .split(/(?:\r?\n+|\.\s+(?=[A-Z]))/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
  }
  if (Array.isArray(instructions)) {
    return instructions
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          if (o["@type"] === "HowToSection" && Array.isArray(o.itemListElement)) {
            return flattenInstructions(o.itemListElement);
          }
          return [String(o.text ?? o.name ?? "")];
        }
        return [];
      })
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
  }
  return [];
}

function inferMealType(category: unknown): MealType {
  const s = (Array.isArray(category) ? category.join(" ") : String(category ?? ""))
    .toLowerCase();
  if (/breakfast|brunch/.test(s)) return "breakfast";
  if (/lunch/.test(s)) return "lunch";
  if (/snack|appetizer|dessert|side/.test(s)) return "snack";
  return "dinner";
}

const SECTION_HINTS: { keywords: RegExp; section: GrocerySection }[] = [
  {
    keywords: /\b(beef|chicken|pork|lamb|fish|salmon|tuna|shrimp|prawn|turkey|bacon|sausage|steak|ground meat)\b/i,
    section: "Meat & seafood",
  },
  {
    keywords: /\b(milk|butter|cheese|yog(h)?urt|cream|egg)\b/i,
    section: "Dairy & eggs",
  },
  { keywords: /\bfrozen\b/i, section: "Frozen" },
  {
    keywords: /\b(rice|pasta|noodle|spaghetti|penne|quinoa|oat|flour|breadcrumb)\b/i,
    section: "Rice, pasta & grains",
  },
  { keywords: /\b(canned|tinned|jar of)\b/i, section: "Canned & packaged" },
  {
    keywords: /\b(sauce|soy|vinegar|oil|salt|pepper|spice|paprika|cumin|cinnamon|chili|chilli|curry|paste|stock|broth)\b/i,
    section: "Sauces & seasonings",
  },
  { keywords: /\b(bread|roll|bun|tortilla|baguette)\b/i, section: "Bakery" },
];

function inferSection(name: string): GrocerySection {
  for (const { keywords, section } of SECTION_HINTS) {
    if (keywords.test(name)) return section;
  }
  return "Produce";
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function recipeFromJsonLd(
  jsonLd: Record<string, unknown>,
  fallbackName?: string
): ImportedRecipe {
  const name =
    (typeof jsonLd.name === "string" && jsonLd.name) || fallbackName || "Imported recipe";

  const ingredientLines = (jsonLd.recipeIngredient as string[] | undefined) ?? [];
  const ingredients: RecipeIngredient[] = ingredientLines
    .filter((line) => typeof line === "string" && line.trim())
    .map((line) => {
      const parsed = parseIngredientLine(line);
      return {
        id: uid(),
        name: parsed.name || line.trim(),
        quantity: parsed.quantity,
        unit: parsed.unit,
        section: inferSection(parsed.name),
        note: parsed.note,
      };
    });

  return {
    name,
    emoji: "🍽️",
    mealType: inferMealType(jsonLd.recipeCategory),
    servings: parseYield(jsonLd.recipeYield),
    prepMinutes: parseIsoDuration(jsonLd.prepTime),
    cookMinutes: parseIsoDuration(jsonLd.cookTime),
    difficulty: 2,
    storageDays: 3,
    freezerFriendly: false,
    tags: [],
    equipment: [],
    ingredients: ingredients.length ? ingredients : [],
    steps: flattenInstructions(jsonLd.recipeInstructions),
  };
}

// Find the first Recipe-shaped JSON-LD block in an HTML document.
// Handles bare arrays, @graph wrappers, and multiple <script> tags.
export function extractRecipeJsonLd(html: string): Record<string, unknown> | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: unknown[] = [];

  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          const graph = (item as Record<string, unknown>)["@graph"];
          if (Array.isArray(graph)) {
            for (const g of graph) candidates.push(g);
          } else {
            candidates.push(item);
          }
        }
      }
    } catch {
      // Skip invalid JSON-LD blocks — many sites have multiple, only one needs to parse.
    }
  }

  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    const t = (c as Record<string, unknown>)["@type"];
    if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) {
      return c as Record<string, unknown>;
    }
  }
  return null;
}
