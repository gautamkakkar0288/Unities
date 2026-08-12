import type { UserRole } from "@/lib/db/schema"

/**
 * Canonical domain model.
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

/**
 * A university or a city.
 *
 * Scope is a place, not a boolean. Modelling "which campus" and "which city"
 * as first-class rows is what makes the second university a configuration
 * change rather than a rewrite - the alternative, a `isChitkara` flag or a
 * hardcoded default, has to be unpicked from every query later.
 */
export type PlaceKind = "UNIVERSITY" | "CITY"

export type PlaceRef = {
  id: Id
  slug: string
  name: string
  kind: PlaceKind
}

/**
 * Who brought a community into existence, which determines who may run it.
 *
 * - `OFFICIAL` - a university body, a registered club, or a verified organiser.
 *   Eligible for the verified badge.
 * - `INTEREST` - seeded from the taxonomy by platform admins. Has no owner, so
 *   it cannot be captured by whoever happened to create it first.
 * - `STUDENT` - proposed by a student and approved by review.
 */
export type CommunityKind = "OFFICIAL" | "INTEREST" | "STUDENT"

/**
 * Where a community sits in the campus-out hierarchy: university, then city,
 * then interest, then everywhere. Discovery walks outwards in this order, so a
 * Chitkara student sees Chitkara before they see the world.
 */
export type CommunityScope = "UNIVERSITY" | "CITY" | "INTEREST" | "GLOBAL"

/**
 * Three privacy levels, not two.
 *
 * - `OPEN` - join lands you inside immediately. The default, because friction
 *   kills community growth.
 * - `APPROVAL` - a moderator decides. For selective societies and leadership
 *   groups.
 * - `INVITE` - not joinable at all; membership arrives as an invitation.
 */
export type JoinPolicy = "OPEN" | "APPROVAL" | "INVITE"

/**
 * Membership is a state machine, not a boolean. `PENDING` exists because
 * approval communities need a waiting room, and `INVITED` because an invite is
 * an offer the student has not yet accepted - both render a different control
 * from "Join".
 */
export type MembershipState =
  | "NONE"
  | "INVITED"
  | "PENDING"
  | "MEMBER"
  | "MODERATOR"
  | "OWNER"

export type CommunitySummary = {
  id: Id
  slug: string
  name: string
  tagline: string
  kind: CommunityKind
  scope: CommunityScope
  /** The university or city this belongs to. `null` for interest and global. */
  place: PlaceRef | null
  interest: Interest
  memberCount: number
  verification: VerificationState
  joinPolicy: JoinPolicy
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

/**
 * A student's request for a community that does not exist yet.
 *
 * `similarTo` is populated at proposal time rather than at review time, so the
 * student sees "Chitkara Football already exists" before they ever submit. Most
 * duplicate communities are not bad intent, they are a failed search.
 */
export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "MERGED"

export type CommunityProposal = {
  id: Id
  proposedName: string
  tagline: string
  reason: string
  interest: Interest
  scope: CommunityScope
  proposedBy: PersonSummary
  proposedAt: Timestamp
  status: ProposalStatus
  /** Other students who backed the same request. Demand, not a vote. */
  supporterCount: number
  /** Existing communities that look like the same thing. */
  similarTo: CommunityRef[]
  reviewerNote: string | null
  /** Set when the proposal was folded into an existing community. */
  mergedInto: CommunityRef | null
}

/**
 * A suggested addition to the interest taxonomy.
 *
 * Suggestions are collected freely and promoted rarely. Unrestricted interests
 * fragment into `Coding`, `coding`, `DSA`, `Competitive Programming`, and
 * `Leetcode`, which destroys both discovery and recommendations. `mapsTo` lets
 * a reviewer say "this is the existing Coding interest" without discarding the
 * signal that a student went looking for it.
 */
export type InterestSuggestion = {
  id: Id
  label: string
  suggestedBy: PersonSummary
  suggestedAt: Timestamp
  /** How many students asked for this, after normalisation. */
  demandCount: number
  status: ProposalStatus
  mapsTo: Interest | null
}

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
 * What kind of thing this is. Not cosmetic: a `TRIP` leaves campus overnight
 * and carries obligations no workshop has, and Explore is organised by these.
 */
export type EventKind =
  | "WORKSHOP"
  | "TALK"
  | "TOURNAMENT"
  | "PERFORMANCE"
  | "TRIP"
  | "MEETUP"
  | "DRIVE"

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
  kind: EventKind
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

/**
 * Extra obligations that apply when an event leaves campus overnight.
 *
 * A trip is not a workshop with a longer duration. Someone's parents need a
 * contact number, the money covers specific things and not others, and a
 * cancellation two days out is not the same as skipping a lecture. Modelling
 * this explicitly is what stops "Kasol Trip" from being posted with the same
 * three fields as a seminar.
 */
export type TripDetails = {
  departsFrom: string
  departsAt: Timestamp
  returnsAt: Timestamp
  nights: number
  travelMode: string
  /** What the fee covers, itemised. Ambiguity here becomes a dispute. */
  costIncludes: string[]
  costExcludes: string[]
  /** A reachable human, not an email address. */
  emergencyContact: string
  /** Whether the organiser must collect parental consent before departure. */
  consentRequired: boolean
  cancellationPolicy: string
}

export type EventDetail = EventSummary & {
  description: string
  agenda: EventAgendaItem[]
  organisers: PersonSummary[]
  registrationClosesAt: Timestamp
  /** A handful of attendees for social proof, not the full list. */
  attendeePreview: PersonSummary[]
  /** Present only when `kind` is `TRIP`. */
  trip: TripDetails | null
}

/** How far away something is, in the words a student would use. */
export type EventTimeBucket =
  | "PAST"
  | "TODAY"
  | "TOMORROW"
  | "THIS_WEEKEND"
  | "THIS_WEEK"
  | "LATER"

/**
 * A student looking for people, which is not the same as an event.
 *
 * "Anyone up for badminton at 6?" has no organiser, no venue booking, no
 * capacity, and no reason to exist tomorrow. Forcing it through the event model
 * would demand a title, description, agenda, and registration window for
 * something that needs a time and a number - and the friction would mean it
 * never gets posted. It expires on its own, because a stale request for a
 * doubles partner is worse than no request.
 */
export type ActivityKind = "SPORT" | "STUDY" | "TEAM" | "TRAVEL" | "CASUAL"

export type ActivityStatus = "OPEN" | "FILLED" | "EXPIRED" | "CANCELLED"

export type Activity = {
  id: Id
  kind: ActivityKind
  /** Short and in the student's own words, e.g. "Badminton doubles at 6". */
  title: string
  detail: string
  author: PersonSummary
  interest: Interest
  place: string
  happensAt: Timestamp
  /** Disappears at this point whether or not it filled. */
  expiresAt: Timestamp
  spotsNeeded: number
  spotsFilled: number
  joiners: PersonSummary[]
  status: ActivityStatus
  viewerHasJoined: boolean
  /** Optional. Most activities belong to nothing at all. */
  community: CommunityRef | null
}

/**
 * The seeded campus landing surface.
 *
 * The university row exists on day one, so a student who signs up before any of
 * their friends still sees a populated campus rather than an empty product.
 */
export type CampusOverview = {
  university: PlaceRef
  studentCount: number
  upcomingEventCount: number
  clubCount: number
  viewerMembership: MembershipState
  trending: EventSummary[]
  activities: Activity[]
  clubs: CommunitySummary[]
}

export type NotificationKind =
  | "EVENT_REMINDER"
  | "COMMUNITY_POST"
  | "MENTION"
  | "MEMBERSHIP"
  | "MODERATION"
  | "ACTIVITY"

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
export type ConversationScope =
  | "OFFICIAL"
  | "COMMUNITY"
  | "EVENT"
  | "ACTIVITY"
  | "DIRECT"

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

export type SearchResultKind =
  | "COMMUNITY"
  | "EVENT"
  | "PERSON"
  | "POST"
  | "ACTIVITY"

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
  | "ACTIVITY"
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
