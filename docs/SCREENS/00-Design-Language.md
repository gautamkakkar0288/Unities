# Wonderer Screen Design Language

> Version 1.0
> Last Updated: July 2026

---

# Purpose

This document defines the universal design rules that every screen in Wonderer must follow.

No individual screen may violate these principles.

The goal is to create an interface that feels like it was designed by one team rather than assembled from many different ideas.

---

# Design Philosophy

Wonderer is built around one simple belief:

People come here to discover opportunities.

The interface should never compete with those opportunities.

The UI should quietly guide users toward meaningful actions.

---

# Core Principles

Every screen should be:

• Calm

• Clean

• Fast

• Friendly

• Predictable

• Premium

• Mobile First

---

# Screen Structure

Every screen follows the same hierarchy.

────────────────────────

Status Bar

↓

Top Navigation

↓

Page Header

↓

Primary Content

↓

Secondary Content

↓

Bottom Navigation (Mobile)

────────────────────────

Users should never wonder where to look next.

---

# Content Hierarchy

Every screen answers three questions.

1. Where am I?

2. What matters most?

3. What should I do next?

Nothing should interrupt this flow.

---

# Visual Hierarchy

Priority order:

Large spacing

↓

Typography

↓

Images

↓

Color

↓

Motion

↓

Icons

Avoid relying on color alone.

---

# Card Philosophy

Cards are the primary building block.

Every card should have:

• Clear purpose

• Comfortable spacing

• One primary action

• Optional secondary action

Cards should never contain unnecessary information.

---

# Scrolling

Scrolling should feel continuous.

Avoid unnecessary pagination.

Prefer infinite scrolling with lazy loading where appropriate.

Use pagination only for administrative interfaces.

---

# Navigation

Users should always know:

• Where they are

• Where they came from

• Where they can go next

Back navigation should never be confusing.

---

# Images

Images are used to inspire exploration.

Preferred order:

1. Real event photos
2. Community photos
3. Organizer photos
4. Branded graphics

Avoid decorative imagery.

---

# Empty States

Every empty state should include:

Illustration

↓

Headline

↓

Description

↓

Primary Action

↓

Optional Secondary Action

An empty page should always encourage exploration.

---

# Loading Experience

Never display blank screens.

Preferred order:

Skeleton

↓

Progressive Loading

↓

Content

Avoid spinners whenever possible.

---

# Error States

Errors should explain:

What happened

Why

How to fix it

Never blame the user.

---

# Search Experience

Search should feel instant.

Include:

Recent Searches

Trending Searches

Suggestions

Popular Categories

Results should update as users type.

---

# Motion Philosophy

Motion exists to explain changes.

Animations should:

Guide attention

Confirm actions

Improve continuity

Avoid decorative animation.

---

# Screen Transitions

Navigation:

Slide

Dialogs:

Scale + Fade

Bottom Sheets:

Slide Up

Cards:

Fade + Lift

Micro interactions:

100–150ms

Screen transitions:

200–300ms

---

# Responsiveness

Every screen must support:

Mobile

Tablet

Desktop

Wide Desktop

Layouts should adapt naturally without redesigning the interface.

---

# Accessibility

Every screen must support:

Keyboard navigation

Screen readers

44px touch targets

Visible focus states

WCAG AA contrast

Reduced motion preference

---

# Performance

A premium experience is also a fast experience.

Prioritize:

Lazy loading

Image optimization

Optimistic updates

Caching

Code splitting

Smooth scrolling

---

# Consistency Rules

Do not introduce:

New spacing

New typography

New button styles

New shadows

New animations

New colors

Unless they become part of the design system.

---

# AI Design Rules

When generating a new screen:

1. Reuse existing components.
2. Follow established spacing.
3. Respect typography hierarchy.
4. Prefer existing patterns over inventing new ones.
5. Keep the interface visually quiet.
6. Every screen should feel unmistakably like Wonderer.

---

# Definition of Done

A screen is complete only if it has:

✓ Mobile layout

✓ Tablet layout

✓ Desktop layout

✓ Loading state

✓ Empty state

✓ Error state

✓ Accessibility review

✓ Motion specification

✓ Responsive behavior

✓ Component mapping

✓ Developer notes

---

# Final Principle

The best interface is the one users stop noticing.

Wonderer should never impress users because it is flashy.

It should impress them because every interaction feels obvious, effortless, and thoughtfully desi