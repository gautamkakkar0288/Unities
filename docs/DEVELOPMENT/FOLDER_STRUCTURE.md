# Folder Structure

```text
app/                  # Routes, layouts, route-level states (loading/error/not-found)
components/
  ui/                 # shadcn/ui primitives (base-nova style)
  layout/             # Shared layout compositions (nav, shell regions)
  providers/          # Client providers (theme, query)
features/             # Feature-based modules (one folder per domain)
hooks/                # Shared React hooks
lib/
  api/                # API client and query hooks
  schemas/            # Shared Zod schemas
  services/           # Business logic (never in components)
  utils.ts            # Generic utilities (cn, etc.)
docs/                 # Source of truth (product, design, engineering)
public/               # Static brand assets
```

## Rules

- Never create unnecessary folders.
- No business logic in `components/` — it belongs in `lib/services/`.
- No shared client state outside `components/providers/` or a dedicated Zustand store.
- Feature folders own their components, hooks, and schemas until something is reused by a second feature — then it moves up.
