import { describe, expect, it } from "vitest"

import type {
  CommunityKind,
  CommunityScope,
  JoinPolicy,
  MembershipState,
  PlaceKind,
  ProposalStatus,
  VerificationState,
} from "@/lib/domain/types"

import { communityKinds, communityScopes, joinPolicies } from "./communities"
import { reviewStatuses, verificationStates } from "./enums"
import { membershipStates } from "./memberships"
import { placeKinds } from "./places"

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
})
