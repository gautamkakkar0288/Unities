# 12 — Responsive System

## Approach
**Mobile-first.** Design and build for mobile first, then adapt upward.

## Breakpoints to Support
- Mobile
- Tablet
- Laptop
- Desktop
- Large Desktop

## Rules
- Layouts must adapt naturally — never simply scale up a mobile layout or hide important features on larger screens.
- Navigation and primary actions must remain accessible at every breakpoint.
- Test every screen across all breakpoints before considering it complete.

## Implementation Notes
Use Tailwind's responsive utility classes consistently; avoid one-off custom media queries where a token-based breakpoint will do.
