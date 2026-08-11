import { describe, expect, it } from "vitest"

import {
  DUPLICATE_THRESHOLD,
  canCreateCommunityDirectly,
  canProposeCommunity,
  canRequestVerification,
  creatableKinds,
  findSimilarCommunities,
  nameSimilarity,
  normaliseCommunityName,
} from "@/lib/domain/community"
import type { CommunitySummary } from "@/lib/domain/types"

const base: Omit<CommunitySummary, "id" | "slug" | "name"> = {
  tagline: "",
  kind: "STUDENT",
  scope: "UNIVERSITY",
  place: null,
  interest: { id: "i", slug: "sports", label: "Sports" },
  memberCount: 10,
  verification: "UNVERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

const community = (name: string, id = name): CommunitySummary => ({
  ...base,
  id,
  slug: id.toLowerCase().replace(/\s+/g, "-"),
  name,
})

describe("normaliseCommunityName", () => {
  it("collapses the duplicates this rule exists to prevent", () => {
    const key = normaliseCommunityName("Chitkara Football")

    expect(normaliseCommunityName("Football Chitkara")).toBe(key)
    expect(normaliseCommunityName("Chitkara Football Lovers")).toBe(key)
    expect(normaliseCommunityName("The Football Club")).toBe(key)
    expect(normaliseCommunityName("football!!")).toBe(key)
  })

  it("keeps genuinely different communities apart", () => {
    expect(normaliseCommunityName("Chitkara Football")).not.toBe(
      normaliseCommunityName("Chitkara Badminton"),
    )
  })

  it("drops trailing plurals so Trekkers and Trekker collide", () => {
    expect(normaliseCommunityName("Trekkers")).toBe(
      normaliseCommunityName("Trekker"),
    )
  })

  it("does not strip the s from short words", () => {
    expect(normaliseCommunityName("DSA")).toBe("dsa")
  })
})

describe("nameSimilarity", () => {
  it("is order independent", () => {
    expect(nameSimilarity("Chitkara Football", "Football Chitkara")).toBe(1)
  })

  it("scores unrelated names at zero", () => {
    expect(nameSimilarity("Robotics Club", "Debate Society")).toBe(0)
  })

  it("returns zero rather than dividing by zero when a name is all noise", () => {
    expect(nameSimilarity("The Club", "Robotics")).toBe(0)
  })

  it("scores partial overlap between the threshold and 1", () => {
    const score = nameSimilarity(
      "Photography Walk Club",
      "Photography Club",
    )
    expect(score).toBeGreaterThanOrEqual(DUPLICATE_THRESHOLD)
    expect(score).toBeLessThan(1)
  })
})

describe("findSimilarCommunities", () => {
  const existing = [
    community("Chitkara Football Club", "c-football"),
    community("Photography Club", "c-photo"),
    community("Robotics Club", "c-robotics"),
  ]

  it("warns before a duplicate is created", () => {
    const matches = findSimilarCommunities("Football Lovers Chitkara", existing)

    expect(matches).toHaveLength(1)
    expect(matches[0]?.community.id).toBe("c-football")
  })

  it("stays quiet for a genuinely new community", () => {
    expect(findSimilarCommunities("Beekeeping", existing)).toHaveLength(0)
  })

  it("ranks the closest match first", () => {
    const matches = findSimilarCommunities("Club", [
      community("Robotics Club", "c-1"),
    ])
    expect(matches).toHaveLength(0)
  })
})

describe("creation rights", () => {
  it("lets staff and verified organisers create outright", () => {
    expect(canCreateCommunityDirectly("PLATFORM_ADMIN")).toBe(true)
    expect(canCreateCommunityDirectly("UNIVERSITY_ADMIN")).toBe(true)
    expect(canCreateCommunityDirectly("ORGANIZER")).toBe(true)
  })

  it("routes students through proposal", () => {
    expect(canCreateCommunityDirectly("STUDENT")).toBe(false)
    expect(canProposeCommunity("STUDENT")).toBe(true)
  })

  it("reserves interest communities for platform admins", () => {
    expect(creatableKinds("PLATFORM_ADMIN")).toContain("INTEREST")
    expect(creatableKinds("UNIVERSITY_ADMIN")).not.toContain("INTEREST")
    expect(creatableKinds("ORGANIZER")).toEqual(["OFFICIAL"])
    expect(creatableKinds("STUDENT")).toEqual([])
  })

  it("only lets official communities ask to be verified", () => {
    expect(canRequestVerification("OFFICIAL")).toBe(true)
    expect(canRequestVerification("STUDENT")).toBe(false)
    expect(canRequestVerification("INTEREST")).toBe(false)
  })
})
