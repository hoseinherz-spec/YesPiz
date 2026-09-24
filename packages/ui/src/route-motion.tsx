export type TransitionApp =
  "customer" | "courier" | "admin" | "provider" | "website";
export type RouteMotion =
  | "fade"
  | `${"zoom" | "drill" | "sheet" | "product" | "food"}-${"in" | "out"}`
  | `${"axis" | "slide" | "strip" | "scroll"}-${"forward" | "back"}`;
export const normalizeRoute = (path: string) =>
  path.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
const tabs: Record<TransitionApp, string[]> = {
  customer: ["/home", "/menu", "/saved", "/orders", "/profile"],
  courier: ["/home", "/earnings", "/account"],
  admin: [
    "/live",
    "/tasks",
    "/orders",
    "/providers",
    "/menu",
    "/quality",
    "/incidents",
    "/support",
    "/feedback",
    "/finance",
    "/growth",
    "/config",
  ],
  provider: ["/offers", "/kitchen", "/batches", "/operations", "/statement"],
  website: ["/", "/dev", "/dev/yesplz"],
};
const auth = [
  "/login",
  "/signup",
  "/verification",
  "/forgot-password",
  "/reset-password",
];
const sheets = [
  "/cart",
  "/addresses/new",
  "/payment/new",
  "/profile/edit",
  "/feedback",
  "/chat",
  "/call",
];
function ordered(
  from: string,
  to: string,
  routes: string[],
  effect: "axis" | "slide" | "scroll",
): RouteMotion | undefined {
  const a = routes.indexOf(from),
    b = routes.indexOf(to);
  return a >= 0 && b >= 0
    ? `${effect}-${b > a ? "forward" : "back"}`
    : undefined;
}
/** Explicit relationships are reversible; unknown routes retain a fade fallback. */
export function mobileRouteMotion(
  from: string,
  to: string,
  app: TransitionApp,
): RouteMotion {
  from = normalizeRoute(from);
  to = normalizeRoute(to);
  if (from === to) return "fade";
  if (from === "/onboarding") return "strip-forward";
  if (to === "/onboarding") return "strip-back";
  const authMotion = ordered(from, to, auth, "axis");
  if (authMotion) return authMotion;
  if (app === "customer") {
    const isProduct = (route: string) => /^\/menu\/[^/]+$/.test(route);
    const isCatalog = (route: string) =>
      ["/home", "/menu", "/saved"].includes(route);
    if (isCatalog(from) && isProduct(to)) return "product-in";
    if (isProduct(from) && isCatalog(to)) return "product-out";
    if (to === "/tracking") return "food-in";
    if (from === "/tracking") return "food-out";
    if (to === "/cart" && (isCatalog(from) || isProduct(from)))
      return "food-in";
    if (from === "/cart" && (isCatalog(to) || isProduct(to))) return "food-out";
    const checkout = ordered(
      from,
      to,
      ["/cart", "/checkout", "/payment", "/order-success"],
      "axis",
    );
    if (checkout) return checkout;
    if (sheets.includes(to)) return "sheet-in";
    if (sheets.includes(from)) return "sheet-out";
    if (to === "/order-success") return "zoom-in";
    if (from === "/order-success") return "zoom-out";
    if (to === "/checkout" || to === "/payment") return "sheet-in";
    if (from === "/checkout" || from === "/payment") return "sheet-out";
    if (to === "/partner") return "zoom-in";
    if (from === "/partner") return "zoom-out";
    if (to === "/pizza" || /^\/menu\/[^/]+$/.test(to) || to === "/tracking")
      return "drill-in";
    if (
      from === "/pizza" ||
      /^\/menu\/[^/]+$/.test(from) ||
      from === "/tracking"
    )
      return "drill-out";
  }
  const tabMotion = ordered(
    from,
    to,
    tabs[app],
    app === "website" ? "scroll" : "slide",
  );
  if (tabMotion) return tabMotion;
  if (
    to.startsWith(`${from}/`) ||
    (tabs[app].includes(from) && !auth.includes(to))
  )
    return "drill-in";
  if (
    from.startsWith(`${to}/`) ||
    (tabs[app].includes(to) && !auth.includes(from))
  )
    return "drill-out";
  return "fade";
}
