# Testing guide

How we write tests in blueprint. `AGENTS.md` summarizes the rules; this doc is the reference for humans and agents.

## Arrange–Act–Assert (required)

Every `it` follows **Arrange → Act → Assert**:

1. **Arrange** — inputs, mocks, DB rows, cookies, route context.
2. **Act** — one call to the subject (service, handler, model method, HTTP handler).
3. **Assert** — outcomes (return value, thrown error, HTTP status, envelope, side effects).

Separate the three blocks with a **blank line** each. Do not use `// Arrange`, `// Act`, or `// Assert` comments.

One behavior per `it`. If you need two acts, split into two tests.

`it` names describe what you assert, in plain language: `"returns 404 when the institution id does not exist"`, not `"handles missing id"`.

### Sync example (model)

```ts
it("rejects edits once archived with a conflict", () => {
  const institution = buildArchivedInstitution();

  const act = () => institution.assertEditable();

  expect(act).toThrow(ConflictError);
  expect(act).toThrow(INSTITUTION_ERROR_MESSAGES.archived);
});
```

### Async example (service)

```ts
it("throws not found when the institution doesn't exist", async () => {
  const { repos, findById, update } = setup();
  findById.mockResolvedValue(null);

  const act = UpdateInstitution.call(repos, buildAdminActor(), { id: INSTITUTION_ID, patch: PATCH });

  await expect(act).rejects.toThrow(NotFoundError);
  expect(update).not.toHaveBeenCalled();
});
```

For rejected promises, assign the promise to `act` in **Act**, then assert with `await expect(act).rejects...` in **Assert**.

### Integration example (route)

Fixtures and sign-in belong in **Arrange** (or shared `beforeEach` inside the same `describe`). The exported route handler is the only **Act**.

```ts
it("returns the institution stored in the database", async () => {
  const institution = await InstitutionFactory.create({ name: "Detalle Integración" });
  const context = IntegrationRoute.routeContext({ id: institution.id });

  const response = await GET(
    IntegrationRoute.request(`/api/admin/institutions/${institution.id}`, { cookie }),
    context,
  );
  const json = await response.json();

  expect(response.status).toBe(200);
  expect(json).toEqual({ ok: true, data: expect.objectContaining({ id: institution.id }) });
});
```

Reference: `tests/unit/domains/institutions/institution.model.test.ts`, `tests/unit/domains/institutions/services/updateInstitution.service.test.ts`, `tests/integration/api/admin/institutions/[id]/route.integration.test.ts`.

---

## Layout

| Kind        | Path                                         | Mirrors              |
| ----------- | -------------------------------------------- | -------------------- |
| Unit        | `tests/unit/**/*.test.ts`                    | `src/` tree          |
| Integration | `tests/integration/**/*.integration.test.ts` | API `route.ts` files |

**Imports:** `@/*` → `src/`; `@tests/*` → `tests/` (Jest + `tsconfig` paths).

Add cases to an existing `describe` for the subject when one is already there. Do not open redundant top-level describes for a one-off scenario.

### Integration file naming

One integration file per route module:

| Route                                                   | Test file                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/app/(server)/api/admin/institutions/route.ts`      | `tests/integration/api/admin/institutions.route.integration.test.ts`      |
| `src/app/(server)/api/admin/institutions/[id]/route.ts` | `tests/integration/api/admin/institutions/[id]/route.integration.test.ts` |

Inside the file: one top-level `describe("METHOD /api/…/path")` per exported handler (`GET`, `POST`, `PATCH`, …).

---

## Unit tests by layer

### Policies

- Allowed and denied paths for each `canX`.
- No I/O; pass `buildAdminActor()` / staff actors from `tests/factories/models.ts`.

### Models

- Use `buildInstitution()`, `buildStudent()`, etc. from `tests/factories/models.ts`.
- Cover state rules (`assertEditable`, `archive`, `deactivate`) and relation methods with fake repos when needed.

### Services

- **Never mock the service under test.**
- Pass a minimal fake `AppRepos`: `{ institutions: { findById: jest.fn(), update: jest.fn() } } as unknown as AppRepos`.
- Shared `setup()` per file is fine; `afterEach(() => jest.restoreAllMocks())` when spying policies.
- Cover: happy path, `NotFoundError`, policy denial (`ForbiddenError`), domain conflicts (`ConflictError`), and repo/thrown messages where relevant.

Reference: `tests/unit/domains/institutions/services/updateInstitution.service.test.ts`.

### HTTP handlers (unit)

- Test auth, validation, and wiring at the route boundary.
- Mock **services** (and auth/db shims via `RouteTestSupport`), not domain logic you are trying to prove.
- Assert the service was or was not called and that status/envelope match.

Reference: `tests/unit/app/api/admin/institutions/route.test.ts`, `tests/unit/lib/http/adminApiHandler.test.ts`.

### Gateway (unit)

- Mock `fetch` / `ApiClient` boundaries; assert URLs, methods, and parsed `ApiResult`.

### Lib (errors, mapping, repos)

- Pure behavior; fake db executor only when the unit under test requires it.

---

## Integration tests (routes)

**Goal:** real Postgres, real handler stack, no mocked `Database` or domain services.

### Setup

| Step           | What                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Isolation      | `await IntegrationDb.reset()` in `beforeEach`                                                                                      |
| 401 cases      | Reset only; call handler without `cookie`                                                                                          |
| Authenticated  | Nested `describe("when authenticated")`: reset → `UserFactory.createAdmin()` → `IntegrationRoute.signInAsAdmin()` → reuse `cookie` |
| Data           | `tests/integration/factories/*.factory.ts` (defaults aligned with `tests/factories/models.ts`)                                     |
| Dynamic routes | `IntegrationRoute.routeContext({ id: … })` as second argument to the handler                                                       |
| Requests       | `IntegrationRoute.request(path, { method, body, cookie })`                                                                         |

### Assertions

- HTTP status.
- JSON envelope: `{ ok: true, data, pagination? }` or `{ ok: false, error, fieldErrors? }`.
- When behavior is persistence, read back with Drizzle (`Database.get()`) and assert row fields.

### Environment

- Postgres must be up (`make db-up`). Migrations applied (`make db-migrate`).
- `BCRYPT_ROUNDS=4` in integration env for speed.
- `globalSetup` skips migrate when the journal already matches (override with `INTEGRATION_SKIP_MIGRATE=1`).
- `make test` runs unit, then integration **`--runInBand`** (one shared DB; no parallel truncation).

Integration only:

```bash
npm test -- --selectProjects integration --runInBand
```

Related file: `tests/integration/helpers/integrationRoute.ts`, `tests/integration/helpers/integrationDb.ts`.

---

## Factories and fake data

| Use                                    | Location                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| In-memory models, actors, stable UUIDs | `tests/factories/models.ts` — `buildInstitution`, `buildAdminActor`, `INSTITUTION_ID`, … |
| Rows persisted for integration         | `tests/integration/factories/*.factory.ts`                                               |

Fake data only in seeds and tests. Never use production identities.

---

## Mandatory coverage

When you add or change behavior, tests should cover:

- Policies (allow / deny).
- Model rules touched by the change.
- Auth and error mapping for new routes or status codes.
- Each affected service: happy path plus not-found, forbidden, and conflict cases where the domain defines them.

Skip impossible states and duplicate assertions already covered elsewhere.

---

## Quality gate

From repo root (Postgres up for integration):

```bash
make test
```

Same as CI: `make lint` · `make typecheck` · `make test` before you call work done.
