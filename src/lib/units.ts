import { Unit } from "./types";

// Dimensions. Two ingredient lines may only be merged when they share a
// dimension AND the same canonical name. Count units never merge across kinds,
// which is what keeps "1 chicken breast" and "500 g chicken breast" separate.
type Dimension = "weight" | "volume" | "count";

const DIMENSION: Record<Unit, Dimension> = {
  g: "weight", kg: "weight", oz: "weight", lb: "weight",
  ml: "volume", l: "volume", tsp: "volume", tbsp: "volume", cup: "volume", floz: "volume",
  piece: "count", clove: "count", can: "count", pinch: "count",
};

// Conversion to a base unit within a dimension (weight->g, volume->ml).
// Count units are 1:1 only with themselves.
const TO_BASE: Record<Unit, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
  ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, floz: 29.5735,
  piece: 1, clove: 1, can: 1, pinch: 1,
};

export function dimensionOf(unit: Unit): Dimension {
  return DIMENSION[unit];
}

// Can two units be summed onto one shopping line?
export function compatible(a: Unit, b: Unit): boolean {
  const da = DIMENSION[a];
  const db = DIMENSION[b];
  if (da !== db) return false;
  if (da === "count") return a === b; // a clove is not a can is not a piece
  return true; // weight<->weight and volume<->volume convert cleanly
}

// Serving scaling: adjusted = original * desired / native
export function scaleQuantity(original: number, desired: number, native: number): number {
  if (native <= 0) return original;
  return (original * desired) / native;
}

// Sum a list of compatible quantities, returning a result in a sensible unit.
export function sumCompatible(
  items: { quantity: number; unit: Unit }[]
): { quantity: number; unit: Unit } {
  if (items.length === 0) return { quantity: 0, unit: "g" };
  const dim = DIMENSION[items[0].unit];

  if (dim === "count") {
    const total = items.reduce((s, i) => s + i.quantity, 0);
    return { quantity: total, unit: items[0].unit };
  }

  const totalBase = items.reduce((s, i) => s + i.quantity * TO_BASE[i.unit], 0);

  if (dim === "weight") {
    // Display in kg once we cross 1000 g, otherwise grams.
    if (totalBase >= 1000) return { quantity: round(totalBase / 1000, 2), unit: "kg" };
    return { quantity: round(totalBase, 0), unit: "g" };
  }
  // volume: prefer the unit most of the items already used, scaled up if large
  if (totalBase >= 1000) return { quantity: round(totalBase / 1000, 2), unit: "l" };
  // pick the largest spoon/cup unit that keeps the number readable
  const preferred = pickVolumeUnit(totalBase);
  return { quantity: round(totalBase / TO_BASE[preferred], 2), unit: preferred };
}

function pickVolumeUnit(base: number): Unit {
  if (base >= TO_BASE.cup) return "cup";
  if (base >= TO_BASE.tbsp * 3) return "tbsp";
  if (base >= TO_BASE.tsp * 3) return "tbsp";
  return "tsp";
}

export function round(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}

// Tidy display: drop trailing zeros, keep fractions readable.
export function fmtQty(n: number): string {
  const r = round(n, 2);
  if (Number.isInteger(r)) return String(r);
  return String(r);
}

export function fmtUnit(unit: Unit, qty: number): string {
  const labels: Record<Unit, [string, string]> = {
    g: ["g", "g"], kg: ["kg", "kg"], oz: ["oz", "oz"], lb: ["lb", "lb"],
    ml: ["ml", "ml"], l: ["l", "l"], tsp: ["tsp", "tsp"], tbsp: ["tbsp", "tbsp"],
    cup: ["cup", "cups"], floz: ["fl oz", "fl oz"],
    piece: ["", ""], clove: ["clove", "cloves"], can: ["can", "cans"], pinch: ["pinch", "pinches"],
  };
  const [one, many] = labels[unit];
  return qty === 1 ? one : many;
}
