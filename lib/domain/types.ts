import type { UserRole } from "@/lib/db/schema"

/**
 * Canonical domain model for Cirqles.
 *
 * This file is the single source of truth for the shapes the product speaks in.
 * The interactive prototype consumes these types today with fixture data; the
 * Drizzle schema landing in Phases 6-13 must satisfy them. That ordering is
 * deliberate - designing the vocabulary before the tables means the prototype
 * screens are not throwaway, because only the data source changes underneath
 * them.
 *
 * Conventions:
 * - Timestamps are ISO-8601 strings, never `Date`. Dates do not survive the
 *   server/client boundary without serialisation, and a string is the same on
 *   both sides.
 * - Money is integer paise, never a float. Floating point currency is a bug
 *   waiting for its first refund.
 * - Anything the current viewer sees differently is prefixed `viewer`, so it is
 *   obvious at a glance which fields are per-request and cannot be cached
 *   globally.
 */

export type Id = string

/** ISO-8601 timestamp, e.g. `2026-08-07T09:00:00+05:30`. */
export type Timestamp = string

/** Trust is a product feature (PRD section 3), so it is modelled explicitly. */
export type VerificationState = "UNVERIFIED" | "PENDING" | "VERIFIED"

export type Interest = {
  id: Id
  slug: string
  label: string
}

/**
 * The denormalised person shape used in lists, bylines, and avatars. Detail
 * screens use `ProfileDetail`. Keeping these separate stops list queries from
 * pulling a whole profile per row.
 */
export type PersonSummary = {
  id: Id
  name: string
  username: string
  avatarUrl: string | null
  role: UserRole
  /** Programme and graduating year, e.g. "B.E. CSE 2027". */
  programme: string | null
}

export type CommunityVisibility = "UNIVERSITY" | "PUBLIC"
export type CommunityJoinPolicy = "OPEN" | "REQUEST"

/**
 * Membership is a state machine, not a boolean. `PENDING` exists because
 * request-to-join communities need a waiting room, and the join button has to
 * render differently for someone who already asked.
 */
export type MembershipState =
  | "NONE"
  | "PENDING"
  | "MEMBER"
  | "MODERATOR"
  | "OWNER"

export type CommunitySummary = {
  id: Id
  slug: string
  name: string
  tagline: string
  interest: Interest
  memberCount: number
  verification: VerificationState
  visibility: CommunityVisibility
  joinPolicy: CommunityJoinPolicy
  viewerMembership: MembershipState
}

export type CommunityDetail = CommunitySummary & {
  about: string
  guidelines: string[]
  createdAt: Timestamp
  moderators: PersonSummary[]
  upcomingEventCount: number
  postCount: number
}

/** The minimum needed to attribute a post or event to its community. */
export type CommunityRef = Pick<
  CommunitySummary,
  "id" | "slug" | "name" | "verification"
>

export type PostKind = "UPDATE" | "ANNOUNCEMENT" | "QUESTION"

export type Post = {
  id: Id
  kind: PostKind
  author: PersonSummary
  community: CommunityRef
  createdAt: Timestamp
  body: string
  pinned: boolean
  reactionCount: number
  commentCount: number
  viewerHasReacted: boolean
  viewerHasSaved: boolean
}

export type Comment = {
  id: Id
  author: PersonSummary
  createdAt: Timestamp
  body: string
  reactionCount: number
  viewerHasReacted: boolean
}

export type EventMode = "IN_PERSON" | "ONLINE" | "HYBRID"

/**
 * `WAITLISTED` and `CLOSED` are first-class states rather than derived flags,
 * because a capacity-limited event has to tell the difference between "you can
 * still join the queue" and "registration is over".
 */
export type RegistrationState =
  | "NONE"
  | "REGISTERED"
  | "WAITLISTED"
  | "CLOSED"

export type EventSummary = {
  id: Id
  slug: string
  title: string
  startsAt: Timestamp
  endsAt: Timestamp
  mode: EventMode
  venue: string
  community: CommunityRef
  interest: Interest
  /** `null` means unlimited seats. */
  capacity: number | null
  registeredCount: number
  /** Integer paise. `null` means free. */
  feeInPaise: number | null
  viewerRegistration: RegistrationState
}

export type EventAgendaItem = {
  at: Timestamp
  title: string
}

export type EventDetail = EventSummary & {
  description: string
  agenda: EventAgendaItem[]
  organisers: PersonSummary[]
  registrationClosesAt: Timestamp
  /** A handful of attendees for social proof, not the full list. */
  attendeePreview: PersonSummary[]
}

export type NotificationKind =
  | "EVENT_REMINDER"
  | "COMMUNITY_POST"
  | "MENTION"
  | "MEMBERSHIP"
  | "MODERATION"

export type AppNotification = {
  id: Id
  kind: NotificationKind
  title: string
  body: string
  createdAt: Timestamp
  read: boolean
  /** Every notification must lead somewhere; a dead-end notification is noise. */
  href: string
  actor: PersonSummary | null
}

/**
 * Messaging is scoped rather than open (PRD section 6). The scope is part of
 * the conversation itself so permission checks never have to guess.
 */
export type ConversationScope = "OFFICIAL" | "COMMUNITY" | "EVENT" | "DIRECT"

export type Conversation = {
  id: Id
  scope: ConversationScope
  title: string
  subtitle: string
  participants: PersonSummary[]
  lastMessagePreview: string
  lastMessageAt: Timestamp
  unreadCount: number
}

export type Message = {
  id: Id
  author: PersonSummary
  body: string
  sentAt: Timestamp
  fromViewer: boolean
}

export type ProfileBadge = {
  label: string
  description: string
}

export type ProfileDetail = {
  person: PersonSummary
  bio: string
  interests: Interest[]
  joinedAt: Timestamp
  communities: CommunitySummary[]
  eventsAttendedCount: number
  postCount: number
  badges: ProfileBadge[]
}

export type SearchResultKind = "COMMUNITY" | "EVENT" | "PERSON" | "POST"

export type SearchResult = {
  id: Id
  kind: SearchResultKind
  title: string
  subtitle: string
  href: string
  meta: string
}

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "MISINFORMATION"
  | "OFF_TOPIC"
  | "OTHER"

export type ModerationStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED"

export type ModerationTargetKind =
  | "POST"
  | "COMMENT"
  | "EVENT"
  | "COMMUNITY"
  | "USER"

export type ModerationItem = {
  id: Id
  reason: ReportReason
  status: ModerationStatus
  targetKind: ModerationTargetKind
  targetLabel: string
  excerpt: string
  reportCount: number
  reportedAt: Timestamp
  assignee: PersonSummary | null
}

export type VerificationRequest = {
  id: Id
  community: CommunityRef
  requestedBy: PersonSummary
  requestedAt: Timestamp
  status: "PENDING" | "APPROVED" | "REJECTED"
  evidence: string
}

/**
 * Every privileged action is recorded. Moderation without an audit trail is
 * indistinguishable from abuse of moderation.
 */
export type AuditEntry = {
  id: Id
  actor: PersonSummary
  action: string
  target: string
  at: Timestamp
}
