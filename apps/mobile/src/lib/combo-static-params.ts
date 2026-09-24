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

  if (!response) return [];
  if (!response.ok) {
    throw new Error(
      "Cannot generate combo detail routes: catalog API unavailable.",
    );
  }

  const result = await response.json();
  const menu = result.data ?? result;
  if (!Array.isArray(menu.items)) {
    throw new Error(
      "Cannot generate combo detail routes: invalid catalog response.",
    );
  }

  return menu.items
    .filter(
      (item: { id?: unknown; productType?: unknown }) =>
        item.productType === "combo" &&
        typeof item.id === "string" &&
        item.id.length > 0,
    )
    .map((item: { id: string }) => ({ id: item.id }));
}
