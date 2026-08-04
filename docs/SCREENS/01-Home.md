# Home Screen Specification

> Version 1.0
> Last Updated: July 2026

---

# Purpose

The Home screen is the heart of Wonderer.

Its job is not simply to display events.

Its job is to help students discover meaningful opportunities with the least amount of effort.

Every scroll should increase the chance that a student finds something worth attending.

---

# Success Metrics

A successful Home screen should allow a first-time user to:

- Find an interesting event within 15–30 seconds.
- Register for an event within one minute.
- Understand what Wonderer offers without needing a tutorial.
- Feel excited to keep exploring.

---

# User Intent

When users open Wonderer, they usually want one of the following:

- "What's happening today?"
- "Anything interesting this week?"
- "Any trips or workshops?"
- "Did my community post anything?"
- "Is there something I shouldn't miss?"

The Home screen should answer these questions immediately.

---

# Entry Points

Users arrive from:

- App launch
- Bottom navigation
- Push notification
- Deep link
- Completed onboarding
- Returning from another screen

---

# Exit Points

Users may navigate to:

- Event Details
- Explore
- Search
- Community
- Notifications
- Profile

The Home screen is primarily a discovery hub.

---

# Layout Structure

```
Status Bar

↓

Top Navigation

↓

Search Bar

↓

Trending This Week

↓

Recommended For You

↓

Upcoming Events

↓

Popular Communities

↓

Categories

↓

Suggested Organizers

↓

Bottom Navigation
```

Every section should feel connected while remaining visually distinct.

---

# Top Navigation

Contains:

- Wonderer logo
- Greeting ("Good Evening, Gautam")
- Notification button
- Profile avatar

Behavior:

- Greeting changes with time.
- Notification icon shows unread badge.
- Avatar opens Profile.

---

# Search Bar

Persistent at the top.

Placeholder:

"Search events, communities, workshops..."

Features:

- Voice search (future)
- Tap to open Search screen
- Recent searches
- Trending searches

The search bar should remain accessible without dominating the screen.

---

# Section 1 — Trending This Week

Purpose:

Highlight the most relevant and engaging opportunities.

Presentation:

- Horizontal carousel
- Large hero cards
- Edge-to-edge imagery

Card Contents:

- Cover image
- Event title
- Organizer
- Date
- Time
- Location
- Interested count
- Trending badge

Interaction:

Tap → Event Details

Swipe → Next card

Long press → Save event

---

# Section 2 — Recommended For You

Driven by:

- Interests
- Joined communities
- Previous registrations
- Campus
- Activity

Cards:

Medium-sized vertical cards.

Label:

"Because you joined AI Club"

or

"Based on your interests"

---

# Section 3 — Upcoming Events

Chronological feed.

Filters:

Today

Tomorrow

This Week

This Month

Each event displays:

- Date
- Time
- Capacity
- Registration status
- Distance (future)
- Friends attending (future)

---

# Section 4 — Popular Communities

Horizontal scrolling cards.

Displays:

- Community image
- Member count
- Upcoming event
- Category
- Verification badge

CTA:

Join Community

---

# Section 5 — Browse by Category

Grid layout.

Examples:

Technology

Sports

Music

Travel

Hackathons

Workshops

Competitions

Cultural

Photography

Fitness

Each category opens filtered Explore results.

---

# Section 6 — Featured Organizers

Display:

- Organizer avatar
- Name
- Verified badge
- Upcoming events
- Rating

CTA:

View Profile

---

# Floating Action Button

None.

The Home screen is for discovery, not content creation.

Future organizer mode may introduce one.

---

# Bottom Navigation

Five items:

- Home
- Explore
- Search
- Notifications
- Profile

Home is always highlighted while active.

---

# Component Mapping

Uses:

- HeroCard
- EventCard
- CommunityCard
- OrganizerCard
- SearchBar
- Badge
- Button
- Avatar
- BottomNavigation
- SectionHeader
- SkeletonLoader

No custom components should be introduced unless added to the design system.

---

# Scrolling Behavior

Single vertical scroll.

Horizontal scrolling is allowed only inside carousels.

Scroll position should be restored when returning from another screen.

---

# Motion

Cards:

Fade + Lift

Section appearance:

Staggered fade

Hero carousel:

Smooth snap

Pull-to-refresh:

Elastic animation

Buttons:

100–150ms scale feedback

Navigation:

200–250ms transition

Animations should feel smooth and unobtrusive.

---

# Loading State

Display:

- Skeleton search bar
- Skeleton hero cards
- Skeleton event cards
- Skeleton community cards

Never show a blank screen.

---

# Empty State

Scenario:

No personalized recommendations available.

Display:

Illustration

Headline:

"Let's find your next adventure."

Description:

"Explore events and communities to personalize your experience."

CTA:

Explore Events

---

# Error State

If content fails to load:

Headline:

"Couldn't load your feed."

Description:

"Check your connection or try again."

CTA:

Retry

---

# Offline State

Previously loaded content remains visible.

Banner:

"You're offline. Showing your last updated feed."

Actions requiring the network are disabled gracefully.

---

# Accessibility

- Full keyboard navigation (desktop)
- Screen reader labels
- 44×44 px touch targets
- Semantic landmarks
- WCAG AA contrast
- Reduced motion support
- Focus indicators

---

# Responsive Behavior

## Mobile

- Single-column layout
- Bottom navigation
- Horizontal carousels

## Tablet

- Wider cards
- Two-column sections where appropriate

## Desktop

- Sidebar navigation
- Multi-column content grid
- Sticky search
- Increased whitespace

The experience should feel native to each screen size while preserving familiarity.

---

# Performance

- Lazy-load below-the-fold sections
- Optimize event images
- Prefetch Event Details on hover (desktop)
- Infinite scrolling with pagination
- Cache personalized feed
- Defer non-critical requests

Target:

- First Contentful Paint < 2 seconds
- Smooth scrolling at 60 FPS

---

# Developer Notes

- Implement with Next.js App Router.
- Use server components where possible.
- Fetch independent sections in parallel.
- Use Tailwind design tokens.
- Build with shadcn/ui primitives.
- Use Motion for transitions.
- Use Lucide icons consistently.

---

# Future Enhancements

- Friends Activity
- AI-powered recommendations
- Continue Exploring
- Recently Viewed
- Weather-aware suggestions
- Campus-specific announcements
- Live event indicators

---

# Definition of Done

The Home screen is complete when:

- Every section is implemented.
- Responsive layouts are verified.
- Loading, empty, offline, and error states exist.
- Accessibility passes WCAG AA.
- Performance meets targets.
- Motion follows the design system.
- Component usage matches the design system.

---

# Final Principle

The Home screen should never feel like an endless feed.

It should feel like walking onto a vibrant campus where every scroll reveals another opportunity