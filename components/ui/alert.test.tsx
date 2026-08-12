import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Alert } from "./alert"

describe("Alert", () => {
  it("asserts urgently for errors", () => {
    render(<Alert variant="error" title="Something failed" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed")
  })

  it("announces politely for info", () => {
    render(<Alert variant="info" title="Heads up" />)
    expect(screen.getByRole("status")).toHaveTextContent("Heads up")
  })

  it("always renders an icon so status is not colour-only", () => {
    const { container } = render(<Alert variant="success" title="Done" />)
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
