# Features Specification

> This document defines every major feature of Wonderer, grouped into modules and prioritized by release phase.

---

# Priority Legend

🔴 MVP (Required for Launch)

🟡 Phase 2

🟢 Phase 3

---

# 1. Authentication

Priority: 🔴 MVP

## Features

- Email & Password Sign Up
- Google Login
- Forgot Password
- Session Management
- Secure Authentication
- Logout

### User Story

As a student, I want to securely create an account so that I can personalize my experience.

### Acceptance Criteria

- Email verification supported.
- Google OAuth available.
- Persistent login.
- Secure password reset.

---

# 2. Student Onboarding

Priority: 🔴 MVP

## Features

- Select College
- Select Course
- Select Year
- Choose Interests
- Profile Picture
- Username

### User Story

As a new student, I want Wonderer to understand my interests so I receive relevant recommendations.

---

# 3. Home Feed

Priority: 🔴 MVP

## Sections

- Trending
- Recommended
- Nearby
- This Week
- Popular Communities
- Upcoming Events

### User Story

As a student, I want a personalized home page that immediately shows opportunities relevant to me.

---

# 4. Event Discovery

Priority: 🔴 MVP

## Features

- Browse Events
- Categories
- Filters
- Search
- Event Cards
- Event Details

### Filters

- College
- Date
- Category
- Free/Paid
- Online/Offline
- Distance

---

# 5. Event Registration

Priority: 🔴 MVP

## Features

- Register
- Cancel Registration
- Registration Status
- Capacity Counter

🟡 Future

- Waitlist
- QR Tickets
- Seat Reservation Timer
- Payments

---

# 6. Communities

Priority: 🔴 MVP

## Features

- Discover Communities
- Join
- Leave
- Community Feed
- Community Profile

🟡 Future

- Community Chat
- Polls
- Events inside Communities

---

# 7. Organizer Portal

Priority: 🔴 MVP

## Features

- Organizer Profile
- Create Event
- Edit Event
- Analytics
- Registrations

🟡 Future

- Team Members
- Revenue Dashboard
- Payment Reports

---

# 8. User Profile

Priority: 🔴 MVP

## Features

- Edit Profile
- Saved Events
- Joined Communities
- Registration History
- Achievements

---

# 9. Search

Priority: 🔴 MVP

Search should support

- Events
- Communities
- Organizers

Future

- AI Search
- Natural Language Search

---

# 10. Notifications

Priority: 🔴 MVP

## Types

- Registration Confirmation
- Event Reminder
- Organizer Announcement
- Community Updates

Future

- Push Notifications
- WhatsApp Notifications
- Email Digests

---

# 11. Trust & Safety

Priority: 🔴 MVP

## Features

- Organizer Verification Badge
- Report Event
- Report Organizer
- Content Moderation
- Trust Indicators

Future

- Trust Score
- Automated Fraud Detection
- AI Moderation

---

# 12. Admin Dashboard

Priority: 🔴 MVP

## Features

- Verify Organizers
- Manage Reports
- Feature Events
- Ban Users
- Moderate Communities

---

# Global Rules

Every event must:

- Belong to at least one category.
- Have an organizer.
- Have start and end times.
- Specify online or offline.
- Display registration status.

Every organizer must:

- Have a verification status.
- Have contact information.
- Follow community guidelines.

Every community must:

- Have at least one admin.
- Display activity status.
- Support moderation.

---

# Event Lifecycle

Draft

↓

Published

↓

Registration Open

↓

Registration Closed

↓

Ongoing

↓

Completed

↓

Archived

Additional States

- Full
- Waitlist
- Cancelled
- Postponed

---

# Community Lifecycle

Active

↓

Dormant

↓

Archived

Additional States

- Hidden
- Reported

---

# Future Platform Features (Phase 3)

- AI Recommendations
- Mentorship
- Student Marketplace
- Startup Hub
- Career Opportunities
- Campus Ambassador Program
- Event Ticketing
- Creator Profiles
- Brand Collaborations
