// A disposable database: this runner never uses the developer's MONGODB_URI.
const { MongoMemoryServer } = require("mongodb-memory-server");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { readFileSync } = require("node:fs");
const { parseEnv } = require("node:util");
const root = path.resolve(__dirname, "..");
let mongo;
let api;
let stripeListener;
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api?.kill("SIGTERM");
  if (stripeListener?.pid && process.platform !== "win32") {
    try {
      process.kill(-stripeListener.pid, "SIGTERM");
    } catch {}
  } else stripeListener?.kill("SIGTERM");
  stripeListener?.stdout?.destroy();
  stripeListener?.stderr?.destroy();
  await mongo?.stop();
  process.exit(typeof code === "number" ? code : 0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION || "7.0.24" },
    instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
  });
  const env = {
    ...process.env,
    MONGODB_URI: mongo.getUri(),
    PORT: "8158",
    NODE_ENV: "test",
    TS_NODE_TRANSPILE_ONLY: "true",
    JWT_SECRET: "browser-order-flow-test-secret",
    REDIS_URL: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_MODE: "",
    STRIPE_WEBHOOK_SECRET: "",
    FCM_PROJECT_ID: "",
    FCM_SERVICE_ACCOUNT_JSON: "",
    S3_BUCKET: "",
    GEOAPIFY_API_KEY: "",
    TWILIO_ACCOUNT_SID: "",
    CORS_ORIGINS: "",
    OTP_DEV_BYPASS: "false",
  };
  if (process.env.TEST_STRIPE_SANDBOX === "1") {
    const values = parseEnv(
      readFileSync(path.join(root, ".env.stripe-sandbox"), "utf8"),
    );
    const key = values.STRIPE_SANDBOX_SECRET_KEY;
    if (!key || !/^(sk|rk|rkcs)_test_/.test(key))
      throw new Error(
        "A Stripe sandbox key is required; live/mock mode refused.",
      );
    env.STRIPE_SECRET_KEY = key;
    env.STRIPE_MODE = "sandbox";
    stripeListener = spawn(
      values.STRIPE_CLI_BIN || "stripe",
      [
        "listen",
        "--events",
        "payment_intent.succeeded",
        "--forward-to",
        "http://localhost:8158/api/v1/payments/webhook/stripe",
      ],
      {
        env: { ...env, STRIPE_API_KEY: key },
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    env.STRIPE_WEBHOOK_SECRET = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Stripe webhook listener timed out")),
        45000,
      );
      let output = "";
      const read = (chunk) => {
        output = (output + chunk.toString()).slice(-16000);
        const secret = output.match(/whsec_[A-Za-z0-9]+/);
        if (secret) {
          clearTimeout(timer);
          resolve(secret[0]);
        }
      };
      stripeListener.stdout.on("data", read);
      stripeListener.stderr.on("data", read);
      stripeListener.once("error", () => {
        clearTimeout(timer);
        reject(new Error("Stripe CLI unavailable"));
      });
      stripeListener.once("exit", () => {
        clearTimeout(timer);
        reject(new Error("Stripe CLI exited"));
      });
    });
  }
  const seed = spawn(
    process.execPath,
    [
      "-r",
      "ts-node/register",
      "-r",
      "tsconfig-paths/register",
      "src/scripts/seed.ts",
    ],
    { cwd: path.join(root, "apps/api"), env, stdio: "inherit" },
  );
  await new Promise((resolve, reject) => {
    seed.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Seed failed: ${code}`)),
    );
    seed.on("error", reject);
  });
  api = spawn(
    process.execPath,
    ["-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/main.ts"],
    { cwd: path.join(root, "apps/api"), env, stdio: "inherit" },
  );
  api.on("exit", stop);
})().catch(async (error) => {
  console.error(error);
  await stop(1);
});
