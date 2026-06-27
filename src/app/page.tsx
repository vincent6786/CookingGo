"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Snowflake,
  ListChecks,
  Plus,
  ArrowRight,
  Soup,
  Settings as SettingsIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { EmptyState } from "@/components/ui";
import MealSheet from "@/components/MealSheet";
import { buildShoppingList } from "@/lib/shopping";
import {
  addDays,
  daysUntil,
  todayISO,
  weekDates,
  weekStart,
} from "@/lib/dates";
import clsx from "clsx";

export default function HomePage() {
  return (
    <ClientGate>
      <Today />
    </ClientGate>
  );
}

function Today() {
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  const entries = useStore((s) => s.entries);
  const recipes = useStore((s) => s.recipes);
  const leftovers = useStore((s) => s.leftovers);
  const pantry = useStore((s) => s.pantry);
  const settings = useStore((s) => s.settings);
  const manual = useStore((s) => s.manualShopping);
  const checked = useStore((s) => s.checked);

  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])),
    [recipes]
  );

  const today = todayISO();
  const tomorrow = addDays(today, 1);

  const todayMeals = entries
    .filter((e) => e.date === today)
    .sort((a, b) => mealOrder(a.mealType) - mealOrder(b.mealType));

  // Prep cues: defrost freezer-friendly proteins planned for tomorrow.
  const prep = useMemo(() => {
    const cues: string[] = [];
    for (const e of entries.filter((x) => x.date === tomorrow && x.status === "cook")) {
      const r = e.recipeId ? recipeMap[e.recipeId] : undefined;
      if (!r) continue;
      if (r.freezerFriendly) {
        const protein = r.ingredients.find((i) => i.section === "Meat & seafood");
        if (protein) cues.push(`Defrost ${protein.name} for ${r.name}`);
      }
    }
    for (const e of todayMeals) {
      if (e.extraPortions > 0 && e.recipeId) {
        const r = recipeMap[e.recipeId];
        if (r) cues.push(`Cook +${e.extraPortions} extra of ${r.name} for leftovers`);
      }
    }
    return cues;
  }, [entries, tomorrow, recipeMap, todayMeals]);

  const attentionLeftovers = leftovers
    .filter((l) => daysUntil(l.consumeByDate) <= 2)
    .sort((a, b) => daysUntil(a.consumeByDate) - daysUntil(b.consumeByDate));

  // Shopping remaining for the current week.
  const weekEntries = useMemo(() => {
    const days = weekDates(weekStart(today));
    return entries.filter((e) => days.includes(e.date));
  }, [entries, today]);

  const shoppingItems = useMemo(
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
  const remaining = shoppingItems.filter((i) => !checked[i.id]).length;

  const greeting = getGreeting();
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="eyebrow mb-1">{dateLabel}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {greeting}
            {settings.name ? `, ${settings.name}` : ""}.
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-raised text-ink-soft hover:bg-surface-sunk"
        >
          <SettingsIcon size={19} />
        </Link>
      </header>

      {/* today's meals */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">On the menu</p>
          <button
            className="btn-quiet !min-h-0 gap-1 !px-2 !py-1 text-sm"
            onClick={() => setSheetDate(today)}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {todayMeals.length === 0 ? (
          <EmptyState
            icon={<Soup size={22} />}
            title="Nothing planned today"
            hint="Add a meal, or open the weekly plan to set up your week."
            action={
              <div className="flex gap-2">
                <button className="btn-amber" onClick={() => setSheetDate(today)}>
                  <Plus size={18} /> Add a meal
                </button>
                <Link className="btn-ghost" href="/plan">
                  Weekly plan
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {todayMeals.map((e) => {
              const r = e.recipeId ? recipeMap[e.recipeId] : undefined;
              const cookable = e.status === "cook" && r;
              return (
                <div key={e.id} className="card flex items-center gap-3 p-3.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunk text-2xl">
                    {e.status === "eat-out" ? "🍽️" : r?.emoji ?? "❓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="readout text-[11px] uppercase tracking-wider text-ink-faint">
                      {e.mealType}
                    </p>
                    <p className="truncate font-display text-lg font-semibold text-ink">
                      {e.status === "eat-out" ? "Eating out" : r?.name ?? "Removed recipe"}
                    </p>
                    {cookable && (
                      <p className="readout text-xs text-ink-faint">
                        {r!.prepMinutes + r!.cookMinutes} min · {e.servings} portions
                      </p>
                    )}
                  </div>
                  {cookable && (
                    <Link
                      href={`/recipes/${r!.id}/cook?servings=${e.servings}`}
                      className="btn-primary !min-h-0 shrink-0 !px-3 !py-2 text-sm"
                    >
                      <ChefHat size={16} /> Cook
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* prep */}
      {prep.length > 0 && (
        <section className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Snowflake size={16} className="text-ink-faint" />
            <p className="eyebrow">Prepare ahead</p>
          </div>
          <ul className="space-y-1.5">
            {prep.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* leftovers needing attention */}
      {attentionLeftovers.length > 0 && (
        <section>
          <p className="eyebrow mb-2">Eat these soon</p>
          <div className="space-y-2">
            {attentionLeftovers.map((l) => {
              const r = recipeMap[l.recipeId];
              const days = daysUntil(l.consumeByDate);
              return (
                <Link
                  key={l.id}
                  href="/pantry"
                  className="card flex items-center gap-3 p-3"
                >
                  <span className="text-xl">{r?.emoji ?? "🥡"}</span>
                  <div className="flex-1">
                    <p className="font-medium text-ink">{r?.name ?? "Leftover"}</p>
                    <p className="readout text-xs text-ink-faint">
                      {l.portions} portions · {l.location}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "chip",
                      days <= 0
                        ? "border-coral/40 bg-coral-soft text-coral-ink"
                        : "border-amber/40 bg-amber-soft text-amber-ink"
                    )}
                  >
                    {days <= 0 ? "Today" : `${days}d left`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* shopping snapshot */}
      <Link
        href="/shopping"
        className="card flex items-center gap-3 p-4 transition-colors hover:border-ink-faint"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-moss-soft text-moss-ink">
          <ListChecks size={20} />
        </span>
        <div className="flex-1">
          <p className="font-display font-semibold text-ink">Shopping list</p>
          <p className="text-sm text-ink-faint">
            {remaining === 0
              ? "All set for this week"
              : `${remaining} item${remaining === 1 ? "" : "s"} to buy this week`}
          </p>
        </div>
        <ArrowRight size={18} className="text-ink-faint" />
      </Link>

      {sheetDate && (
        <MealSheet date={sheetDate} onClose={() => setSheetDate(null)} />
      )}
    </div>
  );
}

function mealOrder(m: string): number {
  return { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }[m] ?? 4;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
