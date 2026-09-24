/// <reference types="react/canary" />
"use client";

import { useState, ViewTransition, type ReactNode } from "react";
import {
  mobileRouteMotion,
  normalizeRoute,
  type RouteMotion,
  type TransitionApp,
} from "./route-motion";
export { mobileRouteMotion } from "./route-motion";

export function MobilePageTransition({
  children,
  pathname,
  app,
}: {
  children: ReactNode;
  pathname: string;
  app: TransitionApp;
}) {
  const route = normalizeRoute(pathname);
  const [navigation, setNavigation] = useState<{ route: string; motion: RouteMotion }>({ route, motion: "fade" });
  const motion = navigation.route === route
    ? navigation.motion
    : mobileRouteMotion(navigation.route, route, app);
  // Keep the route pair across render retries. Mutating a ref during render
  // consumed the old route before commit and silently changed motion to fade.
  if (navigation.route !== route) setNavigation({ route, motion });
  return (
    <ViewTransition
      key={route}
      name="mobile-page"
      share={`mobile-${motion}`}
      default="none"
    >
      <div className="mobile-transition-page" data-page-motion={motion}>
        {children}
      </div>
    </ViewTransition>
  );
}

/** Both ends use the entity ID, so a product image continues into its detail. */
export function PageHero({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={`product-${Array.from(id, (char) => char.codePointAt(0)!.toString(16)).join("-")}`}
      share="mobile-hero"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
