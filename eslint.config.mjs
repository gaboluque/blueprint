import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      // Policy signatures take the resource before they use it, so later relationship checks don't change call sites.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Domain models merge `Row<typeof table>` onto the class via an empty same-name interface so columns become typed instance properties. The runtime side (`Object.assign(this, row)` in `BaseModel`) backs every merged field.
    files: ["src/domains/**/*.model.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
    },
  },
  {
    files: ["src/frontend/**", "src/app/**/page.tsx", "src/app/**/layout.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db/*", "@/domains/*/*.repo", "drizzle-orm", "drizzle-orm/*", "pg"],
              message: "El frontend nunca accede a la base de datos; usa src/frontend/gateway.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "migrations/**", "next-env.d.ts"]),
]);
