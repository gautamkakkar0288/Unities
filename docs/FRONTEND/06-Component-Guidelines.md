# 06 — Component Guidelines

## Every Component Should
- Be reusable
- Accept props (no hardcoded page-specific logic)
- Never contain page-specific business logic
- Be documented
- Support a loading state
- Support a disabled state (where applicable)

## Naming
Good: `EventCard`, `OrganizerCard`, `SearchBar`, `PrimaryButton`, `HeroBanner`
Bad: `Card2`, `ButtonNew`, `ComponentA`

Names must describe purpose, not implementation detail.

## Forms
React Hook Form + Zod for every form. Every form requires: validation, error messages, loading state, success state, disabled state.

## Composition
Prefer composition over new one-off components — check `COMPONENTS/` before creating anything new.
