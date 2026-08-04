# 14 — Create Event (Organizer)

## Purpose
Let verified organizers publish a new event.

## Flow
Event basics (title, category, description) → Date/time/location → Media upload → Registration settings → Review → Publish

## Requirements
- Form validation via React Hook Form + Zod at every step
- Draft-saving so organizers don't lose progress
- Clear preview of how the event will appear before publishing

## Access Control
Only verified organizers can access this screen (see `UX/03-Roles-&-Permissions.md`).

## States
- Loading: disabled "Publish" with spinner
- Error: inline, field-level validation errors
- Success: confirmation + link to the live event page
