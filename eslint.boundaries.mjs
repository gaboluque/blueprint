/**
 * Layer rules for `boundaries/dependencies` (see AGENTS.md request flow).
 *
 * Clean architecture here means dependencies point inward: UI and HTTP adapters may call
 * domain services and shared contracts (views/validations), but domain and infra never
 * depend on Next routes or React. The browser never touches persistence (repos, lib/db).
 */

export const boundariesSettings = {
  "boundaries/root-path": "src",
  "boundaries/include": ["**/*"],
  "boundaries/elements": [
    { type: "frontend", pattern: "frontend/**" },
    // Next route groups use parentheses; micromatch treats `(client)` as extglob, so match without literal parens.
    { type: "app-ui", pattern: "app/*client*/**" },
    { type: "app-api", pattern: "app/**/api/**" },
    { type: "domains", pattern: "domains/**" },
    { type: "lib", pattern: "lib/**" },
  ],
  "boundaries/files": [
    // Next 16 edge entry for `/admin/**`; file descriptor replaces deprecated `mode: "file"` on elements.
    { category: "app-ui-root", pattern: "proxy.ts" },
    { category: "domain-repo", pattern: "domains/**/*.repo.ts" },
    { category: "domain-service", pattern: "domains/**/services/*.service.ts" },
    { category: "domain-model", pattern: "domains/**/*.model.ts" },
    { category: "domain-policy", pattern: "domains/**/*.policy.ts" },
    { category: "domain-errors", pattern: "domains/**/*.errors.ts" },
    { category: "domain-view", pattern: "domains/**/views/*" },
    { category: "domain-validation", pattern: "domains/**/validations/*" },
    { category: "lib-db", pattern: "lib/db/**" },
  ],
};

const domainInternals = [
  "domain-repo",
  "domain-service",
  "domain-model",
  "domain-policy",
  "domain-errors",
];

const appLayers = ["app-api", "app-ui"];

export const boundariesDependenciesRule = {
  default: "allow",
  policies: [
    {
      from: { element: { type: "domains" } },
      disallow: { to: { element: { types: ["frontend", ...appLayers] } } },
      message: "domains/ must not import app/ or frontend/.",
    },
    {
      from: { element: { type: "lib" } },
      disallow: { to: { element: { types: ["frontend", ...appLayers] } } },
      message: "lib/ must not import app/ or frontend/.",
    },
    {
      from: { element: { type: "frontend" } },
      disallow: { to: { element: { types: appLayers } } },
      message: "frontend/ must not import Next app routes.",
    },
    {
      from: { element: { type: "frontend" } },
      disallow: { to: { file: { categories: domainInternals } } },
      message: "frontend/ may only share contract via domains/*/views and validations; use gateway for I/O.",
    },
    {
      from: { element: { type: "frontend" } },
      disallow: { to: { file: { categories: "lib-db" } } },
      message: "frontend/ must not import lib/db; use src/frontend/gateway.",
    },
    {
      from: [{ element: { type: "app-ui" } }, { file: { categories: "app-ui-root" } }],
      disallow: { to: { file: { categories: domainInternals } } },
      message: "app UI binds pages to frontend/ and lib/; domain logic stays in API routes and services.",
    },
    {
      from: { element: { type: "app-api" } },
      disallow: { to: { element: { type: "frontend" } } },
      message: "API routes must not import frontend/.",
    },
    {
      from: { element: { type: "app-api" } },
      disallow: {
        to: {
          file: {
            categories: ["domain-repo", "domain-model", "domain-policy", "domain-errors"],
          },
        },
      },
      message: "API routes call services (and views/validations), not repos or models directly.",
    },
  ],
};
