import { describe, expect, it } from "vitest"

import { isActiveRoute, mobileNav, sidebarNav } from "./config"

describe("isActiveRoute", () => {
  it("matches the exact route", () => {
    expect(isActiveRoute("/home", "/home")).toBe(true)
  })

  it("matches nested child routes", () => {
    expect(isActiveRoute("/communities/robotics", "/communities")).toBe(true)
  })

  it("does not match a different route", () => {
    expect(isActiveRoute("/explore", "/home")).toBe(false)
  })

  it("respects path boundaries", () => {
    // The naive startsWith check would wrongly activate Saved here.
    expect(isActiveRoute("/savedsomething", "/saved")).toBe(false)
  })
})

describe("navigation config", () => {
  it("keeps mobile navigation at the mandated five items", () => {
    // docs/UX/02-Navigation-System.md: maximum items 5.
    expect(mobileNav).toHaveLength(5)
  })

  it("has unique destinations", () => {
    for (const nav of [mobileNav, sidebarNav]) {
      const hrefs = nav.map((item) => item.href)
      expect(new Set(hrefs).size).toBe(hrefs.length)
    }
  })
})
