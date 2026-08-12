import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProposeCommunityForm } from "@/features/communities/components/propose-community-form"

const proposeCommunityAction = vi.fn()

vi.mock("@/features/communities/proposal-actions", () => ({
  proposeCommunityAction: (input: unknown) => proposeCommunityAction(input),
}))

const interests = [
  { id: "int-football", slug: "football", label: "Football" },
  { id: "int-music", slug: "music", label: "Music" },
]

const reason =
  "About forty of us already play every evening and there is nowhere to organise it."

function fillForm() {
  fireEvent.change(screen.getByLabelText(/Name/), {
    target: { value: "Chitkara Football" },
  })
  fireEvent.change(screen.getByLabelText(/One line on what it is for/), {
    target: { value: "Five-a-side on the back field, every evening." },
  })
  fireEvent.change(screen.getByLabelText(/Why should this exist/), {
    target: { value: reason },
  })
  fireEvent.change(screen.getByLabelText(/Interest/), {
    target: { value: "int-football" },
  })
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: /submit proposal/i }))
}

describe("ProposeCommunityForm", () => {
  beforeEach(() => {
    proposeCommunityAction.mockReset()
    proposeCommunityAction.mockResolvedValue({
      ok: true,
      data: { status: "SUBMITTED", proposalId: "proposal-1" },
    })
  })

  it("sends what the student typed, with the duplicate check switched on", async () => {
    render(<ProposeCommunityForm interests={interests} />)

    fillForm()
    submitForm()

    await vi.waitFor(() => {
      expect(proposeCommunityAction).toHaveBeenCalledWith({
        name: "Chitkara Football",
        tagline: "Five-a-side on the back field, every evening.",
        reason,
        interestId: "int-football",
        scope: "UNIVERSITY",
        acknowledgedDuplicates: false,
      })
    })
  })

  it("does not submit an empty form", async () => {
    render(<ProposeCommunityForm interests={interests} />)

    submitForm()

    await vi.waitFor(() => {
      expect(screen.getByText(/Pick an interest\./)).toBeInTheDocument()
    })
    expect(proposeCommunityAction).not.toHaveBeenCalled()
  })

  it("offers the suspected duplicates as somewhere to go instead", async () => {
    proposeCommunityAction.mockResolvedValueOnce({
      ok: true,
      data: {
        status: "DUPLICATE_SUSPECTED",
        matches: [
          {
            id: "c1",
            slug: "football-club",
            name: "Football Club",
            verification: "VERIFIED",
          },
        ],
      },
    })

    render(<ProposeCommunityForm interests={interests} />)
    fillForm()
    submitForm()

    const link = await vi.waitFor(() =>
      screen.getByRole("link", { name: "Football Club" }),
    )
    expect(link).toHaveAttribute("href", "/communities/football-club")
  })

  it("only acknowledges duplicates after they have been shown", async () => {
    proposeCommunityAction.mockResolvedValueOnce({
      ok: true,
      data: {
        status: "DUPLICATE_SUSPECTED",
        matches: [
          {
            id: "c1",
            slug: "football-club",
            name: "Football Club",
            verification: "VERIFIED",
          },
        ],
      },
    })

    render(<ProposeCommunityForm interests={interests} />)
    fillForm()
    submitForm()

    const confirm = await vi.waitFor(() =>
      screen.getByRole("button", { name: /propose mine anyway/i }),
    )
    fireEvent.click(confirm)

    await vi.waitFor(() => {
      expect(proposeCommunityAction).toHaveBeenCalledTimes(2)
    })
    expect(proposeCommunityAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ acknowledgedDuplicates: true }),
    )
  })

  it("replaces the form once the proposal is in", async () => {
    render(<ProposeCommunityForm interests={interests} />)
    fillForm()
    submitForm()

    await vi.waitFor(() => {
      expect(screen.getByText("Proposal submitted")).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("button", { name: /submit proposal/i }),
    ).not.toBeInTheDocument()
  })

  it("shows the service's refusal rather than swallowing it", async () => {
    proposeCommunityAction.mockResolvedValueOnce({
      ok: false,
      code: "INVALID",
      message:
        "Your account is not linked to a campus yet, so it cannot host a campus community. Propose it under your interests instead.",
    })

    render(<ProposeCommunityForm interests={interests} />)
    fillForm()
    submitForm()

    await vi.waitFor(() => {
      expect(
        screen.getByText(/not linked to a campus yet/),
      ).toBeInTheDocument()
    })
  })

  it("does not offer a scope the student should not be picking", () => {
    render(<ProposeCommunityForm interests={interests} />)

    expect(
      screen.queryByRole("option", { name: "Everywhere" }),
    ).not.toBeInTheDocument()
  })
})
