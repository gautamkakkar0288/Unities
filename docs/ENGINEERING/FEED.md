# Home feed and Explore

Phase 4, second half. The first half made Saved and Notifications real; this
turns `/home` and `/explore` from placeholders into the product's front door.

## Shape of the code

```
lib/domain/feed.ts       pure ranking: relevance, upcoming, community suggestions, greeting
lib/domain/explore.ts    pure filtering: tab and chip parsing, event filters, text match
lib/services/posts.ts    first read path for the posts table
lib/services/feed.ts     batched reads -> one projection per page
app/(app)/home/          layout only
app/(app)/explore/       layout only
features/feed/           FeedSection, QuickActions, UpdateCard
features/explore/        ExploreTabs, ExploreSearch, EventFilterChips
```

The split is the point. Every ordering decision is a pure function over
projections, so the rules can be tested against fixed inputs instead of by
rendering a page against a database. Ranking inside a server component is only
testable end to end, which in practice means it is not tested.

## Decisions

**Ranking is deterministic and hand-weighted.** No model, no scoring service.
"Personalised" means four facts the student already gave us - interests,
memberships, saves, registrations - combined with fixed weights that live in one
place at the top of `lib/domain/feed.ts`. The ordering can be justified out loud,
which is what makes it demonstrable.

**Interest outranks membership outranks imminence.** Interest is the only signal
the student chose explicitly for this purpose. Imminence is deliberately weighted
below both, because `Happening soon` already exists - letting it dominate `For
you` would make the two sections show the same events in the same order.

**"For you" excludes what the student already holds.** Recommending an event back
to the person who registered for it is the clearest possible signal that a feed is
not paying attention. Same rule for community suggestions: membership is a filter,
not a penalty. `INVITED` survives, because an unaccepted invitation is the most
actionable card on the page.

**Trending was reused, not rewritten.** `lib/domain/trending.ts` already scored
demand, fill rate and imminence, and `time-buckets.ts` already grouped events into
campus-time buckets. Both are called as they are.

**Explore filters in memory, on purpose.** One batched read serves every tab and
every chip combination, so switching a filter is instant and the counts beside the
tabs cannot disagree with the list beneath them - two queries can disagree across a
write that lands between them. If the dataset outgrows this, the filters move into
the where clause and the domain functions stay as the specification of what each one
means.

**Filters only where the schema can answer.** Timing comes from the event dates,
`Free` from `feeInPaise`, `Online` from `mode` (hybrid counts - a student who cannot
travel can still attend), and category chips from the real `EventKind` enum. The
brief also asked for `Technical`, `Cultural` and `Sports`: those are interest
taxonomy rather than event columns, so they are **not** offered. A chip that
silently matches nothing is worse than an absent one. `Hackathons` is likewise not a
kind - the closest real values are `WORKSHOP` and `TOURNAMENT`. Trips are omitted
because `createEvent` refuses to create them.

**No second search architecture.** The Explore text box is a substring filter over
rows already in memory, and the label says "Filter by name" rather than "Search" so
it does not promise what the later global search page will deliver.

**Tabs and chips are links, not client state.** Every choice is a URL parameter
parsed with an explicit fallback, so views are shareable, the back button behaves,
filters survive a reload, and Explore ships no extra client JavaScript. Unknown or
hostile parameter values fall back rather than throw - this input arrives straight
from a query string.

**The greeting is computed server-side in IST.** Reading the clock in a client
component is the classic way to earn a hydration mismatch, and "Good evening"
flickering to "Good afternoon" is exactly the detail that makes a showcase feel
unfinished.

**Campus updates got a narrower projection than `Post`.** The domain `Post` type
carries `pinned`, `reactionCount`, `commentCount` and `viewerHasReacted`; the
`posts` table has none of those columns. Rather than reuse the type and invent the
numbers, `PostSummary` exposes only what the table stores. Announcements render
with no reaction or comment affordances, because they are announcements.

**Posts reads only.** Publishing an announcement is an organiser flow with its own
authorisation and notification fan-out. Bolting a write onto a feed query is how
that ends up unaudited.

## Performance

- `loadHomeFeed` issues eight reads with one `Promise.all`; `loadExploreData`
  issues seven. Neither page queries per card.
- `listRecentPosts` resolves community, author and linked event in a single query
  with three joins. Fifteen announcements would otherwise be forty-six round trips.
- Saved state arrives as three id sets, so every card knows whether it is saved
  without asking.
- Projections carry display names only. No email addresses, no password hashes, no
  raw rows. `posts.db.test.ts` and `feed.db.test.ts` both assert that no test
  address appears anywhere in the serialised result.

## Not verified locally

This branch was written in an environment with no npm registry, no PostgreSQL and
no browser, so `typecheck`, `lint`, `test` and `build` have **not** been run
against it, and neither has any browser pass. The DB suites follow the existing
`describe.skipIf(!process.env.DATABASE_URL)` convention and will skip until they
are run against the demo database.
