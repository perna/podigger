#!/usr/bin/env node
/**
 * T119 — Bundle-size guard.
 *
 * Compares the Home route's first-load JS to a captured baseline.
 * Exits 1 on a > 10% regression with a named error message.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs           # compare against baseline
 *   node scripts/check-bundle-size.mjs update    # update baseline (slice-9 PR only)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
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
  const result = spawnSync("npm", ["run", "build:analyze"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ANALYZE: "true" },
  });
  if (result.status !== 0) {
    console.error("[check-bundle-size] Build failed.");
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
  const match = result.stdout.match(/First Load JS shared by all[^\d]*([\d.]+)\s*kB/);
  if (!match) {
    console.error("[check-bundle-size] Could not parse bundle size from build output.");
    process.exit(1);
  }
  return { home: { firstLoadJsKb: Number(match[1]) } };
}

function check() {
  const baseline = readBaseline();
  const current = readCurrentBundle();
  const base = baseline.home?.firstLoadJsKb;
  const now = current.home?.firstLoadJsKb;
  if (typeof base !== "number" || typeof now !== "number") {
    console.error("[check-bundle-size] Baseline or current value is missing.");
    process.exit(1);
  }
  const delta = ((now - base) / base) * 100;
  if (delta > MAX_REGRESSION_PERCENT) {
    console.error(
      `[check-bundle-size] FAIL: Home route bundle grew by ${delta.toFixed(1)}% (${base}kB → ${now}kB). Allowed: ${MAX_REGRESSION_PERCENT}%.`,
    );
    process.exit(1);
  }
  console.log(
    `[check-bundle-size] OK: Home route bundle is ${now}kB (baseline ${base}kB, delta ${delta.toFixed(1)}%).`,
  );
}

function update() {
  const current = readCurrentBundle();
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + "\n");
  console.log(`[check-bundle-size] Baseline updated: ${JSON.stringify(current)}`);
}

if (command === "update") {
  update();
} else {
  check();
}
