# Wonderer Typography System

> Version 1.0
> Last Updated: July 2026

---

# Philosophy

Typography is the foundation of visual hierarchy.

In Wonderer, typography should communicate trust, readability, and elegance before personality.

The interface should feel calm and effortless to scan, allowing users to focus on opportunities rather than deciphering content.

Typography should always prioritize clarity over decoration.

---

# Design Goals

The typography system should be:

- Highly readable
- Modern
- Elegant
- Consistent
- Accessible
- Mobile-first

---

# Font Strategy

## Primary Font

Use **Geist** as the primary typeface.

Reasons:

- Excellent readability
- Optimized for digital interfaces
- Modern geometric appearance
- Works well with Next.js
- Great variable font support
- Consistent across platforms

Fallback Stack:

```
Geist
Inter
SF Pro Display
Segoe UI
Roboto
sans-serif
```

---

# Typography Principles

## 1. Readability First

Users should understand content instantly.

Never sacrifice readability for aesthetics.

---

## 2. Consistency

Every text element should belong to a predefined typography style.

Avoid custom font sizes.

---

## 3. Visual Hierarchy

Users should instantly identify:

- Page title
- Section heading
- Card title
- Supporting text
- Metadata

without relying on color alone.

---

## 4. Breathing Room

Typography works together with whitespace.

Avoid cramped layouts.

Maintain comfortable line heights.

---

# Type Scale

## Display

Purpose

Landing pages

Hero sections

Marketing

Weight

Bold

---

## Heading 1

Purpose

Page titles

Examples

Home

Explore

Communities

---

## Heading 2

Purpose

Major sections

Examples

Trending This Week

Recommended

Popular Communities

---

## Heading 3

Purpose

Card headings

Dialog titles

---

## Heading 4

Purpose

Smaller grouped content

Settings sections

Profile groups

---

## Body Large

Purpose

Descriptions

Important paragraphs

---

## Body Medium

Purpose

Default reading size

Used throughout the application.

---

## Body Small

Purpose

Supporting information

Captions

Descriptions

---

## Caption

Purpose

Metadata

Dates

Times

Statistics

---

## Label

Purpose

Buttons

Inputs

Badges

Tags

Navigation

---

# Font Weights

Use only the following weights:

Regular

Medium

Semibold

Bold

Avoid excessive weight variations.

---

# Line Height

Headings

Tight

Body

Comfortable

Long paragraphs

Relaxed

Large blocks of text should remain effortless to read.

---

# Text Alignment

Default alignment:

Left

Exceptions:

Hero sections

Empty states

Marketing banners

Avoid justified text.

---

# Text Colors

Use semantic color tokens.

Never hardcode colors.

Examples:

Primary Text

Secondary Text

Muted Text

Success Text

Error Text

Inverse Text

---

# Maximum Line Length

Long paragraphs should not exceed comfortable reading width.

Aim for:

60–80 characters per line

on desktop layouts.

---

# Emphasis

Use emphasis sparingly.

Priority order:

Weight

↓

Color

↓

Size

Avoid combining multiple emphasis styles.

---

# Numbers

Numbers should align consistently.

Examples:

Event capacity

Statistics

Analytics

Countdowns

Prefer tabular figures where supported.

---

# Links

Links should be clearly distinguishable.

Hover states should provide visual confirmation.

Avoid underlining links by default unless required for accessibility.

---

# Buttons

Button text should be:

Short

Action-oriented

Examples:

Join

Register

Explore

Save

Share

Avoid vague labels such as:

Continue

Submit

Proceed

---

# Form Labels

Labels should always remain visible.

Avoid placeholder-only forms.

Every field should have:

- Label
- Placeholder (optional)
- Helper text (if needed)

---

# Error Messages

Good:

Email address is required.

Bad:

Invalid input.

Messages should explain:

- What happened
- Why
- How to fix it

---

# Accessibility

Typography should satisfy:

- WCAG AA contrast
- Scalable up to 200%
- No information conveyed only by font weight
- Comfortable reading on mobile

---

# Responsive Typography

Typography should scale naturally across:

- Mobile
- Tablet
- Laptop
- Desktop

Avoid creating separate typography systems.

Use fluid scaling where appropriate.

---

# Developer Guidelines

Typography should be exposed through reusable design tokens.

Examples:

text-display

text-h1

text-h2

text-h3

text-body-lg

text-body

text-caption

text-label

Never define font size directly inside components.

---

# AI Guidelines

When generating UI:

- Always use predefined typography styles.
- Do not invent new font sizes.
- Maintain consistent hierarchy.
- Keep button labels concise.
- Prefer readability over visual complexity.

---

# Final Principle

Good typography is invisible.

Users should remember the opportunities they discovered—not the fonts they read them in.
