# Wonderer Color System

> Version 1.0
> Last Updated: July 2026

---

# Philosophy

Colors in Wonderer should guide attention, communicate trust, and create emotional warmth.

The interface should feel premium and calm rather than loud or overly saturated.

Users should notice the content before they notice the colors.

---

# Design Goals

Our color system should be:

- Calm
- Trustworthy
- Youthful
- Premium
- Accessible
- Consistent

---

# Theme Strategy

Wonderer is **Light-First**.

The light theme is the primary experience and should receive the highest design attention.

Dark mode is supported in the future but should never compromise readability or brand consistency.

---

# Brand Color Philosophy

Each color has a purpose.

| Purpose | Emotion |
|----------|---------|
| Primary | Trust & Discovery |
| Secondary | Community |
| Accent | Energy & Highlights |
| Success | Confidence |
| Warning | Attention |
| Error | Clarity |
| Neutral | Balance |

Never use colors purely for decoration.

---

# Color Palette

## Primary

**Wonder Blue**

Purpose:

- Primary buttons
- Links
- Active navigation
- Selected states
- Important actions

Characteristics:

- Modern
- Trustworthy
- Professional
- Recognizable

---

## Secondary

Soft Indigo

Purpose:

- Secondary actions
- Charts
- Tags
- Supporting UI

---

## Accent

Warm Orange

Purpose:

- Trending
- Featured
- Popular
- Limited-time events

Accent colors should be used sparingly.

---

## Success

Green

Used for:

- Registration successful
- Verified
- Completed actions
- Active status

---

## Warning

Amber

Used for:

- Capacity almost full
- Upcoming deadlines
- Pending approval

---

## Error

Red

Used for:

- Validation
- Failed actions
- Critical alerts

Avoid aggressive or overly bright reds.

---

## Information

Sky Blue

Used for:

- Tips
- Information banners
- Educational messages

---

# Neutral Palette

The majority of the interface should rely on neutral colors.

Hierarchy:

Background

↓

Surface

↓

Border

↓

Muted Text

↓

Primary Text

Avoid excessive contrast where softer alternatives improve readability.

---

# Surface Levels

## Level 0

Application Background

---

## Level 1

Cards

---

## Level 2

Dialogs

---

## Level 3

Dropdowns

---

## Level 4

Floating Components

Each elevation level should introduce subtle visual separation without relying on heavy shadows.

---

# Frosted Glass

Wonderer uses frosted glass selectively.

Suitable for:

- Floating navigation
- Search overlays
- Bottom sheets
- Command palette

Avoid using glass effects for:

- Standard cards
- Forms
- Tables
- Content-heavy layouts

Glass should improve focus, not reduce readability.

---

# Gradients

Gradients are supporting elements, not primary branding.

Allowed usage:

- Hero banners
- Marketing pages
- Featured event highlights

Avoid gradients on:

- Primary buttons
- Navigation
- Forms
- Large content sections

---

# Semantic Colors

Every semantic color must have:

- Background
- Border
- Text
- Icon

Example:

Success

Background → Light Green

Border → Medium Green

Text → Dark Green

Icon → Green

Maintain consistency across all semantic states.

---

# Status Indicators

Use colors consistently for:

- Live
- Upcoming
- Cancelled
- Sold Out
- Waitlist
- Draft
- Verified

Avoid introducing multiple meanings for the same color.

---

# Category Colors

Categories may have subtle identity colors.

Examples:

Technology

Sports

Music

Travel

Startup

Workshop

Competition

These colors should assist recognition without overpowering the interface.

---

# Charts & Data

Charts should remain readable in both light and future dark themes.

Use color as a supporting cue, not the only indicator.

Include labels, icons, or patterns where necessary.

---

# Accessibility

Every color combination must satisfy WCAG AA contrast guidelines.

Never rely solely on color to communicate meaning.

Examples:

❌ Red = Error

✅ Red + Icon + Label = Error

---

# Emotional Rules

Use color to create confidence.

Avoid interfaces that feel:

- Loud
- Neon
- Flashy
- Distracting

The platform should feel approachable and trustworthy.

---

# Developer Guidelines

Use design tokens instead of hardcoded colors.

Never reference HEX values directly in components.

Instead use semantic tokens.

Examples:

--color-primary

--color-surface

--color-success

--color-warning

--color-border

This allows effortless theming and future expansion.

---

# Tailwind Mapping

Every semantic token should map to Tailwind utilities.

Example:

bg-primary

text-primary

border-primary

bg-surface

text-muted

bg-success

text-error

Components must never use arbitrary colors when a semantic token exists.

---

# Future Considerations

- Full dark theme
- High contrast mode
- Seasonal themes
- College branding themes (optional)
- Accessibility customization

---

# Final Principle

Content creates value.

Color directs attention.

If users remember the interface more than the opportunities it helped them discover, the design has become too loud.
