/**
 * Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — Lockfile Fora de Sincronia com package.json
 *
 * CRITICAL: This test MUST FAIL on unfixed code — failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 *
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');

/**
 * isBugCondition: returns true when allDeclared is NOT a subset of allLocked
 * (i.e., the bug is present)
 */
function isBugCondition(packageJson, packageLockJson) {
  const allDeclared = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);

  const rootEntry = packageLockJson.packages?.[''] ?? {};
  const allLocked = new Set([
    ...Object.keys(rootEntry.dependencies ?? {}),
    ...Object.keys(rootEntry.devDependencies ?? {}),
  ]);

  for (const dep of allDeclared) {
    if (!allLocked.has(dep)) {
      return true; // bug condition: declared dep missing from lockfile
    }
  }
  return false;
}

describe('Bug Condition: Lockfile out of sync with package.json', () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(frontendDir, 'package.json'), 'utf-8')
  );
  const packageLockJson = JSON.parse(
    readFileSync(resolve(frontendDir, 'package-lock.json'), 'utf-8')
  );

  it('Property 1 — allDeclared SUBSET_OF allLocked (FAILS on unfixed code)', () => {
    const allDeclared = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]);

    const rootEntry = packageLockJson.packages?.[''] ?? {};
    const allLocked = new Set([
      ...Object.keys(rootEntry.dependencies ?? {}),
      ...Object.keys(rootEntry.devDependencies ?? {}),
    ]);

    const missingFromLockfile = [...allDeclared].filter(dep => !allLocked.has(dep));

    // Document counterexample for proof
    if (missingFromLockfile.length > 0) {
      console.error(
        `Counterexample found — declared in package.json but absent in package-lock.json: ${missingFromLockfile.join(', ')}`
      );
    }

    // This assertion FAILS on unfixed code (proves the bug exists)
    expect(missingFromLockfile).toEqual([]);
  });

  it('isBugCondition returns false when lockfile is in sync (FAILS on unfixed code)', () => {
    const bugPresent = isBugCondition(packageJson, packageLockJson);

    if (bugPresent) {
      console.error(
        'Counterexample: isBugCondition returned true — lockfile is out of sync with package.json'
      );
    }

    // This assertion FAILS on unfixed code (proves the bug exists)
    expect(bugPresent).toBe(false);
  });

  it('@next/bundle-analyzer is present in package.json devDependencies', () => {
    // This should always pass — confirms the package is declared
    expect(packageJson.devDependencies).toHaveProperty('@next/bundle-analyzer');
  });

  it('@next/bundle-analyzer is present in package-lock.json packages[""] (confirms fix)', () => {
    const rootEntry = packageLockJson.packages?.[''] ?? {};
    const lockedDevDeps = rootEntry.devDependencies ?? {};

    // This assertion PASSES on fixed code — confirms the package is now in the lockfile
    expect(lockedDevDeps).toHaveProperty('@next/bundle-analyzer');
  });
});
