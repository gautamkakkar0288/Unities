# 13 — Design Tokens

## Purpose
This is the single source of truth for raw design values — color, typography, spacing, radius, shadow, and motion — referenced by every other design and frontend document instead of hardcoded values.

## Token Categories
- **Color** — semantic tokens (primary, success, error, warning, info, surface, text) mapped to raw values
- **Typography** — font family, size scale, weight scale, line-height scale
- **Spacing** — consistent numeric scale (e.g. 4px base unit)
- **Radius** — consistent corner-rounding scale for cards, buttons, inputs
- **Shadow/Elevation** — mapped to the levels in `09-Elevation-System.md`
- **Motion** — standard durations (150–300ms) and easing curves

## Rules
- Never invent a new color, spacing value, or type size outside this token set.
- All components (`COMPONENTS/`) and frontend styling (`FRONTEND/07-Styling.md`) must reference tokens, never hardcode raw values.
- Tokens should be implemented as Tailwind theme extensions so they're enforced at the tooling level.

> Exact numeric/hex token values should be appended here once finalized by design.
