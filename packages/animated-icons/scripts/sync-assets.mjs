import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(packageRoot, "assets");
const repositoryRoot = join(packageRoot, "..", "..");
const mobileApps = ["mobile", "courier-mobile"];

await Promise.all(
  mobileApps.map(async (app) => {
    const destination = join(repositoryRoot, "apps", app, "public", "icons", "ui-animated");
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    const files = await readdir(source);
    await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map((file) => copyFile(join(source, file), join(destination, toAssetName(file)))),
    );
  }),
);

const files = await readdir(source);
console.log(`Synced ${files.filter((file) => file.endsWith(".json")).length} animated icons.`);

function toAssetName(file) {
  return `${file.slice(0, -5)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}.json`;
}
