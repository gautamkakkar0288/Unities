# Cirqles Database Specification

> **This document describes the schema that actually exists in code.**
>
> The source of truth is, in order: `lib/db/schema/*.ts`, the committed
> migrations in `drizzle/`, and `lib/domain/*`. If this document disagrees with
> those, those win and this document is a bug.
>
> An earlier version of this file described a relational model that was never
> built (`user_roles`, a separate `University` entity, a `Profile` table,
> `Tag`/`EntityTag`, messaging, reports). That material is preserved in
> section 8, marked obsolete, so the intent survives without being mistaken for
> the current design.

---

## 1. Status

| Tables | Landed in | Present on |
| --- | --- | --- |
| `places`, `users`, `accounts`, `sessions`, `verification_tokens`, `interests`, `user_interests`, `interest_suggestions`, `interest_suggestion_supporters`, `communities`, `memberships`, `community_proposals`, `community_proposal_supporters` | Phase 0–1 | `main` |
| `verification_requests`, `audit_log` | Phase 2.3 (PR #18) | `main` |
| `events`, `event_registrations` | Phase 3.1 (PR #19) | `main` |

All migrations have been merged. `main` is at **Phase 0–3 complete**.


---

## 2. Principles the schema actually follows

- **A place is a row, not a migration.** Campuses and cities share one table so
  the second university is data. See `places`.
- **One role column, not a junction table.** A user has exactly one platform
  role; community-level authority lives in `memberships.state`. See section 8
  for why the junction table was dropped.
- **Absence is a state.** No `NONE` membership row, no `NONE` registration row.
  Storing the null state would mean writing a row for every user who ever
  looked at a page.
- **Denormalised counters are transactional.** `communities.memberCount` and
  `events.registeredCount` are maintained in the same transaction as the rows
  they count, and the child table stays the source of truth.
- **Enum vocabularies are `text` with a TypeScript union**, not Postgres enum
  types, so adding a value is not a migration. `lib/db/schema/parity.test.ts`
  enforces that these unions match the domain model.
- **History outlives the actor.** Anything a reviewer or admin decided uses
  `on delete set null` for the actor, never `cascade`. Deleting an account must
  not erase what that account did.
- **Money is integer paise**, and nothing in the platform collects it.
- **Timestamps are `timestamp` with `mode: "date"`**; the domain layer passes
  ISO strings, never `Date`.

---

## 3. Identity and tenancy

### `places`

Universities and cities in one table. Replaces the never-built `universities`
table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | uuid |
| `kind` | text | `UNIVERSITY` \| `CITY` |
| `name` | text | |
| `slug` | text | unique |
| `status` | text | `ACTIVE` \| `PENDING` \| `SUSPENDED`, default `PENDING` |
| `parent_place_id` | text → `places.id` | self-referencing, `set null`. A campus sits inside a city |
| `email_domain` | text | e.g. `chitkara.edu.in`. Null for cities |
| `created_at` | timestamp | |

Indexes: `places_kind_idx`, `places_parent_idx`.

`parent_place_id` is what makes the discovery hierarchy real — Chitkara →
Tricity → interests (D28) walks one edge instead of consulting a hardcoded map.

### `users`

Auth.js adapter-compatible, extended with role and campus.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | uuid |
| `name` | text | nullable |
| `email` | text | **not null, unique** |
| `email_verified` | timestamp | null until the university email is confirmed |
| `image` | text | nullable |
| `password_hash` | text | nullable — null for future OAuth-only accounts |
| `role` | text | `STUDENT` \| `ORGANIZER` \| `COMMUNITY_MODERATOR` \| `UNIVERSITY_ADMIN` \| `PLATFORM_ADMIN`, default `STUDENT` |
| `university_id` | text → `places.id` | `set null` |
| `created_at` | timestamp | |

`university_id` points at `places`, and the application only ever writes a place
of kind `UNIVERSITY` there. Postgres cannot express that across a foreign key
without a trigger, so it is enforced at the single write site in registration.

**There is no `Profile` table.** `PersonSummary` in `lib/domain/types.ts` carries
`username` and `programme` for which no columns exist; those fields are not
persisted and must not be presented as if they were.

### `accounts`, `sessions`, `verification_tokens`

Auth.js adapter tables.

- `accounts` — PK `(provider, provider_account_id)`, `user_id` cascade. Reserved
  for OAuth / university SSO; no provider is wired yet.
- `sessions` — `session_token` PK, `user_id` cascade, `expires`. Present from
  day one so moving from JWT to database sessions is a config change rather
  than a migration (D8). **Currently unused: sessions are JWT.**
- `verification_tokens` — PK `(identifier, token)`, `expires`. This is what the
  Phase 2.1 university email verification actually writes to.

---

## 4. Interests

### `interests`

`id`, `slug` (unique), `label`, `sort_order` (curated, not alphabetical),
`status` (`ACTIVE` \| `RETIRED`), `created_at`.

Interests are rows with stable IDs, never free text on the user (D27). Free text
produces `Coding`, `coding`, `DSA`, and `Leetcode` as four categories within a
month, and nothing errors — recommendations just quietly stop working.
`RETIRED` rather than deletion, because an interest with communities attached
cannot be removed without orphaning them.

### `user_interests`

PK `(user_id, interest_id)`, both cascade, plus `created_at`. Index
`user_interests_interest_idx`. What a student picked at onboarding.

### `interest_suggestions`

`id`, `label`, `normalised_label`, `suggested_by_id` (`set null`),
`demand_count`, `status` (`reviewStatuses`), `maps_to_interest_id`,
`promoted_interest_id`, `reviewed_by_id`, `reviewer_note`, `created_at`,
`decided_at`.

Constraints: unique `interest_suggestions_normalised_idx` on
`normalised_label`, so `Padel`, `padel`, and `PADEL ` collapse into one row whose
demand rises. Index `interest_suggestions_status_idx` on `(status,
demand_count)` for the reviewer queue.

`maps_to_interest_id` records "this is the existing Coding interest" without
discarding the signal that a student looked under another name — that is
search-synonym data the product will want later.

### `interest_suggestion_supporters`

PK `(suggestion_id, user_id)`. One row per student, so demand cannot be inflated
by refreshing.

---

## 5. Communities

### `communities`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | uuid |
| `slug` | text | unique |
| `name` | text | |
| `tagline`, `about` | text | default `""` |
| `guidelines` | jsonb `string[]` | default `[]`. Always read whole, never queried |
| `kind` | text | `OFFICIAL` \| `INTEREST` \| `STUDENT` (D26) |
| `scope` | text | `UNIVERSITY` \| `CITY` \| `INTEREST` \| `GLOBAL`, default `UNIVERSITY` |
| `place_id` | text → `places.id` | `set null`. Null for interest and global |
| `interest_id` | text → `interests.id` | **not null**, `restrict` |
| `join_policy` | text | `OPEN` \| `APPROVAL` \| `INVITE`, default `OPEN` (D29) |
| `verification` | text | `UNVERIFIED` \| `PENDING` \| `VERIFIED`, default `UNVERIFIED` |
| `member_count` | integer | denormalised, transactional |
| `created_by_id` | text → `users.id` | `set null` |
| `created_at` | timestamp | |
| `archived_at` | timestamp | archived rather than deleted: posts and events outlive the community |

Indexes: `communities_scope_place_idx`, `communities_interest_idx`,
`communities_kind_idx`.

`verification` is the single source of truth for whether a club is real. Every
card, header, and badge already reads it, which is why approving a verification
request flips this column rather than storing the state twice.

`INTEREST` communities are seeded and ownerless on purpose: "Football" should not
belong to whoever typed it first.

### `memberships`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `community_id` | text → `communities.id` | cascade |
| `user_id` | text → `users.id` | cascade |
| `state` | text | `INVITED` \| `PENDING` \| `MEMBER` \| `MODERATOR` \| `OWNER`, default `MEMBER` |
| `requested_at` | timestamp | set for `PENDING`, kept afterwards |
| `joined_at` | timestamp | null while pending or invited |
| `invited_by_id`, `decided_by_id` | text → `users.id` | `set null` |
| `decided_at`, `created_at` | timestamp | |

Constraints: unique `memberships_community_user_idx` on `(community_id,
user_id)` — one row per person per community, in any state.
Indexes: `memberships_user_state_idx` ("my communities", every page load),
`memberships_community_state_idx` (the moderator queue).

This table, not `users.role`, is what grants authority over a single community.
`OWNER` and `MODERATOR` are membership states.

### `community_proposals`

`id`, `proposed_name`, `normalised_name`, `tagline`, `reason`, `interest_id`
(`restrict`), `scope`, `place_id`, `proposed_by_id`, `status`
(`reviewStatuses`), `supporter_count`, `reviewed_by_id`, `reviewer_note`,
`merged_into_community_id`, `created_community_id`, `created_at`, `decided_at`.

Indexes: `community_proposals_status_idx` on `(status, created_at)`,
`community_proposals_normalised_idx`.

A proposal is not a draft community. Approving one *creates* a community, which
is why `created_community_id` is a separate nullable reference rather than the
proposal row growing into the community row. `MERGED` is distinct from
`REJECTED`: "this already exists as Football" and "no" are different answers.

### `community_proposal_supporters`

PK `(proposal_id, user_id)`. Demand, not a vote — the reviewer decides.

---

## 6. Trust and accountability (PR #18)

### `verification_requests`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `community_id` | text → `communities.id` | cascade |
| `requested_by_id` | text → `users.id` | `set null` — the decision outlives the requester |
| `evidence` | text | **not null**. A reviewer needs something to judge |
| `status` | text | `PENDING` \| `APPROVED` \| `REJECTED` |
| `reviewed_by_id` | text → `users.id` | `set null` |
| `reviewer_note` | text | a rejection with no reason is one nobody can act on |
| `created_at`, `decided_at` | timestamp | |

Constraints: **partial** unique index `verification_requests_pending_idx` on
`community_id` `WHERE status = 'PENDING'`. One open request per community,
enforced by Postgres rather than by the service remembering to check — a
partial unique index survives two submissions racing each other, which a
SELECT-then-INSERT does not. Partial on `PENDING` so a rejected club can try
again.

Indexes: `verification_requests_status_idx` on `(status, created_at)` for the
reviewer queue, `verification_requests_community_idx`.

The verified *state* is not stored here. It lives on
`communities.verification`.

### `audit_log`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `actor_id` | text → `users.id` | `set null` — deleting an account is not a way to erase what it did |
| `action` | text | dotted name such as `verification.approved`. Deliberately not an enum; the vocabulary is typed in `lib/domain/audit.ts` so adding an action is not a migration |
| `target_kind` | text | `POST` \| `COMMENT` \| `EVENT` \| `COMMUNITY` \| `ACTIVITY` \| `USER` |
| `target_id` | text | **not a foreign key** — the target may be any of six tables |
| `summary` | text | the sentence a human reads, written at the time of the action |
| `created_at` | timestamp | |

Indexes: `audit_log_created_idx`, `audit_log_target_idx` on `(target_kind,
target_id)`, `audit_log_actor_idx`.

Written in the same transaction as the change it describes, never afterwards. An
audit row that can fail independently of the action is worse than none, because
the gaps are silent.

---

## 7. Events (PR #19)

### `events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | uuid |
| `slug` | text | unique |
| `title` | text | |
| `description` | text | default `""` |
| `kind` | text | `WORKSHOP` \| `TALK` \| `TOURNAMENT` \| `PERFORMANCE` \| `TRIP` \| `MEETUP` \| `DRIVE` |
| `mode` | text | `IN_PERSON` \| `ONLINE` \| `HYBRID`, default `IN_PERSON` |
| `venue` | text | free text, default `""`. A room number is not worth a `places` row |
| `status` | text | `DRAFT` \| `PUBLISHED` \| `CANCELLED`, default `DRAFT` |
| `agenda` | jsonb `Array<{at, title}>` | default `[]` |
| `starts_at`, `ends_at` | timestamp | **not null** |
| `registration_closes_at` | timestamp | **null means "closes when the event starts"** |
| `capacity` | integer | **null means unlimited** |
| `registered_count` | integer | denormalised, **confirmed seats only** — never waitlist entries |
| `fee_in_paise` | integer | null for free. Recorded for display; **nothing collects it** |
| `community_id` | text → `communities.id` | **not null**, cascade |
| `interest_id` | text → `interests.id` | **not null**, `restrict` |
| `created_by_id` | text → `users.id` | `set null` |
| `created_at`, `cancelled_at` | timestamp | |

Indexes: `events_status_starts_idx` (the discovery query: published, soonest
first), `events_community_starts_idx`, `events_interest_idx`.

`TRIP` is in the enum because the domain union lists it and the two must agree,
but **nothing in this phase can create one**. A trip carries obligations no
workshop has — emergency contact, consent, an itemised refund policy — which
would live in a `trip_details` table that does not exist. `createEvent` refuses
`TRIP`.

`CANCELLED` is a status, not a deletion: students registered for a thing that is
no longer happening still need to be told, and a deleted row cannot notify
anyone.

### `event_registrations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | |
| `event_id` | text → `events.id` | cascade |
| `user_id` | text → `users.id` | cascade |
| `state` | text | `REGISTERED` \| `WAITLISTED` \| `CANCELLED`, default `REGISTERED` |
| `created_at` | timestamp | **the waitlist ordering key — deliberately survives promotion** |
| `promoted_at` | timestamp | set when a waitlist entry became a confirmed seat |
| `cancelled_at` | timestamp | |

Constraints: unique `event_registrations_event_user_idx` on `(event_id,
user_id)`. A student cannot be registered and waitlisted at once, and
re-registering after cancelling updates the existing row rather than adding a
second one.

Indexes: `event_registrations_queue_idx` on `(event_id, state, created_at)`,
which serves both hot reads — counting confirmed seats, and finding the oldest
waitlist entry to promote. `event_registrations_user_idx` on `(user_id, state)`.

**Stored vs computed states.** The domain's `RegistrationState` has four values
and only two are storable:

| Domain value | Where it comes from |
| --- | --- |
| `NONE` | absence of a row |
| `REGISTERED` | stored |
| `WAITLISTED` | stored |
| `CLOSED` | computed from the clock in `describeRegistration`, never stored |

`CANCELLED` runs the other way: it exists in the table but not in the domain
union, because a student who drops out and signs up again must not collide with
the unique constraint, and an organiser looking at a half-empty room deserves to
know whether nobody came or forty people cancelled.

**Concurrency.** Capacity decisions take a row lock on the event
(`.for("update")`) so two students cannot take the last seat simultaneously.
Promotion on cancellation happens in the same transaction as the cancellation.

---

## 8. Obsolete designs — do not reintroduce

These appeared in the original specification and were deliberately not built.
They are recorded so the reasoning is not lost and so nobody re-adds them by
reading an old draft.

| Proposed | What happened instead | Why |
| --- | --- | --- |
| `University` entity | `places` with `kind = 'UNIVERSITY'` | A city is a discovery scope in exactly the same way a campus is. Two tables would make every scope-aware query a union |
| `Role` + `user_roles` junction | `users.role` single column + `memberships.state` | Nobody needs two platform roles at once. Community-level authority is already a membership state, so the junction table would model authority twice |
| `Profile` table | columns on `users` | Splitting identity from presentation buys a join and nothing else at this size. `PersonSummary.username` / `.programme` remain unpersisted |
| `Tag` + `EntityTag` | `interests` + `interest_id` foreign keys | A curated taxonomy is the point (D27). Free-form tags are the failure mode it was designed to avoid |
| `Opportunity` | not built | Phase 4+ |
| `Post` | not built | Phase 4.2 |
| `Notification` | not built | Phase 4.6 |
| `Thread` / `Message` | not built | Explicitly out of scope until the core loop works |
| `Report` / `ModerationAction` | `audit_log` | Reports arrive in Phase 5 and will point at `auditTargetKinds`. A second moderation vocabulary would disagree with the first within a month |
| `SavedItem` | not built | Phase 4.3 |
| Postgres `enum` types | `text` + TypeScript unions + `parity.test.ts` | Adding a value must not require a migration |

---

## 9. Migrations

Migrations are generated, never hand-written:

```
npm run db:generate    # drizzle-kit reads lib/db/schema and writes drizzle/
npm run db:migrate     # applies them
npm run db:seed        # interests, places, seeded communities
```

`db:push` is not used outside throwaway local experiments. CI verifies that the
committed migrations are current by regenerating them and failing if the working
tree is dirty, which is what catches a schema change that shipped without its
migration.

The filename suffix drizzle-kit generates is random (`0001_calm_siren`,
`0001_abandoned_dormammu`, …). It cannot be predicted or authored by hand; the
snapshot JSON alongside it even less so.

Migration order:

| # | Contents |
| --- | --- |
| `0000_certain_living_lightning` | everything through Phase 1 |
| `0001` | `verification_requests`, `audit_log` (PR #18) |
| `0002` | `events`, `event_registrations` (PR #19) |

Both PRs must not generate `0001` independently. #18 merges first, then
`phase-3/events` merges `main` and regenerates as `0002`.

Habits for future changes: add nullable columns first, backfill, then tighten;
prefer additive migrations; never rewrite an applied migration.
