# Wonderer Component System

> Version 1.0
> Last Updated: July 2026

---

# Purpose

The Component System defines every reusable UI element used across Wonderer.

Goals:

- Consistency
- Accessibility
- Reusability
- Scalability
- Developer efficiency

Components should be built once and reused everywhere.

---

# Technology Stack

Frontend

- Next.js App Router
- React 19
- TypeScript

Styling

- Tailwind CSS
- CSS Variables
- Design Tokens

UI Library

- shadcn/ui (Nova Preset)

Animation

- Motion

Icons

- Lucide React

---

# Design Principles

Every component should be:

- Simple
- Predictable
- Accessible
- Mobile-first
- Responsive
- Theme-aware

---

# Component Hierarchy

## Foundation

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Icons

↓

## Basic Components

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Badge
- Avatar
- Tooltip
- Skeleton
- Spinner
- Divider

↓

## Navigation

- Navbar
- Bottom Navigation
- Sidebar
- Tabs
- Breadcrumb
- Pagination
- Search Bar

↓

## Content

- Event Card
- Community Card
- Organizer Card
- Profile Card
- Statistic Card
- Banner
- Empty State
- Timeline
- List Item

↓

## Feedback

- Toast
- Dialog
- Drawer
- Sheet
- Alert
- Progress
- Loading Overlay

↓

## Complex Components

- Event Feed
- Community Feed
- Calendar
- Filter Panel
- Search Results
- Notification Center

---

# Buttons

## Variants

Primary

Main actions.

Secondary

Supporting actions.

Outline

Low emphasis.

Ghost

Toolbar actions.

Destructive

Delete actions.

Link

Navigation.

---

## Sizes

- Small
- Medium
- Large
- Icon Only

---

## States

- Default
- Hover
- Active
- Focus
- Loading
- Disabled

---

## Rules

Every page should have only one Primary Button.

Avoid multiple competing CTAs.

---

# Cards

Cards are the most important reusable component.

## Card Types

### Hero Card

Large image

Featured content

---

### Standard Card

Default event card.

Contains:

- Image
- Title
- Organizer
- Date
- Location
- Category

---

### Compact Card

Used in search results.

---

### Community Card

Used for clubs and communities.

---

### Opportunity Card

For future spontaneous activities.

Example:

Need badminton partner tonight.

---

# Inputs

Support:

- Labels
- Helper text
- Validation
- Error messages
- Prefix
- Suffix

Never rely on placeholders alone.

---

# Search

Global search should include:

- Suggestions
- Recent searches
- Trending searches

Support keyboard navigation.

---

# Badges

Variants:

- Verified
- Trending
- Live
- New
- Featured
- Sold Out
- Waitlist

Badges should communicate status, not decoration.

---

# Avatars

Support:

- Image
- Initials
- Status Indicator
- Verification Badge

---

# Navigation

Bottom Navigation (Mobile)

Items:

- Home
- Explore
- Communities
- Notifications
- Profile

Desktop

Sidebar

Top Navigation

Search

Profile Menu

---

# Dialogs

Dialogs should focus on a single task.

Maximum:

Two actions

Examples:

Cancel

Confirm

Avoid excessive complexity.

---

# Drawers

Preferred on mobile.

Used for:

- Filters
- Settings
- Quick actions

---

# Toasts

Position:

Top Right (Desktop)

Bottom (Mobile)

Variants:

- Success
- Error
- Warning
- Information

Duration:

3–5 seconds

---

# Empty States

Must include:

Illustration

Headline

Description

Primary Action

Optional Secondary Action

Every empty state should encourage exploration.

---

# Loading States

Never show blank pages.

Prefer:

- Skeleton loaders
- Progressive rendering
- Optimistic updates

---

# Motion Rules

Hover

100–150 ms

Click

Immediate

Page Transition

200–300 ms

Dialog

Scale + Fade

Drawer

Slide

Toast

Fade + Slide

Motion should reinforce interactions, not distract.

---

# Accessibility

Every component must support:

- Keyboard navigation
- Screen readers
- Focus indicators
- Touch targets ≥ 44px
- WCAG AA contrast

---

# Naming Convention

Example:

Button

Button.Primary

Button.Secondary

EventCard

CommunityCard

FilterDrawer

SearchDialog

NotificationItem

Names should clearly communicate purpose.

---

# Reuse Policy

Before creating a new component, ask:

Can an existing component be extended?

If yes:

Extend.

Do not duplicate.

---

# Developer Rules

Never hardcode:

- Colors
- Radius
- Font sizes
- Shadows
- Spacing

Always use design tokens.

---

# AI Guidelines

When generating UI:

- Reuse existing components.
- Avoid creating one-off designs.
- Follow established variants.
- Maintain spacing and typography.
- Respect accessibility rules.
- Keep visual hierarchy consistent.

---

# Future Components

Planned additions:

- Rich Text Editor
- Poll Card
- Event Timeline
- QR Ticket
- Payment Widget
- Achievement Card
- Campus Map
- Chat Bubble
- Story Card
- AI Recommendation Panel

---

# Final Principle

A component is successful when users immediately understand how it behaves without needing to learn it.

Consistency is more valuable than creativity at the component level.
