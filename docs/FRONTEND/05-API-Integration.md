# 05 — API Integration

## Layering Rule
Component → Hook → Service → API. Components never call `fetch` directly — this keeps components clean, testable, and keeps API logic centralized in `services/`.

## Services
Each feature domain (events, communities, organizers, notifications, auth) has a corresponding service module encapsulating its API calls.

## Error Handling
Every API request must support: Loading, Error, Retry, and Offline handling. Never leave a blank page — see `UX/04-State-&-Edge-Cases.md`.

## Authentication
Attach auth tokens at the service layer; handle token refresh centrally rather than per-call.
