"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Info,
  Trash2,
  Eraser,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { PageHeader, EmptyState } from "@/components/ui";
import { buildShoppingList } from "@/lib/shopping";
import { fmtQty, fmtUnit } from "@/lib/units";
import {
  ALL_UNITS,
  GROCERY_SECTIONS,
  GrocerySection,
  ShoppingItem,
  Unit,
} from "@/lib/types";
import {
  addDays,
  monthDayLabel,
  todayISO,
  weekDates,
  weekStart,
} from "@/lib/dates";
import clsx from "clsx";

export default function ShoppingPage() {
  return (
    <ClientGate>
      <Shopping />
    </ClientGate>
  );
}

function Shopping() {
  const [anchor, setAnchor] = useState(weekStart(todayISO()));
  const [adding, setAdding] = useState(false);

  const entries = useStore((s) => s.entries);
  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const settings = useStore((s) => s.settings);
  const manual = useStore((s) => s.manualShopping);
  const checked = useStore((s) => s.checked);
  const toggleChecked = useStore((s) => s.toggleChecked);
  const clearChecked = useStore((s) => s.clearChecked);
  const updateSettings = useStore((s) => s.updateSettings);
  const removeManualItem = useStore((s) => s.removeManualItem);

  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])),
    [recipes]
  );

  const days = weekDates(anchor);
  const weekEntries = entries.filter((e) => days.includes(e.date));

  const items = useMemo(
    () =>
      buildShoppingList(
        weekEntries,
        recipeMap,
        pantry,
        settings.subtractPantry,
        manual,
        checked
      ),
    [weekEntries, recipeMap, pantry, settings.subtractPantry, manual, checked]
  );

  const grouped = useMemo(() => {
    const map = new Map<GrocerySection, ShoppingItem[]>();
    for (const it of items) {
      const arr = map.get(it.section) ?? [];
      arr.push(it);
      map.set(it.section, arr);
    }
    return GROCERY_SECTIONS.filter((s) => map.has(s)).map((s) => ({
      section: s,
      items: map.get(s)!,
    }));
  }, [items]);

  const remaining = items.filter((i) => !checked[i.id]).length;
  const done = items.length - remaining;

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Shopping"
        title="Grocery list"
        action={
          done > 0 ? (
            <button className="btn-quiet !min-h-0 gap-1 !px-2 !py-1.5 text-sm" onClick={clearChecked}>
              <Eraser size={16} /> Clear
            </button>
          ) : undefined
        }
      />

      {/* week switcher */}
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-surface-raised px-2 py-2">
        <button className="btn-quiet !min-h-0 !p-2" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Previous week">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="readout text-sm font-semibold text-ink">
            {monthDayLabel(days[0])} – {monthDayLabel(days[6])}
          </p>
          <p className="text-xs text-ink-faint">
            {remaining} to buy{done > 0 ? ` · ${done} in cart` : ""}
          </p>
        </div>
        <button className="btn-quiet !min-h-0 !p-2" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* pantry toggle */}
      <label className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-surface-raised px-4 py-3">
        <span className="text-sm font-medium text-ink-soft">
          Subtract what&apos;s in my pantry
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-moss"
          checked={settings.subtractPantry}
          onChange={(e) => updateSettings({ subtractPantry: e.target.checked })}
        />
      </label>

      {items.length === 0 ? (
        <EmptyState
          icon={<Check size={22} />}
          title="Nothing to buy"
          hint="Plan some meals for this week and the ingredients land here automatically."
          action={
            <Link href="/plan" className="btn-amber">
              Plan meals
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ section, items }) => (
            <section key={section}>
              <h2 className="eyebrow mb-2 px-1">{section}</h2>
              <div className="card divide-y divide-line overflow-hidden">
                {items.map((it) => {
                  const isChecked = !!checked[it.id];
                  return (
                    <div key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                      <button
                        onClick={() => toggleChecked(it.id)}
                        className={clsx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                          isChecked ? "border-moss bg-moss text-white" : "border-line"
                        )}
                        aria-label={isChecked ? "Uncheck" : "Check off"}
                      >
                        {isChecked && <Check size={15} />}
                      </button>
                      <div className={clsx("min-w-0 flex-1", isChecked && "opacity-50")}>
                        <p className={clsx("font-medium text-ink", isChecked && "line-through")}>
                          {it.name}
                          {it.estimated && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[10px] font-normal text-amber-ink">
                              <Info size={11} /> est.
                            </span>
                          )}
                        </p>
                        {it.fromMeals.length > 0 && (
                          <p className="truncate text-xs text-ink-faint">
                            {it.fromMeals.join(", ")}
                          </p>
                        )}
                        {it.manual && (
                          <p className="text-xs text-ink-faint">added manually</p>
                        )}
                      </div>
                      <span
                        className={clsx(
                          "readout shrink-0 text-sm font-medium text-ink",
                          isChecked && "opacity-50"
                        )}
                      >
                        {fmtQty(it.quantity)} {fmtUnit(it.unit, it.quantity)}
                      </span>
                      {it.manual && (
                        <button
                          aria-label="Remove item"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-coral-soft hover:text-coral"
                          onClick={() => removeManualItem(it.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <button className="btn-ghost mt-4 w-full" onClick={() => setAdding(true)}>
        <Plus size={18} /> Add an item
      </button>

      {settings.subtractPantry && items.some((i) => i.estimated) && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-soft px-3 py-2.5 text-xs text-amber-ink">
          <Info size={14} className="mt-0.5 shrink-0" />
          Items marked &ldquo;est.&rdquo; were reduced by an approximate pantry amount — double-check before you buy.
        </p>
      )}

      {adding && <AddItemSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddItemSheet({ onClose }: { onClose: () => void }) {
  const addManualItem = useStore((s) => s.addManualItem);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>("piece");
  const [section, setSection] = useState<GrocerySection>("Produce");

  function add() {
    if (!name.trim()) return;
    addManualItem({
      name: name.trim(),
      quantity,
      unit,
      section,
      fromMeals: [],
      estimated: false,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-surface p-4 shadow-card sm:rounded-2xl">
        <h2 className="mb-4 font-display text-xl font-bold">Add item</h2>
        <div className="space-y-3">
          <div>
            <label className="field-label">Item</label>
            <input
              className="field"
              value={name}
              autoFocus
              placeholder="Paper towels"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Quantity</label>
              <input
                type="number"
                step="any"
                className="field readout"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="field-label">Unit</label>
              <select className="field" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                {ALL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u === "floz" ? "fl oz" : u === "piece" ? "whole" : u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Aisle</label>
            <select
              className="field"
              value={section}
              onChange={(e) => setSection(e.target.value as GrocerySection)}
            >
              {GROCERY_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-amber flex-[2] disabled:opacity-40" onClick={add} disabled={!name.trim()}>
            Add to list
          </button>
        </div>
      </div>
    </div>
  );
}
