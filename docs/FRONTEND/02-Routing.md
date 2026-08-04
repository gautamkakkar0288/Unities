# 02 — Routing

## Approach
Next.js App Router, file-based routing under `app/`.

## Route Map
```
/
/explore
/search
/event/[id]
/community/[id]
/organizer/[id]
/profile
/settings
/saved
/notifications
/login
/signup
```

## Rules
- Every route needs its own `loading`, `error`, and `not-found` handling per App Router conventions.
- Protected routes (profile, settings, saved, organizer dashboard) require an authenticated session — redirect to `/login` otherwise.
- Prefer Server Components for route-level data fetching where possible.
