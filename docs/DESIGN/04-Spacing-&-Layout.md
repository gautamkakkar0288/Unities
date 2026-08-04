# Wonderer Spacing & Layout System

> Version 1.0
> Last Updated: July 2026

---

# Philosophy

Spacing is not empty space—it is a design tool.

Wonderer should feel breathable, elegant, and premium. Good spacing improves readability, reduces cognitive load, and creates a calm experience.

Every pixel should have a purpose.

---

# Design Goals

The layout system should be:

- Mobile-first
- Responsive
- Predictable
- Consistent
- Spacious
- Easy to scan

---

# Layout Principles

## 1. Mobile First

Every screen must be designed for mobile before considering tablet or desktop layouts.

Desktop layouts should enhance the experience, not redefine it.

---

## 2. One Primary Focus

Every screen should have one clear focal point.

Avoid multiple competing sections above the fold.

---

## 3. Predictable Structure

Most pages should follow this hierarchy:

Header

↓

Hero / Context

↓

Primary Content

↓

Secondary Content

↓

Footer / Bottom Navigation

Users should always know where to look next.

---

# Grid System

Use a **12-column responsive grid** on desktop.

Recommended breakpoints:

- Mobile: 1 column
- Tablet: 2–6 columns
- Desktop: 12 columns

Cards and sections should snap naturally to the grid.

---

# Container Widths

Recommended maximum widths:

- Mobile: 100%
- Tablet: 768px
- Desktop: 1280px
- Large Desktop: 1440px

Avoid stretching content across ultra-wide screens.

---

# Spacing Scale

Adopt an 8-point spacing system.

Common spacing values:

- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 40px
- 48px
- 64px
- 80px

Avoid arbitrary spacing values.

---

# Section Spacing

Between major sections:

Large spacing

Between cards:

Medium spacing

Between related items:

Small spacing

Whitespace should visually communicate relationships.

---

# Card Layout

Cards are Wonderer's primary content container.

Every card should include:

- Comfortable internal padding
- Consistent corner radius
- Clear hierarchy
- Touch-friendly spacing

Do not overcrowd cards.

---

# Page Padding

Recommended horizontal padding:

Mobile:

16px

Tablet:

24px

Desktop:

32px

Large Desktop:

48px

---

# Vertical Rhythm

Maintain a consistent vertical rhythm throughout the application.

Avoid uneven spacing between similar components.

Every screen should feel visually balanced.

---

# Hero Sections

Hero sections should:

- Establish context
- Highlight key actions
- Avoid excessive height
- Keep primary content visible above the fold

---

# Lists

Lists should maintain:

- Consistent item spacing
- Clear separators where needed
- Easy scanning

Avoid dense, text-heavy lists.

---

# Forms

Form layouts should:

- Group related fields
- Maintain generous spacing
- Keep labels close to inputs
- Minimize scrolling

Long forms should be divided into logical sections.

---

# Dialogs

Dialogs should:

- Focus on one task
- Limit content width
- Keep actions visible
- Avoid unnecessary scrolling

---

# Navigation Layout

Primary navigation should remain stable across the application.

Mobile:

Bottom navigation

Desktop:

Sidebar + Top Bar

Navigation should never compete with content.

---

# Responsive Behavior

Components should adapt gracefully across screen sizes.

Avoid creating completely different interfaces for different devices.

Maintain familiarity.

---

# Touch Targets

Minimum interactive target:

44 × 44 px

Provide sufficient spacing between adjacent controls.

---

# Empty Space

Whitespace is intentional.

Use it to:

- Improve readability
- Separate content
- Highlight important elements
- Reduce visual noise

Never fill empty space simply because it exists.

---

# Elevation

Use spacing before shadows.

Only introduce shadows when spacing alone cannot communicate hierarchy.

---

# Developer Guidelines

Implement spacing using design tokens.

Example Tailwind spacing:

- p-2
- p-4
- p-6
- p-8
- gap-2
- gap-4
- gap-6
- gap-8

Avoid arbitrary values unless justified.

---

# AI Guidelines

When generating layouts:

- Follow the 8-point spacing system.
- Respect responsive breakpoints.
- Keep one primary focus per screen.
- Prefer whitespace over additional decoration.
- Reuse existing layout patterns before creating new ones.

---

# Final Principle

A well-spaced interface feels effortless.

Users should never feel overwhelmed by information or constrained by clutter. Every layout should encourage exploration while remaining calm, readable, and predictable.
