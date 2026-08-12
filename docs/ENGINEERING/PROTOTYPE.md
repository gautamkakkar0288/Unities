# Interactive Prototype (Phase 6-P)

A clickable walkthrough of all eighteen product screens, running against fixture
data, at `/prototype`.

It exists so the product can be reviewed and corrected before six database
migrations make correction expensive. See D21 to D24 in
`docs/DEVELOPMENT/DECISIONS.md` for the reasoning, and D25 to D31 for the
product decisions this prototype was built to settle.

## Running it

```bash
npm install
cp .env.example .env.local
npx auth secret          # writes AUTH_SECRET
npm run dev
```

Then open <http://localhost:3000/prototype>.

No database and no account are needed. `/prototype` is listed in
`publicPrefixes` in `auth.config.ts`, so the middleware lets it through without
a session. `/design` (the design-system gallery) works the same way.

## What is real and what is not

| Real today | Not real yet |
| --- | --- |
| Every token, type size, spacing value, and both themes | All data — see `lib/prototype/fixtures.ts` |
| Layout and responsive behaviour at every breakpoint | Any mutation: joining, posting, registering, sending |
| Card, badge, avatar, button, empty-state primitives | Filtering, sorting, pagination, infinite scroll |
| Copy and microcopy, including error and empty wording | Realtime updates and notification delivery |
| Keyboard focus order, landmarks, and labelling | Tabs, dialogs, sheets, dropdowns (D24) |
| Membership, registration, and moderation rules | Search ranking and AI recommendations |
| Trending ranking, time bucketing, duplicate detection | Persistence of anything at all |

Every screen carries a `ScreenHeader` naming the phase that makes it real, and a
collapsible "Not wired up on this screen" list. Believe that list over the
layout.

## The eighteen screens

| Route | Screen | Becomes real in |
| --- | --- | --- |
| `/prototype/onboarding` | First run: verified email, seeded campus, curated interests | Phase 6 |
| `/prototype/home` | Trending → soon → recommended → people → communities → feed | Phase 7 |
| `/prototype/explore` | Trips, sports, tech, and the interest taxonomy | Phase 6 |
| `/prototype/activities` | Find people: partners, teammates, study groups | Unscheduled |
| `/prototype/search` | Grouped results across all kinds | Phase 10 |
| `/prototype/communities` | Campus, then city, then interests | Phase 6 |
| `/prototype/community` | One community: about, guidelines, posts, events | Phase 6 |
| `/prototype/community/propose` | Student proposal flow with live duplicate detection | Phase 6 |
| `/prototype/post` | Post detail and comment thread | Phase 7 |
| `/prototype/events` | Event listing, open and past | Phase 8 |
| `/prototype/event` | Event detail with sticky registration panel | Phase 8 |
| `/prototype/event/register` | Confirmed, waitlisted, and closed outcomes | Phase 8 |
| `/prototype/profile` | Identity, activity, communities, badges | Phase 9 |
| `/prototype/settings` | Profile, privacy, notification preferences | Phase 9 |
| `/prototype/notifications` | Categorised, grouped by read state | Phase 12 |
| `/prototype/messages` | Scoped conversations and one thread | Phase 11 |
| `/prototype/operations` | Reports, proposals, interest suggestions, verification, audit | Phase 13 |
| `/prototype/states` | Loading, empty, error, offline, forbidden | Every phase |

## Structure

```
lib/domain/types.ts        Canonical domain model. The schema must satisfy this.
lib/domain/community.ts    Kinds, scopes, join policies, duplicate detection
lib/domain/membership.ts   Join-button states, participation, moderation rights
lib/domain/registration.ts Seats, waitlist, closure, fee and capacity labels
lib/domain/activity.ts     Find-people rules, expiry, join affordances
lib/domain/trending.ts     Ranking and interest-matched recommendation
lib/domain/time-buckets.ts Today / tomorrow / this weekend, pinned to IST
lib/domain/moderation.ts   Report vocabulary and queue ordering policy
lib/domain/messaging.ts    Conversation scopes and reply permission
lib/domain/notifications.ts Categories and which cannot be muted
lib/domain/search.ts       Result grouping and display order
lib/format.ts              Date, time, count, fee, capacity formatting (en-IN)
lib/prototype/fixtures.ts  All fabricated data. Deleted in Phase 16.
lib/prototype/screens.ts   The screen index powering navigation
features/*/components/     Cards that graduate into their real phases
app/(prototype)/           The eighteen screens. Deleted in Phase 16.
```

## What the schema must now support

Phase 6 writes the migration. Because of D25 to D31 it must include, at minimum:

- `places` (university and city) with `communities.place_id` and
  `communities.scope` — not a viewer-derived filter (D28)
- `communities.kind` and `communities.join_policy`, defaulting to `OPEN` (D26, D29)
- `memberships.state` including `INVITED` and `PENDING` from the first migration (D29)
- `community_proposals` and `interest_suggestions`, both with a reviewer and a
  decision note (D26, D27)
- `interests` as a table with stable IDs, seeded with the seventeen (D27)
- `activities` and `activity_joins`, with `expires_at` (D31)
- `events.kind` plus trip columns, or a `trip_details` side table (D31)
- Chitkara University, Tricity, the seventeen interests, and the interest
  communities as seed data inside the migration (D30)

## Rules if you add a screen

1. Import types from `lib/domain/types.ts`. If a screen needs a field that does
   not exist there, add it there first — that file is the schema's contract.
2. Put any rule in `lib/domain/*` with a test, never in the page. If a page
   decides whether a button is disabled, that rule dies when the page does.
3. Reuse the feature components. A card that exists only in the prototype is
   wasted work.
4. Pass `prototypeNow` to every formatter. Never call `new Date()` (D23).
5. Say what is not wired up in `ScreenHeader.notes`. Honesty here is what makes
   the review useful.
6. Register the screen in `lib/prototype/screens.ts`. Navigation and the
   overview page are generated from that list.

## Removal

Phase 16 deletes `app/(prototype)/`, `lib/prototype/`, `app/(design)/`, the
`publicPrefixes` entry in `auth.config.ts`, and the two `robots.ts` disallow
entries. Everything under `lib/domain/`, `lib/format.ts`, and
`features/*/components/` stays — by then it is running the real product.
