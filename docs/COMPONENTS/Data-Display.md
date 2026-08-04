# Data Display

## Components
- Lists (events, notifications, search results) with infinite scroll
- Tables (Admin screen, using TanStack Table — see `FRONTEND Bible`)
- Badges (Verified, Category tags)
- Avatars
- Progress/rating indicators (organizer ratings)

## Rules
- Use virtualization for long lists where needed (event feed)
- Badges use token colors only, never ad-hoc colors
- Tables must support loading/empty/error states like any other screen

## Accessibility
- Tables need proper header/row semantics
- Badges conveying status must not rely on color alone (include text/icon)
