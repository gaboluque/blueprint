# AGENTS.md — blueprint

Source of truth for AI agents working in this repo. Admin panel for institutions and their students. Next.js App Router · TypeScript strict · plain Postgres · Drizzle ORM · Zod · Jest.

**Reference domain:** `src/domains/institutions/` is canonical. Match its file names, export style, and service flow when adding or changing features. Step-by-step checklist: [`_docs/new-domain.md`](_docs/new-domain.md).

## Golden rules

1. **Auth first.** Every `/api/admin/**` route uses `AdminApiHandler` (sign-in/sign-out use `PublicApiHandler`). Don't read cookies or bodies yourself.
2. **Authorize in code, fail closed.** Services call `Policy.authorize(XPolicy.canY(actor, entity))` after loading the entity. There's no RLS; policies are the only access control.
3. **Never trust the client for privileged fields.** `status`, `archivedAt`, `institutionId` on update, and ids are never read from bodies. Schemas are `strictObject`, so unknown keys are rejected.
4. **The frontend never touches the database.** `src/frontend/**` and `src/app/**/{page,layout}.tsx` don't import `@/lib/db/*`, repos, `drizzle-orm`, or `pg` (ESLint enforces it). Data flows through `src/frontend/gateway` → API route.
5. **No hard delete of institutions.** `DELETE` archives. `InstitutionsRepo` doesn't expose `delete`.
6. **Fake data only** in seeds and tests. Never add an AI agent as a coauthor on commits or PRs.
7. No `any`, no `@ts-ignore`, no magic strings: English error messages live in `<domain>.errors.ts`.

## Request flow

```
page.tsx → src/frontend/features/<domain>/<Component> → src/frontend/gateway/<domain>.ts (ApiClient → ApiResult<T>)
  → src/app/(server)/api/**/route.ts   AdminApiHandler: auth → Zod params/query/body → handler → error mapping → envelope
  → services/<verbNoun>.service.ts     load models via repos → policy → model rules → write via repos
  → <table>.repo.ts (BaseRepo + named queries) → Drizzle → Postgres
```

| Layer                          | Owns                                                                                                        | Never                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Route (`src/app/(server)/api`) | Handler options, calling one service, choosing `HandlerResults`                                             | Queries, business `if`s, policies                    |
| Service                        | One user intent. Policy checks, model rules, orchestration, transactions                                    | HTTP, Zod, `Response`, status codes                  |
| Policy (`*.policy.ts`)         | Who may act on which entity (`boolean`)                                                                     | State rules, I/O                                     |
| Model (`*.model.ts`)           | Behavior on own fields; cross-entity rules take an already-loaded entity; relations take `repos` explicitly | Holding a db handle, reading the clock, lazy loading |
| Repo (`*.repo.ts`)             | Queries for one table, row → model, unique violation → `ConflictError`                                      | Business decisions, returning raw rows               |
| View (`views/*.view.ts`)       | Model → wire DTO (the API contract)                                                                         | Business rules                                       |

## Layout

```
src/
  app/                            Next.js routes only — thin bindings
    (server)/api/**               route handlers (AdminApiHandler)
    (client)/admin/**             pages + layouts (import from src/frontend/features)
  frontend/                       everything that ships to the browser
    features/<domain>/            per-domain UI (InstitutionsListPage, StudentForm, …)
    components/
      ui/                         Radix primitives (Button, Alert, Card, …)
      shared/                     cross-domain widgets (ListShell, DataTable, Pagination, …)
      admin/                      admin chrome (AdminShell, adminRoutes, statusLabels)
    hooks/                        useForm, useListQuery, useResource, useMutation, …
    gateway/                      apiClient.ts + <domain>.ts fetch wrappers → ApiResult<T>
  domains/<domain>/               backend domain logic, one folder per domain
    <x>.model.ts  <x>s.repo.ts  <x>.policy.ts  <x>.errors.ts
    services/<verbNoun>.service.ts
    validations/<x>.validation.ts
    views/<x>.view.ts
  lib/                            backend infra + cross-cutting utilities
    auth/       actor, AuthProvider port, dev adapter, session cookie, passwords
    db/         schema.ts (single source of truth), client.ts (singleton), baseRepo.ts, repoRegistry.ts
    errors/     DomainError subclasses, HttpError, ErrorMapping
    http/       ApiResponse, envelope, readJsonBody, HandlerResults, apiHandler factory, AdminApiHandler
    policy/     Policy.isAdmin / Policy.authorize
    validation/ Validation.parse (English Zod messages), shared schemas
    date.ts     formatDate (browser- and server-safe)
db/migrations/                    drizzle-kit SQL; review generated SQL, do not rewrite by hand
scripts/db-generate.mjs           requires a declarative migration name (snake_case)
scripts/seed.ts                   idempotent fake seed
tests/unit/**                     mirrors src/
tests/integration/**              route integration tests (`*.integration.test.ts`)
```

A new feature touches four folders: `frontend/gateway/<domain>.ts` (one method per endpoint), `frontend/features/<domain>/*.tsx` (UI), `app/(client)/admin/(panel)/<domain>/page.tsx` (one-line binding), and `app/(server)/api/admin/<domain>/route.ts` (thin HTTP glue calling a service in `domains/<domain>/services/`).

## Conventions

- **One PascalCase named-object export per module** (`export const InstitutionView = { format }`). Types stay named exports. Classes for models, repos, and errors.
- **Suffixes name the layer:** `.model`, `.repo`, `.policy`, `.errors`, `.service`, `.validation`, `.view`, `.adapter`, `.port`.
- **Services:** `src/domains/<domain>/services/<verbNoun>.service.ts` exporting `export const VerbNoun = { call }`. Signature: `call(repos: AppRepos, actor: Actor, input)`. Receive repos, never create a db handle.
- **Repos:** extend `BaseRepo<typeof table, Model>`; implement `toModel(row)`. Use inherited `find`/`findBy`/`findById`/`count`/`paginate`/`create`/`update` with a camelCase `where` object before adding named methods. Add named methods for joins, aggregates, or search. Register new repos in `RepoRegistry`.
- **Transactions:** in a route, `ctx.transaction(async (repos) => Service.call(repos, actor, input))`. Everything inside commits or rolls back together.
- **Errors:** throw `DomainError` subclasses (`NotFoundError`, `ConflictError`, …) via the domain's `XErrors` factory. `HttpError` is for HTTP-only cases. The handler maps both; anything else becomes a logged `500` with `fallbackError`.
- **Responses:** return a plain value (`200`), `HandlerResults.created(dto)` (`201`), `HandlerResults.page(result, View.format)` (paginated), `HandlerResults.noContent()` (`204`), or a `NextResponse` when you need cookies.
- **DB routes** export `export const runtime = "nodejs"`.
- **Time:** inject `now` into models (`institution.archive(new Date())` in the service).
- **Unexpected (500) errors** go through `ErrorReporter` (`src/lib/observability/errorReporter.ts`) before being logged — a no-op by default. Wire a real adapter (Sentry, …) in `src/instrumentation.ts` via `ErrorReporter.set(...)`; no call site changes.
- **Rate limiting:** `RateLimiter` (`src/lib/http/rateLimiter.ts`) is an in-memory fixed window — fine for one instance, not for horizontal scaling. Swap for a shared store (Postgres, Redis) before running more than one. `POST /api/admin/sessions` is the only consumer today.
- **Async / background work:** none yet. When a feature needs it (email, slow jobs), call the work inline from the service first; only add a queue (pg-boss, BullMQ + Redis, QStash, …) once more than one feature needs deferred work — don't build the abstraction speculatively.
- **Schema changes:** edit `src/lib/db/schema.ts` → `make db-generate NAME=<snake_case>` (required; never accept drizzle-kit’s random Marvel names) → review the SQL in `db/migrations` → `make db-migrate`. Names describe the change (`add_audit_events`, not `0001_demonic_matthew_murdock`). Same via `npm run db:generate -- add_audit_events`.
- **Copy:** English for all user-facing text. Code, comments, and logs in English. Comments only for a non-obvious why.

## Route template

```ts
export const runtime = "nodejs";

export const PATCH = AdminApiHandler(
  async ({ actor, repos, params, body }) =>
    InstitutionView.format(await UpdateInstitution.call(repos, actor, { id: params.id, patch: body })),
  {
    route: "PATCH /api/admin/institutions/[id]",
    fallbackError: "We couldn't update the institution.",
    paramsSchema: idParamsSchema,
    bodySchema: updateInstitutionBodySchema,
  },
);
```

## Service template

```ts
async function call(repos: AppRepos, actor: Actor, { id, patch }: UpdateInstitutionInput): Promise<Institution> {
  const institution = await repos.institutions.findById(id);
  if (!institution) throw InstitutionErrors.notFound();
  Policy.authorize(InstitutionPolicy.canUpdate(actor, institution));
  institution.assertEditable();

  const updated = await repos.institutions.update(id, patch);
  if (!updated) throw InstitutionErrors.notFound();
  return updated;
}

export const UpdateInstitution = { call };
```

## Testing

Full guide: [`_docs/tests.md`](_docs/tests.md). Admin forms: [`_docs/useForm.md`](_docs/useForm.md).

Every test uses **Arrange–Act–Assert** with a **blank line** between each block (no section comments). One behavior per `it`; names state what is asserted.

- **Unit** (`tests/unit/**`) mirrors `src/`. **Integration** (`tests/integration/**`): one `*.integration.test.ts` per `route.ts`; one `describe("METHOD /api/…")` per handler.
- **Services:** fake repos; never mock the service under test. **Integration:** real Postgres; never mock `Database` or domain services.
- **Factories:** in-memory `tests/factories/models.ts`; persisted `tests/integration/factories/*.factory.ts`. Imports: `@/*`, `@tests/*`.

## Quality gates

`make format` · `make lint` · `make typecheck` · `make test` must be green before you call work done. A pre-commit hook (`husky` + `lint-staged`) runs format and lint on staged files automatically.

**ESLint architecture.** `eslint.boundaries.mjs` defines layers (`frontend`, `app-ui`, `app-api`, `domains`, `lib`) and file categories (repos, services, views, …). `boundaries/dependencies` enforces import direction. Complexity (`complexity`, `sonarjs/cognitive-complexity`, `max-depth`) lives in `eslint.complexity.mjs` and runs via `npm run lint:complexity` (separate CI job; `make lint` runs both).

API contract for the next slices: [`_docs`](_docs/api-contracts.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
