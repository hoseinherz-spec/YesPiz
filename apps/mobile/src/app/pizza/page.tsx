"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";

function PizzaPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  useEffect(() => {
    const remaining = new URLSearchParams(params.toString());
    remaining.delete("id");
    const query = remaining.toString();
    router.replace(
      id
        ? `/menu/${encodeURIComponent(id)}/${query ? `?${query}` : ""}`
        : "/menu/",
    );
  }, [id, params, router]);
  return (
    <AppFrame>
      <p role="status">Opening menu…</p>
    </AppFrame>
  );
}

export default function PizzaPage() {
  return (
    <Suspense
      fallback={
        <AppFrame padded={false}>
          <div
            className="h-dvh animate-pulse bg-card"
            aria-label="Loading pizza details"
          />
        </AppFrame>
      }
    >
      <PizzaPageInner />
    </Suspense>
  );
}
