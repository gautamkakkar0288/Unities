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
    place: {
      id: "p-1",
      slug: "chitkara",
      name: "Chitkara University",
      kind: "UNIVERSITY",
    },
    interest: { id: "i-1", slug: "sports", label: "Sports" },
    memberCount: 1240,
    verification: "UNVERIFIED",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

const href = "/communities/football"

describe("CommunityCard", () => {
  it("links to the community by name, so the link text stands alone", () => {
    render(<CommunityCard community={community()} href={href} />)
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      href,
    )
  })

  it("compacts large member counts to fit a card", () => {
    const { container } = render(
      <CommunityCard community={community()} href={href} />,
    )
    expect(container.textContent).toContain("1.2k members")
  })

  it("says member, singular, for a community of one", () => {
    const { container } = render(
      <CommunityCard community={community({ memberCount: 1 })} href={href} />,
    )
    expect(container.textContent).toContain("1 member")
    expect(container.textContent).not.toContain("1 members")
  })

  it("keeps the join control for existing callers by default", () => {
    // The prototype screens rely on this. Changing the default would break
    // five pages that pass only community and href.
    render(<CommunityCard community={community()} href={href} />)
    expect(screen.getByRole("button", { name: "Join Football" })).toBeInTheDocument()
  })

  describe("in the real directory, where joining is not built yet", () => {
    it("renders no control at all rather than a button that does nothing", () => {
      render(
        <CommunityCard community={community()} href={href} joinAction={false} />,
      )
      expect(screen.queryByRole("button")).toBeNull()
    })

    it("still tells a member that they are a member", () => {
      // The button was carrying this information; the badge has to replace it.
      render(
        <CommunityCard
          community={community({ viewerMembership: "MEMBER" })}
          href={href}
          joinAction={false}
        />,
      )
      expect(screen.getByText("Joined")).toBeInTheDocument()
    })

    it("labels an invitation as an invitation, not as a button", () => {
      // describeMembershipAction says "Accept invite" here, which would be a
      // promise this card cannot keep - there is nothing to click.
      render(
        <CommunityCard
          community={community({ viewerMembership: "INVITED" })}
          href={href}
          joinAction={false}
        />,
      )
      expect(screen.getByText("Invited")).toBeInTheDocument()
      expect(screen.queryByText("Accept invite")).toBeNull()
    })

    it("stays quiet about a community the viewer has no relationship with", () => {
      render(
        <CommunityCard community={community()} href={href} joinAction={false} />,
      )
      expect(screen.queryByText("Joined")).toBeNull()
      expect(screen.queryByText("Requested")).toBeNull()
    })
  })

  it("does not brand an unverified community as unverified", () => {
    render(<CommunityCard community={community()} href={href} />)
    expect(screen.queryByText("Unverified")).toBeNull()
  })

  it("shows the verified badge when there is something to verify", () => {
    render(
      <CommunityCard
        community={community({ verification: "VERIFIED" })}
        href={href}
      />,
    )
    expect(screen.getByText("Verified")).toBeInTheDocument()
  })
})
