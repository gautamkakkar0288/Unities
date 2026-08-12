import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"
import { communities, interests, places } from "./schema"

/**
 * Day-one data (D30).
 *
 * A student who signs up before any of their friends must not land in an empty
 * product. Chitkara, Tricity, the seventeen curated interests, and the interest
 * communities therefore exist before the first account does - they are not
 * something the first user is asked to create.
 *
 * Two properties this script must have:
 *
 * 1. **Idempotent.** Every insert is `onConflictDoNothing` against a unique
 *    slug, so running it twice changes nothing. A seed that fails the second
 *    time is a seed nobody dares run against staging.
 * 2. **Additive.** It never updates or deletes. Editing a community name here
 *    would silently overwrite whatever an admin renamed it to in production.
 *    Corrections belong in a migration, where they are reviewed.
 *
 * This opens its own connection rather than importing `lib/db`, because a
 * script has to terminate. The application singleton is deliberately never
 * closed; closing it here would be closing the app's pool.
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
  )
}

const client = postgres(connectionString, { prepare: false, max: 1 })
const db = drizzle(client, { schema })

/**
 * The curated taxonomy (D27). Order is the display order in the picker:
 * deliberately not alphabetical, so the things students actually do come first.
 */
const TAXONOMY = [
  { slug: "travel", label: "Travel" },
  { slug: "trekking", label: "Trekking" },
  { slug: "sports", label: "Sports" },
  { slug: "fitness", label: "Fitness" },
  { slug: "technology", label: "Technology" },
  { slug: "startups", label: "Startups" },
  { slug: "coding", label: "Coding" },
  { slug: "music", label: "Music" },
  { slug: "dance", label: "Dance" },
  { slug: "photography", label: "Photography" },
  { slug: "gaming", label: "Gaming" },
  { slug: "movies", label: "Movies" },
  { slug: "food", label: "Food" },
  { slug: "art", label: "Art" },
  { slug: "volunteering", label: "Volunteering" },
  { slug: "academics", label: "Academics" },
  { slug: "networking", label: "Networking" },
] as const

type InterestSlug = (typeof TAXONOMY)[number]["slug"]

/**
 * Interest communities are seeded for every interest in the taxonomy, not a
 * hand-picked few. A student who picks Gaming at onboarding and finds no Gaming
 * community learns that the interest picker is decorative.
 *
 * These are ownerless by design: "Football" should not belong to whoever
 * happened to type it first.
 */
const interestCommunityTagline: Record<InterestSlug, string> = {
  travel: "Trips, plans, and people to go with.",
  trekking: "Weekend treks and the people who wake up for them.",
  sports: "Matches, teams, and anyone short a player.",
  fitness: "Gym partners, runs, and morning discipline.",
  technology: "What is being built, and by whom.",
  startups: "Founders, ideas, and the people who ship them.",
  coding: "Projects, contests, and late-night debugging.",
  music: "Gigs, jams, and anyone with a spare amp.",
  dance: "Practice, choreography, and stage time.",
  photography: "Walks, shoots, and honest critique.",
  gaming: "Lobbies, LANs, and tournaments.",
  movies: "Screenings, recommendations, and arguments.",
  food: "Where to eat and who is going.",
  art: "Making things, and showing them to people.",
  volunteering: "Drives, causes, and hands that turn up.",
  academics: "Study groups, papers, and exam season.",
  networking: "Meeting people outside your own department.",
}

type SeedCommunity = {
  slug: string
  name: string
  tagline: string
  about: string
  kind: "OFFICIAL" | "INTEREST" | "STUDENT"
  scope: "UNIVERSITY" | "CITY" | "INTEREST" | "GLOBAL"
  placeSlug: string | null
  interestSlug: InterestSlug
  joinPolicy: "OPEN" | "APPROVAL" | "INVITE"
  verification: "UNVERIFIED" | "PENDING" | "VERIFIED"
  guidelines: string[]
}

const CAMPUS_GUIDELINES = [
  "Use your real name. This is a students-only space and it only works if people are who they say they are.",
  "Post things people can turn up to. Promotion without an invitation is spam.",
  "Disagree with the argument, not the person.",
]

const officialCommunities: SeedCommunity[] = [
  {
    slug: "chitkara-university",
    name: "Chitkara University",
    tagline: "Everything happening on campus, in one place.",
    about:
      "The main campus community. Every club, society, and department event" +
      " surfaces here, so you never find out about something the day after it" +
      " happened.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "academics",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "chitkara-coding-club",
    name: "Chitkara Coding Club",
    tagline: "Build things, break things, ship things.",
    about:
      "Workshops, contests, and project nights. Beginners are the point, not" +
      " an inconvenience.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "coding",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "chitkara-photography-club",
    name: "Chitkara Photography Club",
    tagline: "Photo walks, critique, and campus stories.",
    about: "Monthly walks, an honest critique session, and the campus archive.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "photography",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "chitkara-robotics-club",
    name: "Chitkara Robotics Club",
    tagline: "Hardware, firmware, and things that move.",
    about: "Line followers, drones, and the annual build season.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "technology",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "chitkara-music-society",
    name: "Chitkara Music Society",
    tagline: "Open mics, jams, and the annual showcase.",
    about: "Bring an instrument or bring nothing. Both are fine.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "music",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "chitkara-debate-society",
    name: "Chitkara Debate Society",
    tagline: "Parliamentary debate, weekly.",
    about: "Practice rounds on Wednesdays, tournaments once a month.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "academics",
    joinPolicy: "OPEN",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    /**
     * The one seeded community that is not open. Selective bodies are exactly
     * the case D29 keeps `APPROVAL` for, and seeding one means the approval
     * path is exercised on day one rather than discovered to be broken later.
     */
    slug: "chitkara-entrepreneurship-cell",
    name: "Chitkara Entrepreneurship Cell",
    tagline: "For students actually building something.",
    about:
      "Mentorship, pitch practice, and introductions. Membership is reviewed" +
      " because the sessions are small.",
    kind: "OFFICIAL",
    scope: "UNIVERSITY",
    placeSlug: "chitkara-university",
    interestSlug: "startups",
    joinPolicy: "APPROVAL",
    verification: "VERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
]

const cityCommunities: SeedCommunity[] = [
  {
    slug: "tricity-runners",
    name: "Tricity Runners",
    tagline: "Sunday morning runs across Chandigarh, Mohali, and Panchkula.",
    about: "Students from every campus in the Tricity. All paces.",
    kind: "OFFICIAL",
    scope: "CITY",
    placeSlug: "tricity",
    interestSlug: "fitness",
    joinPolicy: "OPEN",
    verification: "UNVERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
  {
    slug: "tricity-foodies",
    name: "Tricity Foodies",
    tagline: "Where to eat, and who is going tonight.",
    about: "Recommendations from students, not from sponsored lists.",
    kind: "OFFICIAL",
    scope: "CITY",
    placeSlug: "tricity",
    interestSlug: "food",
    joinPolicy: "OPEN",
    verification: "UNVERIFIED",
    guidelines: CAMPUS_GUIDELINES,
  },
]

async function seed() {
  console.info("Seeding places...")

  await db
    .insert(places)
    .values({
      kind: "CITY",
      name: "Tricity",
      slug: "tricity",
      status: "ACTIVE",
    })
    .onConflictDoNothing({ target: places.slug })

  const tricityId = await placeIdBySlug("tricity")

  await db
    .insert(places)
    .values({
      kind: "UNIVERSITY",
      name: "Chitkara University",
      slug: "chitkara-university",
      status: "ACTIVE",
      parentPlaceId: tricityId,
      emailDomain: "chitkara.edu.in",
    })
    .onConflictDoNothing({ target: places.slug })

  console.info("Seeding interests...")

  await db
    .insert(interests)
    .values(
      TAXONOMY.map((interest, index) => ({
        slug: interest.slug,
        label: interest.label,
        sortOrder: index,
        status: "ACTIVE" as const,
      })),
    )
    .onConflictDoNothing({ target: interests.slug })

  const interestIds = new Map(
    (await db.select({ id: interests.id, slug: interests.slug }).from(interests)).map(
      (row) => [row.slug, row.id],
    ),
  )

  const placeIds = new Map(
    (await db.select({ id: places.id, slug: places.slug }).from(places)).map(
      (row) => [row.slug, row.id],
    ),
  )

  console.info("Seeding communities...")

  const interestCommunities: SeedCommunity[] = TAXONOMY.map((interest) => ({
    slug: `${interest.slug}-community`,
    name: interest.label,
    tagline: interestCommunityTagline[interest.slug],
    about: `Everyone on Cirqles who is into ${interest.label.toLowerCase()}, wherever they study.`,
    kind: "INTEREST" as const,
    scope: "INTEREST" as const,
    placeSlug: null,
    interestSlug: interest.slug,
    joinPolicy: "OPEN" as const,
    verification: "UNVERIFIED" as const,
    guidelines: CAMPUS_GUIDELINES,
  }))

  const allCommunities = [
    ...officialCommunities,
    ...cityCommunities,
    ...interestCommunities,
  ]

  await db
    .insert(communities)
    .values(
      allCommunities.map((community) => {
        const interestId = interestIds.get(community.interestSlug)
        if (!interestId) {
          throw new Error(
            `Interest "${community.interestSlug}" is missing. The taxonomy and the community seed have drifted apart.`,
          )
        }

        const placeId = community.placeSlug
          ? placeIds.get(community.placeSlug)
          : null
        if (community.placeSlug && !placeId) {
          throw new Error(`Place "${community.placeSlug}" is missing.`)
        }

        return {
          slug: community.slug,
          name: community.name,
          tagline: community.tagline,
          about: community.about,
          guidelines: community.guidelines,
          kind: community.kind,
          scope: community.scope,
          placeId: placeId ?? null,
          interestId,
          joinPolicy: community.joinPolicy,
          verification: community.verification,
        }
      }),
    )
    .onConflictDoNothing({ target: communities.slug })

  console.info(
    `Seeded ${TAXONOMY.length} interests and ${allCommunities.length} communities across 2 places.`,
  )
}

async function placeIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: places.id })
    .from(places)
    .where(eq(places.slug, slug))
    .limit(1)

  if (!row) {
    throw new Error(`Place "${slug}" was not inserted.`)
  }

  return row.id
}

seed()
  .then(async () => {
    await client.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    await client.end()
    process.exit(1)
  })
