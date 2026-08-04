# Inputs

## Variants
- Text input
- Textarea
- Select / Dropdown
- Checkbox / Radio
- Switch/Toggle
- Search input (with debounce, see `SCREENS/03-Search.md`)

## States
Default · Focus · Filled · Error · Disabled

## Rules
- Every input has a visible label (no placeholder-only labels).
- Helper text and error messages appear below the field, never as a tooltip only.
- Validation via React Hook Form + Zod (see `FRONTEND/06-Component-Guidelines.md`).
- Only ask for necessary information — minimize field count per `DESIGN Bible` Forms section.

## Accessibility
- Label programmatically associated with input (`htmlFor`/`id`)
- Error messages announced to screen readers (`aria-describedby`, `aria-invalid`)
