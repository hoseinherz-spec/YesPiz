// background-geolocation 1.2.26 supports Capacitor >=3 in npm, but its Swift
// manifest caps resolution below Capacitor 8. Keep this narrow manifest patch
// reproducible until upstream updates it; native device acceptance is separate.
const { readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");
const plugin =
  require.resolve("@capacitor-community/background-geolocation/package.json");
const pkg = JSON.parse(readFileSync(plugin, "utf8"));
if (pkg.version !== "1.2.26")
  throw new Error(
    "Review background geolocation Swift compatibility before upgrading.",
  );
const manifest = join(dirname(plugin), "Package.swift");
const source = readFileSync(manifest, "utf8");
const previous = 'from: "7.0.0"';
const next = 'from: "8.0.0"';
if (source.includes(previous))
  writeFileSync(manifest, source.replace(previous, next));
else if (!source.includes(next))
  throw new Error("Unexpected background geolocation Swift manifest.");
