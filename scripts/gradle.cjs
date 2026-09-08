const { spawn } = require("node:child_process");
const { join } = require("node:path");
const task = process.argv[2];
if (!["assembleRelease", "bundleRelease"].includes(task)) {
  throw new Error("Expected assembleRelease or bundleRelease.");
}
const windows = process.platform === "win32";
const child = spawn(
  windows ? "cmd.exe" : "sh",
  windows ? ["/d", "/c", "gradlew.bat", task] : ["./gradlew", task],
  { cwd: join(process.cwd(), "android"), stdio: "inherit" },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
