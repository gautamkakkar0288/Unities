# Feedback

## Components
- Toast (success/error/info) — brief, non-blocking
- Inline validation messages
- Skeleton loaders (preferred over spinners per `FRONTEND Bible`)
- Empty state component (illustration + message + action)
- Error state component (message + retry action)

## Rules
- Toasts auto-dismiss but remain screen-reader announced
- Every empty/error state must explain the situation and offer a next action — never a dead end
- Loading skeletons should mirror the actual content layout to avoid layout shift

## Accessibility
- Toasts use `aria-live="polite"` (or `assertive` for errors)
- Retry actions must be keyboard-reachable
