/**
 * T112 — Structural rules registry.
 *
 * The structural test runner reads this file as data; adding a new rule
 * is a one-line PR.
 */

import type { Rule } from "./types";

export const rules: readonly Rule[] = [
  {
    id: "cross/no-fetch-in-page",
    name: "No fetch in page files",
    source: (root) => `${root}/app/**/page.tsx`,
    forbidden: /fetch\(/,
    message: "Pages must not call fetch() directly. Use a service in shared/api/.",
    fix: "Move the fetch into a service under shared/api/endpoints/ and call from the page.",
  },
  {
    id: "cross/no-raw-usestate-for-cross-cutting",
    name: "No raw useState for cross-cutting state",
    source: (root) => `${root}/features/**/*.tsx`,
    forbidden: /useState\s*\([^)]*(auth|user|session|theme|darkMode|isDark)/i,
    message:
      "Cross-cutting state (auth/user/session/theme) must live in the store, not in raw useState.",
    fix: "Use the useAuth / useTheme hook from @/shared/store instead.",
  },
  {
    id: "cross/no-process-env-outside-env-module",
    name: "No process.env outside shared/env/",
    source: (root) => `${root}/**/*.{ts,tsx}`,
    forbidden: /process\.env/,
    message: "process.env must only be read from @/shared/env.",
    fix: "Add the variable to the env schema and import env from @/shared/env.",
    ignore: (file) => file.includes("/shared/env/") || file.includes("__tests__") || file.includes("/__tests__/"),
  },
  {
    id: "cross/no-localstorage-outside-store",
    name: "No localStorage / sessionStorage outside shared/store/",
    source: (root) => `${root}/**/*.{ts,tsx}`,
    forbidden: /(localStorage|sessionStorage)/,
    message: "localStorage / sessionStorage must only be read in shared/store/.",
    fix: "Use the store's persist middleware or add a new abstraction under shared/store/.",
    ignore: (file) => file.includes("/shared/store/") || file.includes("__tests__") || file.includes("/__tests__/"),
  },
  {
    id: "page-files-are-short",
    name: "Page files are short",
    source: (root) => `${root}/app/**/page.tsx`,
    forbidden: /.{200,}/,
    message: "Page files must be under 150 lines (80 for add-podcast).",
    fix: "Move data, policy or UI into the relevant feature or shared module.",
    isLineCount: true,
    limit: (file) => (file.endsWith("/add-podcast/page.tsx") ? 80 : 150),
  },
  {
    id: "a11y/no-removed-aria",
    name: "A11y: aria attributes preserved",
    source: (root) => `${root}/features/**/*.tsx`,
    forbidden: null,
    message: "A11y regression — aria attribute removed.",
    fix: "Re-add the aria attribute.",
  },
  {
    id: "a11y/no-semantic-regression",
    name: "A11y: no swapped semantic element",
    source: (root) => `${root}/features/**/*.tsx`,
    forbidden: /<div[^>]*onClick=/,
    message: "A11y regression — <div onClick> where a <button> should be used.",
    fix: "Replace with a <button> or a <Link>.",
  },
  {
    id: "a11y/no-removed-tabindex",
    name: "A11y: tabIndex on interactive controls preserved",
    source: (root) => `${root}/features/**/*.tsx`,
    forbidden: null,
    message: "A11y regression — removed tabIndex from a control that had one.",
    fix: "Re-add the tabIndex if the control is still focusable.",
  },
] as const;
