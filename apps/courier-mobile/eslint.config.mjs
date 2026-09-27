import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    ".next-demo/**",
    "out/**",
    "build/**",
    "android/**",
    "ios/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
