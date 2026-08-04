# Cards

## Variants
- Event Card (image, title, date, location, save icon)
- Organizer Card (avatar, name, verified badge, follower count)
- Community Card (name, member count, join CTA)
- Notification Card (icon, message, timestamp)

## Rules
- Rounded corners, soft shadow, comfortable padding — never dense (per `DESIGN/05-Component-System.md`)
- Large touch target — entire card is tappable, not just the title
- Consistent aspect ratio per card type across the app
- Support loading (skeleton) and error rendering per instance

## Accessibility
- Card as a whole should be a single focusable/tappable unit with a clear accessible name
- Nested interactive elements (e.g. Save icon inside an Event Card) need independent focus stops
