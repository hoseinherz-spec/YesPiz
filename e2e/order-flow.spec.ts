import { test, expect, type Page } from "@playwright/test";
import { startRoleApp, stopRoleApp, stopRoleApps } from "./role-servers";
test.afterAll(stopRoleApps);

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
  const submit = page.getByRole("button", {
    name: /^(sign in|log in)$/i,
  });
  await submit.click();
  await expect(page).not.toHaveURL(/\/(?:login|auth\/sign-in)(?:\/|$)/, {
    timeout: 60_000,
  });
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
  // Configure the pizza through the same API used by the menu editor.
  const menu = await (
    await request.get("http://localhost:8158/api/v1/catalog/menu")
  ).json();
  const pizza = menu.items.find(
    (item: { name: string }) => item.name === "Margherita",
  );
  const configured = await request.patch(
    `http://localhost:8158/api/v1/catalog/items/${pizza.id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        customization: {
          variants: [
            { id: "medium", name: "Medium", priceCents: 899, isActive: true },
            { id: "large", name: "Large", priceCents: 1199, isActive: true },
          ],
          groups: [
            {
              id: "extras",
              name: "Extras",
              min: 0,
              max: 2,
              options: [
                {
                  id: "extra-cheese",
                  name: "Extra Cheese",
                  priceCents: 150,
                  isActive: true,
                  variantIds: [],
                },
              ],
            },
          ],
        },
      },
    },
  );
  expect(configured.ok()).toBeTruthy();
  const couriers = await request.get(
    "http://localhost:8158/api/v1/couriers/operations",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const rows = await couriers.json();
  if (!rows[0].session) {
    const code = await request.post(
      "http://localhost:8158/api/v1/couriers/sessions/code",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { courierId: rows[0].userId, action: "start" },
      },
    );
    expect(code.ok()).toBeTruthy();
    shiftCode = (await code.json()).code;
  }

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
    test.setTimeout(600_000); // Cold compilation of three role apps can take several minutes.
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
    const courierErrors: string[] = [];
    courier.on("pageerror", (error) => courierErrors.push(error.message));
    try {
      await startRoleApp("provider-panel", 8184);
      await startRoleApp("courier-mobile", 8153);
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
          .getByRole("button", { name: /Start (session|shift)/ })
          .or(courier.getByText(/^On duty/)),
      ).toBeVisible();
      if (
        await courier
          .getByRole("button", { name: /Start (session|shift)/ })
          .isVisible()
      ) {
        await courier.getByLabel("Start QR / OTP").fill(shiftCode);
        await courier
          .getByRole("button", { name: /Start (session|shift)/ })
          .click();
        await expect(courier.getByText(/^On duty/)).toBeVisible();
      }
      await kitchen.goto("http://localhost:8184/operations/");
      const cap = kitchen.getByLabel("Accept cap (blank = no limit)");
      await expect(cap).toBeVisible();
      await cap.fill("12");
      await kitchen.getByRole("button", { name: "Save accept cap" }).click();
      await expect(
        kitchen.getByText("12 spaces remaining before new offers stop."),
      ).toBeVisible();
      await cap.fill("");
      await kitchen.getByRole("button", { name: "Save accept cap" }).click();
      await expect(kitchen.getByText(/^No capacity limit/)).toBeVisible();
      const item = kitchen
        .getByRole("listitem")
        .filter({ hasText: "Margherita" });
      await item.getByRole("button", { name: "86 item" }).click();
      await expect(item.getByRole("button", { name: "Restore" })).toBeVisible();
      await kitchen.reload();
      await expect(
        kitchen.getByLabel("Accept cap (blank = no limit)"),
      ).toHaveValue("");
      await item.getByRole("button", { name: "Restore" }).click();
      await expect(item.getByRole("button", { name: "86 item" })).toBeVisible();
      await kitchen.goto("http://localhost:8184/offers/");
      await customer.bringToFront();
      console.log(`${method}: saving address and building cart`);
      // Save a real delivery coordinate through the customer's address screen.
      await customer.goto("http://localhost:8151/addresses/new/?from=checkout");
      await customer.locator('input[name="street"]').fill("Maximilianstrasse");
      await customer.locator('input[name="houseNumber"]').fill("12");
      await customer.locator('input[name="postalCode"]').fill("80539");
      await customer.locator('input[name="city"]').fill("Munich");
      await customer
        .getByLabel("Delivery location on map")
        .click({ position: { x: 180, y: 140 } });
      await expect(
        customer.getByText("Pin placed", { exact: true }),
      ).toBeVisible();
      const addressSaved = customer.waitForResponse(
        (response) =>
          response.url().endsWith("/orders/addresses") &&
          response.request().method() === "POST",
      );
      await customer
        .locator("form")
        .getByRole("button", { name: /save|add address/i })
        .click();
      const savedAddress = await (await addressSaved).json();
      expect(savedAddress.latitude).toBeCloseTo(48.14, 1);
      expect(savedAddress.longitude).toBeCloseTo(11.58, 1);
      await expect(customer).toHaveURL(/\/checkout\/?$/);
      await customer.goto("http://localhost:8151/menu/");
      await customer
        .getByRole("link", { name: /^Margherita/ })
        .first()
        .click();
      await expect(customer).toHaveURL(/\/menu\/[^/]+\//);
      const largeSize = customer.getByRole("radio", { name: /Large/ });
      await largeSize.click();
      await expect(largeSize).toBeChecked();
      await customer.getByRole("checkbox", { name: /Extra Cheese/ }).click();
      await customer.getByRole("button", { name: /^Add\s+€13\.49$/ }).click();
      await customer.getByRole("button", { name: "Add to cart" }).click();
      await expect(customer).toHaveURL(/menu\/?$/);
      await customer.goto("http://localhost:8151/cart/");
      await customer.bringToFront();
      await customer.reload();
      await expect(
        customer.getByText("Margherita", { exact: true }),
      ).toBeVisible();
      const slideToOrder = customer.getByRole("button", {
        name: "Slide to order",
      });
      await slideToOrder.focus();
      await slideToOrder.press("Enter");
      await expect(customer).toHaveURL(/\/checkout\/?$/);
      await customer
        .getByRole("button", {
          name: "Edit address and delivery instructions",
          exact: true,
        })
        .click();
      await customer
        .getByRole("button", { name: /^Drop.off details/i })
        .click();
      await customer.locator('input[name="floor"]').fill("3");
      await customer.locator('input[name="instructions"]').fill("Ring once");
      await customer
        .getByRole("button", { name: "Save delivery details", exact: true })
        .click();
      await customer
        .getByRole("button", { name: /continue.*payment/i })
        .click();
      await expect(customer).toHaveURL(/payment/, { timeout: 90_000 });
      const paymentMethod = customer.getByRole("radio", {
        name: method === "cash" ? /Cash on Delivery/ : /Card/,
      });
      if (!(await paymentMethod.isChecked())) {
        await paymentMethod.focus();
        await paymentMethod.press("Space");
      }
      await expect(paymentMethod).toBeChecked();
      const placeOrder = customer.getByRole("button", {
        name: method === "cash" ? /Place order.*pay on delivery/ : /Pay.*16.48/,
      });
      // 8.99 pizza + 3.00 large + 1.50 extra cheese + 2.99 delivery.
      await expect(placeOrder).toBeEnabled();
      await customer.screenshot({
        path: `.qa/ui/customer-${method}.png`,
        fullPage: true, animations: "disabled", timeout: 60_000,
      });
      console.log(`${method}: submitting payment`);
      const created = customer.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/orders") &&
          response.request().method() === "POST",
      );
      await placeOrder.click();
      const createdResponse = await created;
      const order = await createdResponse.json();
      expect(
        createdResponse.request().postDataJSON().addressId,
        "Checkout preserves the newly selected address",
      ).toBe(savedAddress.id ?? savedAddress._id);
      await expect(customer).toHaveURL(/order-success/);
      await customer.getByRole("button", { name: /track/i }).click();
      await expect(customer).toHaveURL(/tracking/);
      await expect(customer.getByRole("heading", { name: "Finding your restaurant" })).toBeVisible();
      await expect(customer.getByText(/Maximilianstrasse 12/)).toBeVisible();

      await kitchen.bringToFront();
      console.log(`${method}: kitchen handoff`);
      await kitchen
        .getByRole("button", { name: "Refresh", exact: true })
        .click();
      await customer.bringToFront();
      await expect(customer.locator(".journey-matching strong")).toContainText(/[1-9]/);
      await customer.screenshot({ path: `.qa/ui/matching-live-${method}.png`, fullPage: true, animations: "disabled", timeout: 60_000 });
      await kitchen.bringToFront();
      await kitchen
        .getByRole("button", { name: "Declare ready", exact: true })
        .click();
      await kitchen.goto("http://localhost:8184/kitchen");
      await kitchen
        .getByRole("button", { name: "Start preparing", exact: true })
        .click();
      await expect(kitchen.getByText(/Large.*Extra Cheese/)).toBeVisible();
      await expect(kitchen.getByRole("checkbox").first()).toBeVisible();
      await kitchen.screenshot({
        path: `.qa/ui/kitchen-${method}.png`,
        fullPage: true, animations: "disabled", timeout: 60_000,
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
        fullPage: true, animations: "disabled", timeout: 60_000,
      });
      await kitchen.setViewportSize({ width: 1280, height: 720 });
      for (const check of await kitchen.getByRole("checkbox").all()) {
        await check.focus();
        await check.press("Space");
        await expect(check).toBeChecked();
      }
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
      await kitchen
        .getByRole("combobox", { name: "Assign courier" })
        .fill("Demo Courier");
      await kitchen.getByRole("option", { name: /Demo Courier/ }).click();
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
        .getByRole("button", { name: "Refresh assigned batches", exact: true })
        .click();
      await courier.locator('a[href*="/home/batch/"]').last().click();
      await expect(courier).toHaveURL(/\/home\/batch\//, { timeout: 60_000 });
      await expect(courier.locator('a[href*="/home/order/"]')).toBeVisible({
        timeout: 60_000,
      });
      await courier.screenshot({
        path: `.qa/ui/courier-batch-${method}.png`,
        fullPage: true, animations: "disabled", timeout: 60_000,
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
        latitude: Number(savedAddress.latitude),
        longitude: Number(savedAddress.longitude),
      });
      await customer.bringToFront();
      await customer.reload();
      await customer
        .getByRole("button", { name: /Driver information:/ })
        .click();
      const pin = await customer
        .locator('[data-testid="delivery-pin"]')
        .innerText();
      await courier.screenshot({
        path: `.qa/ui/courier-delivery-${method}.png`,
        fullPage: true, animations: "disabled", timeout: 60_000,
      });
      await expect
        .poll(() =>
          courier.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await courier
        .getByLabel("Door PIN", { exact: true })
        .fill(pin === "0000" ? "1111" : "0000");
      await courier
        .getByRole("button", { name: "Confirm delivery", exact: true })
        .click();
      await expect(
        courier.getByRole("alert").filter({ hasText: /invalid|expired/i }),
      ).toBeVisible();
      await courier.getByLabel("Door PIN", { exact: true }).fill(pin);
      const deliveryResponse = courier.waitForResponse(
        (response) =>
          response.url().endsWith("/deliver") &&
          response.request().method() === "POST",
      );
      await courier
        .getByRole("button", { name: "Confirm delivery", exact: true })
        .click();
      const deliveryResult = await deliveryResponse;
      expect(deliveryResult.ok(), await deliveryResult.text()).toBeTruthy();
      if (method === "cash") {
        await expect(courier.getByLabel("Amount received (€)")).toHaveValue(
          "16.48",
        );
        await courier.screenshot({
          path: ".qa/ui/courier-cash-receipt.png",
          fullPage: true, animations: "disabled", timeout: 60_000,
        });
        await courier
          .getByRole("button", { name: /record.*receipt|save.*receipt/i })
          .click();
      }
      await courier.getByRole("button", { name: "Mark completed" }).click();
      await customer.bringToFront();
      await customer.reload();
      await expect(
        customer.getByText(/delivered|arrived/i).first(),
      ).toBeVisible();
      await expect(courier.getByText(/completed/i).first()).toBeVisible();
      expect(order.totalCents).toBe(1648);
      expect(courierErrors).toEqual([]);
      await courierContext.close();
      await stopRoleApp("courier-mobile");
      await customer.goto("http://localhost:8151/orders/");
      await customer
        .getByRole("button", { name: "Completed", exact: true })
        .click();
      await customer
        .getByRole("button", { name: /order again|reorder/i })
        .first()
        .click();
      await expect(
        customer.getByRole("dialog", { name: "Review reorder" }),
      ).toContainText(
        /Review this (?:pizza|product)'s current choices before ordering again\./,
      );
      await expect(
        customer
          .getByRole("dialog", { name: "Review reorder" })
          .getByRole("button", { name: "Choose options" }),
      ).toBeVisible();
      await customer.goto(`http://localhost:8151/feedback/?order=${order.id}`);
      for (const dimension of [
        "Taste",
        "Temperature",
        "Packaging",
        "Delivery",
      ]) {
        await customer
          .getByRole("radiogroup", { name: new RegExp(`^${dimension}`) })
          .getByRole("radio", { name: "4", exact: true })
          .press("Space");
      }
      await customer
        .getByRole("radio", { name: "Yes", exact: true })
        .press("Space");
      await customer
        .getByLabel("What could we improve? (optional)")
        .fill(`Private pizza feedback ${method}`);
      await customer
        .getByRole("button", { name: "Send feedback", exact: true })
        .click();
      await expect(
        customer.getByText("Thanks for helping us improve"),
      ).toBeVisible();
      await customer.bringToFront();
      await customer.reload();
      await expect(
        customer.getByText("Thanks for helping us improve"),
      ).toBeVisible();
      await customer.goto(`http://localhost:8151/help/?order=${order.id}`);
      await customer
        .getByLabel("Tell us more")
        .fill(`Please review my pizza packaging ${method}.`);
      await customer
        .getByRole("button", { name: "Send to Yespizz", exact: true })
        .click();
      await expect(customer.getByRole("status")).toContainText(
        "Your request has been received.",
      );
      await customer.screenshot({
        path: `.qa/ui/customer-care-${method}.png`,
        fullPage: true, animations: "disabled", timeout: 60_000,
      });
      expect(await customer.locator("body").innerText()).not.toContain(
        "Secret source",
      );
      await startRoleApp("admin", 8152);
      const adminContext = await browser.newContext({
        viewport: { width: 1360, height: 960 },
      });
      try {
        const admin = await adminContext.newPage();
        await login(
          admin,
          "http://localhost:8152",
          "admin@yespizz.local",
          "Admin123!",
        );
        await admin.goto("http://localhost:8152/feedback");
        await expect(
          admin.getByText(`Private pizza feedback ${method}`, { exact: true }),
        ).toBeVisible();
        await admin.screenshot({
          path: `.qa/ui/admin-private-feedback-${method}.png`,
          fullPage: true, animations: "disabled", timeout: 60_000,
        });
        await admin.goto("http://localhost:8152/support");
        const requestCard = admin
          .locator("article")
          .filter({ hasText: `Please review my pizza packaging ${method}.` });
        await requestCard
          .getByRole("button", { name: "Claim & review" })
          .click();
        await admin
          .getByLabel("Internal review note", { exact: false })
          .fill("Quality review complete; internal details stay with Yespizz.");
        await admin
          .getByRole("button", { name: "Resolve request", exact: true })
          .click();
        await expect(requestCard).toHaveCount(0);
        await customer.bringToFront();
      await customer.reload();
        await expect(
          customer
            .locator("article")
            .filter({ hasText: `Please review my pizza packaging ${method}.` }),
        ).toContainText("Resolved");
        await admin.goto("http://localhost:8152/finance");
        await admin.getByRole("button", { name: /Completed order/ }).click();
        await admin
          .getByRole("option", { name: new RegExp(order.id.slice(-6)) })
          .click();
        await admin
          .getByLabel("Agreed amount (€)", { exact: true })
          .fill("7.50");
        await admin.getByLabel("Due date", { exact: true }).fill("2026-10-01");
        await admin
          .getByLabel("Internal accounting note", { exact: true })
          .fill("Approved agreed pizza production amount");
        await admin
          .getByRole("button", { name: "Approve settlement", exact: true })
          .click();
        await expect(
          admin.getByRole("article").filter({ hasText: order.id.slice(-6) }),
        ).toContainText(/€\s*7[.,]50/);
        await kitchen.goto("http://localhost:8184/statement");
        await expect(
          kitchen.getByRole("article").filter({ hasText: order.id.slice(-6) }),
        ).toContainText(/€\s*7[.,]50/);
      } finally {
        await adminContext.close();
        await stopRoleApp("admin");
      }
    } finally {
      await customerContext.close();
      await courierContext.close();
      await kitchenContext.close();
    }
  });
}
