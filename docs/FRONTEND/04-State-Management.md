# 04 — State Management

## Global State — Zustand
Reserved strictly for:
- Authentication
- Theme
- User
- Notification Count
- Filters

## Server State — TanStack Query
Handles: cache, refetch, retry, pagination, infinite scroll. Never manually manage server state with local `useState`.

## Local State
Everything else (form inputs before submission, UI toggle states, modal open/close) stays as local component state. Avoid unnecessary global state — it should be the exception, not the default.
