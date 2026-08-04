# 09 — Elevation System

## Philosophy
Use subtle elevation only. Shadows should remain soft — never heavy or harsh.

## Elevation Hierarchy (low → high)
1. Base Surface
2. Card
3. Modal
4. Dialog
5. Floating Action
6. Toast

## Rules
- Each elevation level maps to a token-defined shadow value (see `13-Design-Tokens.md`)
- Never stack more elevation than necessary to establish hierarchy
- Higher elevation implies higher interruption — reserve top levels (Dialog, Toast) for necessary interruptions only

## Glassmorphism
Use frosted glass selectively — suitable for navigation bars, search, and floating panels. Do not overuse blur effects.
