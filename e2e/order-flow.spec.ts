import { test, expect, type Page } from "@playwright/test";

async function login(
  page: Page,
  base: string,
  email: string,
  password: string,
) {
  await page.bringToFront();
  await page.goto(`${base}/login/`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const submit = page
    .locator("form")
    .getByRole("button", { name: /^(sign in|log in)$/i });
  await submit.focus();
  await submit.press("Enter");
  await expect(page).not.toHaveURL(/\/login/);
}

let shiftCode = "";
test.beforeAll(async ({ request }) => {
  const login = await request.post(
    "http://localhost:8158/api/v1/account/auth/admin/login",
    {
      data: {
        method: "password",
        email: "admin@yespizz.local",
        password: "Admin123!",
      },
    },
  );
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const couriers = await request.get(
    "http://localhost:8158/api/v1/couriers/operations",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const rows = await couriers.json();
  const code = await request.post(
    "http://localhost:8158/api/v1/couriers/sessions/code",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { courierId: rows[0].userId, action: "start" },
    },
  );
  expect(code.ok()).toBeTruthy();
  shiftCode = (await code.json()).code;

  const updated = await request.patch(
    "http://localhost:8158/api/v1/app-config",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { bidWindowSeconds: 60 },
    },
  );
  expect(updated.ok()).toBeTruthy();
});

for (const method of ["card", "cash"] as const) {
  test(`${method}: customer checkout → kitchen → courier → customer delivery`, async ({
    browser,
  }) => {
    const customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { longitude: 11.58, latitude: 48.14 },
      permissions: ["geolocation"],
    });
    const courierContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { longitude: 11.5755, latitude: 48.1374 },
      permissions: ["geolocation"],
    });
    const kitchenContext = await browser.newContext();
    const customer = await customerContext.newPage();
    const kitchen = await kitchenContext.newPage();
    const courier = await courierContext.newPage();
    try {
      console.log(`${method}: signing in`);
      await login(
        customer,
        "http://localhost:8151",
        "customer@yespizz.local",
        "Customer123!",
      );
      await login(
        kitchen,
        "http://localhost:8184",
        "provider.munich@yespizz.local",
        "Provider123!",
      );
      await login(
        courier,
        "http://localhost:8153",
        "courier@yespizz.local",
        "Courier123!",
      );
      await expect(
        courier
          .getByRole("button", { name: "Start session", exact: true })
          .or(courier.getByText(/^On duty/)),
      ).toBeVisible();
      if (
        await courier
          .getByRole("button", { name: "Start session", exact: true })
          .isVisible()
      ) {
        await courier.getByLabel("Start QR / OTP").fill(shiftCode);
        await courier
          .getByRole("button", { name: "Start session", exact: true })
          .click();
        await expect(courier.getByText(/^On duty/)).toBeVisible();
      }
      await customer.bringToFront();
      console.log(`${method}: saving address and building cart`);
      // Save a real delivery coordinate through the customer's address screen.
      await customer.goto("http://localhost:8151/addresses/new/?from=checkout");
      await customer
        .locator('input[name="street"]')
        .fill("Maximilianstrasse 12");
      await customer.locator('input[name="latitude"]').fill("48.14");
      await customer.locator('input[name="longitude"]').fill("11.58");
      await customer
        .locator("form")
        .getByRole("button", { name: /save|add address/i })
        .click();
      await expect(customer).toHaveURL(/checkout/);
      await customer.goto("http://localhost:8151/menu/");
      await customer
        .getByRole("button", { name: "Margherita", exact: true })
        .first()
        .click();
      await expect(customer).toHaveURL(/pizza/);
      await customer.getByRole("button", { name: /Large/ }).click();
      await customer.getByRole("button", { name: /Extra Cheese/i }).click();
      await customer.getByRole("button", { name: /Add to cart/i }).click();
      await expect(customer).toHaveURL(/cart/);
      await customer.reload();
      await expect(
        customer.getByText("Margherita", { exact: true }),
      ).toBeVisible();
      await customer.getByRole("button", { name: /checkout/i }).click();
      await customer.locator('input[name="floor"]').fill("3");
      await customer.locator('input[name="instructions"]').fill("Ring once");
      await customer
        .getByRole("button", {
          name: method === "cash" ? /Cash on delivery/i : /^Card/,
        })
        .click();
      await customer
        .getByRole("button", { name: /continue.*payment/i })
        .click();
      await expect(customer).toHaveURL(/payment/);
      // 8.99 pizza + 3.00 large + 1.50 extra cheese + 2.99 delivery.
      await expect(
        customer.getByRole("button", { name: /Pay.*16.48/ }),
      ).toBeEnabled();
      await customer.screenshot({
        path: `.qa/ui/customer-${method}.png`,
        fullPage: true,
      });
      console.log(`${method}: submitting payment`);
      const created = customer.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/orders") &&
          response.request().method() === "POST",
      );
      await customer.getByRole("button", { name: /Pay.*16.48/ }).click();
      const order = await (await created).json();
      await expect(customer).toHaveURL(/order-success/);
      await customer.getByRole("button", { name: /track/i }).click();
      await expect(customer).toHaveURL(/tracking/);

      await kitchen.bringToFront();
      console.log(`${method}: kitchen handoff`);
      await kitchen
        .getByRole("button", { name: "Refresh", exact: true })
        .click();
      await kitchen
        .getByRole("button", { name: "Declare ready", exact: true })
        .click();
      await kitchen.goto("http://localhost:8184/kitchen");
      await kitchen
        .getByRole("button", { name: "Start preparing", exact: true })
        .click();
      await expect(kitchen.getByText(/large.*extra-cheese/)).toBeVisible();
      await expect(kitchen.getByRole("checkbox").first()).toBeVisible();
      await kitchen.screenshot({
        path: `.qa/ui/kitchen-${method}.png`,
        fullPage: true,
      });
      await kitchen.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() =>
          kitchen.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await kitchen.screenshot({
        path: `.qa/ui/kitchen-mobile-${method}.png`,
        fullPage: true,
      });
      await kitchen.setViewportSize({ width: 1280, height: 720 });
      for (const check of await kitchen.getByRole("checkbox").all())
        await check.check();
      await kitchen
        .getByRole("button", { name: "Submit checklist", exact: true })
        .click();
      await kitchen
        .getByLabel("Seal ID", { exact: true })
        .fill(`SEAL-${method}`);
      await kitchen
        .getByRole("button", { name: "Submit seal", exact: true })
        .click();
      await kitchen.getByLabel("Ready photo", { exact: true }).setInputFiles({
        name: "ready.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      });
      await expect(
        kitchen.getByText("Proof uploaded.", { exact: true }),
      ).toBeVisible();
      await kitchen
        .getByRole("button", { name: "Submit ready photo", exact: true })
        .click();
      await kitchen
        .getByRole("button", { name: "Mark ready", exact: true })
        .click();
      await kitchen.goto("http://localhost:8184/batches");
      await kitchen
        .getByRole("button", { name: /suggest/i })
        .first()
        .click();
      await kitchen
        .getByRole("button", { name: /create.*batch|create.*suggest/i })
        .click();
      const courierOption = await kitchen
        .getByRole("combobox", { name: "Assign courier" })
        .locator("option")
        .filter({ hasText: "Demo Courier" })
        .getAttribute("value");
      await kitchen
        .getByRole("combobox", { name: "Assign courier" })
        .selectOption(courierOption!);
      await kitchen
        .getByRole("button", { name: "Assign courier", exact: true })
        .click();
      await kitchen.goto("http://localhost:8184/kitchen");
      await kitchen
        .getByRole("button", { name: "Show pickup code", exact: true })
        .click();
      const pickupCode = await kitchen
        .locator("strong")
        .filter({ hasText: /^\d{6}$/ })
        .innerText();
      await courier.bringToFront();
      console.log(`${method}: courier delivery`);
      await courier
        .getByRole("button", { name: "Refresh", exact: true })
        .click();
      await courier.locator('a[href*="/home/batch/"]').last().click();
      await expect(courier).toHaveURL(/\/home\/batch\//, { timeout: 60_000 });
      await expect(courier.locator('a[href*="/home/order/"]')).toBeVisible({ timeout: 60_000 });
      await courier.screenshot({
        path: `.qa/ui/courier-batch-${method}.png`,
        fullPage: true,
      });
      await courier.locator('a[href*="/home/order/"]').click();
      await courier
        .getByLabel("Pickup code", { exact: false })
        .fill(pickupCode);
      await courier
        .getByRole("button", { name: "Confirm pickup", exact: true })
        .click();
      await courier
        .getByRole("button", { name: "Mark en route", exact: true })
        .click();
      await expect(
        courier.getByText("Ring once", { exact: true }),
      ).toBeVisible();
      await expect(courier.getByText(/Floor 3/)).toBeVisible();
      await courierContext.setGeolocation({
        latitude: 48.14,
        longitude: 11.58,
      });
      await customer.reload();
      const pin = await customer
        .locator('[data-testid="delivery-pin"]')
        .innerText();
      await courier.screenshot({
        path: `.qa/ui/courier-delivery-${method}.png`,
        fullPage: true,
      });
      await expect
        .poll(() =>
          courier.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await courier.getByLabel("Door PIN", { exact: true }).fill(pin);
      await courier
        .getByRole("button", { name: "Confirm delivery", exact: true })
        .click();
      if (method === "cash") {
        await expect(courier.getByLabel("Amount received (€)")).toHaveValue(
          "16.48",
        );
        await courier.screenshot({
          path: ".qa/ui/courier-cash-receipt.png",
          fullPage: true,
        });
        await courier
          .getByRole("button", { name: /record.*receipt|save.*receipt/i })
          .click();
      }
      await courier.getByRole("button", { name: "Mark completed" }).click();
      await customer.reload();
      await expect(
        customer.getByText(/delivered|arrived/i).first(),
      ).toBeVisible();
      await expect(courier.getByText(/completed/i).first()).toBeVisible();
      expect(order.totalCents).toBe(1648);
      await customer.goto("http://localhost:8151/orders/");
      await customer
        .getByRole("button", { name: /history/i, exact: true })
        .click();
      await customer
        .getByRole("button", { name: /reorder/i })
        .first()
        .click();
      await expect(
        customer.getByRole("dialog", { name: "Review reorder" }),
      ).toContainText("large");
      await expect(
        customer.getByRole("dialog", { name: "Review reorder" }),
      ).toContainText("extra-cheese");
    } finally {
      await customerContext.close();
      await courierContext.close();
      await kitchenContext.close();
    }
  });
}
