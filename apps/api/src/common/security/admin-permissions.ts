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
