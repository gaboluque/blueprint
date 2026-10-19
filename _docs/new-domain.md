# New domain / feature checklist

Use `src/domains/institutions/` as the template. One user-facing capability usually touches every section below.

## 1. Database

- [ ] Add table, enums, indexes, and checks in `src/lib/db/schema.ts`
- [ ] `make db-generate NAME=<snake_case>` (required name; review SQL in `db/migrations/`)
- [ ] `make db-migrate`

## 2. Domain folder (`src/domains/<domain>/`)

| File                                 | Role                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `<entity>.model.ts`                  | Class with field behavior; inject `now` for time; no db handle                                                      |
| `<entities>.repo.ts`                 | Extends `BaseRepo`; `toModel(row)`; named queries only when `where` is not enough; set `conflictMessage` in English |
| `<entity>.policy.ts`                 | `canX(actor, entity)` → `boolean` only                                                                              |
| `<entity>.errors.ts`                 | Factory (`InstitutionErrors.notFound()`); all English messages for the domain                                       |
| `validations/<entity>.validation.ts` | Zod `strictObject` schemas; export input types                                                                      |
| `views/<entity>.view.ts`             | `export const XxxView = { format }` → wire DTOs                                                                     |
| `services/<verbNoun>.service.ts`     | `export const VerbNoun = { call }`; signature `call(repos, actor, input)`                                           |

Service order: load via repo → `if (!entity) throw XxxErrors.notFound()` → `Policy.authorize(XxxPolicy.canY(...))` → model rules → repo write.

- [ ] Register repo in `src/lib/db/repoRegistry.ts` (`AppRepos` type + constructor)
- [ ] Override `institutionIdOf` on repos whose rows are scoped to an institution (see `StudentsRepo`). `BaseRepo.create`/`update` write an `audit_events` row with that id; set `auditable = false` only on the audit repo itself
- [ ] Add the new table to the `TRUNCATE` list in `tests/integration/helpers/integrationDb.ts`

## 3. HTTP (`src/app/(server)/api/admin/...`)

- [ ] One `route.ts` per path segment; export `runtime = "nodejs"`
- [ ] Use `AdminApiHandler` (or `PublicApiHandler` for auth-only public routes)
- [ ] Handler calls exactly one service; map result with `XxxView.format` or `HandlerResults.*`
- [ ] No queries, policies, or business `if`s in the route file

## 4. Browser

- [ ] `src/frontend/gateway/<domain>.ts` — PascalCase export (`AdminXxx`), one method per endpoint, `ApiResult<T>`
- [ ] `src/frontend/features/<domain>/` — pages, `<Entity>Form` + `<Entity>FormModal` (create/edit in `Modal`; login excepted), list shells. Reuse `Table`/`ListFilters`/`Card`/`Button` as-is; they're mobile-first (unprefixed Tailwind classes target phones, `sm:`+ scales up). Hand-rolled grids/tables lose that for free
- [ ] `src/app/(client)/admin/(panel)/<domain>/page.tsx` — thin binding + `AdminPageGuard.requireAdmin()`
- [ ] Add paths to `src/frontend/components/admin/adminRoutes.ts` when navigation needs them

## 5. Contract docs

- [ ] Extend `_docs/api-contracts.md` (methods, schemas, status codes, service ↔ repo matrix)

## 6. Tests

Conventions and examples: [`tests.md`](tests.md).

**Unit** (`tests/unit/**` mirrors `src/`):

- [ ] Policy: allowed and denied cases
- [ ] Model rules (e.g. `assertEditable`, `archive`)
- [ ] Each service: happy path, not found, forbidden, conflict where applicable — fake repos, never mock the service under test

**Integration** (`tests/integration/api/admin/...`):

- [ ] One `*.integration.test.ts` per `route.ts`
- [ ] One top-level `describe("METHOD /api/...")` per exported handler
- [ ] `IntegrationDb.reset()` in `beforeEach`; unauthenticated 401 cases without sign-in; nested `describe("when authenticated")` with `UserFactory.createAdmin()` + `IntegrationRoute.signInAsAdmin()`
- [ ] Call the exported handler; assert status, envelope, and DB-backed fields
- [ ] Persisted fixtures: `tests/integration/factories/*.factory.ts`; in-memory defaults: `tests/factories/models.ts`

## 7. Quality gates

- [ ] `make lint` · `make typecheck` · `make test`

## Anti-patterns

- Reading `status`, `archivedAt`, `institutionId`, or ids from request bodies on update
- Importing `@/lib/db/*`, repos, or `drizzle-orm` from `src/frontend/**` or page/layout files
- Inline English error strings in services (use `*.errors.ts`)
- Hard delete on institutions (archive only)
- Skipping `RepoRegistry` when adding a table repo
