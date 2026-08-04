# 11 — Accessibility

## Non-Negotiable Requirement
Accessibility is mandatory across every screen and component, not optional.

## Required Support
- Keyboard navigation
- Screen reader support
- Visible focus indicators
- Sufficient color contrast
- Large touch targets
- Reduced motion support (respect `prefers-reduced-motion`)

## Design-Level Rules
- Never rely on color alone to communicate state (pair with icon/label)
- Ensure text contrast meets WCAG AA at minimum
- Touch targets should be comfortably tappable on mobile (min ~44x44px)
- Every interactive element needs a clear, visible focus state

## Process
Accessibility should be checked at design review and again at code review (see `AI/Design-Review-Prompt.md` and `AI/Code-Review-Prompt.md`).
