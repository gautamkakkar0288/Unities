# Application Architecture

> This document defines the high-level architecture of Wonderer, including navigation, user roles, entity relationships, permissions, and information architecture.

---

# Platform

Wonderer v1 is a **Progressive Web Application (PWA)** built with Next.js.

## Goals

- Mobile-first
- Desktop responsive
- SEO optimized
- Fast loading
- Installable on supported devices
- Accessible

Future versions may include native Android and iOS applications.

---

# User Roles

## Guest

Can:

- Browse public events
- Browse public communities
- Search
- View organizers

Cannot:

- Register
- Join communities
- Save events
- Create events

---

## Student

Can:

- Register for events
- Join communities
- Save events
- Follow organizers
- Report content
- Manage profile

---

## Organizer

Everything a student can do, plus:

- Create events
- Edit events
- View registrations
- Manage organizer profile

Publishing rules depend on verification status.

---

## Administrator

Can:

- Verify organizers
- Moderate reports
- Feature events
- Suspend users
- Archive communities

---

# Navigation

## Primary Navigation

- Home
- Explore
- Communities
- Notifications
- Profile

---

## Secondary Navigation

- Event Details
- Organizer Profile
- Community Profile
- Search
- Settings

---

# Route Structure

/
├── login
├── signup
├── onboarding
├── home
├── explore
├── events
│   └── [eventSlug]
├── communities
│   └── [communitySlug]
├── organizers
│   └── [organizerSlug]
├── profile
├── notifications
├── settings
└── organizer
	├── dashboard
	├── events
	└── analytics

---

# Core Entities

## User

Attributes

- id
- name
- username
- email
- college
- course
- year
- interests
- profilePhoto

Relationships

- Registers for Events
- Joins Communities
- Follows Organizers

---

## Event

Attributes

- title
- slug
- description
- category
- location
- startTime
- endTime
- capacity
- organizer
- visibility
- registrationStatus

Relationships

- Belongs to one Organizer
- Can belong to multiple Categories
- Has many Registrations
- Has many Reviews

---

## Organizer

Attributes

- name
- verificationLevel
- bio
- contact
- website

Relationships

- Creates Events
- Owns Communities

---

## Community

Attributes

- name
- description
- category
- visibility
- activityStatus

Relationships

- Has Members
- Can Host Events
- Has Moderators

---

# Visibility Model

Public

Visible to everyone.

Campus Only

Visible only to verified students of that campus.

Partner College

Visible to students from partnered institutions.

Private

Invite-only.

---

# Search Architecture

Search supports:

- Events
- Communities
- Organizers

Filters

- Category
- College
- Date
- Free/Paid
- Online/Offline

Future

- AI-powered semantic search
- Natural language search

---

# Recommendation Strategy

Personalization signals include:

- Selected interests
- College
- Followed organizers
- Joined communities
- Past registrations
- Trending score
- Event freshness

Cold-start users receive trending and popular events.

---

# Trust Architecture

Every organizer has:

- Verification status
- Report count
- Review score

Every event has:

- Organizer verification badge
- Reporting option
- Moderation status

---

# Permission Matrix

| Action | Guest | Student | Organizer | Admin |
|--------|-------|----------|-----------|-------|
| View Events | ✅ | ✅ | ✅ | ✅ |
| Register | ❌ | ✅ | ✅ | ✅ |
| Create Event | ❌ | ❌ | ✅ | ✅ |
| Verify Organizer | ❌ | ❌ | ❌ | ✅ |
| Moderate Reports | ❌ | ❌ | ❌ | ✅ |

---

# Architecture Principles

- Single source of truth for each entity.
- Mobile-first navigation.
- Public content should be indexable for SEO.
- Authentication required only for protected actions.
- Every entity should have a unique, shareable URL.
- Modules should remain loosely coupled to simplify future expansion.

---

# Future Expansion

- Native mobile apps
- Multi-language support
- Public API
- AI recommendation service
- Calendar integrations
- Partner institution portals
