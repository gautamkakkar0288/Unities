# Buttons

## Variants
- Primary — the single dominant action per screen; solid fill, high contrast
- Secondary — outlined or subtle-fill, for secondary actions alongside a primary
- Ghost/Text — lowest emphasis, for tertiary/inline actions
- Destructive — for irreversible actions (e.g. delete account), uses error token color
- Icon Button — icon-only, requires an accessible label

## States
Default · Hover · Pressed/Active · Focus · Disabled · Loading

## Rules
- Never place two primary buttons in the same view (per `DESIGN/05-Component-System.md`).
- Loading state replaces label with a spinner, button stays same width (no layout shift).
- Disabled buttons must remain visually distinct but keep sufficient contrast for accessibility.
- Animate press feedback within 150–300ms.

## Accessibility
- Minimum touch target ~44x44px
- Icon-only buttons require `aria-label`
- Focus ring must be visible on keyboard navigation
