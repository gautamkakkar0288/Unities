// @vitest-environment node
import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { auditLog, users } from "@/lib/db/schema"
import { assignRole } from "@/lib/services/roles"

/**
 * Role assignment against a real Postgres.
 *
 * The rules themselves are covered exhaustively as pure functions in
 * lib/domain/role.test.ts. What is tested here is different and can only be
 * tested with a database: that a refusal writes nothing at all, and that an
 * allowed change and its audit row land together.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL)

const PLATFORM = "ra-user-platform"
const CAMPUS = "ra-user-campus"
const OTHER_CAMPUS = "ra-user-other-campus"
const STUDENT = "ra-user-student"

const USER_IDS = [PLATFORM, CAMPUS, OTHER_CAMPUS, STUDENT]

async function cleanup() {
  await db.delete(auditLog).where(inArray(auditLog.actorId, USER_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
}

async function resetRoles() {
  await db.delete(auditLog).where(inArray(auditLog.actorId, USER_IDS))
  await db
    .update(users)
    .set({ role: "PLATFORM_ADMIN" })
    .where(eq(users.id, PLATFORM))
  await db
    .update(users)
    .set({ role: "UNIVERSITY_ADMIN" })
    .where(inArray(users.id, [CAMPUS, OTHER_CAMPUS]))
  await db.update(users).set({ role: "STUDENT" }).where(eq(users.id, STUDENT))
}

async function roleOf(id: string) {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
  return row.role
}

describe.skipIf(!hasDatabase)("role assignment", () => {
  beforeAll(async () => {
    await cleanup()
    await db.insert(users).values([
      {
        id: PLATFORM,
        name: "Platform Admin",
        email: "platform@ra-campus.test",
        role: "PLATFORM_ADMIN" as const,
      },
      {
        id: CAMPUS,
        name: "Campus Admin",
        email: "campus@ra-campus.test",
        role: "UNIVERSITY_ADMIN" as const,
      },
      {
        id: OTHER_CAMPUS,
        name: "Other Campus Admin",
        email: "campus2@ra-campus.test",
        role: "UNIVERSITY_ADMIN" as const,
      },
      {
        id: STUDENT,
        name: "A Student",
        email: "student@ra-campus.test",
        role: "STUDENT" as const,
      },
    ])
  })

  afterAll(cleanup)

  beforeEach(resetRoles)

  it("refuses a student, and changes nothing", async () => {
    const result = await assignRole({
      actorId: STUDENT,
      input: { userId: CAMPUS, role: "STUDENT" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("FORBIDDEN")

    expect(await roleOf(CAMPUS)).toBe("UNIVERSITY_ADMIN")
    const trail = await db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(eq(auditLog.actorId, STUDENT))
    expect(trail).toHaveLength(0)
  })

  it("refuses self promotion, even for a platform admin", async () => {
    const result = await assignRole({
      actorId: PLATFORM,
      input: { userId: PLATFORM, role: "UNIVERSITY_ADMIN" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    expect(await roleOf(PLATFORM)).toBe("PLATFORM_ADMIN")
  })

  it("refuses minting a second platform admin", async () => {
    const result = await assignRole({
      actorId: PLATFORM,
      input: { userId: STUDENT, role: "PLATFORM_ADMIN" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    expect(await roleOf(STUDENT)).toBe("STUDENT")
  })

  it("refuses one campus admin acting on another", async () => {
    const result = await assignRole({
      actorId: CAMPUS,
      input: { userId: OTHER_CAMPUS, role: "STUDENT" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("FORBIDDEN")
    expect(await roleOf(OTHER_CAMPUS)).toBe("UNIVERSITY_ADMIN")
  })

  it("refuses a person who does not exist", async () => {
    const result = await assignRole({
      actorId: PLATFORM,
      input: { userId: "ra-nobody", role: "ORGANIZER" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("NOT_FOUND")
  })

  it("refuses an unknown role rather than writing it", async () => {
    const result = await assignRole({
      actorId: PLATFORM,
      input: { userId: STUDENT, role: "SUPREME_LEADER" },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("INVALID")
    expect(await roleOf(STUDENT)).toBe("STUDENT")
  })

  it("promotes a student to organiser and records who did it", async () => {
    const result = await assignRole({
      actorId: CAMPUS,
      input: { userId: STUDENT, role: "ORGANIZER" },
    })
    expect(result.ok).toBe(true)
    expect(await roleOf(STUDENT)).toBe("ORGANIZER")

    const trail = await db
      .select({ action: auditLog.action, summary: auditLog.summary })
      .from(auditLog)
      .where(eq(auditLog.actorId, CAMPUS))
    expect(trail).toHaveLength(1)
    expect(trail[0].action).toBe("role.assigned")
    // The old role is in the record, so a change can be read back later.
    expect(trail[0].summary).toContain("STUDENT")
    expect(trail[0].summary).toContain("ORGANIZER")
  })

  it("reports a no-op instead of pretending to change something", async () => {
    await assignRole({
      actorId: CAMPUS,
      input: { userId: STUDENT, role: "ORGANIZER" },
    })

    const again = await assignRole({
      actorId: CAMPUS,
      input: { userId: STUDENT, role: "ORGANIZER" },
    })
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.code).toBe("INVALID")
  })

  it("allows a demotion back to student", async () => {
    await assignRole({
      actorId: CAMPUS,
      input: { userId: STUDENT, role: "ORGANIZER" },
    })

    const result = await assignRole({
      actorId: CAMPUS,
      input: { userId: STUDENT, role: "STUDENT" },
    })
    expect(result.ok).toBe(true)
    expect(await roleOf(STUDENT)).toBe("STUDENT")
  })
})
