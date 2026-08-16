# Cirqles

The place where every student discovers the opportunities, communities, events,
and activities happening around them.

Launching at **Chitkara University**, built so that a second campus is a row in
a table rather than a rewrite.

---

## Current status

Cirqles has a **working MVP: communities, verification, and events**. A student
can sign up, verify their university email, onboard, join communities, have their
club verified as an organiser, create and publish events, and register for them.
All of this runs against PostgreSQL with real migrations.

This table is the honest state of the project. A phase is only complete when
database, service, authorization, UI, validation, error handling, tests, and a
real end-to-end flow all work.

| Phase                                     | Status      | What actually exists                                                                                                    |
| ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation                            | ✅ Complete  | One branch on `main`, committed migrations, reproducible install, create chooser, proxy convention, README               |
| 1 — Onboarding, communities, profile      | ✅ Complete  | Onboarding, directory, community detail, join/leave, proposals, moderator queue, profile — all on real data              |
| 2 — University and organiser verification | ✅ Complete  | University email verification (console transport), organiser verification request/review/audit, role promotion           |
| 3 — Events and registration               | ✅ Complete  | Event schema, discovery, detail, creation, registration, capacity, waitlist, auto-promotion, organiser management        |
| 4 — Engagement (home, posts, reminders)   | Not started | Home renders static placeholder content                                                                                 |
| 5 — Activities, search, moderation        | Not started | Domain types only                                                                                                       |
| 6 — Launch hardening                      | Not started | —                                                                                                                       |

What is genuinely working today, end to end:

- Sign-up and sign-in with Auth.js credentials, hashed passwords, roles on the session
- University email verification with a console transport (dev-only; SMTP not yet configured)
- Route protection, plus a server-side session guard in the app shell
- Onboarding: a new account is redirected into it and cannot skip it
- The communities directory, with scope filtering and search
- Community detail pages, including guidelines and who runs the community
- Joining and leaving, including request-to-join and the last-owner rule
- Proposing a community, with duplicate detection before submission
- The moderator queue for approving or declining join requests
- Profile: display name, interests, and the communities you belong to
- **Organiser verification**: submit evidence → admin review → approve/reject → role promotion, with full audit log
- **Events**: create, publish, discover, open event detail, register, capacity enforcement, waitlist, auto-promotion on cancellation
- Organiser event management: cancel event, view registration list (names only, not emails)
- A seed that populates Chitkara, the Tricity places, 17 interests, and their communities
- An interactive prototype of all 16 screens, on fixture data, at `/prototype`

### Migration history

| File | Covers |
| --- | --- |
| `drizzle/0000_certain_living_lightning.sql` | All Phase 0–1 tables (users, communities, memberships, interests, proposals, places) |
| `drizzle/0001_unusual_midnight.sql` | Phase 2.3: `verification_requests`, `audit_log` |
| `drizzle/0002_tired_speed_demon.sql` | Phase 3.1: `events`, `event_registrations` |

What is **not** working, despite appearing to exist:

- Home, Explore, Notifications, Saved, and Search are placeholder screens.
- Production email (SMTP) is not configured; verification emails only print to the console.
- Event editing is not implemented (organiser can cancel, but not edit after publish).
- Avatars are read, never uploaded; there is no file storage.
- Browser end-to-end validation requires a running Postgres instance with migrations applied.


---

## Tech stack

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack), React 19                |
| Language   | TypeScript, strict                                          |
| Database   | PostgreSQL via Drizzle ORM (`postgres` driver)              |
| Auth       | Auth.js v5 (next-auth beta) with the Drizzle adapter        |
| Validation | Zod                                                         |
| Styling    | Tailwind CSS v4 with design tokens, Base UI primitives      |
| Forms      | React Hook Form with the Zod resolver                       |
| Testing    | Vitest, Testing Library, real Postgres for the db suites    |
| CI         | GitHub Actions — a single verification matrix per pull request |

---

## Architecture

One rule, applied everywhere:

```
UI  →  Server Action  →  Service  →  Database  →  UI refresh
```

```
app/
  (marketing)/     public site
  (auth)/          sign-in, sign-up
  (app)/           authenticated shell — home, explore, communities, create, profile
  (prototype)/     fixture-data prototype, development only
  design/          design-system gallery, development only
  api/             Auth.js route handler
components/ui/     design-system primitives
features/          feature slices: components + server actions
lib/
  db/schema/       Drizzle tables (barrel re-exported by index.ts)
  db/seed.ts       Chitkara, places, interests, communities
  domain/          pure business rules, no I/O, heavily unit tested
  schemas/         Zod input schemas shared by actions and services
  services/        authorization + persistence, returns ServiceResult
proxy.ts           route protection (Next 16 replacement for middleware.ts)
auth.ts            full Auth.js config; auth.config.ts is the edge-safe half
```

The boundaries that matter:

- **Business rules live in `lib/domain`**, never in a component. A rule in a
  React component is a rule the server does not enforce.
- **Authorization lives inside services**, not in the caller. A service is
  responsible for refusing. The moderator queue is the clearest example: the
  page asks for the list and renders the refusal, it does not decide who may
  look.
- **Services return `ServiceResult`** rather than throwing; the UI renders the
  failure instead of showing a blank page. Server actions used by client
  components return `ServiceFailure | void`, because a server-rendered screen
  shows success by re-rendering.
- **Components never query the database directly.**
- **Services project, they do not return rows.** A server component serialises
  whatever it is handed, so `select *` on `users` is how a password hash ends up
  in a page payload.

---

## Local setup

Requires Node 22+ and PostgreSQL 16+.

```bash
git clone https://github.com/gautamkakkar0288/Unities.git
cd Unities
npm install
cp .env.example .env.local
```

Generate an auth secret and put it in `.env.local`:

```bash
npx auth secret
```

Then create the database and start the app:

```bash
createdb cirqles
npm run db:migrate
npm run db:seed
npm run dev
```

### A note on `.npmrc`

`.npmrc` sets `legacy-peer-deps=true`. This is not hiding a real
incompatibility: `next-auth@5.0.0-beta.29` declares a peer range of
`next@^14 || ^15`, the project runs `next@16`, and npm v7+ treats that as a hard
install failure. The beta works with Next 16 — CI builds, typechecks, and runs
the suite against it — so the stale peer declaration is the thing that is wrong,
not the dependency. Pinning Next back to 15 to satisfy a beta's metadata would
be the more destructive fix.

Remove the flag once next-auth ships a peer range that admits Next 16.

---

## Environment variables

| Variable              | Required        | Purpose                                                                        |
| --------------------- | --------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`        | yes             | PostgreSQL connection string                                                     |
| `AUTH_SECRET`         | yes             | Auth.js JWT/session signing — `npx auth secret`                                  |
| `NEXT_PUBLIC_APP_URL` | recommended     | Absolute URLs for links and OG tags                                              |
| `TEST_DATABASE_URL`   | for db tests    | Separate database for integration tests; when unset those suites skip themselves |
| `ENABLE_PROTOTYPE`    | no              | Exposes `/prototype` and `/design`. On in development, off in production          |

Never point `TEST_DATABASE_URL` at a database you care about — the suites
truncate tables.

---

## Commands

```bash
# development
npm run dev              # start the dev server
npm run build            # production build
npm run start            # serve the production build

# quality gates — all four must pass before a pull request is ready
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm run test             # vitest run
npm run build

npm run test:watch       # vitest in watch mode
npm run format           # prettier --write .
npm run format:check     # prettier --check .

# database
npm run db:generate      # diff the schema and write a migration into drizzle/
npm run db:migrate       # apply committed migrations — this is how databases change
npm run db:seed          # Chitkara, Tricity, 17 interests, their communities
npm run db:studio        # Drizzle Studio
npm run db:push          # dev-only shortcut; never used against staging or production
```

### Migrations

Migrations are committed SQL under `drizzle/`, generated by drizzle-kit and
applied with `db:migrate`. `db:push` mutates a database to match the schema
without leaving a record of how, which makes it useless for a deployment you
need to reproduce or roll back. It stays available for throwaway local work
only.

Changing the schema:

1. Edit the table in `lib/db/schema/` and export it from `lib/db/schema/index.ts`.
2. `npm run db:generate` — review the SQL it produces before committing it.
3. `npm run db:migrate` against a local database.
4. `npm run db:seed`, then `npm run test`.
5. Commit the schema change **and** the generated files in `drizzle/` together.

`drizzle.config.ts` points `schema` at the barrel **file**, not the directory.
Given a directory, drizzle-kit silently matches nothing, builds an empty model,
and reports success while writing no migration.

---

## Testing

```bash
npm run test                                    # pure suites; db suites skip
TEST_DATABASE_URL=postgres://... npm run test   # everything, including db suites
```

Domain and schema logic is unit tested with no I/O. Service behaviour that
depends on transactions, unique constraints, or count arithmetic is tested
against a real PostgreSQL instance — a mock cannot be wrong about a unique
constraint, which is precisely the thing worth testing. The same reasoning
applies to authorization: `lib/services/pending-requests.db.test.ts` asks the
real database who moderates, because that answer is the only thing keeping a
private queue private.

Component tests cover the states a screen can be in - loading, empty, submitted,
and each way a service can refuse - since a form that cannot show a failure is a
form that lies.

---

## Development workflow

Every feature, in order:

1. Read the existing domain rules, schema, services, and decisions first.
2. Schema → migration → seed, if the database needs to change.
3. Business rules into `lib/domain` or `lib/services`.
4. Tests for the service, before any UI depends on it.
5. Server action wiring the UI to the service.
6. UI with the existing design-system primitives.
7. Every state handled: loading, empty, success, validation error, authorization
   error, server error.
8. `typecheck`, `lint`, `test`, `build` — then click through the flow yourself.

A feature is not done because a component renders. It is done when a real user
action reaches the database and comes back.

**Read the file before you write it.** Several components take optional props
that exist because a caller elsewhere needs them - the interest picker is used by
both onboarding and the profile, and the community card is used by five
prototype screens. Replacing one of these with a fresh version compiles locally
and breaks a screen you never opened.

## Branches and pull requests

- Branch from `main` as `phase-N/short-description`.
- One phase or one vertical slice per pull request. Do not stack seven branches
  on each other — this repository already learned that lesson.
- CI runs the whole verification matrix on every pull request and posts the
  result as a comment, including the SQL any migration step generated.
- Do not merge on red. Do not describe a feature as complete when only its UI
  exists.

---

## Documentation

- `PRD.md` — product requirements
- `DESIGN_SYSTEM.md` — tokens, primitives, usage
- `docs/` — UX, engineering, and the numbered decision log (D1…D37); the log is
  the reason things are the way they are, and is worth reading before changing
  a model
