"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { PageHeader } from "@/components/ui";
import MealSheet from "@/components/MealSheet";
import {
  addDays,
  dayLabel,
  dayNumber,
  isToday,
  monthDayLabel,
  todayISO,
  weekDates,
  weekStart,
} from "@/lib/dates";
import { MealEntry } from "@/lib/types";
import clsx from "clsx";

export default function PlanPage() {
  return (
    <ClientGate>
      <Plan />
    </ClientGate>
  );
}

function Plan() {
  const [anchor, setAnchor] = useState(weekStart(todayISO()));
  const [sheet, setSheet] = useState<{ date: string; editing?: MealEntry } | null>(null);

  const entries = useStore((s) => s.entries);
  const recipes = useStore((s) => s.recipes);
  const settings = useStore((s) => s.settings);
  const removeEntry = useStore((s) => s.removeEntry);

  const days = weekDates(anchor);
  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])),
    [recipes]
  );

  const cookDays = new Set(settings.preferredCookDays);

  const plannedCount = entries.filter((e) => days.includes(e.date)).length;

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Weekly plan"
        title="Your week"
        action={
          <button
            className="btn-ghost !px-3"
            onClick={() => setAnchor(weekStart(todayISO()))}
          >
            This week
          </button>
        }
      />

      {/* week switcher */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-line bg-surface-raised px-2 py-2">
        <button
          className="btn-quiet !min-h-0 !p-2"
          aria-label="Previous week"
          onClick={() => setAnchor(addDays(anchor, -7))}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="readout text-sm font-semibold text-ink">
            {monthDayLabel(days[0])} – {monthDayLabel(days[6])}
          </p>
          <p className="text-xs text-ink-faint">{plannedCount} meals planned</p>
        </div>
        <button
          className="btn-quiet !min-h-0 !p-2"
          aria-label="Next week"
          onClick={() => setAnchor(addDays(anchor, 7))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {days.map((date) => {
          const dayEntries = entries
            .filter((e) => e.date === date)
            .sort((a, b) => mealOrder(a.mealType) - mealOrder(b.mealType));
          const isCookDay = cookDays.has(new Date(date).getDay());

          return (
            <section
              key={date}
              className={clsx(
                "card overflow-hidden",
                isToday(date) && "ring-2 ring-amber"
              )}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-11 w-11 flex-col items-center justify-center rounded-xl",
                      isToday(date) ? "bg-amber text-white" : "bg-surface-sunk text-ink"
                    )}
                  >
                    <span className="text-[10px] uppercase leading-none">
                      {dayLabel(date)}
                    </span>
                    <span className="readout text-lg font-bold leading-tight">
                      {dayNumber(date)}
                    </span>
                  </div>
                  {isCookDay && (
                    <span className="chip border-amber/40 bg-amber-soft text-amber-ink">
                      Cook day
                    </span>
                  )}
                </div>
                <button
                  className="btn-quiet !min-h-0 gap-1 !px-2 !py-1.5 text-sm"
                  onClick={() => setSheet({ date })}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {dayEntries.length === 0 ? (
                <button
                  className="w-full px-4 py-3 text-left text-sm text-ink-faint hover:bg-surface-sunk"
                  onClick={() => setSheet({ date })}
                >
                  No meals yet — tap to plan one.
                </button>
              ) : (
                <ul className="divide-y divide-line">
                  {dayEntries.map((e) => {
                    const r = e.recipeId ? recipeMap[e.recipeId] : undefined;
                    return (
                      <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                        <button
                          className="flex flex-1 items-center gap-3 text-left"
                          onClick={() => setSheet({ date, editing: e })}
                        >
                          <span className="text-xl">
                            {e.status === "eat-out" ? "🍽️" : r?.emoji ?? "❓"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">
                              {e.status === "eat-out" ? "Eating out" : r?.name ?? "Removed recipe"}
                            </span>
                            <span className="readout text-xs capitalize text-ink-faint">
                              {e.mealType}
                              {e.status !== "eat-out" && ` · ${e.servings} portions`}
                              {e.extraPortions > 0 && ` · +${e.extraPortions} extra`}
                            </span>
                          </span>
                          {r && e.status === "cook" && (
                            <span className="readout shrink-0 text-xs text-ink-faint">
                              {r.prepMinutes + r.cookMinutes}m
                            </span>
                          )}
                        </button>
                        <button
                          aria-label="Remove meal"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-coral-soft hover:text-coral"
                          onClick={() => removeEntry(e.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-faint">
        <CalendarDays size={16} className="shrink-0" />
        Plan meals here, then your shopping list builds itself on the Shop tab.
      </div>

      {sheet && (
        <MealSheet
          date={sheet.date}
          editing={sheet.editing}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function mealOrder(m: string): number {
  return { breakfast: 0, lunch: 1, dinner: 2, snack: 3 }[m] ?? 4;
}
