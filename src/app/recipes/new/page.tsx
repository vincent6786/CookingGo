"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ClientGate } from "@/components/ClientGate";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <ClientGate>
      <div className="pb-6">
        <Link href="/recipes" className="btn-quiet mb-3 !min-h-0 gap-1 !px-2 !py-1.5 text-sm">
          <ChevronLeft size={18} /> Recipes
        </Link>
        <h1 className="mb-4 font-display text-2xl font-bold text-ink">New recipe</h1>
        <RecipeForm />
      </div>
    </ClientGate>
  );
}
