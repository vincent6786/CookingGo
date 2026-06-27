"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Snowflake,
  Refrigerator,
  Package,
  UtensilsCrossed,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { PageHeader, EmptyState, Stepper } from "@/components/ui";
import { fmtQty, fmtUnit } from "@/lib/units";
import {
  ALL_UNITS,
  GROCERY_SECTIONS,
  GrocerySection,
  Leftover,
  PantryItem,
  Unit,
} from "@/lib/types";
import { daysUntil, monthDayLabel, todayISO, addDays } from "@/lib/dates";
import clsx from "clsx";

type Tab = "leftovers" | "staples";

export default function PantryPage() {
  return (
    <ClientGate>
      <Pantry />
    </ClientGate>
  );
}

function Pantry() {
  const [tab, setTab] = useState<Tab>("leftovers");
  const [addingPantry, setAddingPantry] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);

  const leftovers = useStore((s) => s.leftovers);
  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);

  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])),
    [recipes]
  );

  const sortedLeftovers = useMemo(
    () =>
      [...leftovers].sort(
        (a, b) => daysUntil(a.consumeByDate) - daysUntil(b.consumeByDate)
      ),
    [leftovers]
  );

  const sortedPantry = useMemo(
    () =>
      [...pantry].sort((a, b) =>
        a.section === b.section
          ? a.name.localeCompare(b.name)
          : GROCERY_SECTIONS.indexOf(a.section) -
            GROCERY_SECTIONS.indexOf(b.section)
      ),
    [pantry]
  );

  return (
    <div className="pb-6">
      <PageHeader eyebrow="Kitchen stock" title="Pantry & leftovers" />

      {/* tab switch */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface-raised p-1">
        <TabButton active={tab === "leftovers"} onClick={() => setTab("leftovers")}>
          Leftovers
          {leftovers.length > 0 && (
            <span className="readout ml-1.5 text-xs opacity-70">
              {leftovers.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "staples"} onClick={() => setTab("staples")}>
          Pantry
          {pantry.length > 0 && (
            <span className="readout ml-1.5 text-xs opacity-70">
              {pantry.length}
            </span>
          )}
        </TabButton>
      </div>

      {tab === "leftovers" ? (
        sortedLeftovers.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed size={22} />}
            title="No leftovers tracked"
            hint="When you finish cooking, save extra portions and they'll show up here with a use-by countdown."
          />
        ) : (
          <div className="space-y-2">
            {sortedLeftovers.map((l) => (
              <LeftoverCard
                key={l.id}
                leftover={l}
                recipeName={recipeMap[l.recipeId]?.name ?? "Saved dish"}
                emoji={recipeMap[l.recipeId]?.emoji ?? "🍽️"}
              />
            ))}
          </div>
        )
      ) : (
        <>
          {sortedPantry.length === 0 ? (
            <EmptyState
              icon={<Package size={22} />}
              title="Pantry is empty"
              hint="Add staples you keep on hand. The shopping list can subtract these so you don't re-buy what you already have."
              action={
                <button className="btn-amber" onClick={() => setAddingPantry(true)}>
                  <Plus size={18} /> Add staple
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {sortedPantry.map((p) => (
                <PantryCard
                  key={p.id}
                  item={p}
                  onEdit={() => setEditing(p)}
                />
              ))}
            </div>
          )}

          {sortedPantry.length > 0 && (
            <button
              className="btn-ghost mt-4 w-full"
              onClick={() => setAddingPantry(true)}
            >
              <Plus size={18} /> Add staple
            </button>
          )}
        </>
      )}

      {(addingPantry || editing) && (
        <PantrySheet
          existing={editing}
          onClose={() => {
            setAddingPantry(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center rounded-xl py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-amber text-white shadow-sm"
          : "text-ink-soft hover:bg-surface-sunk"
      )}
    >
      {children}
    </button>
  );
}

function LeftoverCard({
  leftover,
  recipeName,
  emoji,
}: {
  leftover: Leftover;
  recipeName: string;
  emoji: string;
}) {
  const updateLeftover = useStore((s) => s.updateLeftover);
  const removeLeftover = useStore((s) => s.removeLeftover);
  const left = daysUntil(leftover.consumeByDate);
  const isFreezer = /freez/i.test(leftover.location);

  const urgency =
    left < 0
      ? { label: "past use-by", cls: "text-coral bg-coral-soft" }
      : left === 0
      ? { label: "use today", cls: "text-coral bg-coral-soft" }
      : left <= 2
      ? { label: `${left}d left`, cls: "text-amber-ink bg-amber-soft" }
      : { label: `${left}d left`, cls: "text-moss bg-moss-soft" };

  function eatOne() {
    if (leftover.portions <= 1) {
      removeLeftover(leftover.id);
    } else {
      updateLeftover(leftover.id, { portions: leftover.portions - 1 });
    }
  }

  return (
    <div className="card flex items-center gap-3 px-3 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-sunk text-xl">
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{recipeName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1">
            {isFreezer ? <Snowflake size={12} /> : <Refrigerator size={12} />}
            {leftover.location}
          </span>
          <span>·</span>
          <span className="readout">{leftover.portions} ptn</span>
          <span>·</span>
          <span className={clsx("rounded px-1.5 py-0.5 font-medium", urgency.cls)}>
            {urgency.label}
          </span>
        </div>
      </div>
      <button
        onClick={eatOne}
        className="btn-quiet !min-h-0 shrink-0 !px-2.5 !py-1.5 text-xs"
        aria-label="Mark one portion eaten"
      >
        Ate one
      </button>
      <button
        onClick={() => removeLeftover(leftover.id)}
        aria-label="Remove"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-coral-soft hover:text-coral"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PantryCard({
  item,
  onEdit,
}: {
  item: PantryItem;
  onEdit: () => void;
}) {
  const removePantry = useStore((s) => s.removePantry);
  const expiringSoon =
    item.expiryDate !== undefined && daysUntil(item.expiryDate) <= 3;

  return (
    <div className="card flex items-center gap-3 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {item.name}
          {item.approximate && (
            <span className="ml-1.5 align-middle text-[10px] font-normal text-ink-faint">
              approx.
            </span>
          )}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <span>{item.section}</span>
          {item.location && (
            <>
              <span>·</span>
              <span>{item.location}</span>
            </>
          )}
          {item.expiryDate && (
            <>
              <span>·</span>
              <span
                className={clsx(
                  "inline-flex items-center gap-1",
                  expiringSoon && "text-coral"
                )}
              >
                {expiringSoon && <AlertTriangle size={11} />}
                exp {monthDayLabel(item.expiryDate)}
              </span>
            </>
          )}
        </div>
      </div>
      <span className="readout shrink-0 text-sm font-medium text-ink">
        {fmtQty(item.quantity)} {fmtUnit(item.unit, item.quantity)}
      </span>
      <button
        onClick={onEdit}
        aria-label="Edit"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-sunk hover:text-ink"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={() => removePantry(item.id)}
        aria-label="Remove"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-coral-soft hover:text-coral"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function PantrySheet({
  existing,
  onClose,
}: {
  existing: PantryItem | null;
  onClose: () => void;
}) {
  const addPantry = useStore((s) => s.addPantry);
  const updatePantry = useStore((s) => s.updatePantry);

  const [name, setName] = useState(existing?.name ?? "");
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [unit, setUnit] = useState<Unit>(existing?.unit ?? "piece");
  const [section, setSection] = useState<GrocerySection>(
    existing?.section ?? "Canned & packaged"
  );
  const [location, setLocation] = useState(existing?.location ?? "Pantry");
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? "");
  const [approximate, setApproximate] = useState(existing?.approximate ?? false);

  function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      quantity,
      unit,
      section,
      location: location.trim(),
      expiryDate: expiryDate || undefined,
      approximate,
    };
    if (existing) {
      updatePantry(existing.id, payload);
    } else {
      addPantry(payload);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-card sm:rounded-2xl">
        <h2 className="mb-4 font-display text-xl font-bold">
          {existing ? "Edit staple" : "Add staple"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="field-label">Item</label>
            <input
              className="field"
              value={name}
              autoFocus
              placeholder="Olive oil"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
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
              <select
                className="field"
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
              >
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Stored in</label>
              <input
                className="field"
                value={location}
                placeholder="Pantry"
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Expiry (optional)</label>
              <input
                type="date"
                className="field readout"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-line bg-surface-raised px-3 py-2.5">
            <span className="text-sm font-medium text-ink-soft">
              Amount is approximate
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-moss"
              checked={approximate}
              onChange={(e) => setApproximate(e.target.checked)}
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-amber flex-[2] disabled:opacity-40"
            onClick={save}
            disabled={!name.trim()}
          >
            {existing ? "Save changes" : "Add to pantry"}
          </button>
        </div>
      </div>
    </div>
  );
}
