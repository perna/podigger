import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Extend default ignores with additional patterns:
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Rule: cross-feature imports must go through the feature's index.ts
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/ui/*", "@/features/*/hooks/*", "@/features/*/services/*", "@/features/*/types/*", "@/features/*/policy/*"],
              message:
                "Cross-feature imports must go through '@/features/<other>' (the feature's index.ts).",
            },
          ],
        },
      ],
    },
  },
  // Rule: shared/ must not import from features/ or app/
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*"],
              message: "shared/ must not import from features/ or app/.",
            },
          ],
        },
      ],
    },
  },
  // Rule: no process.env outside shared/env/
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/env/**", "src/**/__tests__/**", "src/**/*.test.*"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Do not read process.env directly. Import 'env' from '@/shared/env' instead.",
        },
      ],
    },
  },
  // T115 — warn on raw <button> / <input> / <a> in pages and feature UI; see specs/005-frontend-coverage-cleanup/spec.md FR-009.
  {
    files: ["src/app/**/page.tsx", "src/features/**/ui/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXOpeningElement[name.name='button']:not([attributes.name.name='data-allow-raw'])",
          message:
            "Use the shared <Button> primitive from @/shared/ui instead of a raw <button>.",
        },
        {
          selector:
            "JSXOpeningElement[name.name='input']:not([attributes.name.name='data-allow-raw'])",
          message:
            "Use the shared <Input> primitive from @/shared/ui instead of a raw <input>.",
        },
        {
          selector:
            "JSXOpeningElement[name.name='a']:not([attributes.name.name='data-allow-raw']):not([attributes.name.name='data-allow-raw-link'])",
          message:
            "Use Next.js <Link> from 'next/link' for internal navigation instead of a raw <a>.",
        },
      ],
    },
  },
]);

export default eslintConfig;
