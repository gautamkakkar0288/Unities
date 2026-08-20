# Search

How `/search` works, and why it works that way.

Search spans four things a student can act on: events, communities,
opportunities and campus updates. It runs against the same database and the same
services as the rest of the product. There is no search index, no separate
search store, and nothing about it is faked for the demo.

## Architecture

Three layers, with one rule each.

| Layer | File | Owns |
| --- | --- | --- |
| Domain | `lib/domain/search.ts` | What the query means, and what order results appear in |
| Service | `lib/services/search.ts` | Which rows match, and who is allowed to see them |
| Route | `app/(app)/search/page.tsx` | Layout, and nothing else |

**Matching is SQL. Ranking is domain.** This is the central decision. Postgres
is far better at filtering than JavaScript is, and far worse at expressing
"exact name beats prefix beats description" without a hand-maintained pile of
`case` expressions that no test can read and no reviewer can check. So the
database answers *is this a result*, and a pure function answers *where does it
go*. The consequence worth having: every ranking rule is unit-testable against
string literals, with no database and no fixtures.

The domain layer has no imports from `lib/db` or React, takes its clock as a
parameter, and never constructs a `RegExp` from user input.

## Search sources

Only public, already-visible content. The fields searched per category:

| Category | Fields matched | Ranked as name / prose / taxonomy |
| --- | --- | --- |
| Events | `title`, `description`, `venue`, `kind`, interest label | title / description / kind, venue, interest, community |
| Communities | `name`, `slug`, `tagline`, `about`, interest label | name / tagline + about / slug, interest, place |
| Opportunities | `title`, `description`, `kind`, interest label, offering community's `name` | title / description / kind, interest, community |
| Updates | `title`, `body`, community `name` | title / body / community |

`slug` is searched for communities because students paste and type URLs, and
`coding-club` should find the Coding Club.

`kind` is searched because "workshop" and "internship" are words students type.
It is weighted as taxonomy, so a workshop actually *called* "Workshop" still
wins - matching on kind is a weak signal precisely because every row of that
type shares it.

There is no organisation or provider column on `opportunities`. An opportunity
is offered by a community or by nobody in particular, so "organisation" means the
optional `communityId` join. Inventing a provider field would have meant
inventing its values.

**Not searched:** anything on `users` beyond a display name, `email`,
`passwordHash`, auth tokens, sessions, draft events, archived communities,
removed posts, moderation reasons, join requests, notifications, saved items.
Removed posts deserve a note: moderation removes rather than deletes so the
decision stays reviewable, which would be pointless if the removed text stayed
findable through search.

People are not searchable. A student directory - names, programmes, photographs
of a hundred strangers - is a privacy decision, not a tab, and it is not made
here. `SearchResultKind` still carries `PERSON` and `ACTIVITY` for the older
grouped-result helpers; the `SearchTab` union is what the route actually offers.

## Ranking algorithm

For each term, each field is scored 0-1 by match strength:

| Match | Score |
| --- | --- |
| Field equals the term | 1.0 |
| Field starts with the term | 0.8 |
| Term starts a word within the field | 0.62 |
| Term appears mid-word | 0.42 |
| No match | 0 |

Those scores are then weighted by which field matched:

| Field | Weight |
| --- | --- |
| Title or name | 1.0 |
| Description, tagline, body | 0.34 |
| Taxonomy - kind, interest, venue, community | 0.18 |
| Timeliness | 0.12 |

The gaps are wide deliberately. An exact name match has to outrank a prefix
candidate that *also* matches on description and taxonomy, otherwise typing a
club's exact name does not put that club first - the one behaviour everybody
expects a search box to get right.

A candidate's score is the mean of its per-term scores, so "ai workshop" rewards
a row matching both words over one matching either twice. Terms that match
nothing contribute zero rather than disqualifying the row; the database decided
what is a result.

**Timeliness** is `1 - distance / 45 days`, in either direction, from the row's
`timelyAt`: an event's start, an opportunity's deadline, a post's creation date.
Communities have none - nothing about a club is more or less timely. At a twelfth
of a name match it is a tie-shaper, not a ranking signal, which is what stops
"robotics" returning tomorrow's poetry reading.

**Stable tie-breaking**, in order: score, then timeliness, then title, then id.
The id makes the ordering total. Without it, two equally-scored rows swap places
between requests depending on how the database felt about row order, and a list
that reshuffles on refresh reads as broken even when every row is correct.

Scores are rounded to six decimal places so floating-point dust cannot defeat the
tie-breaks.

Ranking is deterministic and pure. No AI, no LLM, no randomness, no `Date.now()`.

## Query parameters

| Parameter | Meaning | Invalid input |
| --- | --- | --- |
| `q` | The query. Trimmed, lowercased and whitespace-collapsed for matching; the raw form is echoed back to the input and the empty state. | Missing or blank is the landing state |
| `type` | `events`, `communities`, `opportunities`, `updates`. Absent means All. | Falls back to All |

`/search?q=hackathon` and `/search?q=hackathon&type=events`.

`parseSearchParams` is total by construction. Repeated parameters take the first
value, unknown tabs fall back to All, and queries are capped at 120 characters.
This input comes straight from a query string anyone can edit, and a search page
that 500s on `?type=<script>` is a worse bug than one that shows the All tab.

The URL is the only state. The page is a GET form and server-rendered links, so
reload preserves the search, back and forward work, results are shareable, and
the route ships no client JavaScript of its own. The controlled-input version of
this needs `useState`, a submit handler, a `router.push` and a `useEffect` to
resynchronise on back.

The tab rides along in a hidden field, so refining a query from the Events tab
keeps you on the Events tab.

## Security model

**Identity is derived, never accepted.** The route reads `auth()` and passes
`session.user.id` down. `viewerId` is a function parameter in the service layer
and is never read from a request. There is no `userId`, `universityId` or `role`
parameter anywhere in the search surface - no query string can widen what a
student sees.

**Campus scoping** reuses `scopePlaceIdsForUser` from the communities service,
which resolves the viewer's university and its parent city. Every category
filters on `placeId in (scope) or placeId is null` in the `where` clause, so
placeless content - national listings, global interest communities - stays
visible while another university's content is unreachable. Reusing that helper is
the point: search cannot see a wider campus than browsing does, because both ask
the same function.

Events and updates are scoped through their community's place, which is the same
rule the rest of the product applies.

**Projections carry only what the UI renders.** `UpdateSearchResult` has
`authorName` and nothing else about the author, so a result set structurally
cannot carry an email address rather than relying on every caller to remember.
`lib/services/search.db.test.ts` asserts that no email or password hash appears
in a serialised result set.

**Wildcards are escaped.** `%` and `_` are escaped before reaching `ilike`, so
searching `100%` does not match every row. Ranking does substring work only and
never builds a pattern from user input, so `c++`, `(`, and `.*` are ordinary
queries rather than a `SyntaxError` or a hang.

## Database strategy

The existing Drizzle layer over Postgres, and PGlite for the demo. No new
abstraction, no SQLite, no schema change, no migration.

Matching is one query per category: `ilike` across the listed columns, every term
ANDed, campus scope in the `where` clause, capped at 60 rows.

**Why 60 and not the display limit.** Ranking needs a pool. Taking the database's
first five rows and ordering those is not relevance, because SQL ordered them by
something unrelated to the query. Sixty is comfortably above any plausible campus
result set and still a hard ceiling, so a two-character query cannot become a
table scan rendered to a page.

**Borrowed projections.** Matching returns ids and the prose that was matched;
the display shape comes from `listEvents`, `listCommunitiesForViewer` and
`listOpportunities`. Writing a second row-to-`EventSummary` mapper inside search
would mean two definitions of what an event looks like, and the day they disagree
is the day a search result shows a seat count no other screen agrees with. It
also means search inherits the viewer-registration and membership logic those
services already own, and inherits their exclusions - a draft event cannot
become visible through search, because `listEvents` is still the thing deciding.

The cost: those two hydration reads fetch a category's visible set rather than
only the matched rows. That is bounded by campus size, not by result count. It is
also the documented upgrade point - give `listEvents` and
`listCommunitiesForViewer` an `ids` filter, as `listOpportunities` already has,
and hydration narrows with no change to `lib/services/search.ts`.

Updates get their query here because `main` has no posts service. One query with
three joins resolves community, author name and linked event.

## Performance

- **Query count is constant**, not proportional to results. The All tab is four
  match queries, two hydration reads, one id-filtered read and three saved-id
  lookups, all inside a single `Promise.all`, so the page waits on the slowest
  rather than the sum. A single-category tab skips the other three categories
  entirely - switching tabs costs one category's work.
- **No N+1.** Nothing is fetched per row. Community, author and linked event for
  updates come from joins; saved state comes from three set lookups for the whole
  page.
- **Limits everywhere.** 60-row scan cap per category, 5 per category on All, 24
  on a single-category tab.
- **Short queries never reach the database.** Under two characters the service
  returns empty without a query.

### Why Search filters in the database when Explore filters in memory

Explore deliberately loads its visible set and filters in memory: its filters are
faceted, cheap to apply, and reused across several sections of the same page, and
at demo scale one read beats several. Search cannot work that way. A query is
unbounded user text, arbitrary substrings across four tables, so the candidate set
is unknown before the query runs. Loading four tables to filter them in JavaScript
would be the exact anti-pattern - it scales with the size of the campus rather
than the size of the answer. Hence `ilike` in the `where` clause.

## Accessibility and layout

- The input is a labelled `<input type="search">` inside a `role="search"` form.
  Enter submits because forms submit. Autofocus happens only when the query is
  empty, so returning from a result does not throw the keyboard at you.
- Tabs are links with `aria-current="page"`, so they are shareable and reachable
  through browser history.
- Focus rings use the shared `focus-visible:ring-3` token. The tab strip's
  negative margin and matching padding stop the first and last ring being clipped
  by its own overflow context.
- 390px: input and button on one row, tab strip scrolls horizontally, cards stack
  to one column, no horizontal overflow. 1440px: three-column result grid with a
  heading and a "View all" link per category.

There is no autocomplete. It would need either a debounced client endpoint or a
real index, and reliable beats flashy this phase.

## Navigation

No navigation change was needed, and none was made.

`features/shell/components/app-top-bar.tsx` already links to `/search`, styled
like an input, on every authenticated page. Both navigation documents agree the
top bar owns global search, which is why `lib/navigation/config.ts` has no search
entry. Adding one would have produced two affordances for one destination.

## Result components

`EventCard`, `CommunityCard` and `OpportunityCard` are reused unchanged. They
already render the fields a result needs and they accept an `action` slot, so a
`SaveButton` composes in without a new variant. No `SearchEventCard` was written,
because it would have been the same card with a different name.

The one new component is `UpdateResultCard`, because `main` has no component for
a post. It carries no reaction or comment affordances - the `posts` table stores
no such counts, and a comment button that cannot comment is worse than an
announcement that admits it is an announcement.

## Future upgrade path

In the order it would be worth doing:

1. **`ids` filters on `listEvents` and `listCommunitiesForViewer`**, closing the
   hydration gap above. Small, and the only item here with a real cost today.
2. **Trigram indexes** - `pg_trgm` with a GIN index on the searched columns.
   `ilike '%term%'` cannot use a btree index, so this is the first thing to do
   when the tables outgrow a sequential scan.
3. **PostgreSQL full-text search** - `tsvector` columns with `ts_rank`. Brings
   stemming, so "robotics" finds "robotic". Worth having, and worth noting that
   it moves ranking into SQL, so the weights would need re-expressing as
   `setweight` and the domain tests would lose their teeth. Keep the domain
   ranking as the reranker over a full-text candidate set rather than replacing
   it.
4. **Typo tolerance** via trigram similarity - "hackathan" finding "hackathon".
5. **Search analytics** - what students search and what returns nothing is the
   best available signal for what the campus is missing.

None of these are implemented. Today's volumes do not need them, and each one
adds an index or a column that has to be migrated, backfilled and kept in step
with writes.

## Tests

- `lib/domain/search.test.ts` - parsing including hostile and repeated
  parameters, match-strength ordering, field weighting, multi-term averaging,
  case insensitivity, regex metacharacters, timeliness bounds, stable ordering,
  input-order independence, limits.
- `lib/services/search.db.test.ts` - per-category search, case-insensitive and
  partial matching, relevance ordering end to end, per-category caps,
  tab-scoped work, literal wildcards, and campus scoping across two
  universities. Skips when `DATABASE_URL` is unset, per the existing convention.
