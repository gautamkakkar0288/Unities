# 03 — Data Fetching

## Principles
- Prefer Server Components whenever possible for initial data.
- Use Client Components only when interactivity requires it.
- Prefetch data where possible (e.g. next page of an infinite-scroll feed).
- Lazy-load secondary sections that aren't immediately visible.

## Layering
Component → Hook (`hooks/`) → Service (`services/`) → API

Never call `fetch` directly inside a component.

## Server State
All client-side server state (mutations, caching, pagination) is managed by **TanStack Query** — never manual `useState`/`useEffect` data fetching.
