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
  await expect(page.getByText("No items yet", { exact: true })).toBeVisible();
  await page
    .getByLabel("Category name", { exact: true })
    .fill("Seasonal pizzas");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption({ label: "Seasonal pizzas" });
  await page.getByLabel("Name", { exact: true }).fill("Summer pizza");
  await page.getByLabel("Price (€)", { exact: true }).fill("12.50");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.getByText("Summer pizza", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const menu = async () =>
    (await request.get("http://localhost:8158/api/v1/catalog/menu")).json();
  await expect
    .poll(async () => (await menu()).items[0]?.name)
    .toBe("Summer pizza");
  await page.getByRole("button", { name: "Edit item", exact: true }).click();
  const edit = page
    .locator("form")
    .filter({
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
    page.getByText("Summer pizza deluxe", { exact: true }),
  ).toBeVisible();
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
