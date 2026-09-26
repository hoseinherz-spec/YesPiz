import { test, expect } from "@playwright/test";

test("admin creates, publishes, edits and hides a menu item; responsive menu workspace", async ({
  page,
  request,
}) => {
  await page.goto("http://localhost:8152/login/");
  await page.locator("input[type=email]").fill("admin@yespizz.local");
  await page.locator("input[type=password]").fill("Admin123!");
  await page
    .locator("form")
    .getByRole("button", { name: /^(sign in|log in)$/i })
    .press("Enter");
  await expect(page).not.toHaveURL(/login/);
  await page.goto("http://localhost:8152/menu");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Browser menu acceptance");
  await page
    .getByRole("button", { name: "Create version", exact: true })
    .click();
  await expect(
    page.getByText("Browser menu acceptance", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await page
    .getByLabel("Category name", { exact: true })
    .fill("Seasonal pizzas");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save category", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add category", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "Create item", exact: true }).click();
  await page
    .getByRole("combobox", { name: /Category/ })
    .evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await page.getByRole("combobox", { name: /Category/ }).fill("Seasonal");

  await page.getByRole("combobox", { name: /Category/ }).press("ArrowDown");
  await page.getByRole("combobox", { name: /Category/ }).press("Enter");
  await expect(page.getByRole("combobox", { name: /Category/ })).toHaveValue(
    "Seasonal pizzas",
  );
  await page.getByLabel("Name", { exact: true }).fill("Summer pizza");
  await page.getByLabel("Price (€)", { exact: true }).fill("12.50");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(
    page.locator("div.font-semibold").filter({ hasText: /^Summer pizza$/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/menu\/items\/[^/]+\/edit/);
  const editUrl = page.url();
  await page.getByRole("link", { name: "Versions", exact: true }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const menu = async () =>
    (await request.get("http://localhost:8158/api/v1/catalog/menu")).json();
  await expect
    .poll(async () => (await menu()).items[0]?.name)
    .toBe("Summer pizza");
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Edit item", exact: true }).click();
  const edit = page.locator("form").filter({
    has: page.getByRole("button", { name: "Save item", exact: true }),
  });
  await edit
    .getByLabel("Item name", { exact: true })
    .fill("Summer pizza deluxe");
  await edit.getByLabel("Price (€)", { exact: true }).fill("14.50");
  await edit.getByRole("button", { name: "Save item", exact: true }).click();
  await expect.poll(async () => (await menu()).items[0]?.priceCents).toBe(1450);
  await page.getByRole("button", { name: "Hide item", exact: true }).click();
  await expect.poll(async () => (await menu()).items.length).toBe(0);
  await page.getByRole("button", { name: "Show item", exact: true }).click();
  await expect
    .poll(async () => (await menu()).items[0]?.name)
    .toBe("Summer pizza deluxe");
  await page.reload();
  await expect(
    page
      .locator("div.font-semibold")
      .filter({ hasText: /^Summer pizza deluxe$/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Items", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search menu items" })
    .fill("deluxe");
  await expect(page.getByText(/1 records · Page 1 of 1/)).toBeVisible();
  await page.screenshot({ path: ".qa/ui/admin-menu.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: ".qa/ui/admin-menu-mobile.png",
    fullPage: true,
  });
});

test("admin selectors, media upload, form errors and table pagination", async ({
  page,
  request,
}) => {
  await page.goto("http://localhost:8152/login");
  await page.locator("input[type=email]").fill("admin@yespizz.local");
  await page.locator("input[type=password]").fill("Admin123!");
  await page.getByRole("button", { name: /^(sign in|log in)$/i }).click();
  await expect(page).not.toHaveURL(/login/);
  const token = await page.evaluate(() =>
    localStorage.getItem("yespizz_admin_token"),
  );
  const headers = { Authorization: `Bearer ${token}` };
  expect(
    (
      await request.get("http://localhost:8158/api/v1/operations/lookups/user")
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("http://localhost:8158/api/v1/catalog/media", {
        headers,
        data: { contentType: "image/png", base64: "bm90IGFuIGltYWdl" },
      })
    ).status(),
  ).toBe(400);
  await page.goto("http://localhost:8152/providers");
  await expect(
    page.getByRole("combobox", { name: "User", exact: true }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "User", exact: true }).fill("admin");
  await page
    .getByRole("option")
    .filter({ hasText: "admin@yespizz.local" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "User", exact: true }),
  ).toHaveValue(/admin@yespizz.local/);
  let submissions = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/providers")) submissions++;
  });
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(submissions).toBe(0);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Logo", { exact: true })
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  const preview = page.getByAltText("Current uploaded image");
  await expect(preview).toBeVisible();
  const uploaded = await request.get((await preview.getAttribute("src"))!);
  expect(uploaded.ok()).toBeTruthy();
  expect(uploaded.headers()["content-type"]).toContain("image/png");
  for (let i = 0; i < 12; i++) {
    const result = await request.post(
      "http://localhost:8158/api/v1/catalog/ingredients",
      {
        headers,
        data: {
          name: `Pagination ingredient ${String(i).padStart(2, "0")}`,
          slug: `pagination-ingredient-${i}`,
          description: "Table acceptance",
          image: "",
        },
      },
    );
    expect(result.ok()).toBeTruthy();
  }
  await page.goto("http://localhost:8152/menu/ingredients");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search ingredients" })
    .fill("Pagination ingredient 11");
  await expect(page.getByText(/1 records · Page 1 of 1/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sort by Record" }).click();
  await expect(
    page.getByRole("columnheader", { name: /Record/ }),
  ).toHaveAttribute("aria-sort", "asc" + "ending");
});

test("all admin workspaces render without client errors", async ({ page }) => {
  await page.goto("http://localhost:8152/login");
  await page.locator("input[type=email]").fill("admin@yespizz.local");
  await page.locator("input[type=password]").fill("Admin123!");
  await page.getByRole("button", { name: /^(sign in|log in)$/i }).click();
  await expect(page).not.toHaveURL(/login/);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "order-tools",
    "cash",
    "team-access",
    "inventory",
    "insights",
    "growth",
    "tasks",
    "finance",
    "support",
    "feedback",
    "couriers",
    "refunds",
    "providers",
    "quality",
    "incidents",
    "live",
    "config",
    "exceptions",
    "menu",
    "menu/categories",
    "menu/combos",
    "menu/ingredients",
    "menu/items",
    "menu/create",
  ]) {
    await page.goto(`http://localhost:8152/${route}`);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByText("Loading team access…", { exact: true }),
    ).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});
