# Engineering Decisions

Locked 2026-08-06. Changes require updating this file.

- **D1 — Canonical repo:** This repository is the product. The `gautamkakkar0288/Cirqles` pnpm monorepo (Express 5 + Drizzle + Orval) is superseded and should be archived.
- **D2 — Backend shape:** Next.js App Router monolith (route handlers + server actions). PostgreSQL via Drizzle lands in Phase 2. Redis introduced only when a measured need exists.
- **D3 — Auth:** Auth.js (next-auth v5) with database-backed user records via the Drizzle adapter. Satisfies server-side role claims per `docs/ENGINEERING/ARCHITECTURE.md`.
- **D4 — Client data:** TanStack Query (server state), React Hook Form + Zod (forms), Zustand (local state only).
- **D5 — Theming:** next-themes, light-first default, dark-ready tokens. Dark toggle ships when the theme system is formalized (Phase 3).
- **D6 — Phase ordering:** The 16-phase delivery order (Foundation → Auth → Design System → Landing → Core Layout → Communities → Posts → Events → Profiles → Search → Messaging → Notifications → Operations Center → AI → Performance → Production) supersedes `ROADMAP.md` numbering.
- **D7 — Package manager:** npm. Lockfile regenerated at the end of Milestone 1.
