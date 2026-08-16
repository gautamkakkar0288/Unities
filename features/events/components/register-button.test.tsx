import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { EventSummary } from "@/lib/domain/types"

import { RegisterButton } from "./register-button"

const registerForEventAction = vi.fn()
const cancelRegistrationAction = vi.fn()

// The real module is "use server" and reaches the database. What is worth
// testing here is the wiring: which action a given registration state calls,
// and what happens to a refusal.
vi.mock("@/features/events/actions", () => ({
  registerForEventAction: (input: unknown) => registerForEventAction(input),
  cancelRegistrationAction: (input: unknown) => cancelRegistrationAction(input),
}))

const NOW = "2026-05-01T00:00:00.000Z"
const STARTS = "2026-05-10T10:00:00.000Z"
const ENDS = "2026-05-10T12:00:00.000Z"

function event(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: "e-1",
    slug: "robotics-night",
    title: "Robotics Night",
    kind: "WORKSHOP",
    startsAt: STARTS,
    endsAt: ENDS,
    mode: "IN_PERSON",
    venue: "Lab 3",
    community: {
      id: "c-1",
      slug: "robotics",
      name: "Robotics",
      verification: "VERIFIED",
    },
    interest: { id: "i-1", slug: "robotics", label: "Robotics" },
    capacity: 40,
    registeredCount: 12,
    feeInPaise: null,
    viewerRegistration: "NONE",
    ...overrides,
  }
}

const target = { eventId: "e-1", slug: "robotics-night" }

describe("RegisterButton", () => {
  beforeEach(() => {
    registerForEventAction.mockReset().mockResolvedValue(undefined)
    cancelRegistrationAction.mockReset().mockResolvedValue(undefined)
  })

  it("registers when a seat is free", async () => {
    render(<RegisterButton event={event()} now={NOW} />)

    fireEvent.click(screen.getByRole("button", { name: "Register for Robotics Night" }))

    await vi.waitFor(() => {
      expect(registerForEventAction).toHaveBeenCalledWith(target)
    })
    expect(cancelRegistrationAction).not.toHaveBeenCalled()
  })

  it("offers the waitlist rather than refusing when the room is full", async () => {
    // The distinction the whole feature rests on: a full event still takes
    // entries, and those entries are how a student ends up attending when
    // somebody drops out. Disabling this button would quietly cost attendance.
    render(
      <RegisterButton
        event={event({ capacity: 12, registeredCount: 12 })}
        now={NOW}
      />,
    )

    const button = screen.getByRole("button", {
      name: "Join the waitlist for Robotics Night",
    })
    expect(button).toBeEnabled()

    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(registerForEventAction).toHaveBeenCalledWith(target)
    })
  })

  it("presses nothing once registration has closed", () => {
    render(<RegisterButton event={event()} now={STARTS} />)

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent("Registration closed")

    fireEvent.click(button)
    expect(registerForEventAction).not.toHaveBeenCalled()
  })

  it("cancels a seat rather than registering twice", async () => {
    render(
      <RegisterButton
        event={event({ viewerRegistration: "REGISTERED" })}
        now={NOW}
      />,
    )

    const button = screen.getByRole("button", {
      name: "Cancel my registration for Robotics Night",
    })
    expect(button).toHaveTextContent("Cancel my registration")

    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(cancelRegistrationAction).toHaveBeenCalledWith(target)
    })
    expect(registerForEventAction).not.toHaveBeenCalled()
  })

  it("leaves the waitlist, which is not the same as cancelling a seat", async () => {
    render(
      <RegisterButton
        event={event({ viewerRegistration: "WAITLISTED" })}
        now={NOW}
      />,
    )

    fireEvent.click(
      screen.getByRole("button", { name: /Leave the waitlist/ }),
    )

    await vi.waitFor(() => {
      expect(cancelRegistrationAction).toHaveBeenCalledWith(target)
    })
  })

  it("still lets a registered student withdraw after the deadline", async () => {
    // Closing registration stops new entries. It must not trap the people who
    // already hold seats - those are exactly the seats worth freeing.
    render(
      <RegisterButton
        event={event({ viewerRegistration: "REGISTERED" })}
        now={STARTS}
      />,
    )

    const button = screen.getByRole("button", {
      name: "Cancel my registration for Robotics Night",
    })
    expect(button).toBeEnabled()

    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(cancelRegistrationAction).toHaveBeenCalledWith(target)
    })
  })

  it("shows the refusal to the student who caused it", async () => {
    registerForEventAction.mockResolvedValue({
      ok: false,
      code: "CONFLICT",
      message: "That event has been cancelled.",
    })

    render(<RegisterButton event={event()} now={NOW} />)
    fireEvent.click(screen.getByRole("button", { name: /Register for/ }))

    expect(
      await screen.findByText("That event has been cancelled."),
    ).toBeInTheDocument()
  })

  it("says nothing at all when the write succeeds", async () => {
    render(<RegisterButton event={event()} now={NOW} />)
    fireEvent.click(screen.getByRole("button", { name: /Register for/ }))

    await vi.waitFor(() => {
      expect(registerForEventAction).toHaveBeenCalled()
    })
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("clears a previous refusal when tried again", async () => {
    registerForEventAction.mockResolvedValueOnce({
      ok: false,
      code: "CONFLICT",
      message: "That event has been cancelled.",
    })

    render(<RegisterButton event={event()} now={NOW} />)
    const button = screen.getByRole("button", { name: /Register for/ })

    fireEvent.click(button)
    expect(await screen.findByText(/has been cancelled/)).toBeInTheDocument()

    fireEvent.click(button)
    await vi.waitFor(() => {
      expect(screen.queryByText(/has been cancelled/)).toBeNull()
    })
  })
})
