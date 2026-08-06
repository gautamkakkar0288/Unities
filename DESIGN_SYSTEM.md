# Cirqles Design System

> This document is the master design reference for the repository.
>
> It preserves prior Wonderer component thinking while defining the current Cirqles system.

---

# 1. Brand Philosophy

Cirqles should feel like a trusted, modern campus platform rather than a generic social app.

The visual language should communicate:

- Community
- Confidence
- Clarity
- Momentum
- Trust
- Warmth

The interface should be premium but not sterile, lively but not noisy, and expressive without becoming decorative.

---

# 2. Typography

## Primary Type System

Use a modern sans-serif family with excellent readability across mobile and desktop.

Typography goals:

- Clear hierarchy
- Strong scanning behavior
- Comfortable line height
- Distinct heading rhythm
- Accessible contrast and weight usage

## Typographic Roles

- Display: landing pages and major marketing moments
- Heading: page titles and major sections
- Subheading: card groups and supporting sections
- Body: primary reading text
- Caption: metadata and timestamps
- Label: buttons, tabs, badges, inputs

## Usage Rules

- Never use typography as decoration.
- Avoid excessive weight variations.
- Keep headings short and purposeful.
- Body copy should be easy to scan quickly.

---

# 3. Color Tokens

## Core Philosophy

Color should guide attention and establish trust. It should never overpower the content.

## Semantic Tokens

- Primary: main actions, active navigation, key links
- Secondary: supporting actions and sub-navigation
- Accent: highlights, featured content, momentary emphasis
- Success: verified, completed, approved
- Warning: pending, capacity, deadlines
- Error: invalid, blocked, failed
- Info: educational or informational states
- Neutral: surfaces, borders, text hierarchy

## Theme Strategy

Light mode is the primary experience.

Dark mode must be designed as a true system, not a color inversion.

## Token Rules

- Use semantic tokens only.
- Never hardcode colors inside product components.
- Maintain sufficient contrast for every interactive state.
- Color must never be the only signal for status.

---

# 4. Dark Mode

Dark mode is a future theme capability, but the design system should prepare for it now.

Requirements:

- Tokenized surfaces
- Separate text hierarchy tokens
- Accessible border contrast
- Icons and badges that remain legible
- No dependence on pure black backgrounds

---

# 5. Motion Principles

Motion should explain change, confirm action, and improve orientation.

## Principles

- Purposeful
- Fast
- Smooth
- Subtle
- Non-blocking

## Standard Durations

- Micro interactions: 150ms–200ms
- Screen transitions: 200ms–300ms
- State changes: keep them short and readable

## Motion Rules

- Use motion sparingly.
- Never animate everything at once.
- Prefer transition and feedback over spectacle.
- Respect reduced-motion preferences.

---

# 6. Layout System

## Principles

- Mobile-first
- Strong hierarchy
- Predictable spacing
- Breathable cards
- Clear focal point per screen

## Grid and Containers

- Use a responsive grid on larger screens.
- Keep content readable at wide widths.
- Avoid stretched layouts that dilute hierarchy.

## Responsive Behavior

- Mobile should prioritize speed and clarity.
- Tablet should improve readability and scanning.
- Desktop should add density without clutter.

---

# 7. Spacing

Use a consistent spacing scale across the product.

Rules:

- Use tokenized spacing only.
- Maintain visual rhythm between sections.
- Keep card padding generous.
- Avoid arbitrary one-off spacing decisions.

---

# 8. Elevation and Shadows

Shadows should feel soft, practical, and restrained.

Elevation levels:

- Base surface
- Card
- Floating panel
- Dialog
- Toast

Rules:

- Use the lightest effective shadow.
- Elevation should signal interaction hierarchy, not decoration.
- Higher elevation means higher interruption.

---

# 9. Icons

Use one icon family consistently across the product.

Guidelines:

- Icons should support meaning, not replace it.
- Keep icon stroke and size consistent.
- Pair ambiguous icons with labels.
- Use icons to reinforce state and navigation.

---

# 10. Accessibility

Accessibility is a baseline requirement.

The design system must support:

- Keyboard navigation
- Screen readers
- Visible focus states
- Large touch targets
- Adequate color contrast
- Reduced motion

Never ship a pattern that relies on visual-only cues.

---

# 11. Component Library

The reusable component system should be documented and reused instead of recreated.

This design system is the reference layer for:

- `docs/COMPONENTS/Buttons.md`
- `docs/COMPONENTS/Cards.md`
- `docs/COMPONENTS/Inputs.md`
- `docs/COMPONENTS/Navigation.md`
- `docs/COMPONENTS/Feedback.md`
- `docs/COMPONENTS/Data-Display.md`
- `docs/COMPONENTS/Overlays.md`
- `docs/COMPONENTS/Patterns.md`

---

# 12. Component Specifications

## Buttons

Buttons should have a single clear hierarchy: primary, secondary, ghost, destructive, and icon.

Behavior:

- One primary action per screen.
- Loading state preserves width.
- Disabled state remains readable.
- Focus state must be visible.

Accessibility:

- Icon-only buttons require an accessible label.
- Tap targets should remain comfortable on mobile.

## Inputs

Inputs include text fields, textareas, selects, checkboxes, radios, switches, and search fields.

Behavior:

- Visible labels are mandatory.
- Error messages should sit near the field.
- Helper text should clarify intent.
- Validation should feel immediate and humane.

Accessibility:

- Use programmatic labels.
- Tie errors to fields with descriptive metadata.

## Cards

Cards are the primary content container for events, communities, organizers, profiles, and notifications.

Behavior:

- Comfortable padding
- Clear hierarchy
- Tappable surface where appropriate
- Consistent media ratio per card type

## Navigation

Navigation must be predictable and consistent across mobile and desktop.

Behavior:

- Mobile bottom navigation for primary destinations
- Desktop sidebar or top navigation where appropriate
- Active state must be obvious

## Feedback

Feedback includes toasts, inline validation, skeletons, empty states, and error states.

Behavior:

- Prefer skeletons over spinners.
- Empty states must guide action.
- Errors must explain the failure and recovery.

## Overlays

Overlays include dialogs, modals, sheets, dropdowns, and popovers.

Behavior:

- Focus must be trapped when open.
- Escape should close the topmost overlay.
- Dismissal should be obvious and safe.

## Data Display

Data display includes lists, badges, avatars, metrics, tables, and status indicators.

Behavior:

- Make hierarchy obvious.
- Never rely on color alone for state.
- Support loading, empty, and error states.

## Patterns

Reusable patterns should be documented once and then reused everywhere.

Core patterns include discovery feeds, detail pages, forms, and confirmation states.

---

# 13. Empty States

Empty states should never feel like dead ends.

They should include:

- A clear explanation
- A relevant illustration when useful
- A primary action
- Optional secondary guidance

The goal is to help the user continue, not merely notify them that data is absent.

---

# 14. Error States

Error states should be calm and specific.

They must:

- Explain what went wrong in plain language
- Offer a retry or recovery path
- Avoid blaming the user
- Avoid exposing technical jargon

---

# 15. Skeletons and Loading

Skeletons should mirror the eventual layout closely enough to prevent jarring shifts.

Rules:

- Prefer skeletons for content-rich pages.
- Keep loading states lightweight.
- Avoid blocking the whole screen when partial data can render.

---

# 16. Navigation Surfaces

## Mobile

Mobile navigation should keep the main discovery paths visible and fast to reach.

## Desktop

Desktop can introduce richer hierarchy and persistent access to secondary tools.

## Routes and State

Navigation should clearly indicate the current location, available next steps, and how to return.

---

# 17. Cards by Domain

## Event Cards

- Event image
- Title
- Date and time
- Location
- Trust/status signals
- Save action

## Community Cards

- Community identity
- Membership count
- Activity signal
- Join action

## Profile Cards

- Avatar
- Name
- University affiliation
- Roles or badges

## Opportunity Cards

- Opportunity title
- Category
- Timeline
- Source or host
- Action to learn more

---

# 18. Community Pages

Community pages should feel like the heart of Cirqles.

They need:

- A strong identity header
- Clear membership state
- Recent activity
- Events tied to the community
- Moderation cues when relevant

Visual tone:

- Active
- Warm
- Organized
- Trustworthy

---

# 19. Event Pages

Event pages should help a user decide quickly.

They need:

- Strong hero area
- Clear summary
- Trust signals
- Capacity and status
- Primary call to action
- Supporting information organized by priority

The page should build confidence, not require detective work.

---

# 20. Feed System

The feed should feel structured and intentional.

It should support:

- Recommendation cards
- Community updates
- Opportunities
- Trending items
- Official announcements

The feed should maintain readability even when dense.

---

# 21. Operations Center

Operations views should prioritize clarity over polish.

They need:

- Dense but readable layouts
- Clear statuses
- Tables and filters
- Auditable actions
- Low-friction review workflows

The design language can be more utilitarian here, but it should remain consistent with the brand.

---

# 22. Design References

The existing design documentation remains valuable historical and implementation context:

- [docs/DESIGN/00-Design-Principles.md](docs/DESIGN/00-Design-Principles.md)
- [docs/DESIGN/01-Brand.md](docs/DESIGN/01-Brand.md)
- [docs/DESIGN/02-Color-System.md](docs/DESIGN/02-Color-System.md)
- [docs/DESIGN/03-Typography.md](docs/DESIGN/03-Typography.md)
- [docs/DESIGN/04-Spacing-&-Layout.md](docs/DESIGN/04-Spacing-&-Layout.md)
- [docs/DESIGN/05-Component-System.md](docs/DESIGN/05-Component-System.md)
- [docs/DESIGN/06-Iconography.md](docs/DESIGN/06-Iconography.md)
- [docs/DESIGN/07-Illustration-System.md](docs/DESIGN/07-Illustration-System.md)
- [docs/DESIGN/08-Motion-System.md](docs/DESIGN/08-Motion-System.md)
- [docs/DESIGN/09-Elevation-System.md](docs/DESIGN/09-Elevation-System.md)
- [docs/DESIGN/10-Theme-System.md](docs/DESIGN/10-Theme-System.md)
- [docs/DESIGN/11-Accessibility.md](docs/DESIGN/11-Accessibility.md)
- [docs/DESIGN/12-Responsive-System.md](docs/DESIGN/12-Responsive-System.md)
- [docs/DESIGN/13-Design-Tokens.md](docs/DESIGN/13-Design-Tokens.md)
