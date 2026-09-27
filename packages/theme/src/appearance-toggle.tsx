"use client";
import { useTheme } from "next-themes";

/** One persistent appearance control for the operational workspaces. */
export function AppearanceToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  if (compact) {
    return (
      <button
        type="button"
        className="panel-rail-item"
        aria-label="Switch between light and dark appearance"
        title="Appearance"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <span aria-hidden="true" className="text-base leading-none">
          ◐
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="panel-appearance"
      aria-label="Switch between light and dark appearance"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span aria-hidden="true">◐</span> Appearance
    </button>
  );
}
