import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Avatar, getInitials } from "./avatar"

describe("getInitials", () => {
  it("uses the first and last word", () => {
    expect(getInitials("Gautam Kakkar")).toBe("GK")
    expect(getInitials("Aarav Kumar Sharma")).toBe("AS")
  })

  it("handles a single word", () => {
    expect(getInitials("Robotics")).toBe("R")
  })

  it("handles messy whitespace and empty names", () => {
    expect(getInitials("  coding   club ")).toBe("CC")
    expect(getInitials("   ")).toBe("?")
  })
})

describe("Avatar", () => {
  it("exposes an accessible name when falling back to initials", () => {
    render(<Avatar name="Gautam Kakkar" />)
    expect(screen.getByText("Gautam Kakkar")).toBeInTheDocument()
  })
})
