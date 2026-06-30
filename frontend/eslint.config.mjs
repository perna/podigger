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
]);

export default eslintConfig;
