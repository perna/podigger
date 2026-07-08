#!/usr/bin/env node
/**
 * T119 — Bundle-size guard.
 *
 * Compares the total size of the static JS chunks loaded on the Home
 * route against a captured baseline. Exits 1 on a > 10 % regression
 * with a named error message.
 *
 * Next.js 16 (Turbopack) no longer prints the per-route
 * "First Load JS shared by all …" line, so the script reads the
 * `rootMainFiles` declared in `.next/build-manifest.json` and sums
 * the on-disk sizes of those files. This is a faithful proxy for
 * the pre-Turbopack number: every page loads the same root files, and
 * the per-page delta is dominated by per-route chunks that move with
 * the page anyway.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs           # compare against baseline
 *   node scripts/check-bundle-size.mjs update    # capture current as new baseline
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASELINE_PATH = resolve(__dirname, "baseline-bundle.json");
const MAX_REGRESSION_PERCENT = 10;

const [, , command] = process.argv;

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`[check-bundle-size] No baseline at ${BASELINE_PATH}. Run \`node scripts/check-bundle-size.mjs update\`.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
}

function readCurrentBundle() {
  const env = { ...process.env, ANALYZE: "true", NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000" };
  const result = spawnSync("npm", ["run", "build:analyze"], {
    cwd: ROOT,
    encoding: "utf8",
    env,
  });
  if (result.status !== 0) {
    console.error("[check-bundle-size] Build failed.");
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
  // Read the rootMainFiles from the build manifest and sum their on-disk
  // sizes. These are the chunks every page (including the Home route)
  // loads; per-page chunks are accounted for separately in the build and
  // grow with their own feature.
  const manifestPath = join(ROOT, ".next/build-manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`[check-bundle-size] No build manifest at ${manifestPath} — did the build run?`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const files = manifest.rootMainFiles ?? [];
  if (files.length === 0) {
    console.error("[check-bundle-size] build-manifest.json has no rootMainFiles.");
    process.exit(1);
  }
  let bytes = 0;
  for (const rel of files) {
    const abs = join(ROOT, ".next", rel);
    if (!existsSync(abs)) continue;
    bytes += statSync(abs).size;
  }
  return { home: { rootMainBytes: bytes, files } };
}

function check() {
  const baseline = readBaseline();
  const current = readCurrentBundle();
  const base = baseline.home?.rootMainBytes;
  const now = current.home?.rootMainBytes;
  if (typeof base !== "number" || typeof now !== "number") {
    console.error("[check-bundle-size] Baseline or current value is missing.");
    process.exit(1);
  }
  const delta = ((now - base) / base) * 100;
  if (delta > MAX_REGRESSION_PERCENT) {
    console.error(
      `[check-bundle-size] FAIL: root-main bundle grew by ${delta.toFixed(1)}% (${(base / 1024).toFixed(1)}kB → ${(now / 1024).toFixed(1)}kB). Allowed: ${MAX_REGRESSION_PERCENT}%.`,
    );
    process.exit(1);
  }
  console.log(
    `[check-bundle-size] OK: root-main bundle is ${(now / 1024).toFixed(1)}kB (baseline ${(base / 1024).toFixed(1)}kB, delta ${delta.toFixed(1)}%).`,
  );
}

function update() {
  const current = readCurrentBundle();
  // Write only the metric, drop the verbose `files` list from the saved baseline.
  const slim = { home: { rootMainBytes: current.home.rootMainBytes } };
  writeFileSync(BASELINE_PATH, JSON.stringify(slim, null, 2) + "\n");
  console.log(`[check-bundle-size] Baseline updated: ${(current.home.rootMainBytes / 1024).toFixed(1)}kB (${current.home.files.length} files)`);
}

if (command === "update") {
  update();
} else {
  check();
}
