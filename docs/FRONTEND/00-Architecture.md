# 00 — Architecture (Frontend Constitution)

> This is the master reference document — the "constitution" of the frontend, per the Frontend Bible.

## Why Next.js App Router
Enables Server Components by default, file-based routing, and streaming — well suited to a content-heavy discovery app where most views are read-heavy and benefit from server rendering.

## Server vs Client Components
- Default to **Server Components** wherever possible (feeds, event details, static content).
- Use **Client Components** only when interactivity is required (forms, save/like buttons, filters, animations).

## Data Fetching
- Server Components fetch data directly where possible.
- Client-side server state (mutations, pagination, refetching) goes through **TanStack Query**.
- Never fetch inside UI components — always Component → Hook → Service → API.

## State Management
- **Zustand** only for global concerns: Authentication, Theme, User, Notification Count, Filters.
- Everything else stays local component state.

## Authentication
JWT / Clerk / NextAuth (decided by backend). Flow: Login → Token → Protected Routes → Refresh → Logout. Never expose protected pages without a valid session.

## Feature Organization
Business logic is grouped by feature under `features/` (events, communities, profile, search, notifications), not scattered across generic folders.

## components/ vs features/
- `components/` = pure, reusable, presentational UI (Button, Card, Modal)
- `features/` = business logic and feature-specific composition of those components

## Preventing Inconsistency at Scale
- All styling references design tokens (never hardcoded values)
- All API calls go through `services/`
- All shared types live in `types/`
- Code review checks against `AI/Code-Review-Prompt.md` before merge
