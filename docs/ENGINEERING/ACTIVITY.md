# Community activity

How announcements, reactions, comments, reports and moderation fit together, and
why several obvious-looking things were deliberately not built.

## What already existed

The audit came first, and most of it was already there. `posts` carried
`authorId`, `communityId`, `title`, `body`, `eventId`, `createdAt`, and soft
removal through `removedAt` / `removedById` / `removalReason`. So **publishing,
editing, event linking and deletion needed no schema change at all** - only the
services that write those columns.

The same was true of moderation. `reports` already had reporter, target, reason,
status, reviewer, resolution note, and a unique constraint
(`reports_once_per_reporter`) that makes duplicate reports a database
impossibility rather than a service check. `auditTargetKinds` already contained
`POST` and `COMMENT`. `notificationKinds` already contained `COMMUNITY_POST` and
`ACTIVITY`. `membershipStates` already distinguished `MEMBER`, `MODERATOR` and
`OWNER`, and `lib/domain/membership.ts` already answered `canParticipate` and
`canModerate`.

Nothing in that list was duplicated. No new role, no new reason vocabulary, no
new notification kind, no second audit system.

## What was added

Two tables, because reactions and comments had nowhere to live:

| Table | Why | Notable
| --- | --- | ---
| `post_reactions` | Likes | `unique(post_id, user_id)`; no `kind` column; no removal state
| `post_comments` | Flat comments | No `parent_id`; soft removal mirroring `posts`

**`post_reactions` has no `kind`.** The product has one reaction. Adding the
column now would mean inventing six emoji nobody chose; adding it later is one
column with a default.

**`post_reactions` has no `removed_at`.** Unliking is not a moderation decision
and nobody audits it, so unreact deletes the row and the count stays `count(*)`
with no filter every future query has to remember. Comments and posts do the
opposite, because a removal there is a decision someone may have to answer for.

**`post_comments` has no `parent_id`.** Threading is a different product -
collapse states, depth limits, and a moderation story for a subtree whose root
was removed. A club announcing something and members replying is served by a
flat list.

The migration for these two tables **has not been generated**. Run
`npm run db:generate`, inspect the SQL, then apply it. No migration SQL was
hand-written and no existing migration was touched.

## The shape of a write

```
UI -> server action -> service -> database -> revalidate -> UI
```

Unchanged from the rest of the product. Specifically:

- The action reads the actor from `auth()`. No action accepts a user id, an
  author, a community for an existing post, a timestamp, or a moderation field.
- The service looks up membership itself and asks `lib/domain/activity.ts`
  whether the action is permitted.
- The service returns `ServiceResult`, and the action passes the message back so
  a refusal is readable rather than a console entry.

### Rules live in the domain, once

`lib/domain/activity.ts` holds every rule as a pure function: length limits,
`canPublish`, `canEditPost`, `canRemovePost`, `canRemoveComment`, `canReport`,
`canDecideReport`. The composer decides whether to render from those functions
and the service decides whether to refuse from the same ones, so **the button
and the endpoint cannot disagree**. A hidden button is a courtesy to the person
who cannot use it; the service is the control.

## Authorization

| Action | Who
| --- | ---
| Publish, comment, react | `canParticipate` - MEMBER, MODERATOR, OWNER
| Edit a post | The author only
| Remove a post | The author, or a moderator of that community
| Remove a comment | The author, or a moderator of that community
| Report | Anyone signed in except the content's author
| Decide a report | A moderator of that community, or a campus ADMIN

**Moderators cannot edit.** This is the one deliberate asymmetry. A moderator
rewriting words that still carry someone else's name is the only moderation
action with no honest presentation - a reader cannot tell what was said from
what was changed. Moderators remove, which is visible, attributable, and
recorded.

**Membership, not `users.role`.** A campus admin is not a member of every club
and cannot post in a club's name. Admin widens the *moderation* queue, never the
ability to speak as a community.

**Community comes from the content.** `removePost`, `removeComment`,
`setPostReaction` and `decideReport` resolve the community by reading the post,
never by accepting it, so moderator rights cannot be claimed against a community
the content is not in.

## Notifications

Existing kinds only.

| Event | Kind | Recipients
| --- | --- | ---
| New announcement | `COMMUNITY_POST` | Participating members, minus the author
| New comment | `ACTIVITY` | The post's author, unless they commented
| First like on a post | `ACTIVITY` | The post's author, once per post

The post fan-out and the comment notification are written **in the same
transaction** as the content, because a post that exists while its notifications
silently failed is a club believing it told its members something it did not.

**Reactions notify once per post, not once per like.** Twelve likes producing
twelve inbox rows is how a student turns notifications off. The gate is
`hasNotification`, which already existed for exactly this class of problem - the
unique index cannot do it because it includes `createdAt`.

No client can create a notification. There is no action for it.

## Feed and Search needed no changes

This is the part worth stating plainly: **neither integration required code.**

- `lib/services/posts.ts` (`listRecentPosts`) reads the `posts` table and filters
  `removedAt is null`. A newly published post therefore appears in Campus Updates
  on the next request, with no seed reset - the actions revalidate `/home`.
- Search (PR #25) reads the same table with the same filter, so new posts become
  searchable and removed posts vanish, respecting its existing campus scoping,
  ranking and projection.

No second feed, no second post search service, and `lib/domain/feed.ts`,
`lib/services/feed.ts` and `lib/services/posts.ts` are untouched.

`activityStateFor` is exported for the feed to attach counts later if wanted -
three batched queries over post ids it already has. Home does not currently show
counts, which is honest rather than incomplete: it shows what it shows.

## Honesty about counts

The earlier work refused to render reaction and comment counts because the
schema had nothing to count. That refusal was correct, and it is preserved: the
counts rendered now are `count(*)` over real rows in real tables. Removed
comments are excluded from the count, because a count that includes content
nobody can see sends students looking for something that is gone.

## Query strategy

A community page is **six queries, flat**, regardless of how many announcements
it has:

1. the community, 2. its leads, 3. its activity (one join over posts,
communities, users, events), 4. reaction counts + comment counts + viewer
reactions (three grouped aggregates, concurrent), 5. comments for every post in
one `in (...)`, 6. upcoming events.

Nothing is per post. `commentsForPosts` exists precisely to avoid
`listPostComments` in a loop. Bounds: 20 announcements per page (50 hard cap),
20 comments per post, 60 reports per queue page.

## Post routes

There is none, deliberately. Announcements live on the community page and in the
feed, and a notification about a post links to its community - which is what
`resolveHrefs` in the notifications service already did, with a comment saying
an invented `/posts/<id>` would be a dead link. Adding a route for its own sake
would mean a page whose only content is one card.

## Reporting UI

An inline disclosure, not a modal. `components/ui` has no dialog primitive, and
an accessible one needs a focus trap, focus restoration, escape handling and an
inert background; hand-rolling that produces a modal a keyboard user can fall
out of. The disclosure keeps the reported content on screen while a reason is
chosen and works at 390px without any of that machinery.

Reasons render as radios from the table's own enum, and both the action and the
service check enum membership before writing, so a crafted request cannot file a
report with a reason the severity ordering has no rule for.

## Accessibility notes

- The like control uses `aria-pressed` and an accessible name carrying the count
  ("3 people liked Tryouts moved. Press to like."), because a heart that changes
  colour communicates nothing and `aria-pressed` alone leaves the count unspoken.
- No optimistic flip: the request can be refused, and an instant filled heart
  followed by a silent revert is worse than a moment of `aria-busy`.
- Post titles are `h3`, so the activity list is navigable by heading.
- Comment expansion uses `aria-expanded` / `aria-controls`; validation errors are
  tied to inputs with `aria-describedby` and `aria-invalid`.

## Demo seed

`lib/db/demo-activity-seed.ts`, run after the main demo seed:

```
npx tsx lib/db/demo-activity-seed.ts
```

Separate from `demo-seed.ts` (49KB) rather than appended to it, and **not wired
into `db:seed:demo`** - a documented extra step. Every row has an explicit
`demo-activity-*` id and every insert is `onConflictDoNothing`, so re-running is
a no-op rather than a doubled feed, and there is no delete pass that could
damage a database it did not create. Fixed PRNG seed, fictional content, and no
linked event that the service would itself reject.

## Not built

Nested comments, multiple reaction types, direct messaging, chat, websockets,
media uploads, AI moderation, edit history for posts (there is no `updatedAt` on
`posts` - see below), and analytics.

## Known gaps

- **`posts` has no `updatedAt`/`editedAt`.** An edited announcement cannot be
  labelled "edited". `post_comments` has `editedAt` because it was new; adding
  the equivalent to `posts` is a one-column migration and was left out rather
  than guessed at.
- **No moderation queue UI.** `listModerationQueue` and `decideReport` exist and
  are tested, but no page renders them yet.
- **Nothing here has been executed** - no typecheck, lint, test or build run, and
  no browser validation. See the PR for the exact status.
