// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"
import { communities, interests, memberships, users } from "@/lib/db/schema"
import { listCommunityLeads } from "@/lib/services/community-members"

const hasDatabase = Boolean(process.env.DATABASE_URL)

const INTEREST = "cl-interest"
const COMMUNITY = "cl-community"
const OTHER_COMMUNITY = "cl-other-community"

const OWNER = "cl-owner"
const MODERATOR = "cl-moderator"
const PLAIN_MEMBER = "cl-member"
const APPLICANT = "cl-applicant"
const INVITEE = "cl-invitee"

const USER_IDS = [OWNER, MODERATOR, PLAIN_MEMBER, APPLICANT, INVITEE]

async function cleanup() {
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db
    .delete(communities)
    .where(inArray(communities.id, [COMMUNITY, OTHER_COMMUNITY]))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
}

describe.skipIf(!hasDatabase)("listCommunityLeads", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(interests).values({
      id: INTEREST,
      slug: "cl-testing",
      label: "Testing",
    })

    // Placeless and global, so this fixture needs no place hierarchy.
    await db.insert(communities).values([
      {
        id: COMMUNITY,
        slug: "cl-robotics",
        name: "Robotics",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: INTEREST,
      },
      {
        id: OTHER_COMMUNITY,
        slug: "cl-chess",
        name: "Chess",
        kind: "STUDENT",
        scope: "GLOBAL",
        interestId: INTEREST,
      },
    ])

    await db.insert(users).values([
      {
        id: OWNER,
        name: "Zara Owner",
        email: "cl-owner@vo.test",
        role: "ORGANIZER",
        passwordHash: "not-a-real-hash",
      },
      {
        id: MODERATOR,
        name: "Adam Moderator",
        email: "cl-moderator@vo.test",
        role: "COMMUNITY_MODERATOR",
        passwordHash: "not-a-real-hash",
      },
      {
        id: PLAIN_MEMBER,
        name: "Plain Member",
        email: "cl-member@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: APPLICANT,
        name: "Hopeful Applicant",
        email: "cl-applicant@vo.test",
        passwordHash: "not-a-real-hash",
      },
      {
        id: INVITEE,
        name: "Invited Person",
        email: "cl-invitee@vo.test",
        passwordHash: "not-a-real-hash",
      },
    ])

    await db.insert(memberships).values([
      { communityId: COMMUNITY, userId: OWNER, state: "OWNER" },
      { communityId: COMMUNITY, userId: MODERATOR, state: "MODERATOR" },
      { communityId: COMMUNITY, userId: PLAIN_MEMBER, state: "MEMBER" },
      { communityId: COMMUNITY, userId: APPLICANT, state: "PENDING" },
      { communityId: COMMUNITY, userId: INVITEE, state: "INVITED" },
    ])
  })

  afterAll(cleanup)

  it("returns the owner first, then moderators", async () => {
    const leads = await listCommunityLeads({ communityId: COMMUNITY })

    // Alphabetically "Adam" precedes "Zara", so a name-only sort would put the
    // moderator first. Owners lead the list because they are accountable for it.
    expect(leads.map((lead) => lead.state)).toEqual(["OWNER", "MODERATOR"])
    expect(leads.map((lead) => lead.name)).toEqual([
      "Zara Owner",
      "Adam Moderator",
    ])
  })

  it("does not publish ordinary members", async () => {
    const leads = await listCommunityLeads({ communityId: COMMUNITY })
    expect(leads.map((lead) => lead.id)).not.toContain(PLAIN_MEMBER)
  })

  it("does not leak who asked to join or who was invited", async () => {
    // A declined or pending request is between the student and the moderators.
    const leads = await listCommunityLeads({ communityId: COMMUNITY })
    const ids = leads.map((lead) => lead.id)
    expect(ids).not.toContain(APPLICANT)
    expect(ids).not.toContain(INVITEE)
  })

  it("returns no private user columns at all", async () => {
    // This is the test that matters: a server component serialises whatever it
    // is handed, so widening the projection would put emails and password
    // hashes into the page payload.
    const [lead] = await listCommunityLeads({ communityId: COMMUNITY })

    expect(Object.keys(lead).sort()).toEqual([
      "avatarUrl",
      "id",
      "name",
      "role",
      "state",
    ])
    expect(JSON.stringify(lead)).not.toContain("@vo.test")
  })

  it("scopes leads to the community asked for", async () => {
    expect(await listCommunityLeads({ communityId: OTHER_COMMUNITY })).toEqual([])
  })

  it("returns nothing for a community that does not exist", async () => {
    expect(await listCommunityLeads({ communityId: "cl-nope" })).toEqual([])
  })
})
