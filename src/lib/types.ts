// Domain types. Mirrors the data model in the building plan, with the three
// critical separations kept explicit:
//   - a Recipe is distinct from a scheduled MealEntry
//   - a raw Ingredient line is distinct from a ShoppingItem
//   - a cooked Leftover is distinct from a PantryItem

export type Unit =
  | "g" | "kg" | "oz" | "lb"          // weight
  | "ml" | "l" | "tsp" | "tbsp" | "cup" | "floz" // volume
  | "piece" | "clove" | "can" | "pinch"; // count / discrete

export const ALL_UNITS: Unit[] = [
  "g", "kg", "oz", "lb",
  "ml", "l", "tsp", "tbsp", "cup", "floz",
  "piece", "clove", "can", "pinch",
];

export type GrocerySection =
  | "Produce"
  | "Meat & seafood"
  | "Dairy & eggs"
  | "Frozen"
  | "Rice, pasta & grains"
  | "Canned & packaged"
  | "Sauces & seasonings"
  | "Bakery"
  | "Household";

export const GROCERY_SECTIONS: GrocerySection[] = [
  "Produce",
  "Meat & seafood",
  "Dairy & eggs",
  "Frozen",
  "Rice, pasta & grains",
  "Canned & packaged",
  "Sauces & seasonings",
  "Bakery",
  "Household",
];

export type MealType = "lunch" | "dinner" | "breakfast" | "snack";

export const RECIPE_TAGS = [
  "Quick",
  "Meal prep",
  "One-pot",
  "High protein",
  "Freezer-friendly",
  "Low cleanup",
  "Training-day meal",
  "Weekend cooking",
  "Leftover-friendly",
] as const;

export type RecipeTag = (typeof RECIPE_TAGS)[number];

export interface RecipeIngredient {
  id: string;
  name: string;            // canonical-ish display name, e.g. "chicken breast"
  quantity: number;
  unit: Unit;
  section: GrocerySection; // where it lives in the store
  note?: string;           // "diced", "to taste", etc.
}

export interface Recipe {
  id: string;
  name: string;
  mealType: MealType;
  servings: number;        // the recipe's native yield
  prepMinutes: number;
  cookMinutes: number;
  difficulty: 1 | 2 | 3;
  ingredients: RecipeIngredient[];
  steps: string[];
  equipment: string[];
  storageDays: number;     // how long cooked leftovers keep
  freezerFriendly: boolean;
  tags: RecipeTag[];
  emoji: string;           // lightweight stand-in for a photo in the MVP
  createdAt: number;
  lastCookedAt?: number;
}

export type EntryStatus = "cook" | "leftover" | "eat-out";

export interface MealEntry {
  id: string;
  date: string;            // ISO yyyy-mm-dd
  mealType: MealType;
  recipeId?: string;       // omitted for eat-out
  servings: number;        // portions to put on the plate this slot
  status: EntryStatus;
  extraPortions: number;   // additional portions cooked for future leftovers
}

export interface Leftover {
  id: string;
  recipeId: string;
  portions: number;
  cookedDate: string;      // ISO
  location: string;        // fridge / freezer
  consumeByDate: string;   // ISO
  assignedDate?: string;   // meal slot it's promised to, if any
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  section: GrocerySection;
  location: string;
  expiryDate?: string;     // ISO
  approximate: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  section: GrocerySection;
  fromMeals: string[];     // recipe names that need it
  estimated: boolean;      // true when pantry subtraction was approximate
  manual: boolean;
}

export type ThemePreference = "light" | "dark" | "system";

export interface Settings {
  units: "us" | "metric";
  weekdayMaxCookMinutes: number;
  preferredCookDays: number[]; // 0=Sun..6=Sat
  acceptsLeftovers: boolean;
  defaultPortions: number;
  subtractPantry: boolean;
  name: string;
  theme: ThemePreference;
}

export const DEFAULT_SETTINGS: Settings = {
  units: "us",
  weekdayMaxCookMinutes: 30,
  preferredCookDays: [0, 3], // Sunday + Wednesday batch cooks
  acceptsLeftovers: true,
  defaultPortions: 2,
  subtractPantry: true,
  name: "",
  theme: "system",
};
