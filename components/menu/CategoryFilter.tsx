"use client";

import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CupSoda, UtensilsCrossed, IceCream, Pizza, Coffee, Utensils, LayoutGrid } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("bebida") || n.includes("suco") || n.includes("refrigerante")) return CupSoda;
  if (n.includes("sobremesa") || n.includes("doce")) return IceCream;
  if (n.includes("yakisoba") || n.includes("massa") || n.includes("macarrão")) return UtensilsCrossed;
  if (n.includes("porç") || n.includes("entrada") || n.includes("acompanhamento")) return BowlFood;
  if (n.includes("pizza")) return Pizza;
  if (n.includes("café") || n.includes("cafe")) return Coffee;
  return Utensils;
};

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-1">
        <button
          onClick={() => onSelect(null)}
          title="Todos"
          className={cn(
            "p-3 rounded-xl flex items-center justify-center transition-all duration-200 border",
            selected === null
              ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
              : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-5 h-5 shrink-0" />
        </button>
        {categories
          .filter((cat) => {
            const n = cat.name.toLowerCase();
            return (
              n.includes("yakisoba") ||
              n.includes("massa") ||
              n.includes("macarrão") ||
              n.includes("bebida") ||
              n.includes("suco") ||
              n.includes("refrigerante")
            );
          })
          .map((cat) => {
          const Icon = getCategoryIcon(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              title={cat.name}
              className={cn(
                "p-3 rounded-xl flex items-center justify-center transition-all duration-200 border",
                selected === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
}
