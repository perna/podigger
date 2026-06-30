/**
 * T113 — runRules() helper.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
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

function matchesGlob(file: string, glob: string): boolean {
  const norm = (s: string) => s.split(sep).join("/");
  const f = norm(file);
  const g = norm(glob);
  if (!g.includes("**")) {
    return f === g;
  }
  const [prefix, suffix] = g.split("**", 2);
  if (!f.startsWith(prefix)) return false;
  const remainder = f.slice(prefix.length);
  if (suffix === "") return true;
  if (remainder === suffix.slice(1)) return true;
  if (remainder.endsWith(suffix)) return true;
  if (remainder.endsWith("/" + suffix)) return true;
  return remainder === suffix;
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
  return allFiles.filter((f) => matchesGlob(f, source));
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
