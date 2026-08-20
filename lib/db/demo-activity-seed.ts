import { eq, inArray, like, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  communities,
  events,
  memberships,
  postComments,
  postReactions,
  posts,
  reports,
  users,
} from "@/lib/db/schema"

/**
 * Community activity for the demo database.
 *
 * Runs *after* `demo-seed.ts` and adds only activity: announcements, comments,
 * likes, and a few reports for the moderation walkthrough. It is deliberately a
 * separate module rather than an edit to that file, which is 49KB - appending to
 * it would mean rewriting seed data this branch never read.
 *
 * **Idempotent by construction.** Every row has an explicit `demo-activity-*`
 * id and every insert is `onConflictDoNothing`, so running this twice changes
 * nothing rather than doubling the feed. No delete pass, so it cannot damage a
 * database it did not create.
 *
 * **Deterministic.** The same fixed-seed PRNG approach as the existing seed, so
 * a screenshot taken today matches the database rebuilt tomorrow.
 *
 * **Fictional throughout.** Authors are the existing `demo-student-*` accounts.
 * No real student names or addresses appear here, and none are invented either -
 * the content is club announcements, not people.
 *
 * Run with: npx tsx lib/db/demo-activity-seed.ts
 */

/** The existing seed's PRNG, so ordering decisions here are reproducible. */
function mulberry32(seed: number) {
  let state = seed

  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SHOWCASE_USER = "demo-student-gautam"

/**
 * Announcement templates, written as a campus club would write them.
 *
 * Ordinary operational traffic - a room change, a deadline, a thank-you - rather
 * than launch copy, because the point of the seed is to show what the page looks
 * like on a normal Tuesday.
 */
const POST_TEMPLATES: Array<{ title: string; body: string; linkEvent?: boolean }> = [
  {
    title: "Registrations close this Friday",
    body: "Spots are filling faster than last semester. If you have registered, watch this space for the room number - we may move to the larger lab.",
    linkEvent: true,
  },
  {
    title: "Venue moved to Block 3, Lab 204",
    body: "The original room is being used for an exam. Same time, same day, five minutes further down the corridor. Sorry for the short notice.",
    linkEvent: true,
  },
  {
    title: "Bring your own laptop on Saturday",
    body: "We have eight machines in the lab and forty of you signed up. Charged laptop, and install the toolchain beforehand if you can - the setup guide is pinned in the group.",
    linkEvent: true,
  },
  {
    title: "Congratulations to our finalists",
    body: "Three of our teams made the final round at the inter-college meet. Two podium finishes and a special mention for the first-year team, which is the part we are proudest of.",
  },
  {
    title: "Weekly session shifting to Thursdays",
    body: "Too many of you had a clash on Tuesday evenings. From next week we meet Thursday, same room, same hour. This is permanent, not a one-off.",
  },
  {
    title: "Looking for two volunteers for the help desk",
    body: "Two hours on the morning of the event, mostly pointing people at the right room and handing out badges. Good way to meet everyone if you are new here.",
    linkEvent: true,
  },
  {
    title: "Slides and recordings from last week",
    body: "Everything from the last session is now in the shared drive, including the exercise files. If a link does not work for you, say so in the comments and we will fix access.",
  },
  {
    title: "Beginners welcome - genuinely",
    body: "A few people have asked whether they need prior experience. No. Roughly half the room last month had never written a line of it before. Come anyway.",
  },
  {
    title: "Competition results and what happens next",
    body: "Scores are out and the top four teams go through to the next stage. If you did not make it this time, the practice sessions continue every weekend and everyone is welcome.",
  },
  {
    title: "Workshop capacity increased to 60",
    body: "We managed to book the bigger hall, so the waitlist has been cleared. If you were waiting, you are in - check your notifications.",
    linkEvent: true,
  },
  {
    title: "Internship applications close next month",
    body: "Several openings suitable for second and third years. We are running one CV review session before the deadline; details to follow once the room is confirmed.",
  },
  {
    title: "Thank you to everyone who turned up",
    body: "Ninety-plus people on a Saturday morning, which nobody expected. Feedback form is in the comments and we do read all of it - last term's form is why sessions start at ten now.",
  },
]

/** Comment templates. Short, practical, the way people actually reply. */
const COMMENT_TEMPLATES = [
  "Is there a waitlist if registrations are full?",
  "Thanks for the heads up about the room change.",
  "Will the recording be shared afterwards?",
  "Signed up. Do we need to bring anything else?",
  "Can first years join this one?",
  "Any chance of a weekend batch? Thursdays clash with lab.",
  "Shared this with my classmates, hope that is alright.",
  "Congratulations to the teams, well deserved.",
  "Is attendance counted for this session?",
  "The setup guide link is asking for access.",
]

/** Reports for the moderation demo, using the table's existing reasons. */
const REPORT_TEMPLATES = [
  { reason: "SPAM" as const, detail: "Same promotional message posted in several communities." },
  { reason: "OFF_TOPIC" as const, detail: "Not related to this community at all." },
  { reason: "MISINFORMATION" as const, detail: "The deadline stated here contradicts the official one." },
  { reason: "HARASSMENT" as const, detail: "Comment targets a specific member." },
]

export async function seedCommunityActivity(): Promise<{
  posts: number
  comments: number
  reactions: number
  reports: number
  memberships: number
}> {
  const random = mulberry32(20260819)

  // Work only with what the demo seed created. If it has not run, there is
  // nothing to attach activity to, and inventing communities here would produce
  // a second, conflicting demo dataset.
  const communityRows = await db
    .select({ id: communities.id, slug: communities.slug })
    .from(communities)
    .orderBy(communities.slug)

  if (communityRows.length === 0) {
    throw new Error(
      "No communities found. Run the demo seed first: npm run db:seed:demo",
    )
  }

  const studentRows = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.id, "demo-%"))
    .orderBy(users.id)

  const eventRows = await db
    .select({ id: events.id, communityId: events.communityId })
    .from(events)
    .where(sql`${events.status} <> 'DRAFT'`)

  const eventsByCommunity = new Map<string, string[]>()
  for (const row of eventRows) {
    if (!row.communityId) continue
    const existing = eventsByCommunity.get(row.communityId) ?? []
    existing.push(row.id)
    eventsByCommunity.set(row.communityId, existing)
  }

  // The communities carrying activity: the first twelve by slug, so the set is
  // stable rather than dependent on insertion order.
  const active = communityRows.slice(0, 12)

  /**
   * Memberships for the showcase account.
   *
   * Without these, Gautam signs in to an empty feed and cannot post anywhere -
   * the walkthrough in the brief depends on him being an ordinary member of a
   * handful of communities. MEMBER, not MODERATOR: the point is to demonstrate
   * what a student can do, and a moderator would blur the authorization story.
   */
  const membershipRows = active.slice(0, 6).map((community) => ({
    id: `demo-activity-membership-${community.slug}`,
    communityId: community.id,
    userId: SHOWCASE_USER,
    state: "MEMBER" as const,
    joinedAt: new Date("2026-07-01T09:00:00Z"),
  }))

  const [showcase] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, SHOWCASE_USER))
    .limit(1)

  if (showcase) {
    await db.insert(memberships).values(membershipRows).onConflictDoNothing()
  }

  // Timestamps march backwards from a fixed instant, newest first, so the feed
  // has a believable spread of "2 hours ago" through "three weeks ago".
  const latest = new Date("2026-08-18T11:00:00Z").getTime()
  const hour = 60 * 60 * 1000

  const postRows: Array<{
    id: string
    communityId: string
    authorId: string
    title: string
    body: string
    eventId: string | null
    createdAt: Date
  }> = []

  // 24 announcements: two passes over twelve communities.
  for (let index = 0; index < 24; index += 1) {
    const community = active[index % active.length]!
    const template = POST_TEMPLATES[index % POST_TEMPLATES.length]!
    const communityEvents = eventsByCommunity.get(community.id) ?? []

    // Every fourth post is by the showcase account, so its own feed and its
    // edit and delete controls have something real behind them.
    const author =
      showcase && index % 4 === 0
        ? SHOWCASE_USER
        : studentRows[Math.floor(random() * studentRows.length)]?.id

    if (!author) continue

    postRows.push({
      id: `demo-activity-post-${index + 1}`,
      communityId: community.id,
      authorId: author,
      title: template.title,
      body: template.body,
      // Only linked when the community actually has a publishable event. A
      // linked event that does not belong here is exactly what the service
      // refuses, and the seed should not contain data the app would reject.
      eventId:
        template.linkEvent && communityEvents.length > 0
          ? communityEvents[Math.floor(random() * communityEvents.length)]!
          : null,
      createdAt: new Date(latest - index * 9 * hour),
    })
  }

  await db.insert(posts).values(postRows).onConflictDoNothing()

  const commentRows: Array<{
    id: string
    postId: string
    authorId: string
    body: string
    createdAt: Date
  }> = []

  const reactionRows: Array<{
    id: string
    postId: string
    userId: string
    createdAt: Date
  }> = []

  postRows.forEach((post, postIndex) => {
    // Comments on roughly two thirds of posts, one to four each. Not every
    // post: a feed where everything has replies looks generated.
    const commentCount = postIndex % 3 === 2 ? 0 : 1 + Math.floor(random() * 4)

    for (let index = 0; index < commentCount; index += 1) {
      const commenter = studentRows[Math.floor(random() * studentRows.length)]?.id
      if (!commenter || commenter === post.authorId) continue

      commentRows.push({
        id: `demo-activity-comment-${postIndex + 1}-${index + 1}`,
        postId: post.id,
        authorId: commenter,
        body: COMMENT_TEMPLATES[(postIndex + index) % COMMENT_TEMPLATES.length]!,
        createdAt: new Date(post.createdAt.getTime() + (index + 1) * hour),
      })
    }

    // Likes: a spread from none to a couple of dozen, weighted so the newest
    // posts are not always the most liked.
    const reactionCount = Math.floor(random() * 22)
    const reactors = new Set<string>()

    for (let index = 0; index < reactionCount; index += 1) {
      const reactor = studentRows[Math.floor(random() * studentRows.length)]?.id
      if (!reactor || reactors.has(reactor)) continue
      reactors.add(reactor)

      reactionRows.push({
        id: `demo-activity-reaction-${postIndex + 1}-${index + 1}`,
        postId: post.id,
        userId: reactor,
        createdAt: new Date(post.createdAt.getTime() + (index + 1) * 60000),
      })
    }

    // The showcase account has liked a few, so the control renders in both
    // states during a walkthrough rather than always "not yet liked".
    if (showcase && postIndex % 5 === 1 && post.authorId !== SHOWCASE_USER) {
      reactionRows.push({
        id: `demo-activity-reaction-showcase-${postIndex + 1}`,
        postId: post.id,
        userId: SHOWCASE_USER,
        createdAt: new Date(post.createdAt.getTime() + 30 * 60000),
      })
    }
  })

  if (commentRows.length > 0) {
    await db.insert(postComments).values(commentRows).onConflictDoNothing()
  }

  if (reactionRows.length > 0) {
    await db.insert(postReactions).values(reactionRows).onConflictDoNothing()
  }

  /**
   * Four open reports, so the moderation queue is not empty during a demo.
   *
   * Three against posts and one against a comment, filed by students who did
   * not write the content - the service refuses self-reports, and seed data
   * that the app would reject is misleading.
   */
  const reportRows: Array<{
    id: string
    reporterId: string
    targetKind: "POST" | "COMMENT"
    targetId: string
    reason: (typeof REPORT_TEMPLATES)[number]["reason"]
    detail: string
    createdAt: Date
  }> = []

  REPORT_TEMPLATES.forEach((template, index) => {
    const target =
      index === 3 ? commentRows[index] : postRows[index * 3 + 1]

    if (!target) return

    const reporter = studentRows.find(
      (row) =>
        row.id !== ("authorId" in target ? target.authorId : "") &&
        row.id !== SHOWCASE_USER,
    )?.id

    if (!reporter) return

    reportRows.push({
      id: `demo-activity-report-${index + 1}`,
      reporterId: reporter,
      targetKind: index === 3 ? "COMMENT" : "POST",
      targetId: target.id,
      reason: template.reason,
      detail: template.detail,
      createdAt: new Date(latest - index * 5 * hour),
    })
  })

  if (reportRows.length > 0) {
    await db.insert(reports).values(reportRows).onConflictDoNothing()
  }

  return {
    posts: postRows.length,
    comments: commentRows.length,
    reactions: reactionRows.length,
    reports: reportRows.length,
    memberships: showcase ? membershipRows.length : 0,
  }
}

/** Count what is actually in the database now, for the run summary. */
export async function countActivity(): Promise<{
  posts: number
  comments: number
  reactions: number
}> {
  const [postCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
  const [commentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postComments)
  const [reactionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postReactions)

  return {
    posts: postCount?.count ?? 0,
    comments: commentCount?.count ?? 0,
    reactions: reactionCount?.count ?? 0,
  }
}

// Run directly: npx tsx lib/db/demo-activity-seed.ts
if (process.argv[1]?.includes("demo-activity-seed")) {
  seedCommunityActivity()
    .then(async (written) => {
      const totals = await countActivity()
      console.log("Community activity seeded.")
      console.log(
        `  wrote: ${written.posts} posts, ${written.comments} comments, ${written.reactions} likes, ${written.reports} reports`,
      )
      console.log(
        `  totals now: ${totals.posts} posts, ${totals.comments} comments, ${totals.reactions} likes`,
      )
      process.exit(0)
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exit(1)
    })
}
