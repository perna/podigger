/**
 * Preservation Property Tests
 *
 * Property 2: Preservation — Comportamento Existente Inalterado
 *
 * IMPORTANT: These tests MUST PASS on unfixed code — they establish the baseline
 * behavior that must be preserved after the fix is applied.
 *
 * These tests do NOT use `npm ci` (which fails on unfixed code).
 * They verify the behaviors that must remain intact:
 *   - npm install works (node_modules exists after install)
 *   - build, test, and lint scripts are defined and runnable
 *   - project structure is intact
 *
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');

const packageJson = JSON.parse(
  readFileSync(resolve(frontendDir, 'package.json'), 'utf-8')
);

describe('Preservation: npm install works correctly (Requirement 3.1)', () => {
  it('node_modules directory exists after install', () => {
    // npm install was run (node_modules present) — baseline behavior preserved
    expect(existsSync(resolve(frontendDir, 'node_modules'))).toBe(true);
  });

  it('node_modules/.package-lock.json exists (npm install was executed)', () => {
    // npm install creates this internal lockfile marker
    expect(existsSync(resolve(frontendDir, 'node_modules', '.package-lock.json'))).toBe(true);
  });

  it('core dependencies are installed in node_modules', () => {
    // Verify key packages are present — confirms npm install resolved them
    const coreDeps = ['next', 'react', 'react-dom'];
    for (const dep of coreDeps) {
      expect(
        existsSync(resolve(frontendDir, 'node_modules', dep)),
        `Expected ${dep} to be installed in node_modules`
      ).toBe(true);
    }
  });
});

describe('Preservation: CI scripts are defined and runnable (Requirement 3.2)', () => {
  it('build script is defined in package.json', () => {
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts.build).toBe('next build');
  });

  it('test script is defined in package.json', () => {
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts.test).toBe('vitest run');
  });

  it('lint script is defined in package.json', () => {
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(typeof packageJson.scripts.lint).toBe('string');
    expect(packageJson.scripts.lint.length).toBeGreaterThan(0);
  });

  it('next binary is available (build can run)', () => {
    expect(existsSync(resolve(frontendDir, 'node_modules', '.bin', 'next'))).toBe(true);
  });

  it('vitest binary is available (tests can run)', () => {
    expect(existsSync(resolve(frontendDir, 'node_modules', '.bin', 'vitest'))).toBe(true);
  });

  it('eslint binary is available (lint can run)', () => {
    expect(existsSync(resolve(frontendDir, 'node_modules', '.bin', 'eslint'))).toBe(true);
  });
});

describe('Preservation: project structure is intact (Requirements 3.1, 3.2, 3.3)', () => {
  it('package.json exists and is valid JSON', () => {
    expect(existsSync(resolve(frontendDir, 'package.json'))).toBe(true);
    expect(() =>
      JSON.parse(readFileSync(resolve(frontendDir, 'package.json'), 'utf-8'))
    ).not.toThrow();
  });

  it('package-lock.json exists', () => {
    expect(existsSync(resolve(frontendDir, 'package-lock.json'))).toBe(true);
  });

  it('next.config.ts exists', () => {
    expect(existsSync(resolve(frontendDir, 'next.config.ts'))).toBe(true);
  });

  it('tsconfig.json exists', () => {
    expect(existsSync(resolve(frontendDir, 'tsconfig.json'))).toBe(true);
  });

  it('src directory exists', () => {
    expect(existsSync(resolve(frontendDir, 'src'))).toBe(true);
  });

  it('eslint config exists', () => {
    expect(existsSync(resolve(frontendDir, 'eslint.config.mjs'))).toBe(true);
  });

  it('vitest config exists', () => {
    expect(existsSync(resolve(frontendDir, 'vitest.config.ts'))).toBe(true);
  });
});

describe('Preservation: other project directories are independent (Requirement 3.3)', () => {
  it('frontend package.json does not reference other project directories', () => {
    // Ensure frontend is self-contained — no workspace dependencies on sibling dirs
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const depNames = Object.keys(allDeps);

    // None of the dependencies should be local file references to sibling dirs
    const localFileDeps = depNames.filter(dep => {
      const version = allDeps[dep];
      return typeof version === 'string' && version.startsWith('file:');
    });

    expect(localFileDeps).toEqual([]);
  });

  it('package-lock.json lockfileVersion is present (valid lockfile format)', () => {
    const lockfile = JSON.parse(
      readFileSync(resolve(frontendDir, 'package-lock.json'), 'utf-8')
    );
    expect(lockfile).toHaveProperty('lockfileVersion');
    expect(typeof lockfile.lockfileVersion).toBe('number');
  });

  it('package-lock.json name matches package.json name', () => {
    const lockfile = JSON.parse(
      readFileSync(resolve(frontendDir, 'package-lock.json'), 'utf-8')
    );
    expect(lockfile.name).toBe(packageJson.name);
  });
});
