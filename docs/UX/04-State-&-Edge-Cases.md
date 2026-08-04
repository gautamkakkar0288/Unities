# 04 — State & Edge Cases

## Required States for Every Screen
- **Loading** — skeletons preferred over spinners
- **Empty** — explain why it's empty, guide the user, encourage an action (e.g. "No saved events yet." → "Explore Events")
- **Error** — explain the problem in plain language, offer recovery (e.g. "We couldn't load this event." → "Try Again")
- **Offline** — show cached data where possible, inform the user, disable actions requiring internet

## Key Edge Cases
- Event fills up / registration closes while user is viewing it
- Organizer account gets unverified after publishing events
- User loses connectivity mid-registration
- Community becomes inactive/abandoned by moderator
- Duplicate or spam event submissions

## Principle
Never leave a blank screen. Every state above must be designed and implemented for every screen listed in `SCREENS/`.
