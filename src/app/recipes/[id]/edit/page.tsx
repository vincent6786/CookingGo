"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import RecipeForm from "@/components/RecipeForm";

export default function EditRecipePage() {
  return (
    <ClientGate>
      <Edit />
    </ClientGate>
  );
}

function Edit() {
  const params = useParams();
  const id = params.id as string;
  const recipe = useStore((s) => s.recipes.find((r) => r.id === id));

  if (!recipe) {
    return (
      <div className="pt-10 text-center">
        <p className="text-ink-faint">This recipe no longer exists.</p>
        <Link href="/recipes" className="btn-ghost mt-4">
          Back to recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <Link
        href={`/recipes/${id}`}
        className="btn-quiet mb-3 !min-h-0 gap-1 !px-2 !py-1.5 text-sm"
      >
        <ChevronLeft size={18} /> {recipe.name}
      </Link>
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Edit recipe</h1>
      <RecipeForm existing={recipe} />
    </div>
  );
}
