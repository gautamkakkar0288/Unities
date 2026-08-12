import type {
  Activity,
  AppNotification,
  AuditEntry,
  CampusOverview,
  Comment,
  CommunityDetail,
  CommunityProposal,
  CommunityRef,
  CommunitySummary,
  Conversation,
  EventDetail,
  EventSummary,
  Interest,
  InterestSuggestion,
  Message,
  ModerationItem,
  PersonSummary,
  PlaceRef,
  Post,
  ProfileDetail,
  SearchResult,
  VerificationRequest,
} from "@/lib/domain/types"

/**
 * Fixture data for the interactive prototype.
 *
 * Everything here is fabricated. Two rules keep it useful:
 *
 * 1. **Deterministic.** Timestamps are literals relative to `prototypeNow`,
 *    never `new Date()`. A prototype whose content shifts between server render
 *    and client hydration produces mismatch warnings, and one that changes on
 *    every refresh cannot be reviewed or screenshotted.
 * 2. **Awkward on purpose.** A full event, a pending join request, an
 *    unverified community, an invite-only community, a closed registration, an
 *    expired activity, a duplicate community proposal, and a long name that
 *    wraps. Happy-path fixtures hide exactly the layout and copy problems a
 *    prototype exists to find.
 */

/** The fixed "current time" every prototype screen reasons about. */
export const prototypeNow = "2026-08-07T09:00:00+05:30"

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

/**
 * Seeded on day one. A student who signs up before any of their friends still
 * lands on a populated campus rather than an empty product.
 */
export const chitkara: PlaceRef = {
  id: "pl-chitkara",
  slug: "chitkara-university",
  name: "Chitkara University",
  kind: "UNIVERSITY",
}

export const tricity: PlaceRef = {
  id: "pl-tricity",
  slug: "tricity",
  name: "Tricity",
  kind: "CITY",
}

// ---------------------------------------------------------------------------
// Interest taxonomy (curated seed - see DECISIONS.md D27)
// ---------------------------------------------------------------------------

export const interests: Interest[] = [
  { id: "i-travel", slug: "travel", label: "Travel" },
  { id: "i-trekking", slug: "trekking", label: "Trekking" },
  { id: "i-sports", slug: "sports", label: "Sports" },
  { id: "i-fitness", slug: "fitness", label: "Fitness" },
  { id: "i-technology", slug: "technology", label: "Technology" },
  { id: "i-startups", slug: "startups", label: "Startups" },
  { id: "i-coding", slug: "coding", label: "Coding" },
  { id: "i-music", slug: "music", label: "Music" },
  { id: "i-dance", slug: "dance", label: "Dance" },
  { id: "i-photography", slug: "photography", label: "Photography" },
  { id: "i-gaming", slug: "gaming", label: "Gaming" },
  { id: "i-movies", slug: "movies", label: "Movies" },
  { id: "i-food", slug: "food", label: "Food" },
  { id: "i-art", slug: "art", label: "Art" },
  { id: "i-volunteering", slug: "volunteering", label: "Volunteering" },
  { id: "i-academics", slug: "academics", label: "Academics" },
  { id: "i-networking", slug: "networking", label: "Networking" },
]

const interestBySlug = (slug: string): Interest => {
  const found = interests.find((interest) => interest.slug === slug)
  if (!found) throw new Error(`Unknown fixture interest: ${slug}`)
  return found
}

/** The interests the viewer picked during onboarding. */
export const viewerInterestSlugs = ["technology", "coding", "travel"]

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const viewer: PersonSummary = {
  id: "u-viewer",
  name: "Gautam Kakkar",
  username: "gautam",
  avatarUrl: null,
  role: "STUDENT",
  programme: "B.E. CSE 2027",
}

export const ishita: PersonSummary = {
  id: "u-ishita",
  name: "Ishita Rao",
  username: "ishita.rao",
  avatarUrl: null,
  role: "ORGANIZER",
  programme: "B.E. ECE 2026",
}

export const kabir: PersonSummary = {
  id: "u-kabir",
  name: "Kabir Sethi",
  username: "kabir",
  avatarUrl: null,
  role: "COMMUNITY_MODERATOR",
  programme: "B.Tech Mechanical 2027",
}

export const aarav: PersonSummary = {
  id: "u-aarav",
  name: "Aarav Menon",
  username: "aarav",
  avatarUrl: null,
  role: "STUDENT",
  programme: "B.E. CSE 2028",
}

export const meera: PersonSummary = {
  id: "u-meera",
  name: "Meera Nair",
  username: "meera",
  avatarUrl: null,
  role: "STUDENT",
  programme: "BBA 2027",
}

/** Long name on purpose - headers and bylines have to survive wrapping. */
export const priya: PersonSummary = {
  id: "u-priya",
  name: "Dr. Priyadarshini Balasubramanian",
  username: "p.balan",
  avatarUrl: null,
  role: "UNIVERSITY_ADMIN",
  programme: null,
}

export const people: PersonSummary[] = [viewer, ishita, kabir, aarav, meera, priya]

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

const toRef = (community: CommunitySummary): CommunityRef => ({
  id: community.id,
  slug: community.slug,
  name: community.name,
  verification: community.verification,
})

/** The seeded campus community itself. Nobody has to create this. */
export const chitkaraCommunity: CommunitySummary = {
  id: "c-chitkara",
  slug: "chitkara-university",
  name: "Chitkara University",
  tagline: "Everything happening on campus, in one place.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("academics"),
  memberCount: 12_482,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "MEMBER",
}

export const devCircle: CommunitySummary = {
  id: "c-dev",
  slug: "coding-club",
  name: "Chitkara Coding Club",
  tagline: "Weekly builds, code review, and internship prep.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("coding"),
  memberCount: 1248,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "MODERATOR",
}

export const roboticsClub: CommunitySummary = {
  id: "c-robotics",
  slug: "robotics-club",
  name: "Robotics Club",
  tagline: "Build machines that leave the lab.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("technology"),
  memberCount: 412,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "MEMBER",
}

export const photographyClub: CommunitySummary = {
  id: "c-photography",
  slug: "photography-club",
  name: "Chitkara Photography Club",
  tagline: "Campus walks, darkroom nights, and honest critique.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("photography"),
  memberCount: 634,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

export const designCollective: CommunitySummary = {
  id: "c-design",
  slug: "design-collective",
  name: "Design Collective",
  tagline: "Critique, craft, and campus design jams.",
  kind: "STUDENT",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("art"),
  memberCount: 286,
  verification: "UNVERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

/** Approval-gated, and the viewer is already waiting. */
export const eCell: CommunitySummary = {
  id: "c-ecell",
  slug: "entrepreneurship-cell",
  name: "Entrepreneurship Cell",
  tagline: "From idea to first paying user.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("startups"),
  memberCount: 517,
  verification: "VERIFIED",
  joinPolicy: "APPROVAL",
  viewerMembership: "PENDING",
}

/** Invite only - the third privacy level has to be visible somewhere. */
export const leadershipCircle: CommunitySummary = {
  id: "c-leadership",
  slug: "student-leadership-circle",
  name: "Student Leadership Circle",
  tagline: "Council members, club heads, and student representatives.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("networking"),
  memberCount: 48,
  verification: "VERIFIED",
  joinPolicy: "INVITE",
  viewerMembership: "NONE",
}

export const musicSociety: CommunitySummary = {
  id: "c-music",
  slug: "music-society",
  name: "Music Society",
  tagline: "Open mics, jam rooms, and the annual showcase.",
  kind: "STUDENT",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("music"),
  memberCount: 342,
  verification: "UNVERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

export const debateSociety: CommunitySummary = {
  id: "c-debate",
  slug: "debate-society",
  name: "Debate Society",
  tagline: "Parliamentary debate and public speaking.",
  kind: "OFFICIAL",
  scope: "UNIVERSITY",
  place: chitkara,
  interest: interestBySlug("academics"),
  memberCount: 168,
  verification: "PENDING",
  joinPolicy: "APPROVAL",
  viewerMembership: "NONE",
}

/** City scope. The step between campus and the wider network. */
export const tricityRunners: CommunitySummary = {
  id: "c-tricity-runners",
  slug: "tricity-runners",
  name: "Tricity Runners",
  tagline: "Sunday long runs across Chandigarh, Mohali, and Panchkula.",
  kind: "INTEREST",
  scope: "CITY",
  place: tricity,
  interest: interestBySlug("fitness"),
  memberCount: 2140,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

export const tricityFoodies: CommunitySummary = {
  id: "c-tricity-food",
  slug: "tricity-food",
  name: "Tricity Food Crawl",
  tagline: "Sector 35 street food to Panchkula breakfast runs.",
  kind: "INTEREST",
  scope: "CITY",
  place: tricity,
  interest: interestBySlug("food"),
  memberCount: 1687,
  verification: "UNVERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

/**
 * Interest communities are seeded from the taxonomy and owned by nobody, so
 * they cannot be captured by whoever registered the name first.
 */
export const trekkingCommunity: CommunitySummary = {
  id: "c-trekking",
  slug: "trekking",
  name: "Trekking",
  tagline: "Weekend Himalayan routes, gear talk, and trip planning.",
  kind: "INTEREST",
  scope: "INTEREST",
  place: null,
  interest: interestBySlug("trekking"),
  memberCount: 8940,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "MEMBER",
}

export const footballCommunity: CommunitySummary = {
  id: "c-football",
  slug: "football",
  name: "Football",
  tagline: "Five-a-side, league fixtures, and Sunday kickabouts.",
  kind: "INTEREST",
  scope: "INTEREST",
  place: null,
  interest: interestBySlug("sports"),
  memberCount: 5312,
  verification: "VERIFIED",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

export const communities: CommunitySummary[] = [
  chitkaraCommunity,
  devCircle,
  roboticsClub,
  photographyClub,
  designCollective,
  eCell,
  leadershipCircle,
  musicSociety,
  debateSociety,
  tricityRunners,
  tricityFoodies,
  trekkingCommunity,
  footballCommunity,
]

/** The clubs and societies listed inside the campus community. */
export const campusClubs: CommunitySummary[] = [
  devCircle,
  roboticsClub,
  photographyClub,
  eCell,
  musicSociety,
  debateSociety,
]

/** The communities the viewer belongs to, for the sidebar and profile. */
export const viewerCommunities: CommunitySummary[] = [
  chitkaraCommunity,
  devCircle,
  roboticsClub,
  trekkingCommunity,
  eCell,
]

export const roboticsClubDetail: CommunityDetail = {
  ...roboticsClub,
  about:
    "We design, build, and break autonomous machines. Weekly build nights in the Block E lab, a lending shelf of sensors and motor drivers, and two competition teams that travel each semester. Beginners are the point - if you have never soldered anything, start at a build night and someone will hand you an iron.",
  guidelines: [
    "Anyone can attend a build night. You do not need to be on a competition team.",
    "Log the parts you borrow. The lending shelf runs on trust and a spreadsheet.",
    "Post build photos and failures alike. The failures are more useful.",
    "No recruitment posts for unrelated events or paid courses.",
  ],
  createdAt: "2023-08-12T10:00:00+05:30",
  moderators: [kabir, ishita],
  upcomingEventCount: 3,
  postCount: 214,
}

// ---------------------------------------------------------------------------
// Community proposals and interest suggestions
// ---------------------------------------------------------------------------

/**
 * The first proposal is the case this whole flow exists for: a well-meaning
 * student about to create the fourth Chitkara football community.
 */
export const communityProposals: CommunityProposal[] = [
  {
    id: "cp-1",
    proposedName: "Chitkara Football Lovers",
    tagline: "For everyone who plays football at Chitkara.",
    reason:
      "There is no football group for our year. We play every evening near the hostel ground and organise over WhatsApp.",
    interest: interestBySlug("sports"),
    scope: "UNIVERSITY",
    proposedBy: aarav,
    proposedAt: "2026-08-06T21:40:00+05:30",
    status: "PENDING",
    supporterCount: 12,
    similarTo: [toRef(footballCommunity)],
    reviewerNote: null,
    mergedInto: null,
  },
  {
    id: "cp-2",
    proposedName: "Anime and Manga Club",
    tagline: "Weekly screenings and a lending library of volumes.",
    reason:
      "Thirty-four people signed the interest sheet at the freshers fair and there is nowhere to put them.",
    interest: interestBySlug("movies"),
    scope: "UNIVERSITY",
    proposedBy: meera,
    proposedAt: "2026-08-05T14:10:00+05:30",
    status: "PENDING",
    supporterCount: 34,
    similarTo: [],
    reviewerNote: null,
    mergedInto: null,
  },
  {
    id: "cp-3",
    proposedName: "Chitkara Trekkers",
    tagline: "Weekend treks for students.",
    reason: "We want to organise a Triund trek in September.",
    interest: interestBySlug("trekking"),
    scope: "UNIVERSITY",
    proposedBy: kabir,
    proposedAt: "2026-07-30T11:00:00+05:30",
    status: "MERGED",
    supporterCount: 7,
    similarTo: [toRef(trekkingCommunity)],
    reviewerNote:
      "Folded into the Trekking interest community, which already runs campus trips. Kabir added as a moderator there.",
    mergedInto: toRef(trekkingCommunity),
  },
  {
    id: "cp-4",
    proposedName: "Placement Guarantee Group",
    tagline: "Paid mentorship for placements.",
    reason: "Selling a course.",
    interest: interestBySlug("networking"),
    scope: "UNIVERSITY",
    proposedBy: aarav,
    proposedAt: "2026-07-28T09:15:00+05:30",
    status: "REJECTED",
    supporterCount: 0,
    similarTo: [],
    reviewerNote: "Commercial promotion. Not permitted under the community guidelines.",
    mergedInto: null,
  },
]

export const interestSuggestions: InterestSuggestion[] = [
  {
    id: "is-1",
    label: "Padel",
    suggestedBy: meera,
    suggestedAt: "2026-08-04T17:25:00+05:30",
    demandCount: 41,
    status: "PENDING",
    mapsTo: null,
  },
  {
    id: "is-2",
    label: "Leetcode",
    suggestedBy: aarav,
    suggestedAt: "2026-08-03T10:05:00+05:30",
    demandCount: 6,
    // The fragmentation case: this is Coding wearing a different name.
    status: "MERGED",
    mapsTo: interestBySlug("coding"),
  },
  {
    id: "is-3",
    label: "K-pop dance",
    suggestedBy: meera,
    suggestedAt: "2026-08-02T19:40:00+05:30",
    demandCount: 18,
    status: "MERGED",
    mapsTo: interestBySlug("dance"),
  },
  {
    id: "is-4",
    label: "Cricket",
    suggestedBy: kabir,
    suggestedAt: "2026-08-01T08:30:00+05:30",
    demandCount: 96,
    status: "APPROVED",
    mapsTo: null,
  },
]

// ---------------------------------------------------------------------------
// Activities ("find people")
// ---------------------------------------------------------------------------

export const badmintonActivity: Activity = {
  id: "act-1",
  kind: "SPORT",
  title: "Badminton doubles at 6",
  detail: "Need two more for doubles. Court 3, bring your own racket if you have one.",
  author: aarav,
  interest: interestBySlug("sports"),
  place: "Sports Complex, Court 3",
  happensAt: "2026-08-07T18:00:00+05:30",
  expiresAt: "2026-08-07T17:30:00+05:30",
  spotsNeeded: 3,
  spotsFilled: 1,
  joiners: [meera],
  status: "OPEN",
  viewerHasJoined: false,
  community: null,
}

export const hackathonActivity: Activity = {
  id: "act-2",
  kind: "TEAM",
  title: "Need 2 teammates for the hackathon",
  detail:
    "Building a campus lost-and-found. I can do backend. Looking for someone on frontend and someone who can present.",
  author: meera,
  interest: interestBySlug("coding"),
  place: "Innovation Lab",
  happensAt: "2026-08-14T09:00:00+05:30",
  expiresAt: "2026-08-12T23:59:00+05:30",
  spotsNeeded: 2,
  spotsFilled: 1,
  joiners: [viewer],
  status: "OPEN",
  viewerHasJoined: true,
  community: toRef(devCircle),
}

export const studyGroupActivity: Activity = {
  id: "act-3",
  kind: "STUDY",
  title: "DSA study group before the mock interviews",
  detail: "Graphs and DP, two hours, library second floor. Bring your own laptop.",
  author: kabir,
  interest: interestBySlug("coding"),
  place: "Central Library, Floor 2",
  happensAt: "2026-08-09T16:00:00+05:30",
  expiresAt: "2026-08-09T15:00:00+05:30",
  spotsNeeded: 6,
  spotsFilled: 4,
  joiners: [aarav, meera],
  status: "OPEN",
  viewerHasJoined: false,
  community: null,
}

/** Full on purpose - the reserve path has to be visible. */
export const kasolCarpoolActivity: Activity = {
  id: "act-4",
  kind: "TRAVEL",
  title: "Anyone going to Kasol? Splitting a cab",
  detail: "Leaving Friday night from the main gate. Four seats, splitting fuel and tolls.",
  author: ishita,
  interest: interestBySlug("travel"),
  place: "Main Gate",
  happensAt: "2026-08-21T21:00:00+05:30",
  expiresAt: "2026-08-21T18:00:00+05:30",
  spotsNeeded: 4,
  spotsFilled: 4,
  joiners: [aarav, meera, kabir, viewer],
  status: "OPEN",
  viewerHasJoined: false,
  community: toRef(trekkingCommunity),
}

/** Already expired - it must never appear on a live surface. */
export const expiredActivity: Activity = {
  id: "act-5",
  kind: "CASUAL",
  title: "Coffee at the amphitheatre in 20 minutes",
  detail: "Free period, anyone around?",
  author: aarav,
  interest: interestBySlug("food"),
  place: "Open Air Amphitheatre",
  happensAt: "2026-08-06T15:00:00+05:30",
  expiresAt: "2026-08-06T15:00:00+05:30",
  spotsNeeded: 4,
  spotsFilled: 2,
  joiners: [meera, kabir],
  status: "EXPIRED",
  viewerHasJoined: false,
  community: null,
}

export const activities: Activity[] = [
  badmintonActivity,
  hackathonActivity,
  studyGroupActivity,
  kasolCarpoolActivity,
  expiredActivity,
]

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const feedPosts: Post[] = [
  {
    id: "p-1",
    kind: "ANNOUNCEMENT",
    author: ishita,
    community: toRef(roboticsClub),
    createdAt: "2026-08-07T08:10:00+05:30",
    body: "Line Follower Bootcamp is tomorrow, 4pm, Block E lab.\n\nThree seats left and we are not extending capacity - the lab has 40 stools and a fire code. Bring a laptop. Kits, sensors, and solder stations are provided. If you registered and cannot make it, cancel so someone on the waitlist gets in.",
    pinned: true,
    reactionCount: 86,
    commentCount: 12,
    viewerHasReacted: true,
    viewerHasSaved: true,
  },
  {
    id: "p-2",
    kind: "QUESTION",
    author: aarav,
    community: toRef(devCircle),
    createdAt: "2026-08-07T07:35:00+05:30",
    body: "Has anyone here done the summer internship at a Gurgaon fintech? Trying to work out whether the DSA round is LeetCode medium or harder, and whether they ask system design to second years.",
    pinned: false,
    reactionCount: 14,
    commentCount: 9,
    viewerHasReacted: false,
    viewerHasSaved: false,
  },
  {
    id: "p-3",
    kind: "UPDATE",
    author: kabir,
    community: toRef(roboticsClub),
    createdAt: "2026-08-06T21:15:00+05:30",
    body: "Build night recap: the differential drive finally tracks straight after we swapped to the encoder-based PID. Full write-up and the tuning values are on the shelf notebook. Two spare motor drivers if anyone needs them.",
    pinned: false,
    reactionCount: 41,
    commentCount: 4,
    viewerHasReacted: false,
    viewerHasSaved: false,
  },
  {
    id: "p-4",
    kind: "ANNOUNCEMENT",
    author: priya,
    community: toRef(devCircle),
    createdAt: "2026-08-06T16:00:00+05:30",
    body: "Placement week timetable is published. Pre-placement talks run from 18 August, and the shortlisting deadline for CSE and ECE is 14 August. Registrations close at midnight - late entries will not be considered this cycle.",
    pinned: false,
    reactionCount: 203,
    commentCount: 37,
    viewerHasReacted: false,
    viewerHasSaved: true,
  },
  {
    id: "p-5",
    kind: "UPDATE",
    author: meera,
    community: toRef(designCollective),
    createdAt: "2026-08-05T19:40:00+05:30",
    body: "Portfolio critique night is open to non-members this month. Bring three screens and a thick skin. We start with juniors so nobody has to follow a final-year portfolio.",
    pinned: false,
    reactionCount: 57,
    commentCount: 6,
    viewerHasReacted: true,
    viewerHasSaved: false,
  },
]

/** The post that the post-detail screen opens. */
export const focusPost: Post = feedPosts[0]!

export const focusPostComments: Comment[] = [
  {
    id: "cm-1",
    author: aarav,
    createdAt: "2026-08-07T08:22:00+05:30",
    body: "Do we need to bring our own Arduino or is that provided too?",
    reactionCount: 3,
    viewerHasReacted: false,
  },
  {
    id: "cm-2",
    author: ishita,
    createdAt: "2026-08-07T08:26:00+05:30",
    body: "Provided. Bring only a laptop and a USB-A cable if you have one - we are short on cables, not boards.",
    reactionCount: 11,
    viewerHasReacted: true,
  },
  {
    id: "cm-3",
    author: meera,
    createdAt: "2026-08-07T08:41:00+05:30",
    body: "Is this beginner friendly if I have never touched a soldering iron?",
    reactionCount: 5,
    viewerHasReacted: false,
  },
  {
    id: "cm-4",
    author: kabir,
    createdAt: "2026-08-07T08:47:00+05:30",
    body: "That is the entire point of the bootcamp. Sit at the front table and one of us will walk you through the first joint.",
    reactionCount: 9,
    viewerHasReacted: false,
  },
]

export const communityPosts: Post[] = feedPosts.filter(
  (post) => post.community.id === roboticsClub.id,
)

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const lineFollowerEvent: EventSummary = {
  id: "e-1",
  slug: "line-follower-bootcamp",
  title: "Line Follower Bootcamp",
  kind: "WORKSHOP",
  startsAt: "2026-08-08T16:00:00+05:30",
  endsAt: "2026-08-08T19:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Block E Robotics Lab",
  community: toRef(roboticsClub),
  interest: interestBySlug("technology"),
  capacity: 40,
  registeredCount: 37,
  feeInPaise: null,
  viewerRegistration: "NONE",
}

/** Full - the waitlist path has to be visible in the prototype. */
export const critiqueNightEvent: EventSummary = {
  id: "e-2",
  slug: "portfolio-critique-night",
  title: "Portfolio Critique Night",
  kind: "MEETUP",
  startsAt: "2026-08-09T18:00:00+05:30",
  endsAt: "2026-08-09T20:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Design Studio, Block D",
  community: toRef(designCollective),
  interest: interestBySlug("art"),
  capacity: 25,
  registeredCount: 25,
  feeInPaise: null,
  viewerRegistration: "NONE",
}

/** Paid, hybrid, and the viewer is already in. */
export const mockInterviewEvent: EventSummary = {
  id: "e-3",
  slug: "dsa-mock-interviews",
  title: "Internship Sprint: DSA Mock Interviews",
  kind: "DRIVE",
  startsAt: "2026-08-11T10:00:00+05:30",
  endsAt: "2026-08-11T13:00:00+05:30",
  mode: "HYBRID",
  venue: "Auditorium 2 and online",
  community: toRef(devCircle),
  interest: interestBySlug("coding"),
  capacity: 200,
  registeredCount: 118,
  feeInPaise: 25_000,
  viewerRegistration: "REGISTERED",
}

export const firesideEvent: EventSummary = {
  id: "e-4",
  slug: "founder-fireside",
  title: "Founder Fireside: Building in Public",
  kind: "TALK",
  startsAt: "2026-08-14T17:30:00+05:30",
  endsAt: "2026-08-14T19:00:00+05:30",
  mode: "ONLINE",
  venue: "Streamed link shared on registration",
  community: toRef(eCell),
  interest: interestBySlug("startups"),
  capacity: null,
  registeredCount: 264,
  feeInPaise: null,
  viewerRegistration: "NONE",
}

export const openMicEvent: EventSummary = {
  id: "e-5",
  slug: "open-mic-night",
  title: "Open Mic Night",
  kind: "PERFORMANCE",
  startsAt: "2026-08-15T19:00:00+05:30",
  endsAt: "2026-08-15T22:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Open Air Amphitheatre",
  community: toRef(musicSociety),
  interest: interestBySlug("music"),
  capacity: 300,
  registeredCount: 91,
  feeInPaise: 10_000,
  viewerRegistration: "NONE",
}

/** Already started, so registration is closed. */
export const debateTrialsEvent: EventSummary = {
  id: "e-6",
  slug: "debate-trials",
  title: "Parliamentary Debate Trials",
  kind: "TOURNAMENT",
  startsAt: "2026-08-06T15:00:00+05:30",
  endsAt: "2026-08-06T18:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Seminar Hall 3",
  community: toRef(debateSociety),
  interest: interestBySlug("academics"),
  capacity: 60,
  registeredCount: 60,
  feeInPaise: null,
  viewerRegistration: "CLOSED",
}

/**
 * The trip. Paid, overnight, off campus, and nearly full.
 *
 * This is the fixture that stress-tests the money and duty-of-care copy - a
 * seminar fixture would never have surfaced either.
 */
export const kasolTripEvent: EventSummary = {
  id: "e-7",
  slug: "kasol-weekend-trip",
  title: "Kasol Weekend Trip",
  kind: "TRIP",
  startsAt: "2026-08-21T22:00:00+05:30",
  endsAt: "2026-08-24T07:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Departs from the main gate",
  community: toRef(trekkingCommunity),
  interest: interestBySlug("travel"),
  capacity: 30,
  registeredCount: 26,
  feeInPaise: 450_000,
  viewerRegistration: "NONE",
}

export const badmintonTournamentEvent: EventSummary = {
  id: "e-8",
  slug: "inter-hostel-badminton",
  title: "Inter-Hostel Badminton Tournament",
  kind: "TOURNAMENT",
  startsAt: "2026-08-09T09:00:00+05:30",
  endsAt: "2026-08-09T17:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Sports Complex",
  community: toRef(chitkaraCommunity),
  interest: interestBySlug("sports"),
  capacity: 64,
  registeredCount: 58,
  feeInPaise: 5_000,
  viewerRegistration: "NONE",
}

export const photoWalkEvent: EventSummary = {
  id: "e-9",
  slug: "sukhna-photo-walk",
  title: "Sunrise Photo Walk at Sukhna",
  kind: "MEETUP",
  startsAt: "2026-08-09T05:30:00+05:30",
  endsAt: "2026-08-09T08:30:00+05:30",
  mode: "IN_PERSON",
  venue: "Sukhna Lake, Chandigarh",
  community: toRef(photographyClub),
  interest: interestBySlug("photography"),
  capacity: 20,
  registeredCount: 17,
  feeInPaise: null,
  viewerRegistration: "NONE",
}

export const events: EventSummary[] = [
  lineFollowerEvent,
  critiqueNightEvent,
  mockInterviewEvent,
  firesideEvent,
  openMicEvent,
  debateTrialsEvent,
  kasolTripEvent,
  badmintonTournamentEvent,
  photoWalkEvent,
]

/** Events the viewer is registered for, for the home rail and profile. */
export const viewerEvents: EventSummary[] = [mockInterviewEvent]

export const lineFollowerDetail: EventDetail = {
  ...lineFollowerEvent,
  description:
    "A three hour build from bare PCB to a robot that follows a track. We cover reflectance sensor arrays, motor driver wiring, and just enough PID tuning to stop the oscillation. You leave with a working chassis and the tuning values written on the back of your hand.\n\nNo experience needed. If you have never soldered, sit at the front table.",
  agenda: [
    { at: "2026-08-08T16:00:00+05:30", title: "Kits, safety, and soldering basics" },
    { at: "2026-08-08T16:45:00+05:30", title: "Sensor array assembly" },
    { at: "2026-08-08T17:30:00+05:30", title: "Motor drivers and first movement" },
    { at: "2026-08-08T18:15:00+05:30", title: "PID tuning and time trials" },
  ],
  organisers: [ishita, kabir],
  registrationClosesAt: "2026-08-08T12:00:00+05:30",
  attendeePreview: [aarav, meera, kabir, ishita],
  trip: null,
}

export const kasolTripDetail: EventDetail = {
  ...kasolTripEvent,
  description:
    "Two nights in Kasol with a day hike up to Chalal and a riverside camp on the Saturday. Sleeper bus both ways, shared rooms, and a guide for the hike.\n\nThis is a moderate hike, not a trek - if you can walk for four hours you are fine. Warm layers are not optional; it drops to single digits after dark.",
  agenda: [
    { at: "2026-08-21T22:00:00+05:30", title: "Depart from the main gate" },
    { at: "2026-08-22T08:00:00+05:30", title: "Arrive, breakfast, check in" },
    { at: "2026-08-22T11:00:00+05:30", title: "Chalal hike and riverside afternoon" },
    { at: "2026-08-23T09:00:00+05:30", title: "Free morning in Kasol village" },
    { at: "2026-08-23T20:00:00+05:30", title: "Depart for Chandigarh" },
  ],
  organisers: [ishita],
  registrationClosesAt: "2026-08-18T23:59:00+05:30",
  attendeePreview: [kabir, meera, aarav],
  trip: {
    departsFrom: "Chitkara University main gate",
    departsAt: "2026-08-21T22:00:00+05:30",
    returnsAt: "2026-08-24T07:00:00+05:30",
    nights: 2,
    travelMode: "Sleeper bus, both ways",
    costIncludes: [
      "Return bus fare",
      "Two nights shared accommodation",
      "Breakfast on both mornings",
      "Guide for the Chalal hike",
    ],
    costExcludes: ["Lunch and dinner", "Personal expenses", "Travel insurance"],
    emergencyContact: "Ishita Rao, +91 98xxx xxx21 (reachable through the trip)",
    consentRequired: true,
    cancellationPolicy:
      "Full refund until 14 August. Half refund until 18 August. No refund after that, because the bus and rooms are paid for by then.",
  },
}

// ---------------------------------------------------------------------------
// Campus overview (the seeded Chitkara surface)
// ---------------------------------------------------------------------------

export const campusOverview: CampusOverview = {
  university: chitkara,
  studentCount: 12_482,
  upcomingEventCount: 248,
  clubCount: 36,
  viewerMembership: "MEMBER",
  trending: [
    lineFollowerEvent,
    badmintonTournamentEvent,
    photoWalkEvent,
    kasolTripEvent,
  ],
  activities: [badmintonActivity, hackathonActivity, studyGroupActivity],
  clubs: campusClubs,
}

// ---------------------------------------------------------------------------
// Notifications, messaging, profile, search, moderation
// ---------------------------------------------------------------------------

export const notifications: AppNotification[] = [
  {
    id: "n-1",
    kind: "EVENT_REMINDER",
    title: "Line Follower Bootcamp starts tomorrow",
    body: "Tomorrow, 4:00 pm at Block E Robotics Lab. Bring a laptop.",
    createdAt: "2026-08-07T08:00:00+05:30",
    read: false,
    href: "/prototype/event",
    actor: null,
  },
  {
    id: "n-2",
    kind: "ACTIVITY",
    title: "Aarav needs two more for badminton at 6",
    body: "Court 3, Sports Complex. One spot has been taken.",
    createdAt: "2026-08-07T08:35:00+05:30",
    read: false,
    href: "/prototype/activities",
    actor: aarav,
  },
  {
    id: "n-3",
    kind: "MENTION",
    title: "Ishita Rao replied to your comment",
    body: "Provided. Bring only a laptop and a USB-A cable if you have one.",
    createdAt: "2026-08-07T08:26:00+05:30",
    read: false,
    href: "/prototype/post",
    actor: ishita,
  },
  {
    id: "n-4",
    kind: "MEMBERSHIP",
    title: "Your request to join Entrepreneurship Cell is pending",
    body: "A moderator reviews requests within two working days.",
    createdAt: "2026-08-06T18:20:00+05:30",
    read: false,
    href: "/prototype/community",
    actor: null,
  },
  {
    id: "n-5",
    kind: "COMMUNITY_POST",
    title: "New announcement in Chitkara Coding Club",
    body: "Placement week timetable is published.",
    createdAt: "2026-08-06T16:02:00+05:30",
    read: true,
    href: "/prototype/post",
    actor: priya,
  },
  {
    id: "n-6",
    kind: "MODERATION",
    title: "A post you reported was removed",
    body: "Thanks - the post breached the no-recruitment guideline.",
    createdAt: "2026-08-05T11:05:00+05:30",
    read: true,
    href: "/prototype/operations",
    actor: null,
  },
  {
    id: "n-7",
    kind: "EVENT_REMINDER",
    title: "DSA Mock Interviews is in four days",
    body: "You are registered. Slot allocation is emailed the night before.",
    createdAt: "2026-08-04T09:00:00+05:30",
    read: true,
    href: "/prototype/event",
    actor: null,
  },
]

export const conversations: Conversation[] = [
  {
    id: "cv-1",
    scope: "OFFICIAL",
    title: "Placement Cell",
    subtitle: "Official channel - replies are not monitored",
    participants: [priya],
    lastMessagePreview:
      "Shortlisting deadline for CSE and ECE is 14 August, midnight.",
    lastMessageAt: "2026-08-06T16:05:00+05:30",
    unreadCount: 1,
  },
  {
    id: "cv-2",
    scope: "EVENT",
    title: "Line Follower Bootcamp",
    subtitle: "Event channel - closes 48 hours after the event",
    participants: [ishita, kabir, aarav, meera],
    lastMessagePreview: "Kabir: front table if you have never soldered.",
    lastMessageAt: "2026-08-07T08:47:00+05:30",
    unreadCount: 3,
  },
  {
    id: "cv-3",
    scope: "ACTIVITY",
    title: "Hackathon team",
    subtitle: "Activity channel - closes when the activity expires",
    participants: [meera, viewer],
    lastMessagePreview: "Meera: I will start the repo tonight.",
    lastMessageAt: "2026-08-07T07:10:00+05:30",
    unreadCount: 2,
  },
  {
    id: "cv-4",
    scope: "COMMUNITY",
    title: "Robotics Club moderators",
    subtitle: "Community channel - moderators only",
    participants: [kabir, ishita],
    lastMessageAt: "2026-08-06T22:10:00+05:30",
    lastMessagePreview: "Ishita: two spare drivers logged on the shelf.",
    unreadCount: 0,
  },
  {
    id: "cv-5",
    scope: "DIRECT",
    title: "Aarav Menon",
    subtitle: "You share Chitkara Coding Club",
    participants: [aarav],
    lastMessagePreview: "Are you going to the mock interviews on Tuesday?",
    lastMessageAt: "2026-08-05T20:15:00+05:30",
    unreadCount: 0,
  },
]

export const openConversation: Conversation = conversations[1]!

export const openConversationMessages: Message[] = [
  {
    id: "m-1",
    author: ishita,
    body: "Kits are packed for 40. Doors open 15 minutes early.",
    sentAt: "2026-08-07T08:12:00+05:30",
    fromViewer: false,
  },
  {
    id: "m-2",
    author: aarav,
    body: "Do we need our own Arduino?",
    sentAt: "2026-08-07T08:22:00+05:30",
    fromViewer: false,
  },
  {
    id: "m-3",
    author: ishita,
    body: "Provided. Bring a laptop and a USB-A cable if you have one.",
    sentAt: "2026-08-07T08:26:00+05:30",
    fromViewer: false,
  },
  {
    id: "m-4",
    author: viewer,
    body: "I have two spare cables, I will bring them.",
    sentAt: "2026-08-07T08:31:00+05:30",
    fromViewer: true,
  },
  {
    id: "m-5",
    author: kabir,
    body: "Legend. Front table if anyone has never soldered before.",
    sentAt: "2026-08-07T08:47:00+05:30",
    fromViewer: false,
  },
]

export const viewerProfile: ProfileDetail = {
  person: viewer,
  bio: "Second year CSE. Moderating the Coding Club, building a line follower badly, and collecting internship rejections with good humour.",
  interests: [
    interestBySlug("technology"),
    interestBySlug("coding"),
    interestBySlug("travel"),
  ],
  joinedAt: "2025-08-04T10:00:00+05:30",
  communities: viewerCommunities,
  eventsAttendedCount: 17,
  postCount: 42,
  badges: [
    {
      label: "Early member",
      description: "Joined in the first month the platform was live on campus.",
    },
    { label: "Moderator", description: "Keeps the Coding Club running." },
    { label: "Regular", description: "Attended 15 or more events." },
  ],
}

export const searchQuery = "badminton"

export const searchResults: SearchResult[] = [
  {
    id: "s-1",
    kind: "EVENT",
    title: "Inter-Hostel Badminton Tournament",
    subtitle: "Chitkara University - Sports Complex",
    href: "/prototype/event",
    meta: "Sunday, 9:00 am - 6 seats left",
  },
  {
    id: "s-2",
    kind: "ACTIVITY",
    title: "Badminton doubles at 6",
    subtitle: "Aarav Menon - Sports Complex, Court 3",
    href: "/prototype/activities",
    meta: "Today, 6:00 pm - 2 spots left",
  },
  {
    id: "s-3",
    kind: "COMMUNITY",
    title: "Football",
    subtitle: "Five-a-side, league fixtures, and Sunday kickabouts.",
    href: "/prototype/community",
    meta: "5.3k members - Interest community",
  },
  {
    id: "s-4",
    kind: "PERSON",
    title: "Kabir Sethi",
    subtitle: "B.Tech Mechanical 2027 - Moderator, Robotics Club",
    href: "/prototype/profile",
    meta: "You share 2 communities",
  },
  {
    id: "s-5",
    kind: "POST",
    title: "Court booking rules for the tournament week",
    subtitle: "Dr. Priyadarshini Balasubramanian in Chitkara University",
    href: "/prototype/post",
    meta: "Two days ago - 88 likes",
  },
]

export const moderationQueue: ModerationItem[] = [
  {
    id: "mod-1",
    reason: "SPAM",
    status: "OPEN",
    targetKind: "POST",
    targetLabel: "Post in Chitkara Coding Club",
    excerpt:
      "Crack any placement in 30 days, DM for the paid course link, limited seats...",
    reportCount: 14,
    reportedAt: "2026-08-07T07:50:00+05:30",
    assignee: null,
  },
  {
    id: "mod-2",
    reason: "HARASSMENT",
    status: "IN_REVIEW",
    targetKind: "COMMENT",
    targetLabel: "Comment on Portfolio Critique Night",
    excerpt: "Reported for targeted remarks about a named student.",
    reportCount: 6,
    reportedAt: "2026-08-06T20:05:00+05:30",
    assignee: kabir,
  },
  {
    id: "mod-3",
    reason: "MISINFORMATION",
    status: "OPEN",
    targetKind: "EVENT",
    targetLabel: "Event: Guaranteed Internship Drive",
    excerpt:
      "Claims university placement approval. Placement Cell has no record of it.",
    reportCount: 9,
    reportedAt: "2026-08-06T14:32:00+05:30",
    assignee: null,
  },
  {
    id: "mod-4",
    reason: "OTHER",
    status: "OPEN",
    targetKind: "ACTIVITY",
    targetLabel: "Activity: late night drive to Kasol",
    excerpt:
      "Reported by two students as unsafe - unverified driver, 1am departure.",
    reportCount: 2,
    reportedAt: "2026-08-06T09:15:00+05:30",
    assignee: null,
  },
  {
    id: "mod-5",
    reason: "OFF_TOPIC",
    status: "RESOLVED",
    targetKind: "POST",
    targetLabel: "Post in Music Society",
    excerpt: "Removed under the no-recruitment guideline.",
    reportCount: 2,
    reportedAt: "2026-08-05T10:40:00+05:30",
    assignee: priya,
  },
]

export const verificationRequests: VerificationRequest[] = [
  {
    id: "vr-1",
    community: toRef(debateSociety),
    requestedBy: meera,
    requestedAt: "2026-08-05T15:20:00+05:30",
    status: "PENDING",
    evidence:
      "Registered society since 2019. Faculty advisor letter and last three event reports attached.",
  },
  {
    id: "vr-2",
    community: toRef(musicSociety),
    requestedBy: aarav,
    requestedAt: "2026-08-03T11:00:00+05:30",
    status: "PENDING",
    evidence: "Annual showcase budget approval from the student affairs office.",
  },
]

export const auditTrail: AuditEntry[] = [
  {
    id: "a-1",
    actor: priya,
    action: "Merged community proposal",
    target: "Chitkara Trekkers folded into Trekking",
    at: "2026-08-06T12:20:00+05:30",
  },
  {
    id: "a-2",
    actor: priya,
    action: "Removed post",
    target: "Post in Music Society - off topic",
    at: "2026-08-05T10:45:00+05:30",
  },
  {
    id: "a-3",
    actor: kabir,
    action: "Approved join request",
    target: "Aarav Menon joined Robotics Club",
    at: "2026-08-04T18:12:00+05:30",
  },
  {
    id: "a-4",
    actor: priya,
    action: "Promoted interest",
    target: "Cricket added to the taxonomy after 96 requests",
    at: "2026-08-03T09:30:00+05:30",
  },
  {
    id: "a-5",
    actor: ishita,
    action: "Cancelled event",
    target: "Sensor Workshop - lab unavailable",
    at: "2026-08-01T16:00:00+05:30",
  },
]
