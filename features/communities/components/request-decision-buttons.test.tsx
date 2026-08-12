import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequestDecisionButtons } from "@/features/communities/components/request-decision-buttons"

const reviewJoinRequestAction = vi.fn()

vi.mock("@/features/communities/moderation-actions", () => ({
  reviewJoinRequestAction: (input: unknown) => reviewJoinRequestAction(input),
}))

const props = {
  communityId: "community-1",
  slug: "robotics",
  applicantId: "user-1",
  applicantName: "Asha",
}

describe("RequestDecisionButtons", () => {
  beforeEach(() => {
    reviewJoinRequestAction.mockReset()
    reviewJoinRequestAction.mockResolvedValue(undefined)
  })

  it("sends an approval for this applicant", async () => {
    render(<RequestDecisionButtons {...props} />)

    fireEvent.click(screen.getByRole("button", { name: "Approve Asha" }))

    await vi.waitFor(() => {
      expect(reviewJoinRequestAction).toHaveBeenCalledWith({
        communityId: "community-1",
        slug: "robotics",
        applicantId: "user-1",
        decision: "APPROVE",
      })
    })
  })

  it("sends a decline when declining", async () => {
    render(<RequestDecisionButtons {...props} />)

    fireEvent.click(screen.getByRole("button", { name: "Decline Asha" }))

    await vi.waitFor(() => {
      expect(reviewJoinRequestAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ decision: "DECLINE" }),
      )
    })
  })

  it("names the applicant in both controls", () => {
    // "Approve" on its own is ambiguous in a queue of ten people.
    render(<RequestDecisionButtons {...props} />)

    expect(
      screen.getByRole("button", { name: "Approve Asha" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Decline Asha" }),
    ).toBeInTheDocument()
  })

  it("surfaces a request another moderator already handled", async () => {
    reviewJoinRequestAction.mockResolvedValueOnce({
      ok: false,
      code: "NOT_FOUND",
      message: "That request has already been handled.",
    })

    render(<RequestDecisionButtons {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Approve Asha" }))

    await vi.waitFor(() => {
      expect(screen.getByText(/already been handled/)).toBeInTheDocument()
    })
  })
})
