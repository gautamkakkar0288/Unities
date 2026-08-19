import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EditEventForm } from "./edit-event-form"

/**
 * The edit form's wiring.
 *
 * The rules are tested in `lib/domain/event-edit.test.ts` and the writes in
 * `lib/services/event-editing.db.test.ts`. What is only observable here is what
 * the organiser is told: that the stored event comes back unchanged rather than
 * subtly reformatted, that the type is stated rather than offered, and - the
 * branch that matters - that a save which moved the waitlist stays on the page
 * and says so instead of navigating away from its own consequence.
 */

const updateEventAction = vi.fn()
const push = vi.fn()
const refresh = vi.fn()

// The real module is "use server" and reaches the database.
vi.mock("@/features/events/edit-actions", () => ({
  updateEventAction: (input: unknown) => updateEventAction(input),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}))

/**
 * Whole minutes, because `datetime-local` has minute precision - a fixture with
 * seconds in it would fail the round-trip for a reason that has nothing to do
 * with the form.
 */
const STARTS = "2026-05-10T10:00:00.000Z"
const ENDS = "2026-05-10T12:00:00.000Z"

function storedEvent(overrides = {}) {
  return {
    title: "Robotics Night",
    description: "Bring a laptop.",
    mode: "IN_PERSON" as const,
    venue: "Lab 3",
    startsAt: STARTS,
    endsAt: ENDS,
    registrationClosesAt: null,
    capacity: 40,
    feeInPaise: 15000,
    ...overrides,
  }
}

function renderForm(
  props: {
    waitlistCount?: number
    event?: ReturnType<typeof storedEvent>
  } = {},
) {
  return render(
    <EditEventForm
      eventId="e-1"
      slug="robotics-night"
      kindLabel="Workshop"
      waitlistCount={props.waitlistCount ?? 0}
      event={props.event ?? storedEvent()}
    />,
  )
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
}

describe("EditEventForm", () => {
  beforeEach(() => {
    updateEventAction
      .mockReset()
      .mockResolvedValue({ ok: true, data: { slug: "robotics-night", promoted: 0 } })
    push.mockReset()
    refresh.mockReset()
  })

  it("prefills what is already stored", () => {
    renderForm()

    expect(screen.getByLabelText(/Title/)).toHaveValue("Robotics Night")
    expect(screen.getByLabelText(/Where/)).toHaveValue("Lab 3")
    expect(screen.getByLabelText(/Seats/)).toHaveValue("40")
    // Paise are a storage detail. The organiser typed rupees.
    expect(screen.getByLabelText(/Fee in rupees/)).toHaveValue("150")
  })

  it("states the type rather than offering it", () => {
    // A disabled select would invite the organiser to hunt for the permission
    // to change it, when there is not one.
    renderForm()

    expect(screen.getByText("Workshop")).toBeInTheDocument()
    expect(
      screen.getByText(/type cannot be changed/i),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Type/)).toBeNull()
  })

  it("warns that adding seats will let the queue straight in", () => {
    renderForm({ waitlistCount: 3 })

    expect(
      screen.getByText(/3 students are waiting/),
    ).toBeInTheDocument()
  })

  it("says nothing about a queue that is empty", () => {
    renderForm()

    expect(screen.queryByText(/are waiting/)).toBeNull()
  })

  it("sends the stored values back unchanged", async () => {
    // An untouched form must be a no-op. If the local-time round trip drifted,
    // opening and saving would quietly move the event.
    renderForm()
    save()

    await vi.waitFor(() => {
      expect(updateEventAction).toHaveBeenCalledWith({
        eventId: "e-1",
        title: "Robotics Night",
        description: "Bring a laptop.",
        mode: "IN_PERSON",
        venue: "Lab 3",
        startsAt: STARTS,
        endsAt: ENDS,
        // Blank stays null rather than being written in as the start time.
        registrationClosesAt: null,
        capacity: 40,
        feeInPaise: 15000,
      })
    })
  })

  it("leaves for the event page when nothing was promoted", async () => {
    renderForm()
    save()

    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith("/events/robotics-night")
    })
  })

  it("stays put and names the promotion when the waitlist moved", async () => {
    // The one consequence of an edit that the event page cannot show, and
    // nothing has told those students yet.
    updateEventAction.mockResolvedValue({
      ok: true,
      data: { slug: "robotics-night", promoted: 2 },
    })

    renderForm({ waitlistCount: 2 })
    save()

    expect(
      await screen.findByText(/2 students came off the waitlist/),
    ).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
  })

  it("counts a single promotion in the singular", async () => {
    updateEventAction.mockResolvedValue({
      ok: true,
      data: { slug: "robotics-night", promoted: 1 },
    })

    renderForm({ waitlistCount: 1 })
    save()

    expect(
      await screen.findByText(/1 student came off the waitlist/),
    ).toBeInTheDocument()
  })

  it("shows a refusal to the organiser who caused it", async () => {
    updateEventAction.mockResolvedValue({
      ok: false,
      code: "INVALID",
      message: "Two students are already going.",
    })

    renderForm()
    save()

    expect(
      await screen.findByText("Two students are already going."),
    ).toBeInTheDocument()
    // A refused save must not look like it worked.
    expect(push).not.toHaveBeenCalled()
  })

  it("does not reach the service with an empty title", async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "" },
    })
    save()

    await vi.waitFor(() => {
      expect(screen.queryByLabelText(/Title/)).toBeInvalid()
    })
    expect(updateEventAction).not.toHaveBeenCalled()
  })

  it("always says that registered students have not been told", () => {
    // True on every save until notifications exist, so it is not conditional.
    renderForm()

    expect(
      screen.getByText(/not notified of changes yet/),
    ).toBeInTheDocument()
  })
})
