"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Globe, Sparkles } from "lucide-react";
import { ClientGate } from "@/components/ClientGate";
import RecipeForm from "@/components/RecipeForm";
import type { ImportedRecipe } from "@/lib/recipeImport";

export default function RecipeImportPage() {
  return (
    <ClientGate>
      <ImportFromUrl />
    </ClientGate>
  );
}

function ImportFromUrl() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<"url" | "loading" | "preview">("url");
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedRecipe | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>("");

  async function onFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch(
        `/api/import-recipe?url=${encodeURIComponent(url.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Import failed (${res.status})`);
        setPhase("url");
        return;
      }
      setImported(data.recipe as ImportedRecipe);
      setSourceUrl(data.sourceUrl ?? url.trim());
      setPhase("preview");
    } catch (err) {
      setError((err as Error).message);
      setPhase("url");
    }
  }

  if (phase === "preview" && imported) {
    return (
      <div className="pb-8">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="btn-quiet !min-h-0 gap-1 !px-2 !py-1.5 text-sm"
            onClick={() => {
              setPhase("url");
              setImported(null);
              setError(null);
            }}
          >
            <ChevronLeft size={18} /> Try a different URL
          </button>
        </div>
        <div className="card mb-4 flex items-start gap-2.5 p-3.5">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-amber" />
          <p className="text-sm text-ink-soft">
            Imported from{" "}
            <span className="break-all text-ink">{sourceUrl}</span>. Review and
            adjust below — quantities, sections, and steps may need tidying.
          </p>
        </div>
        <RecipeForm defaults={imported} />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-3">
        <Link
          href="/recipes"
          className="btn-quiet !min-h-0 gap-1 !px-2 !py-1.5 text-sm"
        >
          <ChevronLeft size={18} /> Recipes
        </Link>
      </div>

      <div className="mb-5">
        <p className="eyebrow">Import</p>
        <h1 className="font-display text-2xl font-bold text-ink">
          From a recipe URL
        </h1>
        <p className="mt-1.5 text-sm text-ink-faint">
          Works on NYT Cooking, Bon Appétit, Serious Eats, AllRecipes, most food
          blogs — anywhere the page embeds standard recipe metadata.
        </p>
      </div>

      <form onSubmit={onFetch} className="card space-y-3 p-5">
        <div>
          <label htmlFor="url" className="field-label">
            Recipe URL
          </label>
          <input
            id="url"
            type="url"
            required
            inputMode="url"
            placeholder="https://cooking.nytimes.com/recipes/…"
            className="field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={phase === "loading"}
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="btn-amber w-full"
          disabled={phase === "loading" || !url.trim()}
        >
          <Globe size={18} />
          {phase === "loading" ? "Fetching…" : "Fetch recipe"}
        </button>
        {error && <p className="text-sm text-coral-ink">{error}</p>}
        <p className="pt-1 text-center text-xs text-ink-faint">
          Instagram and TikTok captions don&apos;t use standard recipe metadata
          — that&apos;s a separate import flow, coming next.
        </p>
      </form>
    </div>
  );
}
