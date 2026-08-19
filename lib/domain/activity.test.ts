import { describe, expect, it } from "vitest"

import {
  COMMENT_BODY_MAX,
  POST_BODY_MAX,
  POST_TITLE_MAX,
  canComment,
  canDecideReport,
  canEditPost,
  canPublish,
  canReact,
  canRemoveComment,
  canRemovePost,
  canReport,
  describeReaction,
  excerptOf,
  normaliseBody,
  normaliseTitle,
  validateCommentInput,
  validatePostInput,
} from "@/lib/domain/activity"

/**
 * The rules, tested without a database.
 *
 * These are the same functions the services call, which is the point: an
 * authorization rule that can only be exercised through a request is one nobody
 * tests, and the cases below are the ones that matter - the other student, the
 * removed post, the empty title.
 */

describe("validatePostInput", () => {
  it("requires a title, because every card and search result renders one", () => {
    const errors = validatePostInput({ title: "   ", body: "Something" })
    expect(errors).toHaveLength(1)
    expect(errors[0]?.field).toBe("title")
  })

  it("accepts an empty body - a one-line announcement is complete", () => {
    expect(validatePostInput({ title: "Tryouts cancelled", body: "" })).toEqual([])
  })

  it("rejects an over-long title", () => {
    const errors = validatePostInput({
      title: "a".repeat(POST_TITLE_MAX + 1),
      body: "",
    })
    expect(errors[0]?.field).toBe("title")
  })

  it("rejects an over-long body", () => {
    const errors = validatePostInput({
      title: "Fine",
      body: "a".repeat(POST_BODY_MAX + 1),
    })
    expect(errors[0]?.field).toBe("body")
  })

  it("reports every problem at once rather than one field at a time", () => {
    const errors = validatePostInput({
      title: "",
      body: "a".repeat(POST_BODY_MAX + 1),
    })
    expect(errors.map((error) => error.field)).toEqual(["title", "body"])
  })

  it("measures the title after normalising whitespace, not before", () => {
    const title = `${"a".repeat(POST_TITLE_MAX)}   `
    expect(validatePostInput({ title, body: "" })).toEqual([])
  })
})

describe("validateCommentInput", () => {
  it("rejects an empty comment - that is a misclick, not a short opinion", () => {
    expect(validateCommentInput({ body: "  \n " })).toHaveLength(1)
  })

  it("rejects an over-long comment", () => {
    expect(
      validateCommentInput({ body: "a".repeat(COMMENT_BODY_MAX + 1) }),
    ).toHaveLength(1)
  })

  it("accepts an ordinary comment", () => {
    expect(validateCommentInput({ body: "Is there a waitlist?" })).toEqual([])
  })
})

describe("normalisation", () => {
  it("collapses interior whitespace in a title", () => {
    expect(normaliseTitle("  Tryouts   moved  ")).toBe("Tryouts moved")
  })

  it("keeps interior newlines in a body, because lists matter", () => {
    expect(normaliseBody("  One\n\nTwo  ")).toBe("One\n\nTwo")
  })
})

describe("publishing, commenting and reacting", () => {
  it("allows members, moderators and owners", () => {
    for (const state of ["MEMBER", "MODERATOR", "OWNER"] as const) {
      expect(canPublish(state)).toBe(true)
      expect(canComment(state)).toBe(true)
      expect(canReact(state)).toBe(true)
    }
  })

  it("refuses pending, invited and non-members", () => {
    for (const state of ["PENDING", "INVITED", "NONE"] as const) {
      expect(canPublish(state)).toBe(false)
      expect(canComment(state)).toBe(false)
      expect(canReact(state)).toBe(false)
    }
  })
})

describe("canEditPost", () => {
  it("allows the author", () => {
    expect(
      canEditPost({ authorId: "u1", viewerId: "u1", removed: false }),
    ).toBe(true)
  })

  it("refuses another student", () => {
    expect(
      canEditPost({ authorId: "u1", viewerId: "u2", removed: false }),
    ).toBe(false)
  })

  it("refuses a removed post", () => {
    expect(canEditPost({ authorId: "u1", viewerId: "u1", removed: true })).toBe(
      false,
    )
  })

  it("refuses everyone when the author's account is gone", () => {
    expect(
      canEditPost({ authorId: null, viewerId: "u1", removed: false }),
    ).toBe(false)
  })
})

describe("canRemovePost", () => {
  it("allows the author", () => {
    expect(
      canRemovePost({
        authorId: "u1",
        viewerId: "u1",
        viewerState: "MEMBER",
        removed: false,
      }),
    ).toBe(true)
  })

  it("allows a moderator of the community", () => {
    expect(
      canRemovePost({
        authorId: "u1",
        viewerId: "u2",
        viewerState: "MODERATOR",
        removed: false,
      }),
    ).toBe(true)
  })

  it("refuses an ordinary member who did not write it", () => {
    expect(
      canRemovePost({
        authorId: "u1",
        viewerId: "u2",
        viewerState: "MEMBER",
        removed: false,
      }),
    ).toBe(false)
  })

  it("refuses an already-removed post", () => {
    expect(
      canRemovePost({
        authorId: "u1",
        viewerId: "u2",
        viewerState: "OWNER",
        removed: true,
      }),
    ).toBe(false)
  })
})

describe("canRemoveComment", () => {
  it("allows the author and a moderator, and refuses a bystander", () => {
    const base = { authorId: "u1", removed: false }
    expect(
      canRemoveComment({ ...base, viewerId: "u1", viewerState: "MEMBER" }),
    ).toBe(true)
    expect(
      canRemoveComment({ ...base, viewerId: "u2", viewerState: "MODERATOR" }),
    ).toBe(true)
    expect(
      canRemoveComment({ ...base, viewerId: "u2", viewerState: "MEMBER" }),
    ).toBe(false)
  })
})

describe("canReport", () => {
  it("refuses reporting your own content - delete it instead", () => {
    expect(canReport({ authorId: "u1", viewerId: "u1" })).toBe(false)
  })

  it("allows reporting someone else's", () => {
    expect(canReport({ authorId: "u1", viewerId: "u2" })).toBe(true)
  })
})

describe("canDecideReport", () => {
  it("allows open and in-review reports", () => {
    expect(canDecideReport("OPEN")).toBe(true)
    expect(canDecideReport("IN_REVIEW")).toBe(true)
  })

  it("refuses reopening a decided report", () => {
    expect(canDecideReport("RESOLVED")).toBe(false)
    expect(canDecideReport("DISMISSED")).toBe(false)
  })
})

describe("describeReaction", () => {
  it("speaks the count, not just the state", () => {
    expect(describeReaction({ reacted: false, count: 3, title: "Tryouts" })).toBe(
      "3 people liked Tryouts. Press to like.",
    )
  })

  it("uses the singular for one person", () => {
    expect(describeReaction({ reacted: false, count: 1, title: "Tryouts" })).toBe(
      "1 person liked Tryouts. Press to like.",
    )
  })

  it("offers removal when the viewer has already reacted", () => {
    expect(
      describeReaction({ reacted: true, count: 2, title: "Tryouts" }),
    ).toContain("Press to remove your like.")
  })
})

describe("excerptOf", () => {
  it("leaves a short body alone", () => {
    expect(excerptOf("Short one.")).toBe("Short one.")
  })

  it("cuts on a word boundary rather than mid-word", () => {
    const excerpt = excerptOf("registration closes on Friday evening", 14)
    expect(excerpt).toBe("registration\u2026")
  })

  it("flattens newlines so a card stays one shape", () => {
    expect(excerptOf("One\n\nTwo")).toBe("One Two")
  })
})
