# 03 — Roles & Permissions

## Roles
1. **Student (default user)** — discover, save, register, join communities, follow organizers
2. **Organizer (verified)** — everything a student can do, plus: create/manage events, build a public organizer profile, view registration analytics for their own events
3. **Community Moderator** — moderate community content/discussions within their community
4. **Admin** — platform-wide moderation, organizer verification approval, content takedowns, user management

## Verification
Organizer status is a permission grant, not a signup default — students apply/are verified before gaining organizer capabilities (aligns with the Trust System in `PRD/03-Features.md`).

## Permission Boundaries
- Only verified organizers can publish events.
- Only admins can grant/revoke organizer verification.
- Community moderation actions are scoped to the moderator's own community only.
- Students can always save, share, register, and join — no gating on these core discovery actions.
