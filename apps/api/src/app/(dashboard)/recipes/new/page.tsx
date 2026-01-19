"use client";

import { RecipeForm } from "@/components/recipe/recipe-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewRecipePage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/recipes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-semibold">New Recipe</h1>
      </div>

      <RecipeForm mode="create" />
    </div>
  );
}
