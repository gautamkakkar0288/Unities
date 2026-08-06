# Interactive Prototype (Phase 6-P)

A clickable walkthrough of all sixteen product screens, running against fixture
data, at `/prototype`.

It exists so the product can be reviewed and corrected before six database
migrations make correction expensive. See D21 to D24 in
`docs/DEVELOPMENT/DECISIONS.md` for the reasoning.

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

Every screen carries a `ScreenHeader` naming the phase that makes it real, and a
collapsible "Not wired up on this screen" list. Believe that list over the
layout.

## The sixteen screens

| Route | Screen | Becomes real in |
| --- | --- | --- |
| `/prototype/onboarding` | First run: verify, interests, first communities | Phase 6 |
| `/prototype/home` | Feed: events above conversation | Phase 7 |
| `/prototype/explore` | Discovery by interest | Phase 6 |
| `/prototype/search` | Grouped results across all kinds | Phase 10 |
| `/prototype/communities` | Directory, yours first | Phase 6 |
| `/prototype/community` | One community: about, guidelines, posts, events | Phase 6 |
| `/prototype/post` | Post detail and comment thread | Phase 7 |
| `/prototype/events` | Event listing, open and past | Phase 8 |
| `/prototype/event` | Event detail with sticky registration panel | Phase 8 |
| `/prototype/event/register` | Confirmed, waitlisted, and closed outcomes | Phase 8 |
| `/prototype/profile` | Identity, activity, communities, badges | Phase 9 |
| `/prototype/settings` | Profile, privacy, notification preferences | Phase 9 |
| `/prototype/notifications` | Categorised, grouped by read state | Phase 12 |
| `/prototype/messages` | Scoped conversations and one thread | Phase 11 |
| `/prototype/operations` | Report queue, verification, audit trail | Phase 13 |
| `/prototype/states` | Loading, empty, error, offline, forbidden | Every phase |

## Structure

```
lib/domain/types.ts        Canonical domain model. The schema must satisfy this.
lib/domain/membership.ts   Join-button states, participation, moderation rights
lib/domain/registration.ts Seats, waitlist, closure, fee and capacity labels
lib/domain/moderation.ts   Report vocabulary and queue ordering policy
lib/domain/messaging.ts    Conversation scopes and reply permission
lib/domain/notifications.ts Categories and which cannot be muted
lib/domain/search.ts       Result grouping and display order
lib/format.ts              Date, time, count, fee, capacity formatting (en-IN)
lib/prototype/fixtures.ts  All fabricated data. Deleted in Phase 16.
lib/prototype/screens.ts   The screen index powering navigation
features/*/components/     Cards that graduate into their real phases
app/(prototype)/           The sixteen screens. Deleted in Phase 16.
```

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

## Removal

Phase 16 deletes `app/(prototype)/`, `lib/prototype/`, `app/(design)/`, the
`publicPrefixes` entry in `auth.config.ts`, and the two `robots.ts` disallow
entries. Everything under `lib/domain/`, `lib/format.ts`, and
`features/*/components/` stays — by then it is running the real product.
