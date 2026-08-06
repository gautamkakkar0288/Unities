# Cirqles API Specification

> REST API reference for Cirqles.
>
> This document is specification only and contains no implementation code.

---

## 1. API Conventions

- Base path: `/api/v1`
- JSON request and response bodies
- Bearer token or session-based authentication, depending on the deployment model
- Consistent error envelope
- Versioned contracts only

### Standard Error Shape

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": []
  }
}
```

### Common HTTP Semantics

- `200` OK for successful reads
- `201` Created for successful creates
- `204` No Content for successful deletes or silent updates
- `400` Validation error
- `401` Unauthenticated
- `403` Unauthorized
- `404` Not found
- `409` Conflict
- `422` Business rule violation

---

## 2. Authentication

### POST `/auth/sign-up`

| Field | Details |
|---|---|
| Purpose | Create a new student or organizer account |
| Request | Email, password or provider token, profile basics |
| Response | User summary, session token, onboarding status |
| Permissions | Public |
| Validation | Email format, password strength, tenant rules |
| Errors | Duplicate email, invalid identity provider payload |
| Future Extensions | University SSO and invite-only onboarding |

### POST `/auth/sign-in`

| Field | Details |
|---|---|
| Purpose | Authenticate an existing user |
| Request | Email/password or provider token |
| Response | Session, user summary, role metadata |
| Permissions | Public |
| Validation | Credential validity |
| Errors | Invalid credentials, locked account |
| Future Extensions | Passkeys, SSO, device trust |

### POST `/auth/sign-out`

| Field | Details |
|---|---|
| Purpose | End the active session |
| Request | Session token or cookie context |
| Response | Success acknowledgement |
| Permissions | Authenticated user |
| Validation | Active session present |
| Errors | Session already invalid |
| Future Extensions | Device-level revocation |

---

## 3. Communities

### GET `/communities`

| Field | Details |
|---|---|
| Purpose | List discoverable communities |
| Request | Filters for university, visibility, tags, search text |
| Response | Paged community summaries |
| Permissions | Public or scoped by tenant rules |
| Validation | Valid filter values |
| Errors | Invalid filter combination |
| Future Extensions | Personalized ranking, semantic filters |

### GET `/communities/{communityId}`

| Field | Details |
|---|---|
| Purpose | Fetch a community detail page |
| Request | Community identifier |
| Response | Community profile, membership state, recent activity |
| Permissions | Public if visible |
| Validation | Valid identifier |
| Errors | Community not found, access restricted |
| Future Extensions | Richer module composition |

### POST `/communities/{communityId}/join`

| Field | Details |
|---|---|
| Purpose | Join a community |
| Request | Optional membership metadata |
| Response | Membership confirmation |
| Permissions | Authenticated user |
| Validation | Visibility and eligibility checks |
| Errors | Already joined, join blocked, tenant mismatch |
| Future Extensions | Requests-to-join for private communities |

### POST `/communities/{communityId}/leave`

| Field | Details |
|---|---|
| Purpose | Leave a community |
| Request | None or optional leave reason |
| Response | Membership removal acknowledgement |
| Permissions | Authenticated member |
| Validation | Must already be a member |
| Errors | Not a member |
| Future Extensions | Rejoin cooldowns |

---

## 4. Posts

### GET `/posts`

| Field | Details |
|---|---|
| Purpose | List feed or community posts |
| Request | Filters for community, type, tenant, and pagination |
| Response | Paged post summaries |
| Permissions | Public or scoped |
| Validation | Valid filters |
| Errors | Invalid page or filter state |
| Future Extensions | Personalized feed ranking |

### POST `/posts`

| Field | Details |
|---|---|
| Purpose | Create a community or official post |
| Request | Content, attachments, target community or source |
| Response | Created post summary |
| Permissions | Authorized community manager, organizer, or admin |
| Validation | Content, visibility, attachment limits |
| Errors | Permission denied, policy violation, invalid attachment |
| Future Extensions | Rich editor, drafts, scheduling |

---

## 5. Events

### GET `/events`

| Field | Details |
|---|---|
| Purpose | List discoverable events |
| Request | Filters for university, category, date, status, and text query |
| Response | Paged event summaries |
| Permissions | Public or scoped by visibility |
| Validation | Valid filter values |
| Errors | Invalid date range |
| Future Extensions | AI ranking and recommendations |

### GET `/events/{eventId}`

| Field | Details |
|---|---|
| Purpose | Fetch event detail data |
| Request | Event identifier |
| Response | Event detail, trust signals, registration state |
| Permissions | Public if visible |
| Validation | Valid identifier |
| Errors | Not found, visibility restricted |
| Future Extensions | Related events and summaries |

### POST `/events`

| Field | Details |
|---|---|
| Purpose | Create an event |
| Request | Title, description, date, venue, audience, visibility |
| Response | Created event summary |
| Permissions | Verified organizer, approved university, or admin |
| Validation | Required fields, time ordering, policy rules |
| Errors | Unauthorized, invalid capacity, missing scope |
| Future Extensions | Drafts, templates, collaborative creation |

---

## 6. Registrations

### POST `/events/{eventId}/register`

| Field | Details |
|---|---|
| Purpose | Register for an event |
| Request | Optional attendee metadata |
| Response | Registration confirmation |
| Permissions | Authenticated student |
| Validation | Capacity, deadline, duplicate checks |
| Errors | Full event, registration closed, already registered |
| Future Extensions | Waitlists, tickets, payments |

### POST `/events/{eventId}/cancel-registration`

| Field | Details |
|---|---|
| Purpose | Cancel an existing registration |
| Request | Optional cancellation note |
| Response | Cancellation acknowledgement |
| Permissions | Authenticated registrant |
| Validation | Cancellation window and ownership |
| Errors | Not registered, cancellation closed |
| Future Extensions | Refund handling |

---

## 7. Messaging

### GET `/threads`

| Field | Details |
|---|---|
| Purpose | List message threads |
| Request | Pagination and thread-type filters |
| Response | Thread summaries |
| Permissions | Authenticated user |
| Validation | Valid thread scope |
| Errors | Unauthorized scope access |
| Future Extensions | Thread search, pinning |

### GET `/threads/{threadId}/messages`

| Field | Details |
|---|---|
| Purpose | Fetch thread message history |
| Request | Thread identifier |
| Response | Message list with read state |
| Permissions | Thread participant or authorized moderator |
| Validation | Membership in thread |
| Errors | Not found, access denied |
| Future Extensions | Reactions, attachments |

### POST `/threads/{threadId}/messages`

| Field | Details |
|---|---|
| Purpose | Send a message |
| Request | Text, attachments, optional metadata |
| Response | Created message |
| Permissions | Thread participant |
| Validation | Content rules and attachment limits |
| Errors | Blocked sender, invalid content, rate limit exceeded |
| Future Extensions | Rich media, scheduled messages |

---

## 8. Search

### GET `/search`

| Field | Details |
|---|---|
| Purpose | Return global search results |
| Request | Query, filters, entity types, pagination |
| Response | Ranked results grouped by type |
| Permissions | Scoped by visibility and tenant |
| Validation | Query length and filter values |
| Errors | Invalid search parameters |
| Future Extensions | Semantic search, personalization |

### GET `/search/suggestions`

| Field | Details |
|---|---|
| Purpose | Provide query suggestions |
| Request | Partial query |
| Response | Suggested terms and entities |
| Permissions | Public or scoped |
| Validation | Minimum input length |
| Errors | Empty input |
| Future Extensions | Trend-aware suggestions |

---

## 9. Notifications

### GET `/notifications`

| Field | Details |
|---|---|
| Purpose | List user notifications |
| Request | Pagination and read-state filters |
| Response | Notification items |
| Permissions | Authenticated user |
| Validation | Valid pagination |
| Errors | Unauthorized |
| Future Extensions | Digest grouping and delivery channels |

### POST `/notifications/{notificationId}/read`

| Field | Details |
|---|---|
| Purpose | Mark one notification as read |
| Request | Notification identifier |
| Response | Updated read state |
| Permissions | Notification owner |
| Validation | Ownership |
| Errors | Not found, already read |
| Future Extensions | Batch read operations |

---

## 10. Moderation

### GET `/moderation/reports`

| Field | Details |
|---|---|
| Purpose | Review reported content |
| Request | Queue filters, entity type, status |
| Response | Moderation queue records |
| Permissions | Admin, moderator, operations role |
| Validation | Valid queue filters |
| Errors | Unauthorized, invalid filter |
| Future Extensions | Assignment and SLA tracking |

### POST `/moderation/reports/{reportId}/resolve`

| Field | Details |
|---|---|
| Purpose | Resolve a report |
| Request | Resolution decision, note, action taken |
| Response | Resolution summary |
| Permissions | Authorized operator |
| Validation | Report status, decision payload |
| Errors | Not found, invalid state transition |
| Future Extensions | Bulk resolution |

### POST `/moderation/verification-requests/{requestId}/decide`

| Field | Details |
|---|---|
| Purpose | Approve or reject a verification request |
| Request | Decision and explanation |
| Response | Verification outcome |
| Permissions | Admin or delegated verifier |
| Validation | Request status and decision rules |
| Errors | Invalid decision, already resolved |
| Future Extensions | Automated pre-checks |
