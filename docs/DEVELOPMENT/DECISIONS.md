# Engineering Decisions

Locked 2026-08-06. Changes require updating this file.

- **D1 — Canonical repo:** This repository is the product. The `gautamkakkar0288/Cirqles` pnpm monorepo (Express 5 + Drizzle + Orval) is superseded and should be archived.
- **D2 — Backend shape:** Next.js App Router monolith (route handlers + server actions). PostgreSQL via Drizzle lands in Phase 2. Redis introduced only when a measured need exists.
- **D3 — Auth:** Auth.js (next-auth v5) with database-backed user records via the Drizzle adapter. Satisfies server-side role claims per `docs/ENGINEERING/ARCHITECTURE.md`.
- **D4 — Client data:** TanStack Query (server state), React Hook Form + Zod (forms), Zustand (local state only).
- **D5 — Theming:** next-themes, light-first default, dark-ready tokens. Dark toggle ships when the theme system is formalized (Phase 3).
- **D6 — Phase ordering:** The 16-phase delivery order (Foundation → Auth → Design System → Landing → Core Layout → Communities → Posts → Events → Profiles → Search → Messaging → Notifications → Operations Center → AI → Performance → Production) supersedes `ROADMAP.md` numbering.
- **D7 — Package manager:** npm. Lockfile regenerated at the end of Milestone 1.
- **D8 — Session strategy (JWT first):** The Auth.js `Credentials` provider only supports the JWT session strategy, so Phase 2 ships JWT sessions. `ARCHITECTURE.md` asks for server-revocable sessions, which JWTs cannot provide instantly. The `sessions` table is created now, so adopting database sessions once OAuth / magic-link providers land is a configuration change rather than a migration. Mitigation until then: short token lifetimes and role claims re-read on sign-in.
- **D9 — Password hashing:** bcrypt (`bcryptjs`) at cost factor 12, executed server-side only. Passwords are capped at 72 characters in the Zod schema because bcrypt silently truncates beyond that length.
- **D10 — Edge/runtime split:** `auth.config.ts` contains no database or bcrypt imports so `middleware.ts` stays edge-compatible; the full configuration with the Drizzle adapter lives in `auth.ts` and runs only in the Node runtime.
