import { describe, expect, it } from "vitest"

import {
  audiences,
  faqs,
  features,
  footerSections,
  marketingNav,
  problems,
  steps,
} from "./content"

describe("marketing content", () => {
  it("has no duplicate nav targets", () => {
    const hrefs = marketingNav.map((link) => link.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it("points every in-page nav link at a section that exists", () => {
    // Anchors rendered by the page: Section ids plus audience ids.
    const renderedIds = new Set([
      "problem",
      "features",
      "how-it-works",
      "faq",
      ...audiences.map((audience) => audience.id),
    ])

    const anchors = [...marketingNav, ...footerSections.flatMap((s) => s.links)]
      .map((link) => link.href)
      .filter((href) => href.startsWith("#"))

    for (const anchor of anchors) {
      expect(renderedIds.has(anchor.slice(1))).toBe(true)
    }
  })

  it("has no empty copy", () => {
    const strings = [
      ...features.flatMap((f) => [f.title, f.description]),
      ...problems.flatMap((p) => [p.title, p.description]),
      ...steps.flatMap((s) => [s.title, s.description]),
      ...faqs.flatMap((f) => [f.question, f.answer]),
      ...audiences.flatMap((a) => [a.title, a.description, ...a.points]),
    ]

    for (const value of strings) {
      expect(value.trim().length).toBeGreaterThan(0)
    }
  })

  it("asks no duplicate questions", () => {
    const questions = faqs.map((faq) => faq.question)
    expect(new Set(questions).size).toBe(questions.length)
  })
})
