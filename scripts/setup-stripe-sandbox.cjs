// Idempotently provision only test-mode billing resources; never print credentials.
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const Stripe = require("stripe");
const root = path.resolve(__dirname, "..");
function update(file, values) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    text = pattern.test(text)
      ? text.replace(pattern, () => line)
      : `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(file, text, { mode: 0o600 });
  fs.chmodSync(file, 0o600);
}
async function main() {
  const envPath = path.join(root, ".env.stripe-sandbox");
  const config = parseEnv(fs.readFileSync(envPath, "utf8"));
  const key = config.STRIPE_SANDBOX_SECRET_KEY;
  if (!/^(sk|rk|rkcs)_test_/.test(key || ""))
    throw new Error("A test sandbox key is required.");
  const stripe = new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 });
  const balance = await stripe.balance.retrieve();
  if (balance.livemode) throw new Error("Live mode is refused.");
  const prices = await stripe.prices.list({
    lookup_keys: ["yespiz_plus_30_days_v1"],
    active: true,
    limit: 1,
  });
  let price = prices.data[0];
  if (!price) {
    const product = await stripe.products.create(
      { name: "Yespiz Plus", metadata: { purpose: "membership" } },
      { idempotencyKey: "yespiz-plus-product-v1" },
    );
    price = await stripe.prices.create(
      {
        product: product.id,
        currency: "eur",
        unit_amount: 499,
        recurring: { interval: "day", interval_count: 30 },
        lookup_key: "yespiz_plus_30_days_v1",
      },
      { idempotencyKey: "yespiz-plus-price-v1" },
    );
  }
  if (
    price.livemode ||
    price.currency !== "eur" ||
    price.unit_amount !== 499 ||
    price.recurring?.interval !== "day" ||
    price.recurring.interval_count !== 30
  )
    throw new Error("Existing sandbox price does not match published terms.");
  const portals = await stripe.billingPortal.configurations.list({
    is_default: true,
    limit: 1,
  });
  if (!portals.data.length)
    await stripe.billingPortal.configurations.create({
      business_profile: { headline: "Manage your Yespiz Plus membership" },
      features: {
        customer_update: { enabled: true, allowed_updates: ["email"] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
      },
    });
  const cli = "/tmp/yespiz-stripe-cli/node_modules/.bin/stripe";
  if (fs.existsSync(cli)) update(envPath, { STRIPE_CLI_BIN: cli });
  update(path.join(root, "apps/api/.env"), {
    STRIPE_MODE: "sandbox",
    STRIPE_SECRET_KEY: key,
    STRIPE_MEMBERSHIP_PRICE_ID: price.id,
  });
  console.log(
    "Stripe sandbox verified. Plus price and billing portal prepared. Private local configuration updated.",
  );
}
main().catch((e) => {
  console.error(
    "Sandbox setup failed:",
    e.type || e.name,
    e.code || "",
    e.statusCode || "",
  );
  process.exitCode = 1;
});
