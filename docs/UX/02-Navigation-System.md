# Wonderer Navigation System

> Version 1.0
> Last Updated: July 2026

---

# Purpose

The navigation system defines how users move throughout Wonderer.

Navigation should feel invisible.

Users should never stop and think:

> "Where do I go now?"

Instead, every action should naturally lead to the next one.

---

# Navigation Principles

Navigation should always be:

- Predictable
- Consistent
- Fast
- Discoverable
- Accessible
- Context-aware

---

# Primary Navigation

## Mobile

Wonderer uses a persistent bottom navigation.

```
🏠 Home

🔍 Explore

⌕ Search

🔔 Notifications

👤 Profile
```

Maximum items: **5**

No hidden tabs.

No horizontal scrolling.

No nested bottom navigation.

---

# Why These Five?

## Home

Starting point.

Discovery.

Personalized feed.

---

## Explore

Browse opportunities intentionally.

Categories.

Filters.

Trending.

---

## Search

Direct access.

Users who know exactly what they want.

---

## Notifications

Keeps users engaged.

Registrations.

Announcements.

Reminders.

Community activity.

---

## Profile

Personal space.

Settings.

Saved activity.

Joined communities.

Registered events.

---

# Desktop Navigation

Desktop uses two navigation areas.

## Sidebar

```
Home

Explore

Communities

Saved

Profile
```

---

## Top Navigation

Contains:

Global Search

Notifications

Quick Actions (future)

Profile Menu

---

# Navigation Hierarchy

```
Level 1

Bottom Navigation

↓

Level 2

Feature Pages

↓

Level 3

Detail Pages

↓

Level 4

Actions
```

Example

```
Explore

↓

AI Workshop

↓

Register

↓

Confirmation
```

---

# Detail Pages

Detail pages never appear inside navigation.

Examples:

- Event
- Community
- Organizer
- Registration
- Settings

They are destination pages.

---

# Back Navigation

Back should always return to the previous screen.

Never redirect unexpectedly.

Examples

Home

↓

Explore

↓

Event

↓

Back

↓

Explore

NOT Home

---

# Deep Linking

Every important page should have a shareable URL.

Examples

```
/events/:id

/community/:id

/organizer/:id

/profile/:username
```

Push notifications should always open the correct destination.

---

# Navigation Persistence

Bottom navigation remains visible on:

- Home
- Explore
- Search
- Notifications
- Profile

Hide on immersive screens:

- Authentication
- Onboarding
- Registration Flow
- Fullscreen Media

---

# Search Navigation

Search behaves like a dedicated destination.

Opening Search:

```
Current Screen

↓

Search

↓

Results

↓

Event

↓

Back

↓

Search Results
```

Search history should remain until dismissed.

---

# Breadcrumbs

Mobile

Not required.

Desktop

Optional on deep pages.

Example

```
Home

>

Explore

>

Hackathons

>

Hackathon Details
```

---

# Tabs

Tabs are used only within pages.

Examples

Community

```
Feed

Events

Members

Media

About
```

Organizer

```
Upcoming

Past

Reviews
```

Never use tabs as global navigation.

---

# Drawers

Use drawers for:

- Filters
- Sorting
- Quick settings

Avoid placing core navigation inside drawers.

---

# Contextual Navigation

Every screen should suggest logical next steps.

Example

Event Page

↓

Organizer

↓

Upcoming Events

↓

Community

↓

Related Events

Users should naturally continue exploring.

---

# Notification Routing

Every notification opens the exact destination.

Examples

Registration Reminder

↓

Event Details

Community Announcement

↓

Community Feed

Organizer Update

↓

Organizer Profile

No notification should land on the Home screen unless necessary.

---

# Empty Navigation States

When no content exists:

Guide users to meaningful destinations.

Examples

"No saved events."

↓

Explore Events

"No joined communities."

↓

Discover Communities

---

# Accessibility

Navigation must support:

- Keyboard navigation
- Screen readers
- Visible focus states
- 44×44 px touch targets
- ARIA labels
- High contrast

---

# Motion

Bottom Navigation

100 ms

Page Transition

200–250 ms

Drawer

Slide

Dialog

Fade + Scale

Search

Expand smoothly

Motion should communicate direction.

---

# Performance

Navigation should feel instant.

Goals

Navigation latency

<100 ms

Back Navigation

Immediate

Prefetch likely destinations.

Preserve scroll position whenever appropriate.

---

# Developer Guidelines

Use the Next.js App Router.

- Layouts should persist between navigation.
- Bottom navigation should remain mounted across primary screens.
- Prefetch primary routes.
- Preserve client state where appropriate.
- Use shallow routing when possible.
- Avoid full page reloads.

---

# Analytics

Track:

- Navigation source
- Navigation destination
- Time on screen
- Back navigation frequency
- Search entry rate
- Deep link opens

Use analytics to identify confusing navigation paths.

---

# Future Expansion

The navigation system should support future modules without restructuring.

Examples:

- Marketplace
- Mentorship
- AI Assistant
- Campus Map
- Ticket Wallet
- Student Groups
- Team Finder

These should integrate into existing navigation rather than adding new primary tabs.

---

# Final Principle

Navigation should disappear into the background.

The user should think about discovering opportunities—not about finding their way through the app.