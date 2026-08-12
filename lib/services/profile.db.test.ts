// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import {
  communities,
  interests,
  memberships,
  places,
  userInterests,
  users,
} from "@/lib/db/schema"
import { getProfile, updateDisplayName } from "@/lib/services/profile"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const PLACE = "pf-campus"
const ACTIVE_INTEREST = "pf-interest-active"
const RETIRED_INTEREST = "pf-interest-retired"

const STUDENT = "pf-student"
const STRANGER = "pf-stranger"
const USER_IDS = [STUDENT, STRANGER]

const RUNS = "pf-runs"
const BELONGS = "pf-belongs"
const REQUESTED = "pf-requested"
const SOMEONE_ELSES = "pf-someone-elses"
const COMMUNITY_IDS = [RUNS, BELONGS, REQUESTED, SOMEONE_ELSES]

async function cleanup() {
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db.delete(userInterests).where(inArray(userInterests.userId, USER_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db
    .delete(interests)
    .where(inArray(interests.id, [ACTIVE_INTEREST, RETIRED_INTEREST]))
  await db.delete(places).where(eq(places.id, PLACE))
}

describe.skipIf(!hasDatabase)("profile service", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(places).values({
      id: PLACE,
      slug: "pf-test-campus",
      name: "Test Campus",
      kind: "UNIVERSITY",
    })

    await db.insert(interests).values([
      {
        id: ACTIVE_INTEREST,
        slug: "pf-football",
        label: "Football",
        status: "ACTIVE",
      },
      {
        id: RETIRED_INTEREST,
        slug: "pf-orkut",
        label: "Orkut",
        status: "RETIRED",
      },
    ])

    await db.insert(users).values([
      {
        id: STUDENT,
        name: "Test Student",
        email: "pf-student@vo.test",
        passwordHash: "not-a-real-hash",
        universityId: PLACE,
      },
      {
        id: STRANGER,
        name: "Someone Else",
        email: "pf-stranger@vo.test",
        passwordHash: "not-a-real-hash",
      },
    ])

    await db.insert(communities).values([
      {
        id: RUNS,
        slug: "pf-runs",
        name: "Zulu Society",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: ACTIVE_INTEREST,
      },
      {
        id: BELONGS,
        slug: "pf-belongs",
        name: "Alpha Club",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: ACTIVE_INTEREST,
      },
      {
        id: REQUESTED,
        slug: "pf-requested",
        name: "Bravo Club",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: ACTIVE_INTEREST,
      },
      {
        id: SOMEONE_ELSES,
        slug: "pf-someone-elses",
        name: "Not Yours",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: ACTIVE_INTEREST,
      },
    ])

    await db.insert(userInterests).values([
      { userId: STUDENT, interestId: ACTIVE_INTEREST },
      { userId: STUDENT, interestId: RETIRED_INTEREST },
    ])

    await db.insert(memberships).values([
      { communityId: RUNS, userId: STUDENT, state: "OWNER" },
      { communityId: BELONGS, userId: STUDENT, state: "MEMBER" },
      { communityId: REQUESTED, userId: STUDENT, state: "PENDING" },
      { communityId: SOMEONE_ELSES, userId: STRANGER, state: "MEMBER" },
    ])
  })

  afterAll(cleanup)

  it("returns the account with its campus attached", async () => {
    const profile = await getProfile(STUDENT)

    expect(profile?.name).toBe("Test Student")
    expect(profile?.university?.name).toBe("Test Campus")
  })

  it("drops interests that have since been retired", async () => {
    // Both rows exist for this student. Showing the retired one would offer a
    // tag that no longer recommends anything.
    const profile = await getProfile(STUDENT)

    expect(profile?.interests.map((interest) => interest.label)).toEqual([
      "Football",
    ])
  })

  it("lists what they run before what they joined, and requests last", async () => {
    const profile = await getProfile(STUDENT)

    // Alphabetically "Zulu" is last, so a name-only sort would bury the
    // community this student is actually responsible for.
    expect(profile?.communities.map((community) => community.state)).toEqual([
      "OWNER",
      "MEMBER",
      "PENDING",
    ])
    expect(profile?.communities[0].name).toBe("Zulu Society")
  })

  it("does not list communities belonging to other people", async () => {
    const profile = await getProfile(STUDENT)
    const slugs = profile?.communities.map((community) => community.slug) ?? []

    expect(slugs).not.toContain("pf-someone-elses")
  })

  it("returns the account's own email but never its password hash", async () => {
    // The email is deliberate - this is the student's own profile. The hash
    // never is, and a server component would serialise it into the page.
    const profile = await getProfile(STUDENT)

    expect(profile?.email).toBe("pf-student@vo.test")
    expect(JSON.stringify(profile)).not.toContain("not-a-real-hash")
  })

  it("returns nothing for an account that does not exist", async () => {
    expect(await getProfile("pf-nobody")).toBeNull()
  })

  it("trims a new name before storing it", async () => {
    const result = await updateDisplayName({
      userId: STUDENT,
      input: { name: "  Renamed Student  " },
    })

    expect(result).toEqual({ ok: true, data: { name: "Renamed Student" } })
    expect((await getProfile(STUDENT))?.name).toBe("Renamed Student")
  })

  it("refuses a name that is not one", async () => {
    const result = await updateDisplayName({
      userId: STUDENT,
      input: { name: "x" },
    })

    expect(result.ok).toBe(false)
    // The stored name is untouched by the rejected write.
    expect((await getProfile(STUDENT))?.name).toBe("Renamed Student")
  })
})
