# Event Details Screen Specification

> Version 1.0
> Last Updated: July 2026

---

# Purpose

The Event Details screen helps users make an informed decision about attending an event.

It should answer every important question before the user has to ask it.

By the time a user reaches the bottom of the page, they should feel confident enough to either:

- Register
- Save for later
- Share with friends

---

# Success Metrics

A successful Event screen enables users to:

- Understand the event within 20 seconds.
- Register within 60 seconds.
- Save or share if not ready to register.
- Trust the organizer and event information.

---

# User Intent

Users typically want answers to:

- What is this event?
- Should I attend?
- Who is organizing it?
- When and where is it?
- Is it worth my time?
- Is registration still open?
- Are my friends going?

The screen should answer these naturally without forcing excessive scrolling.

---

# Entry Points

Users arrive from:

- Home
- Explore
- Search
- Community
- Notifications
- Shared Links
- Organizer Profile
- Deep Links

---

# Exit Points

Users can navigate to:

- Registration
- Organizer Profile
- Community
- Similar Events
- Home
- Explore

---

# Screen Structure

```
Hero Banner

↓

Floating Header

↓

Event Summary

↓

Primary CTA

↓

About Event

↓

Schedule

↓

Venue

↓

Organizer

↓

Gallery

↓

Reviews

↓

Similar Events

↓

Sticky Register Button
```

---

# Hero Banner

Large immersive image.

Shows:

- Event cover
- Gradient overlay
- Event category
- Save button
- Share button

Parallax scrolling (optional).

---

# Floating Header

Appears after scrolling.

Contains:

- Back
- Event Title
- Save
- Share

---

# Event Summary

Displays:

- Event Title
- Category
- Date
- Time
- Venue
- Price
- Capacity
- Registration Status

Badges:

- Trending
- Verified
- Limited Seats
- Free
- Paid

---

# Primary CTA

Large prominent button.

Possible states:

Register Now

Join Waitlist

Registration Closed

Already Registered

The CTA remains sticky at the bottom while scrolling.

---

# About Event

Contains:

- Description
- Highlights
- Learning Outcomes
- Eligibility
- Things to Bring
- FAQs (optional)

Use expandable sections for long descriptions.

---

# Schedule

Timeline format.

Example:

09:00 AM — Check-in

10:00 AM — Opening Ceremony

11:00 AM — Workshop

01:00 PM — Lunch

03:00 PM — Networking

---

# Venue

Display:

- Building
- Room
- Address
- Map Preview
- Directions (future)

For online events:

- Platform
- Meeting link (after registration)

---

# Organizer

Shows:

- Logo / Avatar
- Name
- Verified Badge
- Rating
- Followers
- Upcoming Events

CTA:

View Organizer

---

# Community

If linked to a community:

Display:

- Community Banner
- Member Count
- Upcoming Activities

CTA:

View Community

---

# Participants

Display:

- Attendee avatars (limited)
- Number registered
- Capacity indicator

Future:

- Friends attending
- Team members

---

# Gallery

Horizontal image carousel.

Supports:

- Photos
- Posters
- Videos (future)

---

# Reviews

Display:

- Average rating
- Recent reviews
- Organizer responses (future)

CTA:

View All Reviews

---

# Similar Events

Recommendation engine.

Based on:

- Category
- Organizer
- Interests
- Campus

Horizontal cards.

---

# Sticky Register Button

Always visible.

Shows:

- Price
- Registration state
- Countdown (if applicable)

Never hide the primary action.

---

# Registration States

## Open

Green badge.

CTA:

Register Now

---

## Few Seats Left

Orange badge.

CTA:

Register Now

Capacity indicator visible.

---

## Waitlist

Yellow badge.

CTA:

Join Waitlist

---

## Closed

Red badge.

CTA disabled.

Offer Similar Events.

---

## Already Registered

Success state.

CTA:

View Ticket

---

# Save Event

Heart icon.

Tap:

Save.

Tap again:

Remove.

Should animate smoothly.

---

# Share Event

Native share sheet.

Options:

- WhatsApp
- Instagram
- Copy Link
- More...

---

# Loading State

Skeletons for:

- Hero
- Summary
- Organizer
- Gallery
- Reviews

Images lazy-load.

---

# Empty States

If no reviews:

"Be the first to review this event."

If no gallery:

Display cover image only.

If no similar events:

Suggest categories.

---

# Error State

Headline:

"Couldn't load event."

CTA:

Retry

---

# Offline State

Show cached event information.

Disable registration.

Display offline banner.

---

# Motion

Hero image:

Parallax

CTA:

Scale feedback

Gallery:

Snap scrolling

Sections:

Fade + Slide

Page transition:

250 ms

---

# Accessibility

Support:

- Screen readers
- Keyboard navigation
- Focus indicators
- Semantic headings
- High contrast
- Reduced motion

---

# Responsive Behavior

## Mobile

Single-column

Sticky bottom CTA

Large touch targets

---

## Tablet

Two-column content

Sticky side summary

---

## Desktop

Hero banner

Right-side registration panel

Sticky sidebar

Gallery grid

---

# Performance

- Lazy-load gallery.
- Cache event data.
- Optimize hero image.
- Prefetch registration screen.
- Defer reviews until visible.

Target:

Largest Contentful Paint < 2.5 s

---

# Component Mapping

Uses:

- HeroBanner
- Badge
- EventSummary
- Timeline
- OrganizerCard
- CommunityCard
- Gallery
- ReviewCard
- EventCard
- StickyCTA
- ShareButton
- SaveButton

---

# Developer Notes

- Fetch event, organizer, reviews, and recommendations independently.
- Keep registration status live.
- Handle sold-out state without reloads.
- Support deep linking.
- Use Motion for transitions.
- Build with shadcn/ui components and Tailwind design tokens.

---

# Future Enhancements

- Live attendee count
- Event chat
- QR ticket
- Calendar sync
- AI event summary
- Friend attendance
- Live updates during event

---

# Definition of Done

The Event screen is complete when:

- Registration states work correctly.
- Sticky CTA behaves consistently.
- Hero media is optimized.
- Loading, empty, offline, and error states exist.
- Accessibility meets WCAG AA.
- Responsive layouts are complete.
- Performance targets are met.

---

# Final Principle

The Event Details screen should replace uncertainty with confidence.

A user should never leave wondering:

"What exactly am I signing up for?"

Instead, they should feel informed, excited, and ready to participate.