# blueprint

Starter template for fullstack Next.js apps: typed API routes, Postgres, and a browser UI that never talks to the database directly. Clone it, rename it, and grow your own domains on the same skeleton.

**Stack:** Next.js App Router · TypeScript strict · Postgres · Drizzle ORM · Zod · Jest

**Sample app:** an admin panel for institutions and students. It is reference code, not the product—you can replace or extend it while keeping the patterns.

## What you get

| Area                 | What blueprint gives you                                                                             |
|----------------------|------------------------------------------------------------------------------------------------------|
| **Request flow**     | `page → gateway → API handler → service → repo → Postgres`, with auth and validation at the edge     |
| **Layers**           | `domains/` (models, repos, policies, services), `frontend/` (features + gateway), thin `app/` routes |
| **HTTP**             | `AdminApiHandler` — session auth, Zod, `{ ok, data \| error }` envelope, mapped domain errors        |
| **Data**             | Plain Postgres (no Supabase/RLS); code-side policies; migrations from `schema.ts`                    |
| **Auth**             | `AuthProvider` port + dev bcrypt/JWT cookie; swap the adapter without touching routes                |
| **Quality**          | Unit + integration tests, CI workflow, `make lint` / `typecheck` / `test` / `check`                  |
| **AI-friendly docs** | [`AGENTS.md`](AGENTS.md) and `_docs/` for agents and humans                                          |

Canonical implementation to copy when you add features: `src/domains/institutions/`.

## Documentation

| Doc                                                | Purpose                                                      |
|----------------------------------------------------|--------------------------------------------------------------|
| [`AGENTS.md`](AGENTS.md)                           | Golden rules, templates, layout (source of truth for agents) |
| [`_docs/api-contracts.md`](_docs/api-contracts.md) | Sample admin API (envelope, status codes, DTOs)              |
| [`_docs/new-domain.md`](_docs/new-domain.md)       | Checklist for a new domain or endpoint slice                 |
| [`_docs/tests.md`](_docs/tests.md)                 | Arrange–Act–Assert, unit vs integration, factories           |

## Requirements

- Node.js 22+ and npm (see `.nvmrc`)
- Docker (Postgres for local dev and integration tests)

## Get started

```bash
make setup        # .env.example → .env, npm install
make db-up        # Postgres on localhost:5434
make db-migrate   # apply db/migrations/
make seed         # fake admin, institutions, students (idempotent)
npm run dev       # http://localhost:3001
```

Or `make start` (Postgres + migrate + dev server).

Before you deploy or share an environment, set `SESSION_SECRET` in `.env` to a new value, for example:

```bash
openssl rand -base64 48
```

### Try the sample admin

Open `http://localhost:3001/admin/login`.

| Email                 | Password    |
|-----------------------|-------------|
| `admin@blueprint.dev` | `Admin123!` |

Session API from the terminal:

```bash
curl -i -c cookies.txt -H 'content-type: application/json' \
  -d '{"email":"admin@blueprint.dev","password":"Admin123!"}' \
  http://localhost:3001/api/admin/sessions
curl -b cookies.txt http://localhost:3001/api/admin/me
```

## Commands

| Command                                      | Does                                                             |
|----------------------------------------------|------------------------------------------------------------------|
| `make setup`                                 | Create `.env` if missing, `npm install`                          |
| `make start`                                 | Postgres, migrate, `next dev`                                    |
| `make db-up` / `make db-down`                | Start or stop Postgres                                           |
| `make db-generate NAME=…`                    | Migration from `src/lib/db/schema.ts` (snake_case name required) |
| `make db-migrate`                            | Apply pending migrations                                         |
| `make seed`                                  | Idempotent fake seed                                             |
| `make lint` · `make typecheck` · `make test` | Quality gates (integration needs Postgres)                       |
| `make check`                                 | Lint, typecheck, test, production build (like CI)                |
| `make build`                                 | `next build`                                                     |

Use `npm ci` in CI or clean installs.

## Using this as a template

1. **Fork or clone** and create your app repo.
2. **Rename** the package and branding (`package.json`, UI copy, cookie name if you want isolation).
3. **Keep the layers** — add tables in `schema.ts`, domains under `src/domains/`, gateway methods, routes, and UI following [`_docs/new-domain.md`](_docs/new-domain.md).
4. **Trim or replace** the sample institutions/students slice when it no longer fits; keep one domain as the pattern reference until your own is stable.
5. **Run** `make db-generate NAME=your_change` for every schema edit; review generated SQL before migrate.

Frontend code must not import `@/lib/db/*`, repos, or Drizzle (ESLint enforces this). All browser data goes through `src/frontend/gateway/`.

## Architecture (overview)

```
src/
  app/              Next.js pages and API routes (thin glue)
  frontend/         UI, hooks, gateway (ApiResult<T>)
  domains/          Per-domain models, repos, policies, services, validations, views
  lib/              Auth, db, HTTP handlers, errors, validation, observability
db/migrations/      drizzle-kit SQL
tests/unit/         Mirrors src/
tests/integration/  Route tests against Postgres (*.integration.test.ts)
```

**Database.** Single schema in `src/lib/db/schema.ts`. Named migrations only (`make db-generate NAME=add_audit_events`). One cached `pg` pool for dev hot reload.

**Repos and models.** `BaseRepo` + rich model classes; models do not hold a db handle. Authorization lives in `*.policy.ts` and runs in services (fail closed).

**Tests.** [`_docs/tests.md`](_docs/tests.md). Integration tests need `make db-up`; `make test` runs integration `--runInBand`.

**Auth.** Implement `AuthProvider` (`signIn`, `authenticate`) and wire it in `src/lib/auth/auth.ts`. The included dev adapter uses bcrypt + HS256 session cookie.

## Continuous integration

Push and PR to `main` run [`.github/workflows/ci.yml`](.github/workflows/ci.yml): `npm ci` → Postgres 17 → migrate → lint → typecheck → test → build.

Locally: `make db-migrate && make check` with Postgres up and `.env` configured.

For GitHub: require the CI workflow (or `quality` job) on `main` before merge.
