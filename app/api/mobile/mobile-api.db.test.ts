// @vitest-environment node

import { eq, inArray } from "drizzle-orm"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  communities,
  deviceTokens,
  eventRegistrations,
  events,
  interests,
  memberships,
  notifications,
  places,
  users,
} from "@/lib/db/schema"

import { POST as signUp } from "./auth/sign-up/route"
import { GET as communityDetail } from "./communities/[slug]/route"
import { POST as joinCommunityRoute } from "./communities/[slug]/membership/route"
import { GET as communityList } from "./communities/route"
import { POST as registerDevice } from "./devices/route"
import { GET as eventDetail } from "./events/[slug]/route"
import { POST as registerForEventRoute } from "./events/[slug]/registration/route"
import { GET as eventList } from "./events/route"
import { GET as feed } from "./feed/route"
import { GET as me } from "./me/route"
import { POST as markRead } from "./notifications/[id]/read/route"
import { GET as notificationList } from "./notifications/route"

/**
 * The mobile API, exercised through the route handlers themselves.
 *
 * Testing the handlers rather than the services is the point: the services
 * already have their own suites, and every bug this layer can introduce lives in
 * the translation - a missing session check, a slug taken on trust, an ownership
 * test that was never written, a service refusal mapped to the wrong status.
 *
 * The session is the only thing mocked. `auth()` reads a cookie that no test can
 * produce, so it is replaced and everything behind it - the services, the domain
 * rules, Postgres - runs for real. Gated on `DATABASE_URL` exactly like the
 * existing `*.db.test.ts` files.
 */

vi.mock("@/auth", () => ({ auth: vi.fn() }))

const authMock = auth as unknown as Mock

function signedInAs(userId: string) {
  authMock.mockResolvedValue({ user: { id: userId, role: "STUDENT" } })
}

function signedOut() {
  authMock.mockResolvedValue(null)
}

const hasDatabase = Boolean(process.env.DATABASE_URL)

const PLACE = "ma-campus"
const EMAIL_DOMAIN = "ma-campus.test"
const INTEREST = "ma-interest"

const STUDENT = "ma-student"
const STRANGER = "ma-stranger"
const USER_IDS = [STUDENT, STRANGER]

const OPEN_COMMUNITY = "ma-open"
const APPROVAL_COMMUNITY = "ma-approval"
const INVITE_COMMUNITY = "ma-invite"
const JOINED_COMMUNITY = "ma-joined"
const COMMUNITY_IDS = [
  OPEN_COMMUNITY,
  APPROVAL_COMMUNITY,
  INVITE_COMMUNITY,
  JOINED_COMMUNITY,
]

const OPEN_EVENT = "ma-event-open"
const FULL_EVENT = "ma-event-full"
const CLOSED_EVENT = "ma-event-closed"
const CANCELLED_EVENT = "ma-event-cancelled"
const DRAFT_EVENT = "ma-event-draft"
const EVENT_IDS = [
  OPEN_EVENT,
  FULL_EVENT,
  CLOSED_EVENT,
  CANCELLED_EVENT,
  DRAFT_EVENT,
]

const OWN_NOTIFICATION = "ma-note-own"
const OTHER_NOTIFICATION = "ma-note-other"

const NEW_ACCOUNT_EMAIL = `ma-fresh@${EMAIL_DOMAIN}`
const TAKEN_EMAIL = `ma-student@${EMAIL_DOMAIN}`

const hour = 60 * 60 * 1000
const soon = new Date(Date.now() + 48 * hour)
const later = new Date(Date.now() + 50 * hour)
const yesterday = new Date(Date.now() - 24 * hour)

function request(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: body === undefined ? "GET" : "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function slugContext(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

function idContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

type Envelope = {
  data?: unknown
  meta?: Record<string, unknown>
  error?: { code: string; message: string; fieldErrors?: Record<string, string> }
}

async function read(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Envelope,
  }
}

async function cleanup() {
  await db
    .delete(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, EVENT_IDS))
  await db.delete(deviceTokens).where(inArray(deviceTokens.userId, USER_IDS))
  await db.delete(notifications).where(inArray(notifications.userId, USER_IDS))
  await db.delete(memberships).where(inArray(memberships.userId, USER_IDS))
  await db.delete(events).where(inArray(events.id, EVENT_IDS))
  await db.delete(communities).where(inArray(communities.id, COMMUNITY_IDS))
  await db
    .delete(users)
    .where(inArray(users.email, [NEW_ACCOUNT_EMAIL, TAKEN_EMAIL]))
  await db.delete(users).where(inArray(users.id, USER_IDS))
  await db.delete(interests).where(eq(interests.id, INTEREST))
  await db.delete(places).where(eq(places.id, PLACE))
}

describe.skipIf(!hasDatabase)("mobile api", () => {
  beforeAll(async () => {
    await cleanup()

    await db.insert(places).values({
      id: PLACE,
      slug: "ma-test-campus",
      name: "Mobile Test Campus",
      kind: "UNIVERSITY",
      status: "ACTIVE",
      // The signup gate looks the university up by this domain.
      emailDomain: EMAIL_DOMAIN,
    })

    await db.insert(interests).values({
      id: INTEREST,
      slug: "ma-football",
      label: "Football",
      status: "ACTIVE",
    })

    await db.insert(users).values([
      {
        id: STUDENT,
        name: "Mobile Student",
        email: TAKEN_EMAIL,
        passwordHash: "not-a-real-hash",
        universityId: PLACE,
      },
      {
        id: STRANGER,
        name: "Someone Else",
        email: `ma-stranger@${EMAIL_DOMAIN}`,
        passwordHash: "not-a-real-hash",
        universityId: PLACE,
      },
    ])

    await db.insert(communities).values([
      {
        id: OPEN_COMMUNITY,
        slug: "ma-open",
        name: "Open Club",
        tagline: "Anyone may join",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        placeId: PLACE,
        interestId: INTEREST,
        joinPolicy: "OPEN",
      },
      {
        id: APPROVAL_COMMUNITY,
        slug: "ma-approval",
        name: "Approval Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        placeId: PLACE,
        interestId: INTEREST,
        joinPolicy: "APPROVAL",
      },
      {
        id: INVITE_COMMUNITY,
        slug: "ma-invite",
        name: "Invite Club",
        kind: "OFFICIAL",
        scope: "UNIVERSITY",
        placeId: PLACE,
        interestId: INTEREST,
        joinPolicy: "INVITE",
      },
      {
        id: JOINED_COMMUNITY,
        slug: "ma-joined",
        name: "Already In Club",
        kind: "STUDENT",
        scope: "UNIVERSITY",
        placeId: PLACE,
        interestId: INTEREST,
        joinPolicy: "OPEN",
        memberCount: 1,
      },
    ])

    await db
      .insert(memberships)
      .values([
        { communityId: JOINED_COMMUNITY, userId: STUDENT, state: "MEMBER" },
      ])

    await db.insert(events).values([
      {
        id: OPEN_EVENT,
        slug: "ma-event-open",
        title: "Open Event",
        description: "Seats available.",
        kind: "WORKSHOP",
        mode: "IN_PERSON",
        venue: "Room 1",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: later,
        capacity: 5,
        communityId: OPEN_COMMUNITY,
        interestId: INTEREST,
      },
      {
        id: FULL_EVENT,
        slug: "ma-event-full",
        title: "Full Event",
        kind: "TALK",
        mode: "IN_PERSON",
        venue: "Room 2",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: later,
        capacity: 1,
        registeredCount: 1,
        communityId: OPEN_COMMUNITY,
        interestId: INTEREST,
      },
      {
        id: CLOSED_EVENT,
        slug: "ma-event-closed",
        title: "Closed Event",
        kind: "MEETUP",
        mode: "ONLINE",
        status: "PUBLISHED",
        startsAt: soon,
        endsAt: later,
        // Registration shut yesterday even though the event is still ahead.
        registrationClosesAt: yesterday,
        communityId: OPEN_COMMUNITY,
        interestId: INTEREST,
      },
      {
        id: CANCELLED_EVENT,
        slug: "ma-event-cancelled",
        title: "Cancelled Event",
        kind: "MEETUP",
        mode: "ONLINE",
        status: "CANCELLED",
        startsAt: soon,
        endsAt: later,
        cancelledAt: yesterday,
        communityId: OPEN_COMMUNITY,
        interestId: INTEREST,
      },
      {
        id: DRAFT_EVENT,
        slug: "ma-event-draft",
        title: "Draft Event",
        kind: "TALK",
        mode: "ONLINE",
        status: "DRAFT",
        startsAt: soon,
        endsAt: later,
        communityId: OPEN_COMMUNITY,
        interestId: INTEREST,
      },
    ])

    // The full event's single seat is taken by somebody else.
    await db.insert(eventRegistrations).values({
      eventId: FULL_EVENT,
      userId: STRANGER,
      state: "REGISTERED",
    })

    await db.insert(notifications).values([
      {
        id: OWN_NOTIFICATION,
        userId: STUDENT,
        kind: "MEMBERSHIP",
        title: "You joined Open Club",
        targetKind: "COMMUNITY",
        targetId: OPEN_COMMUNITY,
      },
      {
        id: OTHER_NOTIFICATION,
        userId: STRANGER,
        kind: "EVENT_REMINDER",
        title: "Not your notification",
      },
    ])
  })

  afterAll(cleanup)

  beforeEach(() => {
    signedInAs(STUDENT)
  })

  describe("authentication", () => {
    it("refuses every protected route without a session", async () => {
      signedOut()

      const responses = await Promise.all([
        me(),
        feed(request("/api/mobile/feed")),
        eventList(request("/api/mobile/events")),
        eventDetail(
          request("/api/mobile/events/x"),
          slugContext("ma-event-open"),
        ),
        communityList(request("/api/mobile/communities")),
        communityDetail(
          request("/api/mobile/communities/x"),
          slugContext("ma-open"),
        ),
        notificationList(request("/api/mobile/notifications")),
        registerForEventRoute(
          request("/api/mobile/events/x/registration", {}),
          slugContext("ma-event-open"),
        ),
        joinCommunityRoute(
          request("/api/mobile/communities/x/membership", {}),
          slugContext("ma-open"),
        ),
        markRead(
          request("/api/mobile/notifications/x/read", {}),
          idContext(OWN_NOTIFICATION),
        ),
        registerDevice(
          request("/api/mobile/devices", {
            token: "t".repeat(64),
            platform: "android",
          }),
        ),
      ])

      for (const response of responses) {
        const { status, body } = await read(response)

        expect(status).toBe(401)
        expect(body.error?.code).toBe("UNAUTHORIZED")
      }
    })

    it("answers /me from the database, without the password hash", async () => {
      const { status, body } = await read(await me())
      const data = body.data as Record<string, unknown>

      expect(status).toBe(200)
      expect(data.id).toBe(STUDENT)
      expect(data.email).toBe(TAKEN_EMAIL)
      expect(data.role).toBe("STUDENT")
      expect(JSON.stringify(body)).not.toContain("not-a-real-hash")
      expect(JSON.stringify(body)).not.toContain("passwordHash")
    })
  })

  describe("feed", () => {
    it("reports the capability gap rather than an empty page", async () => {
      // There is no feed service in this backend. An empty array here would be
      // indistinguishable from a student with nothing to read.
      const { status, body } = await read(
        await feed(request("/api/mobile/feed")),
      )

      expect(status).toBe(501)
      expect(body.error?.code).toBe("MISSING_BACKEND_CAPABILITY")
    })

    it("still validates its parameters", async () => {
      const { status, body } = await read(
        await feed(request("/api/mobile/feed?limit=9999")),
      )

      expect(status).toBe(422)
      expect(body.error?.code).toBe("VALIDATION_ERROR")
    })
  })

  describe("validation", () => {
    it("refuses a malformed slug before touching the database", async () => {
      const { status, body } = await read(
        await eventDetail(
          request("/api/mobile/events/x"),
          slugContext("not a slug"),
        ),
      )

      expect(status).toBe(422)
      expect(body.error?.code).toBe("VALIDATION_ERROR")
    })

    it("refuses an invalid cursor and an invalid limit", async () => {
      const cursor = await read(
        await notificationList(request("/api/mobile/notifications?cursor=abc")),
      )
      const limit = await read(
        await notificationList(request("/api/mobile/notifications?limit=0")),
      )

      expect(cursor.status).toBe(422)
      expect(limit.status).toBe(422)
    })
  })

  describe("events", () => {
    it("returns a published event with everything the detail screen needs", async () => {
      const { status, body } = await read(
        await eventDetail(
          request("/api/mobile/events/x"),
          slugContext("ma-event-open"),
        ),
      )
      const data = body.data as Record<string, unknown>

      expect(status).toBe(200)
      expect(data.slug).toBe("ma-event-open")
      expect(data.status).toBe("PUBLISHED")
      expect(data.description).toBe("Seats available.")
      expect(data.capacity).toBe(5)
      expect(data.communityId).toBe(OPEN_COMMUNITY)
      expect(data.viewerRegistrationState).toBe("NONE")
    })

    it("hides a draft event and an event that never existed", async () => {
      const draft = await read(
        await eventDetail(
          request("/api/mobile/events/x"),
          slugContext("ma-event-draft"),
        ),
      )
      const missing = await read(
        await eventDetail(
          request("/api/mobile/events/x"),
          slugContext("ma-event-nowhere"),
        ),
      )

      expect(draft.status).toBe(404)
      expect(missing.status).toBe(404)
    })

    it("lists events with a status on every item", async () => {
      const { status, body } = await read(
        await eventList(request("/api/mobile/events?limit=2")),
      )
      const items = body.data as Array<Record<string, unknown>>

      expect(status).toBe(200)
      expect(items.length).toBeLessThanOrEqual(2)
      expect(body.meta?.limit).toBe(2)
      for (const item of items) expect(item.status).not.toBeNull()
    })

    it("registers the signed-in student and repeats the answer on a retry", async () => {
      const first = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration"),
          slugContext("ma-event-open"),
        ),
      )
      const second = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration"),
          slugContext("ma-event-open"),
        ),
      )

      expect(first.status).toBe(200)
      expect((first.body.data as Record<string, unknown>).state).toBe(
        "REGISTERED",
      )
      // Idempotent: a retry on a flaky connection is not a conflict.
      expect(second.status).toBe(200)
      expect((second.body.data as Record<string, unknown>).state).toBe(
        "REGISTERED",
      )
    })

    it("waitlists rather than refusing when the seats are gone", async () => {
      const { status, body } = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration"),
          slugContext("ma-event-full"),
        ),
      )

      expect(status).toBe(200)
      expect((body.data as Record<string, unknown>).state).toBe("WAITLISTED")
    })

    it("refuses a closed event and a cancelled event with a conflict", async () => {
      const closed = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration"),
          slugContext("ma-event-closed"),
        ),
      )
      const cancelled = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration"),
          slugContext("ma-event-cancelled"),
        ),
      )

      expect(closed.status).toBe(409)
      expect(closed.body.error?.code).toBe("CONFLICT")
      expect(cancelled.status).toBe(409)
    })

    it("refuses a body that tries to register somebody else", async () => {
      const { status, body } = await read(
        await registerForEventRoute(
          request("/api/mobile/events/x/registration", { userId: STRANGER }),
          slugContext("ma-event-open"),
        ),
      )

      expect(status).toBe(400)
      expect(body.error?.code).toBe("BAD_REQUEST")
    })
  })

  describe("communities", () => {
    it("returns a community with the viewer's own membership state", async () => {
      const { status, body } = await read(
        await communityDetail(
          request("/api/mobile/communities/x"),
          slugContext("ma-joined"),
        ),
      )
      const data = body.data as Record<string, unknown>

      expect(status).toBe(200)
      expect(data.slug).toBe("ma-joined")
      expect(data.joinPolicy).toBe("OPEN")
      expect(data.viewerMembership).toBe("MEMBER")
      expect(Array.isArray(data.moderators)).toBe(true)
    })

    it("404s a community that does not exist", async () => {
      const { status } = await read(
        await communityDetail(
          request("/api/mobile/communities/x"),
          slugContext("ma-nowhere"),
        ),
      )

      expect(status).toBe(404)
    })

    it("filters the directory by search term using the existing domain filter", async () => {
      const { status, body } = await read(
        await communityList(request("/api/mobile/communities?search=Approval")),
      )
      const items = body.data as Array<Record<string, unknown>>

      expect(status).toBe(200)
      expect(items.map((item) => item.slug)).toContain("ma-approval")
      expect(items.map((item) => item.slug)).not.toContain("ma-open")
    })

    it("joins an open community immediately", async () => {
      const { status, body } = await read(
        await joinCommunityRoute(
          request("/api/mobile/communities/x/membership"),
          slugContext("ma-open"),
        ),
      )

      expect(status).toBe(200)
      expect((body.data as Record<string, unknown>).state).toBe("MEMBER")
      expect((body.data as Record<string, unknown>).pending).toBe(false)
    })

    it("queues a request for an approval community", async () => {
      const { status, body } = await read(
        await joinCommunityRoute(
          request("/api/mobile/communities/x/membership"),
          slugContext("ma-approval"),
        ),
      )

      expect(status).toBe(200)
      expect((body.data as Record<string, unknown>).state).toBe("PENDING")
      expect((body.data as Record<string, unknown>).pending).toBe(true)
    })

    it("leaves an existing member where they are", async () => {
      const { status, body } = await read(
        await joinCommunityRoute(
          request("/api/mobile/communities/x/membership"),
          slugContext("ma-joined"),
        ),
      )

      expect(status).toBe(200)
      expect((body.data as Record<string, unknown>).state).toBe("MEMBER")
    })

    it("refuses an invite-only community", async () => {
      const { status, body } = await read(
        await joinCommunityRoute(
          request("/api/mobile/communities/x/membership"),
          slugContext("ma-invite"),
        ),
      )

      expect(status).toBe(403)
      expect(body.error?.code).toBe("FORBIDDEN")
    })

    it("404s a join request for a community that does not exist", async () => {
      const { status } = await read(
        await joinCommunityRoute(
          request("/api/mobile/communities/x/membership"),
          slugContext("ma-nowhere"),
        ),
      )

      expect(status).toBe(404)
    })
  })

  describe("notifications", () => {
    it("lists only the viewer's own alerts, with an unread count", async () => {
      const { status, body } = await read(
        await notificationList(request("/api/mobile/notifications")),
      )
      const items = body.data as Array<Record<string, unknown>>

      expect(status).toBe(200)
      expect(items.map((item) => item.id)).toContain(OWN_NOTIFICATION)
      expect(items.map((item) => item.id)).not.toContain(OTHER_NOTIFICATION)
      expect(items.every((item) => item.userId === STUDENT)).toBe(true)
      expect(typeof body.meta?.unreadCount).toBe("number")
    })

    it("carries the target so the client can deep link", async () => {
      const { body } = await read(
        await notificationList(request("/api/mobile/notifications")),
      )
      const items = body.data as Array<Record<string, unknown>>
      const own = items.find((item) => item.id === OWN_NOTIFICATION)

      expect(own?.targetKind).toBe("COMMUNITY")
      expect(own?.targetId).toBe(OPEN_COMMUNITY)
    })

    it("marks the viewer's own notification read, twice if asked", async () => {
      const first = await read(
        await markRead(
          request("/api/mobile/notifications/x/read"),
          idContext(OWN_NOTIFICATION),
        ),
      )
      const again = await read(
        await markRead(
          request("/api/mobile/notifications/x/read"),
          idContext(OWN_NOTIFICATION),
        ),
      )

      expect(first.status).toBe(200)
      expect(again.status).toBe(200)
    })

    it("will not let one student mark another student's notification read", async () => {
      const { status, body } = await read(
        await markRead(
          request("/api/mobile/notifications/x/read"),
          idContext(OTHER_NOTIFICATION),
        ),
      )

      // Not found rather than forbidden: a 403 would confirm the id exists.
      expect(status).toBe(404)
      expect(body.error?.code).toBe("NOT_FOUND")

      const [row] = await db
        .select({ readAt: notifications.readAt })
        .from(notifications)
        .where(eq(notifications.id, OTHER_NOTIFICATION))

      expect(row.readAt).toBeNull()
    })
  })

  describe("devices", () => {
    it("refuses a platform the sender could not reach", async () => {
      const { status, body } = await read(
        await registerDevice(
          request("/api/mobile/devices", {
            token: "t".repeat(64),
            platform: "web",
          }),
        ),
      )

      expect(status).toBe(422)
      expect(body.error?.fieldErrors?.platform).toBeTruthy()
    })

    it("refuses a token that is obviously a placeholder", async () => {
      const { status } = await read(
        await registerDevice(
          request("/api/mobile/devices", { token: "abc", platform: "android" }),
        ),
      )

      expect(status).toBe(422)
    })

    it("stores a token, normalises the platform, and never echoes it back", async () => {
      const token = `ma-token-${"a".repeat(40)}`

      const { status, body } = await read(
        await registerDevice(
          request("/api/mobile/devices", { token, platform: "android" }),
        ),
      )

      expect(status).toBe(201)
      expect((body.data as Record<string, unknown>).platform).toBe("ANDROID")
      expect(JSON.stringify(body)).not.toContain(token)

      const rows = await db
        .select({ userId: deviceTokens.userId })
        .from(deviceTokens)
        .where(eq(deviceTokens.token, token))

      expect(rows).toHaveLength(1)
      expect(rows[0].userId).toBe(STUDENT)
    })

    it("moves a re-registered token to whoever is signed in now", async () => {
      const token = `ma-shared-${"b".repeat(40)}`

      await registerDevice(
        request("/api/mobile/devices", { token, platform: "ios" }),
      )

      signedInAs(STRANGER)

      await registerDevice(
        request("/api/mobile/devices", { token, platform: "ios" }),
      )

      const rows = await db
        .select({ userId: deviceTokens.userId })
        .from(deviceTokens)
        .where(eq(deviceTokens.token, token))

      // One row, and it now belongs to the person holding the phone.
      expect(rows).toHaveLength(1)
      expect(rows[0].userId).toBe(STRANGER)
    })
  })

  describe("sign-up", () => {
    it("refuses an address that is not a university address", async () => {
      const { status, body } = await read(
        await signUp(
          request("/api/mobile/auth/sign-up", {
            name: "Outside Student",
            email: "someone@gmail.test",
            password: "correct horse battery",
          }),
        ),
      )

      expect(status).toBe(403)
      expect(body.error?.code).toBe("FORBIDDEN")
    })

    it("refuses a password that is too short, naming the field", async () => {
      const { status, body } = await read(
        await signUp(
          request("/api/mobile/auth/sign-up", {
            name: "Short Password",
            email: `ma-short@${EMAIL_DOMAIN}`,
            password: "abc",
          }),
        ),
      )

      expect(status).toBe(422)
      expect(body.error?.fieldErrors?.password).toBeTruthy()
    })

    it("refuses an address that already has an account", async () => {
      const { status, body } = await read(
        await signUp(
          request("/api/mobile/auth/sign-up", {
            name: "Mobile Student",
            email: TAKEN_EMAIL,
            password: "correct horse battery",
          }),
        ),
      )

      expect(status).toBe(409)
      expect(body.error?.code).toBe("CONFLICT")
    })

    it("creates an unverified account and says what still has to happen", async () => {
      const { status, body } = await read(
        await signUp(
          request("/api/mobile/auth/sign-up", {
            name: "Fresh Student",
            email: NEW_ACCOUNT_EMAIL,
            password: "correct horse battery",
          }),
        ),
      )
      const data = body.data as Record<string, unknown>

      expect(status).toBe(201)
      expect(data.emailVerificationRequired).toBe(true)
      expect(data.onboardingRequired).toBe(true)
      expect(data.signInRequired).toBe(true)
      expect(data.nextStep).toBe("VERIFY_EMAIL")

      const [created] = await db
        .select({
          role: users.role,
          emailVerified: users.emailVerified,
          universityId: users.universityId,
        })
        .from(users)
        .where(eq(users.email, NEW_ACCOUNT_EMAIL))

      // The rules the action owns, still applied: student by default,
      // unverified, attached to the campus that owns the domain.
      expect(created.role).toBe("STUDENT")
      expect(created.emailVerified).toBeNull()
      expect(created.universityId).toBe(PLACE)
    })
  })
})
