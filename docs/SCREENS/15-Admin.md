# 15 — Admin

## Purpose
Platform moderation and organizer verification.

## Core Functions
- Review and approve/reject organizer verification requests
- Moderate flagged events/communities/content
- Manage user reports
- View platform-wide health metrics (from `UX/06-Analytics.md`)

## Access Control
Restricted to Admin role only (see `UX/03-Roles-&-Permissions.md`).

## States
- Loading: skeleton tables/lists
- Empty: "No pending items." — a calm, positive empty state
- Error: "We couldn't load this data." → Try Again
