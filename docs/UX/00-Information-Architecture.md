# Wonderer Information Architecture

> Version 1.0
> Last Updated: July 2026

---

# Purpose

This document defines the complete structure of Wonderer.

It answers one question:

> "Where can a user go from here?"

Every screen, navigation path, and feature should originate from this architecture.

---

# Product Hierarchy

```
Wonderer
│
├── Authentication
│   ├── Welcome
│   ├── Sign Up
│   ├── Login
│   ├── Forgot Password
│   ├── OTP Verification
│   └── Onboarding
│
├── Home
│   ├── Trending This Week
│   ├── Recommended For You
│   ├── Upcoming Events
│   ├── Friends Activity (Future)
│   ├── Popular Communities
│   ├── Categories
│   └── Featured Organizers
│
├── Explore
│   ├── Events
│   ├── Communities
│   ├── Trips
│   ├── Workshops
│   ├── Competitions
│   ├── Sports
│   ├── Cultural
│   ├── Tech
│   ├── Music
│   └── All Categories
│
├── Search
│   ├── Recent Searches
│   ├── Trending Searches
│   ├── Events
│   ├── Communities
│   ├── Organizers
│   └── Tags
│
├── Event
│   ├── Gallery
│   ├── Description
│   ├── Schedule
│   ├── Venue
│   ├── Organizer
│   ├── Reviews
│   ├── Participants
│   ├── Similar Events
│   └── Registration
│
├── Community
│   ├── Feed
│   ├── Events
│   ├── Members
│   ├── About
│   ├── Announcements
│   └── Media
│
├── Organizer
│   ├── Profile
│   ├── Upcoming Events
│   ├── Past Events
│   ├── Reviews
│   └── Verification
│
├── Notifications
│   ├── Activity
│   ├── Event Updates
│   ├── Community Updates
│   ├── Registration
│   └── Announcements
│
├── Saved
│   ├── Saved Events
│   ├── Saved Communities
│   └── Saved Organizers
│
├── Profile
│   ├── Personal Info
│   ├── Interests
│   ├── Joined Communities
│   ├── Registered Events
│   ├── Badges
│   ├── Activity
│   └── Settings
│
├── Settings
│   ├── Account
│   ├── Notifications
│   ├── Privacy
│   ├── Appearance
│   ├── Security
│   ├── Help
│   └── About
│
└── Organizer Dashboard (Future)
    ├── Analytics
    ├── Create Event
    ├── Manage Events
    ├── Registrations
    ├── Community
    └── Payments
```

---

# Primary Navigation

The primary navigation should never exceed five items.

## Mobile

```
Home

Explore

Search

Notifications

Profile
```

Communities, Saved, and other destinations should be accessible through the primary screens rather than occupying permanent navigation slots.

---

# Desktop Navigation

Desktop uses a persistent sidebar.

```
Home

Explore

Search

Notifications

Saved

Communities

Profile
```

A top bar contains:

- Global Search
- Quick Actions
- Notification Indicator
- User Menu

---

# User Journey Levels

The platform is organized into four levels.

```
Level 1

Navigation

↓

Level 2

Discovery

↓

Level 3

Decision

↓

Level 4

Action
```

Example:

```
Explore

↓

AI Workshop

↓

Event Details

↓

Register
```

---

# Discovery Flow

A user should be able to discover opportunities through multiple paths.

Examples:

Home Feed

↓

Trending Event

↓

Event Details

↓

Register

or

Community

↓

Upcoming Event

↓

Register

or

Search

↓

Results

↓

Event

↓

Register

---

# Content Relationships

Events belong to:

- Communities
- Organizers
- Categories

Communities contain:

- Events
- Posts
- Members
- Announcements

Organizers own:

- Events
- Communities (optional)
- Reviews
- Verification

Users interact with:

- Events
- Communities
- Organizers
- Notifications

---

# Information Hierarchy

Every page should answer:

1. What am I looking at?
2. Why should I care?
3. What can I do next?

This sequence should be visually obvious.

---

# Search Architecture

Search should support:

- Events
- Communities
- Organizers
- Categories
- Tags

Future:

- Students
- Clubs
- Opportunities

---

# Notifications

Grouped into:

```
Today

Yesterday

Earlier
```

Types:

- Registration
- Reminder
- Community
- Organizer
- System

---

# Future Expansion

The architecture is designed to support future modules without restructuring the navigation.

Potential additions include:

- Campus Marketplace
- Student Clubs
- Team Finder
- Internship Hub
- Mentorship
- Lost & Found
- Campus Map
- Chat
- AI Assistant
- Ticket Wallet

---

# Design Rules

- No screen should be more than three taps away from the Home screen.
- Users should always know where they are.
- Every page must have a clear primary action.
- Navigation should remain consistent across the application.
- New features should extend the existing architecture instead of creating parallel navigation paths.

---

# Success Criteria

A first-time user should be able to:

- Discover an event within 30 seconds.
- Register for an event in under one minute.
- Find any major section in two taps or fewer.
- Understand the app's structure without needing a tutorial.

---

# Final Principle

Information architecture should feel invisible.

Users shouldn't think about navigating Wonderer—they should simply move through it naturally, wi