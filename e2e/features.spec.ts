import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, port: number, role: "customer" | "admin") {
  await page.goto(`http://localhost:${port}/login/`);
  await page.locator('input[type="email"]').fill(`${role}@yespizz.local`);
  await page
    .locator('input[type="password"]')
    .fill(role === "admin" ? "Admin123!" : "Customer123!");
  await page
    .locator("form")
    .getByRole("button", { name: /sign in|log in/i })
    .click();
  await expect(page).not.toHaveURL(/login/);
}
test("approved pizza comments, referral configuration and scheduled ordering", async ({
  browser,
  request,
}) => {
  const customerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const adminContext = await browser.newContext({
    viewport: { width: 1360, height: 960 },
  });
  try {
    const customer = await customerContext.newPage();
    const admin = await adminContext.newPage();
    await login(customer, 8151, "customer");
    const token = await customer.evaluate(() =>
      localStorage.getItem("yespizz_access_token"),
    );
    const orders = await request.get("http://localhost:8158/api/v1/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = (await orders.json())[0];
    const pizzaId = order.lines[0].menuItemId;
    await customer.goto(`http://localhost:8151/feedback/?order=${order.id}`);
    for (const dimension of ["Taste", "Temperature", "Packaging", "Delivery"])
      await customer
        .getByRole("radiogroup", { name: new RegExp(`^${dimension}`) })
        .getByRole("radio", { name: "4", exact: true })
        .press("Space");
    await customer
      .getByRole("radio", { name: "Yes", exact: true })
      .press("Space");
    await customer
      .getByLabel("What could we improve? (optional)")
      .fill("Great crust. The pizza arrived hot.");
    await customer
      .getByRole("checkbox", { name: /Yespizz may publish/ })
      .press("Space");
    await customer
      .getByRole("button", { name: "Send feedback", exact: true })
      .click();
    await expect(
      customer.getByText("Thanks for helping us improve"),
    ).toBeVisible();
    await customer.goto(`http://localhost:8151/pizza/?id=${pizzaId}`);
    await expect(
      customer.getByText("No published comments yet."),
    ).toBeVisible();
    await login(admin, 8152, "admin");
    await admin.goto("http://localhost:8152/feedback");
    const review = admin
      .locator("article")
      .filter({ hasText: "Great crust. The pizza arrived hot." });
    await review
      .getByLabel("Public text — exact comment or excerpt")
      .fill("Great crust.");
    await review.getByRole("checkbox", { name: /I checked/ }).press("Space");
    await review.getByRole("button", { name: "Approve & publish" }).click();
    await expect(
      review.getByText("Published anonymously", { exact: true }),
    ).toBeVisible();
    await customer.reload();
    await expect(customer.locator("blockquote")).toHaveText("Great crust.");
    await expect(customer.getByText("Taste 4")).toHaveCount(0);
    await customer.screenshot({
      path: ".qa/ui/pizza-approved-comment.png",
      fullPage: true,
    });
    await admin.screenshot({
      path: ".qa/ui/comment-moderation.png",
      fullPage: true,
    });
    await review.getByRole("button", { name: "Unpublish comment" }).click();
    await expect(
      review.getByText("Not published", { exact: true }),
    ).toBeVisible();
    await customer.reload();
    await expect(
      customer.getByText("No published comments yet."),
    ).toBeVisible();
    await admin.goto("http://localhost:8152/growth");
    await admin.getByLabel("Credit per person (€)").fill("3");
    await admin.getByRole("button", { name: "Save referral reward" }).click();
    await expect(admin.getByLabel("Credit per person (€)")).toHaveValue("3.00");
    await customer.goto("http://localhost:8151/referrals/");
    await expect(customer.getByText("€3.00 credit each")).toBeVisible();
    await customer.screenshot({
      path: ".qa/ui/referral-account.png",
      fullPage: true,
    });
    await admin.goto("http://localhost:8152/finance");
    await expect(
      admin.getByRole("heading", { name: "Withdrawal requests" }),
    ).toBeVisible();
    await admin.getByRole("button", { name: /Completed order/ }).click();
    await admin
      .getByRole("option", { name: new RegExp(order.id.slice(-6)) })
      .click();
    await admin.getByLabel("Agreed amount (€)", { exact: true }).fill("7.50");
    await admin.getByLabel("Due date", { exact: true }).fill("2026-12-01");
    await admin
      .getByLabel("Internal accounting note", { exact: true })
      .fill("Approved test settlement");
    await admin
      .getByRole("button", { name: "Approve settlement", exact: true })
      .click();
    await expect(
      admin.locator("article").filter({ hasText: order.id.slice(-6) }),
    ).toContainText(/€\s*7[.,]50/);
    await customer.goto(`http://localhost:8151/pizza/?id=${pizzaId}`);
    await customer.getByRole("button", { name: /Add to cart/i }).click();
    await expect(customer).toHaveURL(/cart/);
    await customer.getByRole("button", { name: /checkout/i }).click();
    await customer.getByRole("radio", { name: /45/ }).press("Space");
    await customer.getByRole("button", { name: /continue.*payment/i }).click();
    await expect(customer).toHaveURL(/\/payment\/?$/);
    await expect(
      customer.getByRole("button", { name: /Pay.*11.98/ }),
    ).toBeEnabled();
    await customer.getByRole("button", { name: /Pay.*11.98/ }).click();
    await expect(customer).toHaveURL(/order-success/);
    await customer.getByRole("button", { name: /track/i }).click();
    await expect(customer.getByText(/Order starts/)).toBeVisible();
  } finally {
    await customerContext.close();
    await adminContext.close();
  }
});

test("admin Zod forms block invalid login and reversed coupon dates", async ({
  page,
}) => {
  await page.goto("http://localhost:8152/login");
  let loginRequests = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/auth/admin/login")
    )
      loginRequests++;
  });
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();
  expect(loginRequests).toBe(0);
  await login(page, 8152, "admin");
  await page.goto("http://localhost:8152/growth");
  const coupon = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Discount codes", exact: true }),
  });
  let couponRequests = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/growth/coupons")
    )
      couponRequests++;
  });
  await coupon.getByLabel("Code", { exact: true }).fill("PIZZA10");
  await coupon
    .getByLabel("Internal name", { exact: true })
    .fill("Form validation");
  await coupon.getByLabel("Starts (local time)").fill("2027-01-02T12:00");
  await coupon.getByLabel("Ends (local time)").fill("2027-01-01T12:00");
  await coupon.getByRole("button", { name: "Create discount code" }).click();
  await expect(
    coupon.getByText("The discount must end after it starts.", { exact: true }),
  ).toBeVisible();
  expect(couponRequests).toBe(0);
});

test("customer Zod login shows inline errors before sending credentials", async ({
  page,
}) => {
  await page.goto("http://localhost:8151/login/");
  let loginRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/auth/"))
      loginRequests++;
  });
  await page.locator('input[name="email"]').fill("not-an-email");
  await page.locator('input[name="password"]').fill("short");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Use at least 8 characters.", { exact: true }),
  ).toBeVisible();
  expect(loginRequests).toBe(0);
});

test("admin dynamic pizza builder and manual withdrawal UI", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 960 },
  });
  try {
    const admin = await context.newPage();
    await login(admin, 8152, "admin");
    await admin.goto("http://localhost:8152/menu");
    const row = admin
      .locator("li")
      .filter({ has: admin.getByText("Margherita", { exact: true }) });
    const builder = row
      .locator("details")
      .filter({
        has: admin.locator("summary").filter({ hasText: "Pizza builder" }),
      })
      .first();
    await builder.locator("summary").first().click();
    await builder
      .getByRole("button", { name: "Configure custom sizes and choices" })
      .click();
    await builder.getByLabel("Name", { exact: true }).fill("32 cm");
    await builder.getByLabel("Price (€)", { exact: true }).fill("12.50");
    await builder
      .getByRole("button", { name: "Add choice group", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Save pizza configuration" })
      .click();
    await expect(
      builder.getByRole("alert").filter({ hasText: "groups.0.name" }),
    ).toBeVisible();
    await builder
      .getByRole("button", { name: "Remove group", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Save pizza configuration" })
      .click();
    await expect(builder.getByRole("status")).toHaveText(
      "Pizza settings saved.",
    );
    const menu = await (
      await request.get("http://localhost:8158/api/v1/catalog/menu")
    ).json();
    expect(
      menu.items.find((item: { name: string }) => item.name === "Margherita")
        .customization.variants[0],
    ).toMatchObject({ name: "32 cm", priceCents: 1250 });
    await admin.screenshot({
      path: ".qa/ui/dynamic-pizza-builder.png",
      fullPage: true,
    });
    await admin.goto("http://localhost:8152/finance");
    await expect(
      admin.getByRole("heading", { name: "Withdrawal requests" }),
    ).toBeVisible();
    await expect(
      admin.getByText(/Automatically transfer this approved/),
    ).toHaveCount(0);
    await admin.screenshot({
      path: ".qa/ui/manual-withdrawals.png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});
test("customer dynamic pizza choices reach the cart", async ({
  browser,
  request,
}) => {
  const menu = await (
    await request.get("http://localhost:8158/api/v1/catalog/menu")
  ).json();
  const pizza = menu.items.find(
    (item: { name: string }) => item.name === "Margherita",
  );
  const auth = await (
    await request.post(
      "http://localhost:8158/api/v1/account/auth/admin/login",
      {
        data: {
          method: "password",
          email: "admin@yespizz.local",
          password: "Admin123!",
        },
      },
    )
  ).json();
  const updated = await request.patch(
    `http://localhost:8158/api/v1/catalog/items/${pizza.id}`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      data: {
        customization: {
          variants: [
            { id: "regular", name: "32 cm", priceCents: 1250, isActive: true },
          ],
          groups: [],
        },
      },
    },
  );
  expect(updated.ok()).toBeTruthy();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const customer = await context.newPage();
    await login(customer, 8151, "customer");
    await customer.goto(`http://localhost:8151/pizza/?id=${pizza.id}`);
    await expect(customer.getByRole("radio", { name: /32 cm/ })).toBeChecked();
    await customer.getByRole("button", { name: /add to cart/i }).click();
    await expect(customer).toHaveURL(/cart/);
    await expect(customer.getByText("32 cm", { exact: true })).toBeVisible();
    const checkoutButton = customer.getByRole("button", {
      name: /proceed to checkout/i,
    });
    expect(
      await checkoutButton.evaluate(
        (el) => el.scrollWidth <= el.clientWidth + 1,
      ),
    ).toBeTruthy();
    await customer.screenshot({
      path: ".qa/ui/dynamic-pizza-cart.png",
      fullPage: true,
    });
    await customer.getByRole("button", { name: /checkout/i }).click();
    await expect(
      customer.getByRole("radiogroup", { name: /address/i }),
    ).toBeVisible();
    await customer
      .getByRole("radiogroup", { name: /address/i })
      .getByRole("radio")
      .first()
      .press("Space");
    await customer.getByRole("button", { name: /continue.*payment/i }).click();
    await expect(customer).toHaveURL(/payment/);
    await expect(
      customer.getByRole("radio", { name: /card/i }).first(),
    ).toBeChecked();
  } finally {
    await context.close();
  }
});
