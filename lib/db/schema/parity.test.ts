import { describe, expect, it } from "vitest"

import type {
  CommunityKind,
  CommunityScope,
  EventKind,
  EventMode,
  JoinPolicy,
  MembershipState,
  ModerationStatus,
  ModerationTargetKind,
  NotificationKind,
  PlaceKind,
  ProposalStatus,
  RegistrationState,
  ReportReason,
  VerificationRequest,
  VerificationState,
} from "@/lib/domain/types"

import { communityKinds, communityScopes, joinPolicies } from "./communities"
import {
  auditTargetKinds,
  reviewStatuses,
  verificationRequestStatuses,
  verificationStates,
} from "./enums"
import { registrationStates } from "./event-registrations"
import { eventKinds, eventModes } from "./events"
import { membershipStates } from "./memberships"
import { notificationKinds } from "./notifications"
import { placeKinds } from "./places"
import { moderationStatuses, reportReasons } from "./reports"

/**
 * The schema and the domain model must agree.
 *
 * `lib/domain/types.ts` is the contract the prototype was built against, and
 * the schema is supposed to satisfy it - but nothing enforces that, because the
 * domain types are hand-written unions and the schema arrays are hand-written
 * literals. A mismatch would not fail to compile; it would fail in production
 * when a value round-trips through the database and comes back unrecognised.
 *
 * Each check below is two assertions in one. The `Record<Union, true>` object
 * fails to compile if the domain union gains a member that is not listed, and
 * the runtime comparison fails if the database array and the domain union have
 * drifted apart. Adding a state now requires touching both, deliberately.
 *
 * These live in a test rather than in the schema modules because importing
 * domain types into the schema would create a module cycle - `types.ts` already
 * imports `UserRole` from here.
 */

const sameMembers = (actual: readonly string[], expected: readonly string[]) =>
  expect([...actual].sort()).toEqual([...expected].sort())

describe("schema and domain vocabulary agree", () => {
  it("place kinds", () => {
    const domain: Record<PlaceKind, true> = { UNIVERSITY: true, CITY: true }
    sameMembers(placeKinds, Object.keys(domain))
  })

  it("community kinds", () => {
    const domain: Record<CommunityKind, true> = {
      OFFICIAL: true,
      INTEREST: true,
      STUDENT: true,
    }
    sameMembers(communityKinds, Object.keys(domain))
  })

  it("community scopes", () => {
    const domain: Record<CommunityScope, true> = {
      UNIVERSITY: true,
      CITY: true,
      INTEREST: true,
      GLOBAL: true,
    }
    sameMembers(communityScopes, Object.keys(domain))
  })

  it("join policies", () => {
    const domain: Record<JoinPolicy, true> = {
      OPEN: true,
      APPROVAL: true,
      INVITE: true,
    }
    sameMembers(joinPolicies, Object.keys(domain))
  })

  it("verification states", () => {
    const domain: Record<VerificationState, true> = {
      UNVERIFIED: true,
      PENDING: true,
      VERIFIED: true,
    }
    sameMembers(verificationStates, Object.keys(domain))
  })

  it("review statuses", () => {
    const domain: Record<ProposalStatus, true> = {
      PENDING: true,
      APPROVED: true,
      REJECTED: true,
      MERGED: true,
    }
    sameMembers(reviewStatuses, Object.keys(domain))
  })

  it("verification request statuses, which exclude MERGED", () => {
    /**
     * Narrower than `reviewStatuses` on purpose. A club either proved it is
     * real or it did not; there is nothing to merge it into.
     */
    const domain: Record<VerificationRequest["status"], true> = {
      PENDING: true,
      APPROVED: true,
      REJECTED: true,
    }
    sameMembers(verificationRequestStatuses, Object.keys(domain))
  })

  it("audit target kinds match the moderation vocabulary", () => {
    /**
     * The audit log and the moderation queue point at the same set of things.
     * Keeping one list means a report and its audit entry can never disagree
     * about what kind of thing was acted on.
     */
    const domain: Record<ModerationTargetKind, true> = {
      POST: true,
      COMMENT: true,
      EVENT: true,
      COMMUNITY: true,
      ACTIVITY: true,
      USER: true,
    }
    sameMembers(auditTargetKinds, Object.keys(domain))
  })

  it("membership states, excluding NONE", () => {
    /**
     * `NONE` is deliberately absent from the database: no row means no
     * membership. If this ever needs to change, it is a schema decision, not a
     * typo, so the exclusion is written out explicitly here.
     */
    const domain: Record<Exclude<MembershipState, "NONE">, true> = {
      INVITED: true,
      PENDING: true,
      MEMBER: true,
      MODERATOR: true,
      OWNER: true,
    }
    sameMembers(membershipStates, Object.keys(domain))
  })

  it("event kinds", () => {
    const domain: Record<EventKind, true> = {
      WORKSHOP: true,
      TALK: true,
      TOURNAMENT: true,
      PERFORMANCE: true,
      TRIP: true,
      MEETUP: true,
      DRIVE: true,
    }
    sameMembers(eventKinds, Object.keys(domain))
  })

  it("event modes", () => {
    const domain: Record<EventMode, true> = {
      IN_PERSON: true,
      ONLINE: true,
      HYBRID: true,
    }
    sameMembers(eventModes, Object.keys(domain))
  })

  it("registration states, excluding the two the viewer computes", () => {
    /**
     * This one does not line up one-to-one, and the mismatch is the point.
     *
     * `NONE` is the absence of a row. `CLOSED` is a fact about the clock that
     * `describeRegistration` derives at read time - stored, it would be wrong
     * the moment the event started. `CANCELLED` runs the other way: the
     * database needs it so a student can drop out and sign up again without
     * colliding with the unique constraint, but no viewer is ever in it, so
     * the domain union has no reason to carry it.
     */
    const domain: Record<Exclude<RegistrationState, "NONE" | "CLOSED">, true> =
      {
        REGISTERED: true,
        WAITLISTED: true,
      }
    sameMembers(registrationStates, [...Object.keys(domain), "CANCELLED"])
  })

  it("notification kinds", () => {
    /**
     * `lib/domain/notifications.ts` labels and tones every kind, and
     * `requiredNotificationKinds` marks MEMBERSHIP and MODERATION as ones a
     * student cannot switch off. A kind that exists in the database but not in
     * the domain would render with no label and no tone.
     */
    const domain: Record<NotificationKind, true> = {
      EVENT_REMINDER: true,
      COMMUNITY_POST: true,
      MENTION: true,
      MEMBERSHIP: true,
      MODERATION: true,
      ACTIVITY: true,
    }
    sameMembers(notificationKinds, Object.keys(domain))
  })

  it("report reasons", () => {
    /**
     * These are load-bearing beyond display: `reasonSeverity` ranks the queue
     * by them, so a reason stored but not ranked would sort as `undefined` and
     * land in an arbitrary position - most likely ahead of harassment.
     */
    const domain: Record<ReportReason, true> = {
      SPAM: true,
      HARASSMENT: true,
      MISINFORMATION: true,
      OFF_TOPIC: true,
      OTHER: true,
    }
    sameMembers(reportReasons, Object.keys(domain))
  })

  it("moderation statuses", () => {
    /**
     * Unlike the verification statuses, this list keeps all four. `IN_REVIEW`
     * is the difference between "nobody has looked at this" and "somebody is
     * looking", which is what stops two moderators working the same report.
     */
    const domain: Record<ModerationStatus, true> = {
      OPEN: true,
      IN_REVIEW: true,
      RESOLVED: true,
      DISMISSED: true,
    }
    sameMembers(moderationStatuses, Object.keys(domain))
  })
})
