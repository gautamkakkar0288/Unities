import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { CommunitySummary } from "@/lib/domain/types"

import { CommunityCard } from "./community-card"

function community(overrides: Partial<CommunitySummary> = {}): CommunitySummary {
  return {
    id: "c-1",
    slug: "football",
    name: "Football",
    tagline: "Five-a-side, every evening.",
    kind: "STUDENT",
    scope: "UNIVERSITY",
    place: { id: "p-1", slug: "chitkara", name: "Chitkara University", kind: "UNIVERSITY" },
    interest: { id: "i-1", slug: "sports", label: "Sports" },
    memberCount: 1240,
    verification: "UNVERIFIED",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

describe("CommunityCard", () => {
  it("links to the community by name, so the link text means something alone", () => {
    render(<CommunityCard community={community()} />)
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/communities/football",
    )
  })

  it("compacts large member counts to fit a card", () => {
    render(<CommunityCard community={community()} />)
    expect(screen.getByText(/1\.2k members/)).toBeInTheDocument()
  })

  it("says member, singular, for a community of one", () => {
    render(<CommunityCard community={community({ memberCount: 1 })} />)
    expect(screen.getByText(/1 member$/)).toBeInTheDocument()
  })

  it("shows the viewer's relationship when they have one", () => {
    render(<CommunityCard community={community({ viewerMembership: "MEMBER" })} />)
    expect(screen.getByText("Joined")).toBeInTheDocument()
  })

  it("labels an invitation as an invitation, not as a button", () => {
    // describeMembershipAction says "Accept invite" here, which would be a
    // promise this card cannot keep - there is nothing to click.
    render(<CommunityCard community={community({ viewerMembership: "INVITED" })} />)
    expect(screen.getByText("Invited")).toBeInTheDocument()
    expect(screen.queryByText("Accept invite")).toBeNull()
  })

  it("stays quiet about strangers", () => {
    render(<CommunityCard community={community()} />)
    expect(screen.queryByText("Joined")).toBeNull()
    expect(screen.queryByText("Requested")).toBeNull()
  })

  it("does not brand an unverified community as unverified", () => {
    render(<CommunityCard community={community()} />)
    expect(screen.queryByText("Unverified")).toBeNull()
  })

  it("shows the verified badge when there is something to verify", () => {
    render(<CommunityCard community={community({ verification: "VERIFIED" })} />)
    expect(screen.getByText("Verified")).toBeInTheDocument()
  })

  it("does not render a join control, because joining does not work yet", () => {
    render(<CommunityCard community={community()} />)
    expect(screen.queryByRole("button")).toBeNull()
  })
})
