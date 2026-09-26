export const ADMIN_AREAS = [
  "operations",
  "catalog",
  "finance",
  "support",
  "growth",
] as const;
export type AdminArea = (typeof ADMIN_AREAS)[number];
export const ADMIN_PERMISSIONS = ADMIN_AREAS.flatMap((area) => [
  `${area}:read`,
  `${area}:write`,
]);
/** Unknown admin routes fail closed for delegated staff. Account administration stays with full admins. */
export function requiredAdminPermission(
  url: string,
  method: string,
): string | null {
  const path = url.split("?")[0].replace(/^\/api\/v1\//, "");
  let area: AdminArea | undefined;
  if (
    /^(groups\/admin\/refunds|finance|payments\/(refunds|reconcile))/.test(path)
  )
    area = "finance";
  else if (/^(catalog|products|menus|pizzas|growth\/menu)(\/|$)/.test(path))
    area = "catalog";
  else if (/^(care|support|feedback)/.test(path)) area = "support";
  else if (/^(growth|referrals)/.test(path)) area = "growth";
  else if (
    /^(insights|inventory|delivery-slots|orders|dispatch|providers|couriers|quality|incidents|batches|proof|delivery|sla|operations)/.test(
      path,
    )
  )
    area = "operations";
  return area
    ? `${area}:${["GET", "HEAD", "OPTIONS"].includes(method) ? "read" : "write"}`
    : null;
}

/** Minimal lookup data is shared by the areas that actually select these entities. */
export function adminToolPermissions(
  url: string,
  method: string,
): string[] | null {
  const path = url.split("?")[0].replace(/^\/api\/v1\//, "");
  if (path === "catalog/media" && method === "POST")
    return ["catalog:write", "operations:write"];
  if (method !== "GET") return null;
  const kind = /^operations\/lookups\/([a-z]+)$/.exec(path)?.[1];
  const areas: Record<string, string[]> = {
    user: ["operations"],
    customer: ["operations", "support", "growth"],
    courier: ["operations", "finance"],
    provider: ["operations", "finance", "catalog"],
    order: ["operations", "finance", "support"],
    address: ["operations", "support"],
    ingredient: ["catalog", "operations"],
  };
  return kind && Object.prototype.hasOwnProperty.call(areas, kind)
    ? areas[kind].map((area) => `${area}:read`)
    : null;
}
