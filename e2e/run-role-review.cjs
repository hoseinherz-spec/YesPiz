// Run one role surface at a time to keep browser QA practical on developer laptops.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const cli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
for (const [surface, role] of [
  ["mobile", "customer:"],
  ["admin", "admin:"],
  ["provider-panel", "kitchen:"],
  ["courier-mobile", "courier:"],
  ["visitor", "visitor:"],
]) {
  const result = spawnSync(process.execPath, [cli, "test", "--config=playwright.review.config.ts", "--grep", role], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, YESPIZZ_REVIEW_SURFACE: surface },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
