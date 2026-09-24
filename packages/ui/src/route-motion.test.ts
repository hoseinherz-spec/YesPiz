import assert from "node:assert/strict";
import { test } from "node:test";
import { mobileRouteMotion } from "./route-motion";

test("ordered tabs stay spatially consistent when revisited", () => {
  assert.equal(
    mobileRouteMotion("/home/", "/menu/", "customer"),
    "slide-forward",
  );
  assert.equal(mobileRouteMotion("/menu", "/home", "customer"), "slide-back");
  assert.equal(
    mobileRouteMotion("/home", "/menu", "customer"),
    "slide-forward",
  );
});
test("specific route pairs take priority over sheets and hierarchy", () => {
  for (const [from, to, effect, reverse] of [
    ["/cart", "/checkout", "axis-forward", "axis-back"],
    ["/menu", "/cart", "food-in", "food-out"],
    ["/profile", "/profile/edit", "sheet-in", "sheet-out"],
    ["/menu", "/menu/test-pizza/", "product-in", "product-out"],
    ["/menu", "/partner", "zoom-in", "zoom-out"],
    ["/onboarding", "/login", "strip-forward", "strip-back"],
  ]) {
    assert.equal(mobileRouteMotion(from!, to!, "customer"), effect);
    assert.equal(mobileRouteMotion(to!, from!, "customer"), reverse);
  }
});
test("other apps cover sibling, nested, and unrelated routes", () => {
  assert.equal(
    mobileRouteMotion("/home", "/home/batch", "courier"),
    "drill-in",
  );
  assert.equal(
    mobileRouteMotion("/home/order", "/home", "courier"),
    "drill-out",
  );
  assert.equal(mobileRouteMotion("/live", "/menu", "admin"), "slide-forward");
  assert.equal(
    mobileRouteMotion("/offers", "/kitchen", "provider"),
    "slide-forward",
  );
  assert.equal(mobileRouteMotion("/", "/dev", "website"), "scroll-forward");
  assert.equal(mobileRouteMotion("/unknown", "/future", "customer"), "fade");
  assert.equal(
    mobileRouteMotion("/menu/?sort=price", "/menu", "customer"),
    "fade",
  );
});
