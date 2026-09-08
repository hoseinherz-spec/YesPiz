import { test, expect, type Frame } from "@playwright/test";
for (const scenario of ["visa", "3ds", "decline-retry"] as const) {
  test(`Stripe sandbox browser: ${scenario}`, async ({
    page,
    request,
  }, testInfo) => {
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (
        url.hostname === "api.stripe.com" &&
        /payment_intents/.test(url.pathname)
      )
        console.log("Stripe payment request", response.status(), url.pathname);
    });
    const api = "http://localhost:8158/api/v1";
    const login = await request.post(`${api}/account/auth/client/login`, {
      data: {
        method: "password",
        email: "customer@yespizz.local",
        password: "Customer123!",
      },
    });
    expect(login.ok()).toBeTruthy();
    const { accessToken } = await login.json();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const menu = await (await request.get(`${api}/catalog/menu`)).json();
    const addressResponse = await request.post(`${api}/orders/addresses`, {
      headers,
      data: {
        label: "Sandbox",
        street: "Test delivery",
        latitude: 48.14,
        longitude: 11.58,
      },
    });
    expect(addressResponse.ok()).toBeTruthy();
    const address = await addressResponse.json();
    const created = await request.post(`${api}/orders`, {
      headers,
      data: {
        menuVersion: menu.version.version,
        addressId: address.id ?? address._id,
        paymentMethod: "card",
        lines: [
          { menuItemId: menu.items[0].id ?? menu.items[0]._id, quantity: 1 },
        ],
      },
    });
    expect(created.ok()).toBeTruthy();
    const order = await created.json();
    try {
      await page.goto("http://localhost:8151/login/");
      await page.locator("input[type=email]").fill("customer@yespizz.local");
      await page.locator("input[type=password]").fill("Customer123!");
      await page
        .locator("form")
        .getByRole("button", { name: /^(sign in|log in)$/i })
        .click();
      await expect(page).not.toHaveURL(/login/);
      await page.goto(`http://localhost:8151/payment/?orderId=${order.id}`);
      await page.getByRole("button", { name: /^Pay /i }).click();
      const form = page.frameLocator(
        'iframe[title="Secure payment input frame"]',
      );
      await form
        .getByPlaceholder("1234 1234 1234 1234")
        .fill(
          scenario === "3ds"
            ? "4000000000003220"
            : scenario === "decline-retry"
              ? "4000000000000002"
              : "4242424242424242",
        );
      await form.getByPlaceholder("MM / YY").fill("1234");
      await form.getByPlaceholder("CVC").fill("123");
      const country = form.getByRole("combobox", { name: /^Country$/ });
      if (await country.isVisible()) await country.selectOption("DE");
      const postal = form.getByRole("textbox", {
        name: /^(postal code|zip)$/i,
      });
      if (await postal.isVisible()) await postal.fill("80331");
      const agentCheckbox = form.getByRole("checkbox", {
        name: "I am an AI agent acting on behalf of someone else",
      });
      if (await agentCheckbox.isVisible()) {
        await agentCheckbox.check();
        console.log("Stripe agent identification checked");
      }
      const submit = page.getByRole("button", { name: /^Pay /i });
      // Leave the cross-origin frame before measuring the submit button position.
      await submit.focus();
      await submit.click();
      if (scenario === "3ds") {
        let challenge: Frame | undefined;
        await expect
          .poll(
            async () => {
              for (const frame of page.frames()) {
                if (
                  await frame
                    .getByRole("button", { name: /Complete/ })
                    .isVisible()
                ) {
                  challenge = frame;
                  return true;
                }
              }
              return false;
            },
            { timeout: 45000 },
          )
          .toBe(true);
        await challenge!.getByRole("button", { name: /Complete/ }).click();
      }
      if (scenario === "decline-retry") {
        await expect(
          page.getByRole("alert").filter({ hasText: /declined/i }),
        ).toBeVisible();
        await form
          .getByPlaceholder("1234 1234 1234 1234")
          .fill("4242424242424242");
        await submit.focus();
        await submit.click();
      }
      await expect(page).toHaveURL(/order-success/, { timeout: 45000 });
      const final = await (
        await request.get(`${api}/orders/${order.id}`, { headers })
      ).json();
      expect(final.paymentStatus).toBe("captured");
      expect(final.orderState).toBe("active");
      console.log(`${scenario}: sandbox payment captured for ${order.id}`);
    } catch (error) {
      await page.screenshot({
        path: testInfo.outputPath("checkout-full.png"),
        fullPage: true,
      });
      for (const frame of page.frames()) {
        if (
          await frame
            .getByRole("textbox", { name: "Card number", exact: true })
            .count()
        ) {
          console.log(
            "Payment form validation:",
            await frame
              .locator('[role="alert"], [aria-invalid="true"]')
              .allTextContents(),
          );
        }
      }
      throw error;
    } finally {
      const cancelled = await request.post(`${api}/payments/cancel-order`, {
        headers,
        data: { orderId: order.id, reason: "Sandbox browser cleanup" },
      });
      expect(cancelled.ok()).toBeTruthy();
    }
  });
}
