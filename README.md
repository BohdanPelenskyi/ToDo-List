# TODO — task management app

[![CI](https://github.com/BohdanPelenskyi/ToDo-List/actions/workflows/ci.yml/badge.svg)](https://github.com/BohdanPelenskyi/ToDo-List/actions/workflows/ci.yml)

A full-stack task manager: register, sign in, and manage your own tasks with
status filtering, due dates, a calendar of scheduled tasks and a drag-and-drop board.

<p align="center">
  <img src="docs/screenshots/desktop-tasks.jpg" alt="Task list on a desktop screen" width="58%">
  <img src="docs/screenshots/mobile-tasks.jpg" alt="Task list on a phone" width="19%">
  <img src="docs/screenshots/mobile-dialog.jpg" alt="Creating a task in a bottom sheet on a phone" width="19%">
</p>

<p align="center">
  <img src="docs/screenshots/desktop-board.jpg" alt="Board view with drag-and-drop between statuses" width="48%">
  <img src="docs/screenshots/desktop-calendar.jpg" alt="Calendar of scheduled tasks" width="48%">
</p>

<p align="center">
  <img src="docs/screenshots/mobile-board.jpg" alt="Board on a phone" width="24%">
  <img src="docs/screenshots/mobile-calendar.jpg" alt="Calendar on a phone" width="24%">
</p>

<p align="center">
  <img src="docs/screenshots/desktop-login.jpg" alt="Sign-in page on a desktop screen" width="78%">
  <img src="docs/screenshots/mobile-login.jpg" alt="Sign-in page on a phone" width="19%">
</p>

> **Demo account** (after seeding): `demo@example.com` / `Password123!`

## What you can do

- **Tasks** with a title, description, status and an optional **due date and time**.
- **Three views** of the same tasks, chosen with the switcher (the choice lives in the URL):
  - **List**: filter by status, paginate, change a status from a select, edit or delete.
  - **Board**: three columns (To do, In progress, Done). **Drag a card to another column** to change its
    status, with the mouse, a finger or the keyboard (focus the handle, press Space, move with the arrow
    keys, press Space again). Screen readers announce each step.
  - **Calendar**: a month grid with a dot for every scheduled task. Pick a day to see its tasks below the
    grid, or add one to that day. Unscheduled tasks stay out of the calendar.
- Overdue tasks are highlighted; finished tasks never are.

## Tech stack

| Area        | Choice                                                                                        | Why                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Backend     | Node.js 20, Express 5, TypeScript (strict)                                                    | Required by the brief; Express 5 forwards async errors to the error handler natively    |
| Database    | PostgreSQL 16 + Sequelize 6, `sequelize-cli` migrations                                       | Required by the brief; schema changes are versioned and reversible instead of `sync()`  |
| Validation  | zod (API input, env config, and the frontend forms)                                           | One schema language on both sides; the frontend mirrors the backend rules               |
| Auth        | JWT in an `httpOnly` cookie, bcrypt (cost 12)                                                 | The token is unreachable from JavaScript, which removes the main XSS token-theft vector |
| Security    | helmet (API) and security headers (web), CORS allow-list, auth rate limiting, body size limit | Cheap, standard hardening                                                               |
| Logging     | pino / pino-http                                                                              | Structured logs; cookies and auth headers are redacted                                  |
| Frontend    | Next.js 15 (App Router), React 19, Tailwind CSS 4, lucide-react icons, Manrope font           | Required by the brief                                                                   |
| Data        | TanStack Query v5                                                                             | Caching, request de-duplication, optimistic updates with rollback                       |
| Drag & drop | @dnd-kit/core                                                                                 | Touch, mouse and keyboard sensors and screen-reader announcements out of the box        |
| Forms       | react-hook-form + zod                                                                         | Accessible validation with little re-rendering                                          |
| Tests       | Jest + Supertest (API), Vitest + React Testing Library + MSW (UI)                             | MSW exercises the real `fetch` path instead of mocking the client                       |
| Tooling     | ESLint (strict type-checked) + Prettier, GitHub Actions, Docker Compose                       | One shared lint config, reproducible environments                                       |

## Quick start (Docker)

Requires Docker with Compose v2.

```bash
cp .env.example .env
# Put a random secret of at least 32 characters into JWT_SECRET in .env, for example:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose up --build
```

- App: <http://localhost:3000>
- API: <http://localhost:4000/api/health>

Migrations are applied automatically when the backend container starts. To load the demo user
and sample tasks:

```bash
docker compose exec backend npx sequelize-cli db:seed:all
```

`docker compose up` stops with a clear message if `JWT_SECRET` is missing, so the stack can never start with a
publicly known secret. If a port is already in use on your machine, set `FRONTEND_PORT`, `BACKEND_PORT`
or `POSTGRES_PORT` in `.env`. The stack is served over plain HTTP, so Compose turns off the `Secure` cookie flag
(`COOKIE_SECURE=false`); remove that when you put it behind HTTPS.

## Running locally without Docker

Requires Node.js 20+ and a PostgreSQL 16 server. If you only want the database in a container:
`docker compose up -d postgres` (it creates both the `todo` and `todo_test` databases).

```bash
npm install
cp backend/.env.example backend/.env        # adjust DATABASE_URL if needed
cp frontend/.env.example frontend/.env

npm run db:migrate -w backend               # create the schema
npm run db:seed -w backend                  # optional: demo user + tasks

npm run dev                                 # API on :4000, web on :3000
```

Other database commands: `npm run db:migrate:undo -w backend` reverts the last migration and
`npm run db:seed:undo -w backend` removes the demo data.

## Tests, linting and type checks

```bash
npm test                          # backend + frontend
npm run test:coverage -w backend  # backend with coverage report
npm run lint                      # ESLint, both packages
npm run typecheck                 # tsc --noEmit, both packages
npm run format:check              # Prettier
```

Backend tests are integration tests against a real PostgreSQL database (`todo_test`, configured by
`TEST_DATABASE_URL` in `backend/.env` or the shell, default `postgres://postgres:postgres@localhost:5432/todo_test`). Jest applies
the migrations itself before the run and clears the tables between tests. A few service-layer unit
tests use mocks instead and need no data. CI runs everything on every push and pull request,
with a PostgreSQL service container, and also starts the whole Docker Compose stack and smoke-tests it (health check, sign-up and creating a task).

## Project structure

```
.
├── docker-compose.yml          # postgres, backend, frontend
├── docker/postgres/            # init script creating the test database
├── .github/workflows/ci.yml
├── backend/
│   ├── db/
│   │   ├── migrations/         # sequelize-cli migrations
│   │   └── seeders/            # demo data
│   ├── src/
│   │   ├── config/             # zod-validated env, logger
│   │   ├── db/                 # Sequelize connection
│   │   ├── models/             # User, Task + associations
│   │   ├── middlewares/        # requireAuth, validate, rate limit, error handler
│   │   ├── modules/
│   │   │   ├── auth/           # routes → controller → service (+ schemas, token, cookie)
│   │   │   ├── tasks/          # routes → controller → service (+ schemas, serializer)
│   │   │   └── health/
│   │   ├── utils/              # AppError, asyncHandler
│   │   ├── app.ts              # builds the Express app (no listen, so tests can use it)
│   │   └── server.ts           # listen + graceful shutdown
│   └── tests/                  # integration tests, unit/ for services
└── frontend/
    └── src/
        ├── app/                # routes: (auth)/login, (auth)/register, tasks
        ├── components/         # ui/ (primitives), auth/, tasks/, layout/, providers/
        ├── features/           # React Query hooks and API calls per domain
        ├── lib/                # api-client, query client/keys, zod schemas, helpers
        ├── mocks/              # MSW server for tests
        ├── types/              # API contract types
        └── middleware.ts       # redirects based on the session cookie
```

The backend is layered: **routes → controllers → services → models**. Controllers only translate
HTTP to and from service calls; all business rules live in services.

## API

Base path `/api`. All bodies are JSON. Errors always have the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": {} } }
```

`details` is present for validation errors (`400`), in the form of zod's flattened errors.

### Auth

| Method | Endpoint             | Body                         | Success                      | Errors                                 |
| ------ | -------------------- | ---------------------------- | ---------------------------- | -------------------------------------- |
| POST   | `/api/auth/register` | `{ email, password, name? }` | `201 { user }` + sets cookie | `400` invalid input, `409` email taken |
| POST   | `/api/auth/login`    | `{ email, password }`        | `200 { user }` + sets cookie | `401` wrong credentials                |
| POST   | `/api/auth/logout`   | –                            | `204`, clears cookie         | –                                      |
| GET    | `/api/auth/me`       | –                            | `200 { user }`               | `401` no or invalid session            |

`user` is `{ id, email, name, createdAt }`; the password hash is never returned. Passwords must be
8–72 characters with at least one letter and one digit. Register and login are rate limited
(20 requests per 15 minutes per IP by default → `429`).

### Tasks

All task endpoints require a session. A user only ever sees and changes their own tasks; anyone
else's task behaves as if it did not exist (`404`).

| Method | Endpoint         | Description                               | Success               |
| ------ | ---------------- | ----------------------------------------- | --------------------- |
| GET    | `/api/tasks`     | List with filter, pagination and sorting  | `200 { items, meta }` |
| GET    | `/api/tasks/:id` | Get one task                              | `200 Task`            |
| POST   | `/api/tasks`     | Create `{ title, description?, status? }` | `201 Task`            |
| PATCH  | `/api/tasks/:id` | Partial update (at least one field)       | `200 Task`            |
| DELETE | `/api/tasks/:id` | Delete                                    | `204`                 |

`Task` is `{ id, title, description, status, dueAt, createdAt, updatedAt }` where `title` is 1–200
characters, `description` is `null` or up to 2000 characters, and `status` is `todo`,
`in_progress` or `done` (default `todo`). `dueAt` is `null` or an ISO 8601 moment with a time zone
(`2026-11-05T14:30:00.000Z` or `...+02:00`); a local time without an offset is rejected.

List query parameters: `status` (`todo|in_progress|done`), `page` (default 1), `limit`
(default 20, max 100), `dueFrom` / `dueTo` (inclusive ISO bounds of the due date, used by the calendar),
`sort` (`createdAt|updatedAt|title|status|dueAt`, default `createdAt`; tasks without a due date always come
last when sorting by `dueAt`) and
`order` (`asc|desc`, default `desc`). The response `meta` is `{ page, limit, total, totalPages }`.

### Examples

```bash
API=http://localhost:3000/api   # through the web app's proxy; or http://localhost:4000/api directly

# Sign in and keep the session cookie
curl -c jar.txt -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"Password123!"}'

# Create a scheduled task (the time is stored as an absolute moment)
curl -b jar.txt -X POST $API/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Call the client","dueAt":"2026-11-05T14:30:00+02:00"}'

# Everything due in November, soonest first (this is what the calendar requests)
curl -b jar.txt "$API/tasks?dueFrom=2026-11-01T00:00:00Z&dueTo=2026-11-30T23:59:59Z&sort=dueAt&order=asc"

# Create a task
curl -b jar.txt -X POST $API/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Write the README","description":"Document the API","status":"in_progress"}'

# List the second page of "done" tasks, 5 per page, oldest first
curl -b jar.txt "$API/tasks?status=done&page=2&limit=5&sort=createdAt&order=asc"

# Change the status
curl -b jar.txt -X PATCH $API/tasks/<id> -H 'Content-Type: application/json' -d '{"status":"done"}'

# Delete
curl -b jar.txt -X DELETE $API/tasks/<id>
```

## Architecture decisions and trade-offs

- **`httpOnly` cookie instead of `localStorage`.** A token in `localStorage` can be read by any
  injected script. An `httpOnly`, `SameSite=Lax` (and `Secure` in production) cookie cannot, and
  `SameSite=Lax` also blocks cross-site `POST`/`PATCH`/`DELETE`, which covers CSRF without extra
  tokens. The cost: the browser, not the client code, owns the session. The API also accepts
  `Authorization: Bearer` for scripts and tools. Browsers reject `Secure` cookies on plain HTTP
  (Safari even on `localhost`), so the local Compose stack sets `COOKIE_SECURE=false`; behind HTTPS
  remove it and the flag defaults to on in production.
- **Same-origin API through Next.js rewrites.** The browser only talks to the Next.js origin, which
  proxies `/api/*` to the backend. There is no CORS to configure for the app, and the cookie is
  first-party. The backend URL is read at build time, so it is a build argument in Docker.
- **Migrations, not `sequelize.sync()`.** `sync()` cannot express a change safely on existing data
  and hides drift between environments. Migrations are versioned, reviewable and reversible, and
  the tests run on the migrated schema, so production and tests use the same one.
- **`404` instead of `403` for someone else's task.** It does not reveal whether an id exists.
  Every query in the tasks service is scoped by `userId`, so there is no code path that can
  forget the check.
- **Login errors are indistinguishable.** An unknown email and a wrong password return the same
  response, and a dummy bcrypt comparison keeps the timing alike. Registration does reveal that an
  email is taken (`409`), which is required for a usable sign-up form; the rate limiter bounds
  enumeration.
- **Stateless JWT.** Simple and horizontally scalable, but a token cannot be revoked before it
  expires (7 days by default). See the improvements below.
- **Optimistic updates for status changes and deletes.** The list feels instant; on failure the
  cache snapshot is restored and a toast explains what happened. The cache is always revalidated
  afterwards, so the server stays the source of truth.
- **Filter and page live in the URL.** Reloading, sharing a link and the back button all work, and
  filter chips are real links (Ctrl/Cmd+click opens a new tab).
- **Offset pagination.** Matches the requirements and is easy to reason about. Keyset pagination
  would scale better for very large lists. Ordering has an `id` tiebreaker so pages do not shift
  when sort values repeat.
- **Due dates are absolute moments.** The browser's date picker works in local time, so the form converts
  it to UTC before sending, and every date is shown back in the viewer's own time zone. The server never
  guesses a zone: it rejects timestamps without an offset. The calendar groups tasks by the viewer's local day.
- **One request per calendar month, one per board.** The calendar asks for the six visible weeks and the
  board for the first 100 tasks; both say so on screen when there are more. A dedicated endpoint or
  per-column pagination would remove that limit.
- **@dnd-kit instead of the browser's native drag-and-drop**, which does not work with touch. Only the grip
  handle starts a drag, so the rest of a card still scrolls on a phone. The status select on the list view
  and the edit dialog remain as a plain alternative.
- **Native `<dialog>` for modals.** The browser provides the focus trap, `Esc` handling, an inert
  background and focus restoration; no extra dependency.
- **Rate limiting is in-memory.** Fine for a single instance; with several replicas it needs a
  shared store such as Redis.
- **Express 5 and `asyncHandler`.** Express 5 already forwards rejected promises; the small
  `asyncHandler` wrapper keeps handlers explicit and the typing simple.

## Assumptions

- Each task belongs to exactly one user; there is no sharing or team feature.
- Titles are required; descriptions are optional and an empty description is stored as `null`.
- Emails are compared case-insensitively (stored lowercase) and trimmed.
- One session per cookie lifetime; "log out" clears the cookie on this browser only.
- The UI is English-only; the API uses `in_progress` and the UI shows "In progress".
- Docker Compose is intended for local use and evaluation, not as a production deployment.

## What I would improve with more time

- **Refresh tokens** with rotation and a server-side revocation list (short-lived access tokens).
- **End-to-end tests with Playwright** covering the real browser flows, including the modal focus
  trap that jsdom cannot exercise.
- **OpenAPI / Swagger** generated from the zod schemas, plus typed API client generation so the
  frontend types cannot drift from the contract.
- **i18n** (e.g. `next-intl`) with the status labels and messages extracted.
- **Drag-and-drop to reorder** cards within a column (it needs a stored position), and a drag from the
  calendar to reschedule a task.
- Task search, reminders and labels; keyset pagination; a Redis-backed rate limiter; password reset
  and email verification; request tracing and metrics.

## Design and credits

The interface is mobile-first: it was checked at widths from 320 px to 1440 px with no horizontal
scrolling, touch targets are at least 44 px on phones, dialogs become bottom sheets, the filter chips
scroll sideways, and the main action turns into a floating button within thumb reach. Icons come from
[Lucide](https://lucide.dev) and the typeface is [Manrope](https://fontsource.org/fonts/manrope),
both bundled with the app (no requests to third-party hosts at runtime).

Photos are free to use under the [Unsplash License](https://unsplash.com/license):
[Alejandro Escamilla](https://unsplash.com/photos/LNRyGwIJr5c) (sign-in page),
[Galymzhan Abdugalimov](https://unsplash.com/photos/ICW6QYOcdlg) (sign-up page) and
[Aleksi Tappura](https://unsplash.com/photos/mCg0ZgD7BgU) (task list banner).
