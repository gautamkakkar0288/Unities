import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { faqs } from "@/lib/marketing/content"

import { FaqSection } from "./faq-section"

describe("FaqSection", () => {
  it("renders every question", () => {
    render(<FaqSection />)
    for (const faq of faqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument()
    }
  })

  it("renders answers in the document so they are findable by browser search", () => {
    render(<FaqSection />)
    // details/summary keeps collapsed answers in the DOM, unlike a JS accordion
    // that mounts on open.
    expect(screen.getByText(faqs[0]!.answer)).toBeInTheDocument()
  })
})
