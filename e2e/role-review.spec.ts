import { test, expect } from "@playwright/test";

const roles = [
  {
    role: "customer",
    port: 8151,
    email: "customer@yespizz.local",
    password: "Customer123!",
    routes: [
      "home",
      "menu",
      "cart",
      "checkout",
      "payment",
      "payment/new",
      "orders",
      "saved",
      "profile",
      "profile/edit",
      "settings",
      "settings/privacy",
      "addresses/new",
      "notifications",
      "help",
      "referrals",
      "credit",
      "feedback",
      "chat",
      "tracking",
      "order-success",
      "partner",
      "call",
    ],
  },
  {
    role: "admin",
    port: 8152,
    email: "admin@yespizz.local",
    password: "Admin123!",
    routes: [
      "live",
      "incidents",
      "incidents/000000000000000000000000",
      "exceptions",
      "couriers",
      "providers",
      "quality",
      "quality/000000000000000000000000",
      "refunds",
      "menu",
      "config",
      "growth",
      "tasks",
      "finance",
      "support",
      "feedback",
    ],
  },
  {
    role: "kitchen",
    port: 8184,
    email: "provider.munich@yespizz.local",
    password: "Provider123!",
    routes: ["offers", "kitchen", "operations", "batches", "statement"],
  },
  {
    role: "courier",
    port: 8153,
    email: "courier@yespizz.local",
    password: "Courier123!",
    routes: ["home", "earnings", "home/batch", "home/order"],
  },
];

for (const role of roles) {
  test(`${role.role}: authenticated screens and responsive layouts`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://localhost:${role.port}/login/`);
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill(role.email);
    await page.locator('input[type="password"]').fill(role.password);
    await page
      .locator("form")
      .getByRole("button", { name: /^(sign in|log in)$/i })
      .click();
    await expect(page).not.toHaveURL(/\/login/);
    for (const route of role.routes) {
      await test.step(route, async () => {
        console.log(`Review ${role.role}: /${route}`);
        await page.setViewportSize({ width: 1360, height: 960 });
        const response = await page.goto(
          `http://localhost:${role.port}/${route}/`,
        );
        expect
          .soft(response?.status(), `${role.role}/${route}: HTTP`)
          .toBeLessThan(400);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("body")).not.toBeEmpty();
        await expect(page.getByRole("progressbar")).toHaveCount(0);
        await expect
          .soft(page.getByText(/Application error:|Internal Server Error/))
          .toHaveCount(0);
        await page.screenshot({
          path: `.qa/review/${role.role}-${route.replaceAll("/", "-")}-desktop.png`,
          fullPage: true,
          caret: "initial",
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect.soft
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            { message: `${role.role}/${route}: mobile overflow` },
          )
          .toBe(true);
        await page.screenshot({
          path: `.qa/review/${role.role}-${route.replaceAll("/", "-")}-mobile.png`,
          fullPage: true,
          caret: "initial",
        });
      });
    }
    if (role.role === "customer") {
      await page.goto(`http://localhost:${role.port}/settings/`);
      await page
        .getByRole("button", { name: "Light mode", exact: true })
        .click();
      await expect(page.locator("html")).toHaveClass(/light/);
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Light mode", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.screenshot({
        path: ".qa/review/customer-settings-light.png",
        fullPage: true,
        caret: "initial",
      });
      await page.getByRole("button", { name: "Deutsch", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Heller Modus", exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Heller Modus", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: ".qa/review/customer-settings-german.png",
        fullPage: true,
        caret: "initial",
      });
      await page.getByRole("button", { name: "English", exact: true }).click();
      await page.getByRole("button", { name: "Log Out", exact: true }).click();
      await expect(page).toHaveURL(/login/);
    }
    expect.soft(errors, "uncaught browser errors").toEqual([]);
  });
}

test("visitor: public landing and customer account entry screens", async ({
  page,
}) => {
  for (const [port, routes] of [
    [8150, [""]],
    [
      8151,
      [
        "onboarding",
        "login",
        "signup",
        "forgot-password",
        "reset-password",
        "verification",
        "page-does-not-exist",
      ],
    ],
  ] as const) {
    for (const route of routes) {
      const response = await page.goto(
        `http://localhost:${port}/${route ? `${route}/` : ""}`,
      );
      expect
        .soft(response?.status())
        .toBe(route === "page-does-not-exist" ? 404 : 200);
      await page.waitForLoadState("networkidle");
      if (port === 8150) {
        for (const href of await page
          .locator('footer a[href^="#"]')
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute("href")!),
          )) {
          expect(href).not.toBe("#");
          await expect(page.locator(href)).toHaveCount(1);
        }
      }
      for (const width of [1360, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect.soft
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            { message: `${port}/${route}: overflow at ${width}` },
          )
          .toBe(true);
        await page.screenshot({
          path: `.qa/review/visitor-${port}-${route || "landing"}-${width}.png`,
          fullPage: true,
          caret: "initial",
        });
      }
    }
  }
});

for (const role of roles) {
  test(`${role.role}: wrong-role credentials cannot sign in`, async ({
    page,
  }) => {
    await page.goto(`http://localhost:${role.port}/login/`);
    await page.waitForLoadState("networkidle");
    await page
      .locator('input[type="email"]')
      .fill(
        role.role === "customer"
          ? "admin@yespizz.local"
          : "customer@yespizz.local",
      );
    await page
      .locator('input[type="password"]')
      .fill(role.role === "customer" ? "Admin123!" : "Customer123!");
    await page
      .locator("form")
      .getByRole("button", { name: /^(sign in|log in)$/i })
      .click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
}

test("customer: new delivery address persists through navigation and reload", async ({
  page,
}) => {
  await page.goto("http://localhost:8151/login/");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').fill("customer@yespizz.local");
  await page.locator('input[type="password"]').fill("Customer123!");
  await page
    .locator("form")
    .getByRole("button", { name: /sign in|log in/i })
    .click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto("http://localhost:8151/addresses/new/?from=checkout");
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="street"]').fill("New destination 48");
  await page.locator('input[name="postalCode"]').fill("80539");
  await page.locator('input[name="latitude"]').fill("48.14");
  await page.locator('input[name="longitude"]').fill("11.58");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/orders/addresses") &&
      response.request().method() === "POST",
  );
  await page
    .locator("form")
    .getByRole("button", { name: /save|add address/i })
    .click();
  const address = await (await saved).json();
  expect(address).toMatchObject({ latitude: 48.14, longitude: 11.58 });
  await expect(page).toHaveURL(/\/checkout\/?$/);
  const selected = () =>
    page.getByRole("radio", { name: /New destination 48/ });
  await expect(selected()).toBeChecked();
  await page.goto("http://localhost:8151/menu/");
  await page.goto("http://localhost:8151/checkout/");
  await expect(selected()).toBeChecked();
  await page.reload();
  await expect(selected()).toBeChecked();
  const token = await page.evaluate(() =>
    localStorage.getItem("yespizz_access_token"),
  );
  await page.route("**/api/v1/account/profile/me", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporarily unavailable" }),
    }),
  );
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(
    await page.evaluate(() => localStorage.getItem("yespizz_access_token")),
  ).toBe(token);
  await page.unroute("**/api/v1/account/profile/me");
  await page.reload();
  await expect(selected()).toBeChecked();
});
