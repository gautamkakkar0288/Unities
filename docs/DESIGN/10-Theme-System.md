# 10 — Theme System

## Current Scope
**Light Mode** is the primary and only theme for v1 — designed to feel warm and inviting, not stark white.

## Future Scope
Dark mode is planned as a future addition, not part of MVP.

## Rules for Implementation
- All colors must be defined as design tokens (see `13-Design-Tokens.md`), never hardcoded, so a future dark theme can be layered in without touching component code.
- Theme switching (when introduced) should be managed via a global Zustand store (`store/theme`).
- Respect system-level reduced-motion and contrast preferences regardless of theme.
