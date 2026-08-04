# Overlays

## Components
- Modal
- Dialog (confirmation, e.g. delete account)
- Bottom Sheet (mobile-friendly alternative to modal)
- Toast (see `Feedback.md`)
- Dropdown/Popover menus

## Elevation
Overlays sit above Card in the elevation hierarchy (see `DESIGN/09-Elevation-System.md`): Modal → Dialog → Floating Action → Toast.

## Rules
- Only one overlay open at a time
- Dismiss via overlay backdrop click, Escape key, or explicit close action
- Avoid unnecessary popups — per `DESIGN Bible` "Things to Avoid"

## Accessibility
- Focus trapped within open modal/dialog
- Focus returns to the triggering element on close
- Escape key always closes the topmost overlay
