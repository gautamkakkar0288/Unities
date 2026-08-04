# Navigation

## Components
- Primary Nav (Home, Explore, Search, Notifications, Profile) — bottom tab bar on mobile, sidebar/top nav on larger screens
- Breadcrumb / Back navigation for nested screens (e.g. Event → Organizer)
- Tabs (e.g. within Profile: Activity / Saved / Settings shortcuts)

## Rules
- Always visible/reachable except within focused flows (registration, onboarding) per `UX/02-Navigation-System.md`
- Active state clearly indicated (icon fill/color + label)
- Consistent placement across all screens

## Accessibility
- Keyboard-navigable tab order
- Current page indicated via `aria-current`
