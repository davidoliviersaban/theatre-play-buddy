import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Flat config ignores
  { ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "data/**",
    "public/**",
    "node_modules/**",
    "docker/**",
  ]},
  {
    files: ["jest.config.js", "jest.setup.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
    },
  },
  {
    files: ["src/jobs/parse/parse-pipeline.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
