// Local sandbox webhook forwarding; credentials stay in ignored environment files.
const { spawn } = require("node:child_process");
const { readFileSync, writeFileSync, chmodSync } = require("node:fs");
const { resolve } = require("node:path");
const { parseEnv } = require("node:util");
const root = resolve(__dirname, "..");
const config = parseEnv(
  readFileSync(resolve(root, ".env.stripe-sandbox"), "utf8"),
);
const key = config.STRIPE_SANDBOX_SECRET_KEY;
if (!key || !/^(sk|rk|rkcs)_test_/.test(key)) {
  throw new Error("Configure a Stripe sandbox key; live keys are refused.");
}
const apiFile = resolve(root, "apps/api/.env");
const apiConfig = parseEnv(readFileSync(apiFile, "utf8"));
if (
  apiConfig.STRIPE_MODE !== "sandbox" ||
  apiConfig.STRIPE_SECRET_KEY !== key
) {
  throw new Error(
    "Configure the same sandbox key and STRIPE_MODE=sandbox in apps/api/.env first.",
  );
}
const child = spawn(
  config.STRIPE_CLI_BIN || "stripe",
  [
    "listen",
    "--events",
    "payment_intent.succeeded,checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,invoice.payment_action_required",
    "--forward-to",
    "http://localhost:8058/api/v1/payments/webhook/stripe",
  ],
  {
    env: { ...process.env, STRIPE_API_KEY: key },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let ready = false;
let output = "";
const timer = setTimeout(() => {
  console.error("Stripe listener did not become ready within 45 seconds.");
  child.kill("SIGTERM");
  process.exitCode = 1;
}, 45000);
function receive(chunk) {
  output = (output + chunk.toString()).slice(-16000);
  const secret = output.match(/whsec_[A-Za-z0-9]+/);
  if (!ready && secret) {
    const file = apiFile;
    const current = readFileSync(file, "utf8");
    const line = `STRIPE_WEBHOOK_SECRET=${secret[0]}`;
    writeFileSync(
      file,
      /^STRIPE_WEBHOOK_SECRET=.*$/m.test(current)
        ? current.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, line)
        : `${current.trimEnd()}\n${line}\n`,
      { mode: 0o600 },
    );
    chmodSync(file, 0o600);
    ready = true;
    output = "";
    clearTimeout(timer);
    console.log(
      "Sandbox webhooks ready on API port 8058. Signing secret saved privately; restart the API if already running.",
    );
  }
}
child.stdout.on("data", receive);
child.stderr.on("data", receive);
child.on("error", () => {
  clearTimeout(timer);
  console.error("Could not start the Stripe CLI. Check STRIPE_CLI_BIN.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  clearTimeout(timer);
  if (!ready) console.error("Stripe listener stopped before becoming ready.");
  process.exitCode = process.exitCode || code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
