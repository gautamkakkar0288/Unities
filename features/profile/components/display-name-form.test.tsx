import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DisplayNameForm } from "@/features/profile/components/display-name-form"

const updateDisplayNameAction = vi.fn()

vi.mock("@/features/profile/actions", () => ({
  updateDisplayNameAction: (input: unknown) => updateDisplayNameAction(input),
}))

describe("DisplayNameForm", () => {
  beforeEach(() => {
    updateDisplayNameAction.mockReset()
    updateDisplayNameAction.mockResolvedValue(undefined)
  })

  it("starts from the name already stored", () => {
    render(<DisplayNameForm name="Existing Name" />)

    expect(screen.getByLabelText(/Display name/)).toHaveValue("Existing Name")
  })

  it("saves the edited name", async () => {
    render(<DisplayNameForm name="Existing Name" />)

    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "New Name" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save name/i }))

    await vi.waitFor(() => {
      expect(updateDisplayNameAction).toHaveBeenCalledWith({ name: "New Name" })
    })
  })

  it("confirms the save, because nothing else on the page would", async () => {
    render(<DisplayNameForm name="Existing Name" />)

    fireEvent.click(screen.getByRole("button", { name: /save name/i }))

    await vi.waitFor(() => {
      expect(screen.getByText("Saved.")).toBeInTheDocument()
    })
  })

  it("does not call the server with a name the schema rejects", async () => {
    render(<DisplayNameForm name="Existing Name" />)

    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "x" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save name/i }))

    await vi.waitFor(() => {
      expect(screen.getByText(/at least two characters/)).toBeInTheDocument()
    })
    expect(updateDisplayNameAction).not.toHaveBeenCalled()
  })

  it("shows a refusal from the server instead of a false confirmation", async () => {
    updateDisplayNameAction.mockResolvedValueOnce({
      ok: false,
      code: "FORBIDDEN",
      message: "Your session has expired. Sign in again to continue.",
    })

    render(<DisplayNameForm name="Existing Name" />)
    fireEvent.click(screen.getByRole("button", { name: /save name/i }))

    await vi.waitFor(() => {
      expect(screen.getByText(/session has expired/)).toBeInTheDocument()
    })
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument()
  })
})
