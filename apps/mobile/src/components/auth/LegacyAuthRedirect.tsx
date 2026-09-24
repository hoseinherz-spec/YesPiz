"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function LegacyAuthRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to + window.location.search);
  }, [router, to]);
  return (
    <main className="min-h-dvh bg-background text-foreground grid place-items-center">
      <p role="status">Opening your account…</p>
    </main>
  );
}
