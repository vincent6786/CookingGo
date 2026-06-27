"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Clock, ChefHat } from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { PageHeader, EmptyState } from "@/components/ui";
import { RECIPE_TAGS } from "@/lib/types";
import clsx from "clsx";

export default function RecipesPage() {
  return (
    <ClientGate>
      <Recipes />
    </ClientGate>
  );
}

function Recipes() {
  const recipes = useStore((s) => s.recipes);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return recipes
      .filter((r) => (q ? r.name.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (tag ? r.tags.includes(tag as never) : true))
      .sort((a, b) => (b.lastCookedAt ?? 0) - (a.lastCookedAt ?? 0) || a.name.localeCompare(b.name));
  }, [recipes, q, tag]);

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Library"
        title="Recipes"
        action={
          <Link href="/recipes/new" className="btn-amber !px-3">
            <Plus size={18} /> New
          </Link>
        }
      />

      <div className="relative mb-3">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          className="field pl-10"
          placeholder="Search recipes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip label="All" active={tag === null} onClick={() => setTag(null)} />
        {RECIPE_TAGS.map((t) => (
          <FilterChip
            key={t}
            label={t}
            active={tag === t}
            onClick={() => setTag(tag === t ? null : t)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ChefHat size={22} />}
          title={q || tag ? "No matches" : "No recipes yet"}
          hint={q || tag ? "Try a different search or filter." : "Add your first recipe to start planning."}
          action={
            <Link href="/recipes/new" className="btn-amber">
              <Plus size={18} /> Add recipe
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="card flex flex-col p-3 transition-transform active:scale-[0.98]"
            >
              <div className="mb-2 flex h-20 items-center justify-center rounded-xl bg-surface-sunk text-4xl">
                {r.emoji}
              </div>
              <p className="line-clamp-2 font-medium leading-tight text-ink">{r.name}</p>
              <div className="mt-2 flex items-center gap-2 text-ink-faint">
                <Clock size={13} />
                <span className="readout text-xs">{r.prepMinutes + r.cookMinutes} min</span>
                <span className="text-xs">·</span>
                <span className="readout text-xs">serves {r.servings}</span>
              </div>
              {r.tags[0] && (
                <span className="mt-2 inline-block self-start rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-medium text-amber-ink">
                  {r.tags[0]}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-ink bg-ink text-surface"
          : "border-line bg-surface-raised text-ink-faint hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
