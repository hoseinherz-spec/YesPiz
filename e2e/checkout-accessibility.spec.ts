import { test, expect } from "@playwright/test";

const app = "http://localhost:8151";
const api = "http://localhost:8158/api/v1";

test("customer delivery details, payment selection, tracking and account remain accessible", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const login = await request.post(`${api}/account/auth/customer/login`, {
    data: {
      method: "password",
      email: "customer@yespizz.local",
      password: "Customer123!",
    },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const savedAddress = await request.post(`${api}/orders/addresses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      label: "Home",
      street: "Maximilianstrasse 12",
      city: "Munich",
      zipcode: "80539",
      latitude: 48.14,
      longitude: 11.58,
      isDefault: true,
    },
  });
  expect(savedAddress.ok()).toBeTruthy();
  await page.goto(`${app}/login/`);
  await page.locator('input[type="email"]').fill("customer@yespizz.local");
  await page.locator('input[type="password"]').fill("Customer123!");
  await page.getByRole("button", { name: /^(sign in|log in)$/i }).click();
  await expect(page).not.toHaveURL(/sign-in|login/);
  await page.goto(`${app}/menu/`);
  await page
    .getByRole("link", { name: /^Margherita/ })
    .first()
    .click();
  await page.getByRole("button", { name: /^Add\s+€/ }).click();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.goto(`${app}/checkout/`);
  await expect(
    page.getByRole("navigation", { name: "Checkout steps" }),
  ).toBeVisible();
  const edit = page.getByRole("button", {
    name: "Edit address and delivery instructions",
  });
  await edit.click();
  await expect(
    page.getByRole("heading", { name: "Edit address" }),
  ).toBeFocused();
  const details = page.getByRole("button", { name: /Drop-off details/ });
  await details.click();
  await expect(details).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Floor", { exact: true }).fill("3");
  await page
    .getByLabel("Delivery instructions", { exact: true })
    .fill("Ring once");
  await details.click();
  await expect(details).toHaveAttribute("aria-expanded", "false");
  await details.press("Tab");
  await expect(
    page.getByRole("button", { name: "Save delivery details" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Save delivery details" }).click();
  await expect(edit).toBeFocused();
  await page.getByRole("button", { name: /continue.*payment/i }).click();
  await expect(page).toHaveURL(/\/payment\//);
  const cash = page.getByRole("radio", { name: /Cash on Delivery/ });
  await cash.focus();
  await cash.press("Space");
  await expect(cash).toBeChecked();
  const submit = page.getByRole("button", {
    name: /Place order.*pay on delivery/,
  });
  await expect(submit).toBeEnabled();
  const created = page.waitForResponse(
    (r) => r.url() === `${api}/orders` && r.request().method() === "POST",
  );
  await submit.click();
  const response = await created;
  expect(response.ok()).toBeTruthy();
  expect(response.request().postDataJSON()).toMatchObject({
    deliveryFloor: "3",
    deliveryInstructions: "Ring once",
    paymentMethod: "cash",
  });
  await expect(page).toHaveURL(/order-success/);
  await page.getByRole("button", { name: /track/i }).click();
  await expect(page.locator(".tracking-eta")).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Order progress" }),
  ).toBeVisible();
  await expect(
    page.getByText("Maximilianstrasse 12", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Help with this order" }),
  ).toBeVisible();
  await page.goto(`${app}/profile/`);
  await expect(
    page.getByRole("heading", { name: "Your account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Your orders Track/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
