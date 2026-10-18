# Admin API contracts

Contract for auth, institutions, and students. Every endpoint and client module below is implemented in this repo. DTO types live in code and are the source of truth:

- `InstitutionDto`, `InstitutionListItemDto` → `src/domains/institutions/views/institution.view.ts`
- `StudentDto` → `src/domains/students/views/student.view.ts`
- `UserDto` → `src/domains/users/views/user.view.ts`
- Request schemas (Zod) → `src/domains/<domain>/validations/*.validation.ts`, `src/lib/auth/auth.validation.ts`

## Conventions

- **Auth.** Every route except `POST`/`DELETE /api/admin/sessions` uses `AdminApiHandler`, which requires the `blueprint_admin_session` cookie. No cookie or an invalid/expired session returns `401`.
- **Envelope.** Success: `{ ok: true, data, pagination? }`. Failure: `{ ok: false, error, fieldErrors? }`. `error` is user-safe Spanish. `fieldErrors` maps a field path (`"email"`, `"_root"`) to a message.
- **Lists** put `pagination: { page, pageSize, total }` at the top level, next to `data` (an array).
- **Query params** on lists: `page` (default `1`, min `1`), `pageSize` (default `20`, max `100`), `search` (trimmed, max 100, blank = none), `status` (omitted = all).
- **Bodies** are JSON (`Content-Type: application/json`, else `415`). Unknown keys return `400` with the key in `fieldErrors`. Emails are trimmed and lowercased.
- **IDs** in paths are UUIDs; anything else returns `400`.
- **Dates** are ISO 8601 strings (UTC).
- **Archived institutions are read-only.** Any write on the institution or its students returns `409`.

| Status | When                                                     |
| ------ | -------------------------------------------------------- |
| 200    | Read, update, archive                                    |
| 201    | Created (`POST`)                                         |
| 204    | Deleted, signed out (no body)                            |
| 400    | Invalid params, query, or body (`fieldErrors` set)       |
| 401    | Not signed in, session expired, wrong credentials        |
| 403    | Policy denied (unreachable while admin is the only role) |
| 404    | Resource doesn't exist                                   |
| 409    | Unique conflict (slug, email) or archived institution    |
| 415    | Body isn't JSON                                          |
| 500    | Unexpected; message is the route's `fallbackError`       |

## Sessions

| Method | Path                  | Body                  | Success                      | Errors                                          |
| ------ | --------------------- | --------------------- | ---------------------------- | ----------------------------------------------- |
| POST   | `/api/admin/sessions` | `{ email, password }` | `201` `UserDto`, sets cookie | `400`, `401` "Correo o contraseña incorrectos." |
| DELETE | `/api/admin/sessions` | —                     | `204`, clears cookie         | —                                               |
| GET    | `/api/admin/me`       | —                     | `200` `UserDto`              | `401`                                           |

## Institutions

| Method | Path                           | Query / body                                                                                                  | Success                                                                                | Errors                                     |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| GET    | `/api/admin/institutions`      | `listInstitutionsQuerySchema`: `page`, `pageSize`, `search` (name or slug), `status` (`active` \| `archived`) | `200` `InstitutionListItemDto[]` + `pagination`, newest first                          | `400`                                      |
| POST   | `/api/admin/institutions`      | `createInstitutionBodySchema`: `{ name, slug, contactEmail }`                                                 | `201` `InstitutionDto` (`status: "active"`)                                            | `400`, `409` slug taken                    |
| GET    | `/api/admin/institutions/[id]` | —                                                                                                             | `200` `InstitutionDto` (archived ones too)                                             | `400`, `404`                               |
| PATCH  | `/api/admin/institutions/[id]` | `updateInstitutionBodySchema`: any of `name`, `slug`, `contactEmail` (at least one)                           | `200` `InstitutionDto`                                                                 | `400`, `404`, `409` archived or slug taken |
| DELETE | `/api/admin/institutions/[id]` | —                                                                                                             | `200` `InstitutionDto` with `status: "archived"`, `archivedAt` set. Students are kept. | `404`, `409` already archived              |

`status` and `archivedAt` are never accepted in bodies; archiving only happens through `DELETE`. There is no hard delete and no unarchive yet.

## Students

| Method | Path                                    | Query / body                                                                                                                     | Success                                                                    | Errors                                                              |
| ------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/admin/institutions/[id]/students` | `listStudentsQuerySchema`: `page`, `pageSize`, `search` (first/last name, email, document id), `status` (`active` \| `inactive`) | `200` `StudentDto[]` + `pagination`, by last name then first name          | `400`, `404` institution                                            |
| POST   | `/api/admin/institutions/[id]/students` | `createStudentBodySchema`: `{ firstName, lastName, email, documentId, status? }` (`status` defaults to `active`)                 | `201` `StudentDto`                                                         | `400`, `404` institution, `409` institution archived or email taken |
| GET    | `/api/admin/students/[id]`              | —                                                                                                                                | `200` `StudentDto`                                                         | `400`, `404`                                                        |
| PATCH  | `/api/admin/students/[id]`              | `updateStudentBodySchema`: any of `firstName`, `lastName`, `email`, `documentId`, `status` (at least one)                        | `200` `StudentDto`                                                         | `400`, `404`, `409` institution archived or email taken             |
| DELETE | `/api/admin/students/[id]`              | —                                                                                                                                | `200` `StudentDto` with `status: "inactive"` (deactivates; no hard delete) | `400`, `404`, `409` already inactive or institution archived        |

`institutionId` comes from the path on create and can't be changed afterwards. Students are never hard deleted because they'll carry clinical history; `DELETE` only deactivates, and `PATCH` with `status: "active"` reactivates.

## Building blocks for each endpoint

| Endpoint           | Service (`src/domains/<domain>/services/`)              | Repo calls                                                                                     | Policy                        | Model rule                                             |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| GET institutions   | `listInstitutions.service.ts` → `ListInstitutions.call` | `institutions.listWithStudentCounts`                                                           | `canList`                     | —                                                      |
| POST institutions  | `createInstitution.service.ts`                          | `institutions.create` (unique slug → `409`)                                                    | `canCreate`                   | —                                                      |
| GET institution    | `getInstitution.service.ts`                             | `institutions.findById`                                                                        | `canRead`                     | —                                                      |
| PATCH institution  | `updateInstitution.service.ts`                          | `findById`, `update`                                                                           | `canUpdate`                   | `assertEditable()`                                     |
| DELETE institution | `archiveInstitution.service.ts`                         | `findById`, `update(id, institution.archive(new Date()))`                                      | `canArchive`                  | `archive(now)`                                         |
| GET students       | `listInstitutionStudents.service.ts`                    | `institutions.findById`, `institution.students(repos, page, filters)`                          | `canRead` (institution)       | —                                                      |
| POST student       | `createStudent.service.ts`                              | `institutions.findById`, `students.create` (unique email → `409`)                              | `canManageStudents`           | `assertEditable()`                                     |
| GET student        | `getStudent.service.ts`                                 | `students.findById`                                                                            | `StudentPolicy.canRead`       | —                                                      |
| PATCH student      | `updateStudent.service.ts`                              | `students.findById`, `student.institution(repos)`, `students.update`                           | `StudentPolicy.canUpdate`     | `institution.assertEditable()`                         |
| DELETE student     | `deactivateStudent.service.ts`                          | `students.findById`, `student.institution(repos)`, `students.update(id, student.deactivate())` | `StudentPolicy.canDeactivate` | `institution.assertEditable()`, `student.deactivate()` |

Errors come from `InstitutionErrors` / `StudentErrors` (`*.errors.ts`); don't inline new Spanish strings in services.

## Client modules

Browser code calls the API through `src/frontend/gateway/*` on top of `ApiClient`. Each method returns `ApiResult<T>` (`{ ok: true, data, pagination? }` or `{ ok: false, error, fieldErrors? }`). Types come from domain views and validations via `import type`.

| Export              | Module                                 | Methods                                                                                                                                                       |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminSession`      | `src/frontend/gateway/session.ts`      | `signIn(body)` → `UserDto` · `signOut()` → `null` (`204`) · `me()` → `UserDto`                                                                                |
| `AdminInstitutions` | `src/frontend/gateway/institutions.ts` | `list(query)` · `create(body)` · `get(id)` · `update(id, body)` · `archive(id)` · `listStudents(institutionId, query)` · `createStudent(institutionId, body)` |
| `AdminStudents`     | `src/frontend/gateway/students.ts`     | `get(id)` · `update(id, body)` · `deactivate(id)` → `StudentDto` (same as `DELETE /api/admin/students/[id]`, `200`)                                           |

Admin UI bindings: `LoginForm` → `AdminSession`; `InstitutionsListPage` / `InstitutionDetailPage` / `InstitutionForm` / `InstitutionStudentsSection` → `AdminInstitutions`; `StudentDetailPage` / `StudentForm` → `AdminStudents` and nested institution routes.
