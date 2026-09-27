import { PIZZAS } from "@/constants/pizzas";

// Capacitor packages static pages, including every published catalog item.
// Rebuild the native bundle after publishing new pizza IDs.
export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8058";
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/v1/catalog/menu`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  ).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") return null;
    throw error;
  });
  if (!response) {
    // API unavailable at build time: fall back to the bundled product ids so
    // the app still builds. Runtime screens fetch the real catalog again.
    return PIZZAS.map(({ id }) => ({ id }));
  }
  if (!response.ok)
    throw new Error(
      "Cannot generate menu detail routes: catalog API unavailable.",
    );
  const result = await response.json();
  const menu = result.data ?? result;
  if (!Array.isArray(menu.items))
    throw new Error(
      "Cannot generate menu detail routes: invalid catalog response.",
    );
  const ids = new Set<string>(PIZZAS.map((pizza) => pizza.id));
  for (const item of menu.items) {
    if (typeof item.id === "string" && item.id) ids.add(item.id);
  }
  return [...ids].map((id) => ({ id }));
}
