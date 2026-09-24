import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { app } from "../playwright.config";

const resolveModule = createRequire(path.resolve("package.json"));
const running = new Map<string, ChildProcess>();
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startRoleApp(workspace: string, port: number) {
  if (running.has(workspace)) return;
  try {
    const response = await fetch(`http://localhost:${port}/login/`, {
      signal: AbortSignal.timeout(2000),
    });
    await response.body?.cancel();
    if (response.ok) return;
  } catch {
    /* Start the isolated QA server when no preview is serving this port. */
  }
  mkdirSync(".qa", { recursive: true });
  const log = openSync(`.qa/server-${workspace}.log`, "a");
  const child = spawn(
    process.execPath,
    [
      resolveModule.resolve("next/dist/bin/next"),
      "dev",
      "--webpack",
      "--port",
      String(port),
    ],
    {
      cwd: path.resolve("apps", workspace),
      env: { ...process.env, ...app(workspace, port).env },
      stdio: ["ignore", log, log],
      detached: process.platform !== "win32",
    },
  );
  closeSync(log);
  running.set(workspace, child);
  let spawnError: Error | undefined;
  child.on("error", (error) => {
    spawnError = error;
  });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null)
      throw new Error(`${workspace} exited; see .qa/server-${workspace}.log`);
    try {
      const response = await fetch(`http://localhost:${port}/login/`, {
        signal: AbortSignal.timeout(2000),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      /* The first route is still compiling. */
    }
    await pause(300);
  }
  throw new Error(
    `${workspace} did not become ready; see .qa/server-${workspace}.log`,
  );
}

export async function stopRoleApp(workspace: string) {
  const child = running.get(workspace);
  if (!child) return;
  running.delete(workspace);
  const signal = (name: NodeJS.Signals) => {
    try {
      if (process.platform !== "win32" && child.pid)
        process.kill(-child.pid, name);
      else child.kill(name);
    } catch {
      /* Already stopped. */
    }
  };
  signal("SIGTERM");
  for (
    let i = 0;
    i < 50 && child.exitCode === null && child.signalCode === null;
    i++
  )
    await pause(100);
  if (child.exitCode === null && child.signalCode === null) signal("SIGKILL");
}
export async function stopRoleApps() {
  await Promise.all([...running.keys()].map(stopRoleApp));
}
process.once("exit", () => {
  for (const child of running.values()) {
    try {
      if (process.platform !== "win32" && child.pid)
        process.kill(-child.pid, "SIGTERM");
      else child.kill("SIGTERM");
    } catch {
      /* Already stopped. */
    }
  }
});
