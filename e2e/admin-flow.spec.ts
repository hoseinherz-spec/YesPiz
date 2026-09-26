import { test, expect, type Page } from "@playwright/test";
async function login(
  page: Page,
  port: number,
  email: string,
  password: string,
) {
  await page.bringToFront();
  await page.goto(`http://localhost:${port}/login/`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const submit = page
    .locator("form")
    .getByRole("button", { name: /^(sign in|log in)$/i });
  await submit.focus();
  await submit.press("Enter");
  await expect(page).not.toHaveURL(/login/);
}
test("admin issues a QR shift code, courier resumes on reload and ends with a new code", async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const courierContext = await browser.newContext({
    permissions: ["geolocation"],
    geolocation: { longitude: 11.5755, latitude: 48.1374 },
  });
  const admin = await adminContext.newPage();
  const courier = await courierContext.newPage();
  try {
    await login(admin, 8152, "admin@yespizz.local", "Admin123!");
    await admin.goto("http://localhost:8152/couriers");
    await admin.getByRole("button", { name: "Issue start code" }).click();
    const code = await admin.locator("code").innerText();
    await expect(admin.locator("canvas")).toBeVisible();
    await login(courier, 8153, "courier@yespizz.local", "Courier123!");
    await courier.getByLabel("Start QR / OTP").fill(code);
    await courier
      .getByRole("button", { name: "Start shift", exact: true })
      .click();
    await expect(courier.getByText(/^On duty/)).toBeVisible();
    await courier.reload();
    await expect(courier.getByText(/^On duty/)).toBeVisible();
    await courier.getByLabel("End OTP").fill("000000");
    await courier
      .getByRole("button", { name: "End shift", exact: true })
      .click();
    await expect(
      courier.getByRole("alert").filter({ hasText: "Invalid or expired" }),
    ).toBeVisible();
    await admin.reload();
    await admin.getByRole("button", { name: "Issue end code" }).click();
    const end = await admin.locator("code").innerText();
    await courier.getByLabel("End OTP").fill(end);
    await courier
      .getByRole("button", { name: "End shift", exact: true })
      .click();
    await expect(courier.getByText(/^Off duty/)).toBeVisible();
    await admin.goto("http://localhost:8152/refunds");
    await expect(
      admin.getByRole("heading", { name: "Refunds", exact: true }),
    ).toBeVisible();
    await expect(admin.getByText("No refunds recorded.")).toBeVisible();
  } finally {
    await Promise.all([adminContext.close(), courierContext.close()]);
  }
});
