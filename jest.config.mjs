import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const shared = {
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
};

const transformIgnorePatterns = ["/node_modules/(?!jose/)", "^.+\\.module\\.(css|sass|scss)$"];

// jose v6 ships ESM only, so it must go through the transformer.
export default async function jestConfig() {
  const resolved = await createJestConfig(shared)();
  const projectBase = {
    ...resolved,
    transformIgnorePatterns,
  };

  return {
    ...projectBase,
    projects: [
      {
        ...projectBase,
        displayName: "unit",
        testMatch: ["<rootDir>/tests/unit/**/*.test.ts", "<rootDir>/tests/unit/**/*.test.tsx"],
        setupFiles: ["<rootDir>/tests/setupEnv.ts"],
        testEnvironment: "node",
      },
      {
        ...projectBase,
        displayName: "integration",
        testMatch: ["<rootDir>/tests/integration/**/*.integration.test.ts"],
        globalSetup: "<rootDir>/tests/integration/globalSetup.ts",
        globalTeardown: "<rootDir>/tests/integration/globalTeardown.ts",
        setupFiles: ["<rootDir>/tests/integration/setupIntegrationEnv.ts"],
        testEnvironment: "node",
      },
    ],
  };
}
