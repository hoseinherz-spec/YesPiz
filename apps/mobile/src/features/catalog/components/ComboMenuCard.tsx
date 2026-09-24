"use client";
import type { CatalogPizza } from "@/lib/catalog";
import { ComboCard } from "./ComboCard";
export function ComboMenuCard({ combo, language }: { combo: CatalogPizza; products: CatalogPizza[]; language: string }) {
  return <ComboCard pizza={combo} language={language} />;
}
