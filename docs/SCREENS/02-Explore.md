# Explore Screen Specification

> Version 1.0
> Last Updated: July 2026

---

# Purpose

The Explore screen is Wonderer's discovery engine.

While the Home screen answers:

"What should I look at?"

The Explore screen answers:

"What exists?"

It allows students to browse opportunities without relying on recommendations.

---

# Success Metrics

A successful Explore screen enables users to:

- Discover new events and communities.
- Browse categories effortlessly.
- Filter opportunities quickly.
- Find something relevant within 30 seconds.
- Transition smoothly to Event Details or Community pages.

---

# User Intent

Users typically come to Explore to:

- Browse all events.
- Find hackathons or competitions.
- Look for trips.
- Explore workshops.
- Join communities.
- Discover clubs.
- Search by category.
- Find weekend activities.

Unlike Home, Explore is **user-driven**, not recommendation-driven.

---

# Entry Points

Users arrive from:

- Bottom Navigation
- Home → "See All"
- Category Cards
- Search Results
- Push Notifications
- Deep Links

---

# Exit Points

Users can navigate to:

- Event Details
- Community
- Organizer
- Search
- Saved
- Home

---

# Screen Layout

```
Status Bar

↓

Top App Bar

↓

Search Field

↓

Quick Categories

↓

Filters

↓

Sort Options

↓

Results Feed

↓

Bottom Navigation
```

Everything above the fold should help users narrow down content before scrolling.

---

# Top App Bar

Contains:

- Explore title
- Search shortcut
- Filter button

Behavior:

- Remains sticky while scrolling.
- Filter button opens a Bottom Sheet (mobile) or Side Panel (desktop).

---

# Search

Placeholder:

"Search events, workshops, communities..."

Features:

- Tap opens dedicated Search screen.
- Recent searches.
- Trending searches.
- AI suggestions (future).

---

# Quick Categories

Horizontal scroll chips.

Examples:

- 🎓 Workshops
- 💻 Hackathons
- 🏀 Sports
- ✈️ Trips
- 🎵 Music
- 🎨 Art
- 📷 Photography
- 💼 Career
- 🚀 Startups
- ❤️ Volunteering

Behavior:

- Single tap applies filter.
- Selected chip remains highlighted.
- Multiple filters allowed.

---

# Filter System

Filter options include:

### Time

- Today
- Tomorrow
- This Week
- This Month
- Custom Date

---

### Category

- Technology
- Sports
- Music
- Cultural
- Travel
- Workshops
- Competitions
- Startups
- Fitness

---

### Location

- On Campus
- Nearby
- Online
- Hybrid

---

### Price

- Free
- Paid

---

### Availability

- Open Registration
- Waitlist
- Full

---

### Organizer

- Verified Only
- Clubs
- University
- External

---

# Sort Options

Users may sort by:

- Recommended
- Trending
- Newest
- Closest Date
- Most Popular
- Highest Rated

Default:

Trending

---

# Results Feed

Primary layout:

Vertical list of Event Cards.

Alternative:

Grid on Desktop.

Each card contains:

- Cover image
- Event title
- Organizer
- Date
- Time
- Venue
- Category
- Registration status
- Interested count
- Save button

---

# Infinite Scroll

Content loads continuously.

Trigger:

Load next page at 70–80% scroll depth.

Display skeleton cards while loading.

---

# No Results State

Illustration

Headline:

"No matching events found."

Description:

"Try changing your filters or explore another category."

Primary CTA:

Reset Filters

Secondary CTA:

Browse All Events

---

# Empty Explore State

If there are no events available:

Headline:

"Nothing here yet."

Description:

"New opportunities will appear soon."

CTA:

Explore Communities

---

# Error State

Headline:

"Something went wrong."

Description:

"We couldn't load opportunities."

CTA:

Retry

---

# Offline State

Show cached Explore results.

Display offline banner.

Disable refresh until connection returns.

---

# Bottom Navigation

Persistent.

Current tab:

Explore

---

# Component Mapping

Uses:

- SearchBar
- CategoryChip
- FilterDrawer
- SortDropdown
- EventCard
- Badge
- EmptyState
- SkeletonCard
- BottomNavigation

No screen-specific UI components should be introduced without updating the design system.

---

# Motion

Category Chips:

Scale + color transition

Filter Drawer:

Slide Up

Event Cards:

Fade + Lift

Result Updates:

Crossfade

Page Transition:

200–250 ms

---

# Accessibility

Support:

- Keyboard navigation
- Screen readers
- ARIA labels
- Focus indicators
- WCAG AA contrast
- Reduced motion preference

---

# Responsive Behavior

## Mobile

- Single-column feed
- Bottom sheet filters
- Horizontal category chips

---

## Tablet

- Two-column card grid
- Wider filter panel

---

## Desktop

- Sidebar filters
- Three-column responsive grid
- Sticky filter panel
- Sticky search bar

---

# Performance

- Virtualize long lists if needed.
- Lazy-load images.
- Cache applied filters.
- Debounce search requests.
- Prefetch Event Details on hover (desktop).
- Preserve scroll position when returning from Event Details.

Target:

- First content visible < 2 seconds
- Smooth scrolling at 60 FPS

---

# Developer Notes

- Fetch filters and results independently.
- Keep filters in URL query parameters for shareable links.
- Use Next.js App Router search params.
- Build filter drawer with shadcn/ui Sheet.
- Animate with Motion.
- Use design tokens for spacing, colors, and typography.

---

# Future Enhancements

- AI-powered discovery
- Map View
- Calendar View
- Friend activity overlays
- "Near Me" recommendations
- Campus-specific trending feeds
- Personalized filter presets

---

# Definition of Done

The Explore screen is complete when:

- Filters function correctly.
- Sorting updates results instantly.
- Responsive layouts are verified.
- Loading, empty, offline, and error states exist.
- Accessibility requirements are met.
- Performance targets are achieved.
- Component usage matches the design system.

---

# Final Principle

Explore should feel like walking through a vibrant university campus.

Every scroll should reveal another opportunity to learn, compete, connect, or create a memorable