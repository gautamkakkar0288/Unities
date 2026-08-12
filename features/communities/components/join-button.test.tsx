import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CommunitySummary } from "@/lib/domain/types"

import { JoinButton } from "./join-button"

const joinCommunityAction = vi.fn()
const leaveCommunityAction = vi.fn()

// The real module is "use server" and reaches the database. What is worth
// testing here is the wiring: which action a given membership state calls, and
// what happens to a refusal.
vi.mock("@/features/communities/actions", () => ({
  joinCommunityAction: (input: unknown) => joinCommunityAction(input),
  leaveCommunityAction: (input: unknown) => leaveCommunityAction(input),
}))

type Viewer = Pick<
  CommunitySummary,
  "id" | "slug" | "name" | "joinPolicy" | "viewerMembership"
>

function community(overrides: Partial<Viewer> = {}): Viewer {
  return {
    id: "c-1",
    slug: "robotics",
    name: "Robotics",
    joinPolicy: "OPEN",
    viewerMembership: "NONE",
    ...overrides,
  }
}

const target = { communityId: "c-1", slug: "robotics" }

describe("JoinButton", () => {
  beforeEach(() => {
    joinCommunityAction.mockReset().mockResolvedValue(undefined)
    leaveCommunityAction.mockReset().mockResolvedValue(undefined)
  })

  it("joins an open community", async () => {
    render(<JoinButton community={community()} />)

    fireEvent.click(screen.getByRole("button", { name: "Join Robotics" }))

    await vi.waitFor(() => {
      expect(joinCommunityAction).toHaveBeenCalledWith(target)
    })
    expect(leaveCommunityAction).not.toHaveBeenCalled()
  })

  it("asks rather than joins when the community screens members", async () => {
    render(<JoinButton community={community({ joinPolicy: "APPROVAL" })} />)

    expect(
      screen.getByRole("button", { name: "Request to join Robotics" }),
    ).toHaveTextContent("Request to join")
  })

  it("presses nothing on an invite-only community", () => {
    render(<JoinButton community={community({ joinPolicy: "INVITE" })} />)

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent("Invite only")

    fireEvent.click(button)
    expect(joinCommunityAction).not.toHaveBeenCalled()
  })

  it("accepts an invitation through join, not leave", async () => {
    render(
      <JoinButton
        community={community({ joinPolicy: "INVITE", viewerMembership: "INVITED" })}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Accept your invitation/ }))

    await vi.waitFor(() => {
      expect(joinCommunityAction).toHaveBeenCalledWith(target)
    })
  })

  it("says leave, not joined, when the button would remove you", async () => {
    render(<JoinButton community={community({ viewerMembership: "MEMBER" })} />)

    const button = screen.getByRole("button", { name: "Leave Robotics" })
    expect(button).toHaveTextContent("Leave")

    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(leaveCommunityAction).toHaveBeenCalledWith(target)
    })
    expect(joinCommunityAction).not.toHaveBeenCalled()
  })

  it("withdraws a request instead of leaving something never joined", async () => {
    render(<JoinButton community={community({ viewerMembership: "PENDING" })} />)

    fireEvent.click(screen.getByRole("button", { name: /Withdraw your request/ }))

    await vi.waitFor(() => {
      expect(leaveCommunityAction).toHaveBeenCalledWith(target)
    })
  })

  it("shows the refusal to the student who caused it", async () => {
    // The sole-owner block is the case that would otherwise look like a dead
    // button: the click succeeds, nothing changes, and nothing is explained.
    leaveCommunityAction.mockResolvedValue({
      ok: false,
      code: "CONFLICT",
      message: "You are the only owner. Make someone else an owner before you leave.",
    })

    render(<JoinButton community={community({ viewerMembership: "OWNER" })} />)
    fireEvent.click(screen.getByRole("button", { name: "Leave Robotics" }))

    expect(
      await screen.findByText(
        "You are the only owner. Make someone else an owner before you leave.",
      ),
    ).toBeInTheDocument()
  })

  it("says nothing at all when the write succeeds", async () => {
    render(<JoinButton community={community()} />)
    fireEvent.click(screen.getByRole("button", { name: "Join Robotics" }))

    await vi.waitFor(() => {
      expect(joinCommunityAction).toHaveBeenCalled()
    })
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("clears a previous refusal when tried again", async () => {
    leaveCommunityAction.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "You are the only owner. Make someone else an owner before you leave.",
    })

    render(<JoinButton community={community({ viewerMembership: "MEMBER" })} />)
    const button = screen.getByRole("button", { name: "Leave Robotics" })

    fireEvent.click(button)
    expect(await screen.findByText(/only owner/)).toBeInTheDocument()

    fireEvent.click(button)
    await vi.waitFor(() => {
      expect(screen.queryByText(/only owner/)).toBeNull()
    })
  })
})
