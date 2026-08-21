# Mobile API

The JSON surface the Flutter client (`Unities-app`) talks to. Everything lives
under `app/api/mobile/*` and every route is an adapter: it authenticates,
validates, calls an existing function in `lib/services/*` or `lib/domain/*`,
serialises the result, and stops. No business rule is implemented here, and any
rule that appears to be is a bug worth reporting.

The web app is unchanged. No existing service, action, schema or route was
modified to build this.

## Shape of every response

Success:

```json
{ "data": { }, "meta": { } }
```

Lists always carry `meta`:

```json
{ "data": [], "meta": { "nextCursor": null, "hasMore": false, "limit": 20 } }
```

Failure:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Sign in to continue." } }
```

`data` and `error` never appear together. Validation failures may add
`error.fieldErrors`, a flat map of field name to message; a client that ignores
it still works.

### Error codes

| Code | Status | Means |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | No session, or a session whose user no longer exists. |
| `FORBIDDEN` | 403 | Authenticated, but not allowed. |
| `NOT_FOUND` | 404 | No such resource, or none this viewer may see. |
| `VALIDATION_ERROR` | 422 | A parameter or body field is wrong. |
| `CONFLICT` | 409 | Well-formed, but the world says no (closed, cancelled, sole owner). |
| `BAD_REQUEST` | 400 | Malformed body, or a body trying to act for another user. |
| `MISSING_BACKEND_CAPABILITY` | 501 | The feature does not exist server-side yet. |
| `INTERNAL_ERROR` | 500 | Something threw. Details are logged, never returned. |

Messages are the service layer's own wording wherever a service refused, because
those sentences were already written for a student and are already what the web
UI shows. Raw database and framework errors never reach a client: `withMobileRoute`
catches every throw, logs it with the route name, and answers with a generic
`INTERNAL_ERROR`.

## Authentication

There is no second auth system. `requireMobileSession()` calls the existing
Auth.js `auth()` helper, so a request is authenticated exactly when it carries
the same session cookie the web app uses. Auth.js is configured with the JWT
strategy, so no session row is read.

The helper returns `{ userId, role, email, name, image }`. `role` falls back to
`STUDENT` if the token has no role claim. A request without a session gets 401
before any parameter is parsed or any query runs.

**How the Flutter client gets that cookie** (unchanged by this phase, and already
modelled in `AuthPaths`):

1. `GET /api/auth/csrf` - read `csrfToken`, keep the cookie.
2. `POST /api/auth/callback/credentials` - form-encoded `email`, `password`,
   `csrfToken`. Do not follow the redirect; the `Set-Cookie` on the 302 is the
   session.
3. Send that cookie on every `/api/mobile/*` request.
4. `GET /api/auth/session` to check it, `POST /api/auth/signout` to end it.

Sign-up is the only unauthenticated mobile route.

## Pagination

`?limit=` defaults to 20 and is capped at 50. Zero, negative, fractional and
non-numeric values are refused rather than clamped, so a client bug surfaces
immediately instead of silently returning a different page size than it asked
for. There is no way to ask for an unlimited query.

`?cursor=` is an ISO-8601 timestamp and is validated as one.

Only notifications page for real, because `listNotifications` already accepts a
`before` timestamp under a stable ordering. Events and communities return
`"nextCursor": null` because their services take a limit and no cursor -
accepting a cursor this layer cannot honour would produce an infinite scroll that
silently repeats page one. `hasMore` still tells the client whether rows were
left behind. Keyset paging for those two belongs in the services, next to the
ordering it has to match.

---

## `GET /api/mobile/me`

The signed-in student's profile.

- **Auth** required. **Params** none.
- **Calls** `getProfile(userId)`, which is self-only by construction - it takes
  the viewer's id and there is no parameter to point it elsewhere.
- **Errors** `UNAUTHORIZED` (no session, or the session's user has been deleted -
  a stale cookie is not a 500).

```json
{
  "data": {
    "id": "usr_1",
    "name": "Asha",
    "email": "asha@campus.edu",
    "image": null,
    "imageUrl": null,
    "role": "STUDENT",
    "roleChangedSinceSignIn": false,
    "university": { "id": "plc_1", "slug": "iit-b", "name": "IIT Bombay" },
    "interests": [{ "id": "int_1", "slug": "football", "label": "Football" }],
    "communities": [{ "id": "cmy_1", "slug": "fc", "name": "FC", "state": "MEMBER" }]
  }
}
```

The password hash is not in the projection at all, so it cannot leak here. Nor
are `email_verified`, audit rows or security metadata. `roleChangedSinceSignIn`
is true when the database role differs from the session claim, which is the
client's cue to re-authenticate rather than trust its cached role.

## `GET /api/mobile/feed`

**Not available.** Returns 501 `MISSING_BACKEND_CAPABILITY` with
`"The feed is not available yet. Browse events and communities in the meantime."`

This is deliberate and is the honest answer. There is no feed or post service in
this backend: `lib/services/` has no feed module, `features/posts/` contains
components only, and `app/(app)/home/page.tsx` renders an `EmptyState` saying the
recommendation feed arrives with communities and posts. Returning `{"data": []}`
would have been indistinguishable from a student with nothing to read, and the
Flutter client already models this exact case as
`MissingBackendCapabilityError`.

The route still authenticates and still validates `limit` and `cursor`, so the
client's paging code can be exercised against it today and the response shape
will not change when a feed service lands.

## `GET /api/mobile/events`

Not in the Phase 2 list, added because the detail endpoint takes a slug and
without a list there is no way for a client to discover one while the feed does
not exist.

- **Auth** required. **Params** `limit`, optional `communityId`.
- **Calls** `listEvents({ viewerId, communityId, limit })`, which excludes drafts
  and archived communities and orders by start time. Statuses come from
  `eventStatusesByIds`.
- **Pagination** `hasMore` only; `nextCursor` is null.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`.

## `GET /api/mobile/events/:slug`

Everything the detail screen needs.

- **Auth** required. **Params** `slug`, matched against
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` before any query runs.
- **Calls** `getEventBySlug({ slug, viewerId })`.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`.
- **Authorization** the service is viewer-aware and drafts resolve to null, so a
  draft is a 404 rather than a leak. Organiser identity is limited to the
  community reference the service returns; `listRegistrations` - the one function
  that exposes attendee names, and only to owners and moderators - is not called
  from any mobile route.

```json
{
  "data": {
    "id": "evt_1",
    "slug": "open-mic-night",
    "title": "Open Mic Night",
    "description": "Bring an instrument.",
    "kind": "PERFORMANCE",
    "mode": "IN_PERSON",
    "venue": "Audi 2",
    "status": "PUBLISHED",
    "startsAt": "2026-09-01T13:30:00.000Z",
    "endsAt": "2026-09-01T16:00:00.000Z",
    "registrationClosesAt": null,
    "capacity": 120,
    "registeredCount": 84,
    "waitlistCount": 3,
    "feeInPaise": null,
    "agenda": [{ "at": "18:00", "title": "Doors" }],
    "community": { "id": "cmy_1", "slug": "music", "name": "Music Club", "verification": "VERIFIED" },
    "communityId": "cmy_1",
    "interest": { "id": "int_2", "slug": "music", "label": "Music" },
    "interestId": "int_2",
    "viewerRegistration": "NONE",
    "viewerRegistrationState": "NONE"
  }
}
```

`feeInPaise` records what a thing costs. Nothing in this platform collects money;
no screen may imply otherwise.

## `POST /api/mobile/events/:slug/registration`

- **Auth** required. **Params** `slug`. **Body** none required. A body containing
  `userId` or `user_id` is refused with 400 rather than ignored.
- **Calls** `getEventBySlug` (slug to id, and the visibility check), then
  `registerForEvent({ userId, eventId })`.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`, `BAD_REQUEST`, `NOT_FOUND`
  (missing, draft), `CONFLICT` (cancelled, registration closed).
- **Authorization** the registered account is always `session.userId`. No code
  path reads a user identifier from the body or URL.

```json
{ "data": { "eventSlug": "open-mic-night", "state": "REGISTERED", "viewerRegistration": "REGISTERED", "viewerRegistrationState": "REGISTERED" } }
```

Two behaviours worth knowing, both the service's and both intentional:

- **A full event is not an error.** When the seats are gone the student is
  waitlisted and the response says `"WAITLISTED"` with a 200.
- **Registering twice is not an error.** The service is idempotent, so a retry
  after a dropped connection returns the existing state with a 200. Only a
  cancelled event or closed registration produces a 409.

## `GET /api/mobile/communities`

- **Auth** required. **Params** `limit`, `search` (trimmed, max 80 chars),
  `scope` (`UNIVERSITY` | `CITY` | `INTEREST` | `GLOBAL`), `cursor` accepted and
  validated but not yet honoured.
- **Calls** `listCommunitiesForViewer({ viewerId, limit })`, then
  `filterCommunities` and `parseCommunityScope` from `lib/domain/community` for
  search and scope - the same helpers the web directory uses, so the two surfaces
  cannot disagree about what matches.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`.
- **Authorization** visibility, ordering and archived-exclusion are entirely the
  service's. This route never adds back a community the service left out.

An unrecognised `scope` is treated as no filter, matching the web directory
rather than erroring on a stale link.

Search has a known cost: `filterCommunities` matches in memory and its own
documentation says that is only equivalent to SQL while the page holds every
visible row. So a filtered request fetches the viewer's whole visible directory
before paging. Correct today, and the thing to move into the query when the
directory outgrows a single page.

## `GET /api/mobile/communities/:slug`

- **Auth** required. **Params** `slug`.
- **Calls** `getCommunityBySlug({ slug, viewerId })` and
  `listCommunityLeads({ communityId })`.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND` (missing or
  archived).
- **Authorization** `listCommunityLeads` returns owners and moderators only.
  Ordinary members, pending applicants and invitees are not public information
  and this route does not widen that. `listPendingRequests`, which is
  moderator-only, is not called from any mobile route.

```json
{
  "data": {
    "id": "cmy_1",
    "slug": "music",
    "name": "Music Club",
    "tagline": "Every Thursday",
    "about": "Long description.",
    "guidelines": ["Be kind."],
    "kind": "STUDENT",
    "scope": "UNIVERSITY",
    "place": { "id": "plc_1", "slug": "iit-b", "name": "IIT Bombay" },
    "placeId": "plc_1",
    "interest": { "id": "int_2", "slug": "music", "label": "Music" },
    "interestId": "int_2",
    "joinPolicy": "OPEN",
    "verification": "VERIFIED",
    "memberCount": 214,
    "viewerMembership": "MEMBER",
    "moderators": [{ "id": "usr_9", "name": "Ravi", "avatarUrl": null, "imageUrl": null, "role": "OWNER", "state": "OWNER" }]
  }
}
```

Moderator entries carry a name and avatar and never an email address.

## `POST /api/mobile/communities/:slug/membership`

- **Auth** required. **Params** `slug`. **Body** none required; one naming a user
  is refused with 400.
- **Calls** `getCommunityBySlug`, then `joinCommunity({ userId, communityId })`.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`, `BAD_REQUEST`, `NOT_FOUND`,
  `FORBIDDEN` (invite-only: "This community is invite only. A moderator has to
  add you.").

```json
{ "data": { "communitySlug": "music", "state": "MEMBER", "viewerMembership": "MEMBER", "pending": false } }
```

| Community | Result |
| --- | --- |
| `OPEN` | 200, `MEMBER`, member count incremented in the same transaction |
| `APPROVAL` | 200, `PENDING`, `pending: true` |
| `INVITE` | 403 |
| Already a member | 200, existing state, nothing written |
| Missing or archived | 404 |

Success is 200 with a state rather than 201, because the client cannot know in
advance whether it is joining or queuing and the useful answer is what its
membership is now.

## `GET /api/mobile/notifications`

- **Auth** required. **Params** `limit`, `cursor` (ISO timestamp),
  `unreadOnly=true`.
- **Calls** `listNotifications({ viewerId, limit, before, unreadOnly })`,
  `countUnreadNotifications(viewerId)`, and a viewer-scoped projection for
  `targetKind`, `targetId` and `readAt`.
- **Pagination** real. `meta.nextCursor` is the last item's `createdAt`, offered
  only when another page exists.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`.
- **Authorization** the service scopes by `viewerId` and this route has no
  parameter that could point it at anyone else.

```json
{
  "data": [
    {
      "id": "ntf_1",
      "userId": "usr_1",
      "kind": "EVENT_REMINDER",
      "title": "Open Mic Night starts in an hour",
      "body": "Audi 2.",
      "createdAt": "2026-08-31T12:30:00.000Z",
      "read": false,
      "readAt": null,
      "targetKind": "EVENT",
      "targetId": "evt_1",
      "href": "/events/open-mic-night"
    }
  ],
  "meta": { "nextCursor": "2026-08-31T12:30:00.000Z", "hasMore": true, "limit": 20, "unreadCount": 4 }
}
```

`href` is resolved by the existing service and is null when the target no longer
exists. No audit-log data is exposed; `targetKind` and `targetId` are the
notification's own columns, which is what deep linking needs.

## `POST /api/mobile/notifications/:id/read`

- **Auth** required. **Params** `id`. **Body** none required.
- **Calls** `markNotificationRead({ viewerId, notificationId })`.
- **Errors** `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`.
- **Authorization** the viewer is part of the service's `WHERE` clause, so
  another student's notification does not match, is not updated, and returns
  `NOT_FOUND`. There is no check-then-write window and no branch in this route
  that could be forgotten.

`NOT_FOUND` rather than `FORBIDDEN` for somebody else's alert is deliberate: a
403 would confirm the id exists and turn this into an enumeration tool.
Already-read is a success, because marking twice is the same outcome as marking
once.

## `POST /api/mobile/devices`

Registers where a device could be reached. **Nothing sends to these yet.**

- **Auth** required. **Body** `{ "token": "...", "platform": "android" }`.
- **Validation** `platform` is checked against the schema's own enum -
  `ANDROID` or `IOS`, case-insensitively. Anything else, `web` included, is a 422
  naming the field. Tokens shorter than 32 characters are refused as
  placeholders.
- **Calls** `registerDeviceToken` in `lib/services/devices.ts`.
- **Errors** `UNAUTHORIZED`, `BAD_REQUEST`, `VALIDATION_ERROR`.

```json
{ "data": { "id": "dev_1", "platform": "ANDROID", "createdAt": "...", "updatedAt": "..." } }
```

201. The token is never echoed back - it is a capability to interrupt somebody's
phone, and a response containing it would end up in the first debug log anyone
adds.

The unique constraint is on the token alone, not on the pair with a user, and the
write is an upsert on it. A push token identifies an installation rather than a
person, so when a student signs out of a shared handset and someone else signs
in, the token moves. Keying on the pair would leave the previous student silently
subscribed to alerts on a phone they no longer hold.

There is no FCM credential, no APNs key and no queue in this project, so no
sender was written. This endpoint establishes the persistence contract and claims
nothing more.

## `POST /api/mobile/auth/sign-up`

The only unauthenticated mobile route.

- **Body** `{ "name", "email", "password" }`, validated with the existing
  `signUpSchema` - name 2-80 characters, valid email, password 8-72 characters.
- **Calls** `registerUser` from `features/auth/actions.ts`, unchanged. It remains
  the single implementation of what signing up means: lowercasing, the
  university-domain gate via `findUniversityForEmail`, the duplicate check,
  bcrypt at cost 12, the `STUDENT` default, the unverified email, and the
  verification mail through `requestEmailVerification`.
- **Errors** `VALIDATION_ERROR` (with `fieldErrors`), `FORBIDDEN` (not a
  university address), `CONFLICT` (address already registered), `BAD_REQUEST`.

```json
{
  "data": {
    "email": "asha@campus.edu",
    "university": { "id": "plc_1", "slug": "iit-b", "name": "IIT Bombay" },
    "role": "STUDENT",
    "created": true,
    "emailVerificationRequired": true,
    "onboardingRequired": true,
    "signInRequired": true,
    "nextStep": "VERIFY_EMAIL"
  }
}
```

201. Three flags rather than a session: **this endpoint does not sign anybody
in.** Minting a session here would be a second authentication path, and Auth.js
already owns that - the client posts the credentials to
`/api/auth/callback/credentials` afterwards. `emailVerificationRequired` is
always true because the account is stored unverified.
`onboardingRequired` is always true because a new account has no interests yet.

The server action collapses every failure into one human sentence, which is right
for a form and useless to a client deciding between highlighting a password field
and sending someone to sign-in. So the schema and the university lookup are
consulted first, **to classify, not to enforce**: `registerUser` re-checks both
and remains the thing that decides. Anything it still refuses afterwards is a
duplicate account.

No SMTP detail is exposed. Nothing here weakens the domain restriction or skips
verification.

---

## Intentionally not available

Requests to these return nothing at all, because no route exists:

- messaging and direct messages
- opportunities
- creating posts, events or communities
- advanced search beyond the community directory filter
- reviews, recommendations, analytics
- admin, university-administration and moderation dashboards
- cancelling a registration or leaving a community (`cancelRegistration` and
  `leaveCommunity` both exist and are safe to expose, but no mobile screen needs
  them yet)
- marking all notifications read (`markAllNotificationsRead` exists, same reason)

The feed is the one case that answers rather than 404s, because the client needs
to distinguish "not built" from "nothing to show".

## CORS

**No CORS headers were added, and none are needed.** CORS is a browser policy.
The Flutter client uses a Dio HTTP client, which sends no `Origin` header and
enforces no same-origin rule, so a permissive `Access-Control-Allow-Origin`
would buy nothing and would weaken a cookie-authenticated API for every real
browser.

This becomes wrong the day a Flutter **web** build talks to a different origin.
At that point the fix is a narrow allowlist of known origins with
`Access-Control-Allow-Credentials`, implemented once in middleware - never `*`,
which browsers refuse to combine with credentials anyway.

## Contract decisions

Where the backend and the Flutter Phase 1 models disagreed, the smallest clean
change was made on the backend and recorded here. No Flutter file was touched.

1. **Identifiers are emitted twice.** Events and communities carry both nested
   `community`/`interest`/`place` objects and flat `communityId`/`interestId`/
   `placeId`. The domain projections are nested; the Flutter models read flat
   ids. Emitting both is additive and costs a few bytes. Widening the shared
   domain types for one non-web caller was the alternative and was rejected.
2. **`viewerRegistration` and `viewerRegistrationState`, `image` and `imageUrl`,
   `avatarUrl` and `imageUrl`** are the same pairs of aliases for the same
   reason: the domain uses one name, the Flutter model the other.
3. **`readAt`, `targetKind` and `targetId`** are not in the web notification
   projection, which only needs `read` and a resolved `href`. Rather than change
   that projection, `lib/api/mobile/projections.ts` reads those three columns in
   a separate viewer-scoped query. Same for event `status` in list responses.
4. **No cursor for events and communities**, as described under Pagination.

When the services gain cursors, the aliases can be dropped in a versioned
change. Nothing in the client depends on the duplicates being duplicates.

## Tests

- `lib/api/mobile/query.test.ts` - parameter parsing, no database required.
- `app/api/mobile/mobile-api.db.test.ts` - the route handlers themselves, with
  only `auth()` mocked so the services, domain rules and Postgres all run for
  real. Skipped unless `DATABASE_URL` is set, matching the existing `*.db.test.ts`
  convention. Covers 401 on every protected route, ownership on notification
  read, the registration and membership branches, strict device platforms, and
  the four signup outcomes.

Run with `npm test`. Flutter is not involved.

## Known gaps

- **No rate limiting** on sign-up, registration, membership or device
  registration. Sign-up is the one that matters: it can be used to test whether
  an address is registered. The web form has the same exposure today, so the fix
  belongs in one place for both.
- **The device-token migration is hand-written** and is not registered in
  `drizzle/meta/_journal.json`, because `drizzle-kit` could not be run in the
  environment where this was written and a journal entry without its snapshot
  would corrupt later generations. Run `npm run db:generate` to register it
  properly, or apply `drizzle/0003_mobile_device_tokens.sql` directly - it is
  idempotent.
- **Community search reads the whole visible directory** before paging, as
  described above.
