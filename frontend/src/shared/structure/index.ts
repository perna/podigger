/**
 * T113 — runRules() helper.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import picomatch from "picomatch";
import { rules } from "./rules";
import type { Rule, Violation } from "./types";

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "dist" || entry === "build") continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function lineCount(content: string): number {
  return content.split("\n").length;
}

function expandSource(source: string, root: string): string[] {
  if (!source.includes("**")) {
    return [];
  }
  const baseDir = source.split("**")[0].replace(/[/\\]$/, "");
  const fullBase = baseDir.startsWith("/") || baseDir.match(/^[A-Z]:/) ? baseDir : join(root, baseDir);
  const allFiles = walk(fullBase);
  const matcher = picomatch(source, { dot: true });
  return allFiles.filter((f) => matcher(f));
}

export function runRules(root: string, customRules: readonly Rule[] = rules): Violation[] {
  const violations: Violation[] = [];
  for (const rule of customRules) {
    if (rule.forbidden === null) continue;
    const sourcePattern = rule.source(root);
    const files = expandSource(sourcePattern, root);
    if (typeof process !== "undefined" && (process as { env?: Record<string, string | undefined> }).env?.DEBUG_STRUCTURE) {
      console.log(`[structure] rule=${rule.id} source=${sourcePattern} files=${files.length}`);
    }
    for (const file of files) {
      if (rule.ignore && rule.ignore(file)) continue;
      const content = readFileSync(file, "utf8");
      if (rule.isLineCount) {
        const limit = rule.limit?.(file) ?? 150;
        if (lineCount(content) > limit) {
          violations.push({
            file: relative(root, file),
            rule: rule.id,
            message: rule.message,
            fix: rule.fix,
          });
        }
      } else if (rule.forbidden && rule.forbidden.test(content)) {
        violations.push({
          file: relative(root, file),
          rule: rule.id,
          message: rule.message,
          fix: rule.fix,
        });
      }
    }
  }
  return violations;
}
