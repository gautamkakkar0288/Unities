# 10 — Performance

## Target
Lighthouse score **95+** across all key routes.

## Techniques
- Image optimization via `next/image` (always — never unoptimized images)
- Code splitting
- Lazy loading of secondary/below-the-fold sections
- Dynamic imports for heavy/rarely-used components
- Memoization to avoid unnecessary re-renders
- Prefetching for likely next navigations (e.g. next feed page)

## Rule
Never sacrifice performance for a visual effect — this overrides any single animation or decoration decision.
