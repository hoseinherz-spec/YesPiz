// Twilio Verify uses a real Trial account, not Twilio test credentials.
// This command provisions a service but never sends a message or buys a number.
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const Twilio = require("twilio");
const root = path.resolve(__dirname, "..");
async function main() {
  const file = path.join(root, ".env.twilio-sandbox");
  const apiPath = path.join(root, "apps/api/.env");
  const cfg = {
    ...parseEnv(fs.readFileSync(apiPath, "utf8")),
    ...(fs.existsSync(file) ? parseEnv(fs.readFileSync(file, "utf8")) : {}),
  };
  if (
    !/^AC[0-9a-f]{32}$/i.test(cfg.TWILIO_ACCOUNT_SID || "") ||
    !cfg.TWILIO_AUTH_TOKEN
  )
    throw new Error("Twilio account credentials are missing.");
  const client = Twilio(cfg.TWILIO_ACCOUNT_SID, cfg.TWILIO_AUTH_TOKEN, {
    timeout: 15000,
    autoRetry: false,
  });
  const account = await client.api.v2010
    .accounts(cfg.TWILIO_ACCOUNT_SID)
    .fetch();
  if (account.status !== "active")
    throw new Error("An active Twilio account is required.");
  let service;
  if (cfg.TWILIO_VERIFY_SERVICE_SID)
    service = await client.verify.v2
      .services(cfg.TWILIO_VERIFY_SERVICE_SID)
      .fetch();
  else
    service = (await client.verify.v2.services.list({ limit: 100 })).find(
      (s) => s.friendlyName === "Yespiz Sandbox",
    );
  if (!service)
    service = await client.verify.v2.services.create({
      friendlyName: "Yespiz Sandbox",
      codeLength: 6,
    });
  else if (service.codeLength !== 6)
    service = await client.verify.v2.services(service.sid).update({ codeLength: 6 });
  const apiFile = path.join(root, "apps/api/.env");
  let text = fs.readFileSync(apiFile, "utf8");
  const values = {
    TWILIO_ACCOUNT_SID: cfg.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: cfg.TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID: service.sid,
    OTP_DEV_BYPASS: "false",
  };
  for (const [name, value] of Object.entries(values)) {
    const pattern = new RegExp(`^${name}=.*$`, "m"),
      line = `${name}=${value}`;
    text = pattern.test(text)
      ? text.replace(pattern, () => line)
      : `${text.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(apiFile, text, { mode: 0o600 });
  fs.chmodSync(apiFile, 0o600);
  if (fs.existsSync(file)) fs.chmodSync(file, 0o600);
  console.log(
    "Twilio Verify service ready. Development OTP bypass disabled. No SMS sent. Restart the API, then verify an approved recipient through the app.",
  );
}
main().catch((e) => {
  console.error(
    "Twilio setup failed:",
    e.code || (e.name === "Error" ? e.message : e.name),
  );
  process.exitCode = 1;
});
