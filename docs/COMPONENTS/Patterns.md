# Patterns

## Composite Patterns
- **Discovery Feed Pattern** — infinite-scroll card grid/list with skeleton loading and prefetch (Home, Explore, Search results)
- **Detail + CTA Pattern** — hero content + single primary CTA (Event, Organizer, Community screens)
- **Form + Confirmation Pattern** — multi-step form ending in a clear success state (Registration, Create Event)
- **Empty/Error/Loading Pattern** — every screen implements all three consistently (see `UX/04-State-&-Edge-Cases.md`)

## Principle
Prefer composition of existing components (`Buttons`, `Inputs`, `Cards`, `Feedback`, `Overlays`) over inventing new one-off patterns. If a new pattern is needed twice, document it here.
