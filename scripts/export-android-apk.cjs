const { execFileSync } = require("node:child_process");
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { homedir, tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const project = process.cwd();
const android = join(project, "android");
const properties = join(android, "local.properties");
const configuredSdk = existsSync(properties)
  ? readFileSync(properties, "utf8").match(/^sdk\.dir=(.+)$/m)?.[1].replace(/\\ /g, " ")
  : undefined;
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || configuredSdk;
if (!sdk) throw new Error("Android SDK not found. Set ANDROID_HOME or android/local.properties.");

const tools = join(sdk, "build-tools");
const { readdirSync } = require("node:fs");
const versions = readdirSync(tools).sort((first, second) =>
  second.localeCompare(first, undefined, { numeric: true }),
);
const extension = process.platform === "win32" ? ".exe" : "";
const buildTools = versions.find((version) =>
  ["zipalign", "apksigner"].every((tool) => existsSync(join(tools, version, tool + extension))),
);
if (!buildTools) throw new Error(`zipalign and apksigner not found in ${tools}`);

const keystore = join(homedir(), ".android", "debug.keystore");
if (!existsSync(keystore)) {
  throw new Error(`Android debug keystore not found at ${keystore}. Build a debug app first.`);
}

const unsigned = join(android, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
const outputDir = resolve(project, "..", "..", "artifacts", "apk");
const output = join(outputDir, "yespizz-customer-installable.apk");
const temp = mkdtempSync(join(tmpdir(), "yespizz-apk-"));
mkdirSync(outputDir, { recursive: true });

try {
  const aligned = join(temp, "aligned.apk");
  execFileSync(join(tools, buildTools, "zipalign" + extension), ["-f", "-p", "4", unsigned, aligned], { stdio: "inherit" });
  execFileSync(join(tools, buildTools, "apksigner" + extension), [
    "sign", "--ks", keystore, "--ks-key-alias", "androiddebugkey",
    "--ks-pass", "pass:android", "--key-pass", "pass:android", "--out", output, aligned,
  ], { stdio: "inherit" });
  execFileSync(join(tools, buildTools, "apksigner" + extension), ["verify", "--verbose", output], { stdio: "inherit" });
  console.log(`Installable test APK: ${output}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
