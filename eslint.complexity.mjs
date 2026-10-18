import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";
import sonarjs from "eslint-plugin-sonarjs";
import { boundariesSettings } from "./eslint.boundaries.mjs";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { sonarjs, boundaries },
    settings: boundariesSettings,
    rules: {
      complexity: ["error", { max: 15 }],
      "max-depth": ["error", 4],
      "sonarjs/cognitive-complexity": ["error", 15],
      "boundaries/dependencies": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "migrations/**", "next-env.d.ts"]),
]);
