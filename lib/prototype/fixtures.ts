import type {
  AppNotification,
  AuditEntry,
  Comment,
  CommunityDetail,
  CommunityRef,
  CommunitySummary,
  Conversation,
  EventDetail,
  EventSummary,
  Interest,
  Message,
  ModerationItem,
  PersonSummary,
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
 *    unverified community, a closed registration, a long name that wraps. Happy
 *    -path fixtures hide exactly the layout and copy problems a prototype
 *    exists to find.
 */

/** The fixed "current time" every prototype screen reasons about. */
export const prototypeNow = "2026-08-07T09:00:00+05:30"

export const interests: Interest[] = [
  { id: "i-tech", slug: "technology", label: "Technology" },
  { id: "i-design", slug: "design", label: "Design" },
  { id: "i-robotics", slug: "robotics", label: "Robotics" },
  { id: "i-entrepreneurship", slug: "entrepreneurship", label: "Entrepreneurship" },
  { id: "i-music", slug: "music", label: "Music" },
  { id: "i-sports", slug: "sports", label: "Sports" },
  { id: "i-literature", slug: "literature", label: "Literature" },
  { id: "i-careers", slug: "careers", label: "Careers" },
]

const interestBySlug = (slug: string): Interest => {
  const found = interests.find((interest) => interest.slug === slug)
  if (!found) throw new Error(`Unknown fixture interest: ${slug}`)
  return found
}

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

export const people: PersonSummary[] = [
  viewer,
  ishita,
  kabir,
  aarav,
  meera,
  priya,
]

const toRef = (community: CommunitySummary): CommunityRef => ({
  id: community.id,
  slug: community.slug,
  name: community.name,
  verification: community.verification,
})

export const devCircle: CommunitySummary = {
  id: "c-dev",
  slug: "dev-circle",
  name: "Dev Circle",
  tagline: "Weekly builds, code review, and internship prep.",
  interest: interestBySlug("technology"),
  memberCount: 1248,
  verification: "VERIFIED",
  visibility: "UNIVERSITY",
  joinPolicy: "OPEN",
  viewerMembership: "MODERATOR",
}

export const roboticsClub: CommunitySummary = {
  id: "c-robotics",
  slug: "robotics-club",
  name: "Robotics Club",
  tagline: "Build machines that leave the lab.",
  interest: interestBySlug("robotics"),
  memberCount: 412,
  verification: "VERIFIED",
  visibility: "UNIVERSITY",
  joinPolicy: "OPEN",
  viewerMembership: "MEMBER",
}

export const designCollective: CommunitySummary = {
  id: "c-design",
  slug: "design-collective",
  name: "Design Collective",
  tagline: "Critique, craft, and campus design jams.",
  interest: interestBySlug("design"),
  memberCount: 286,
  verification: "VERIFIED",
  visibility: "UNIVERSITY",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

/** Request-to-join, and the viewer is already waiting. */
export const eCell: CommunitySummary = {
  id: "c-ecell",
  slug: "entrepreneurship-cell",
  name: "Entrepreneurship Cell",
  tagline: "From idea to first paying user.",
  interest: interestBySlug("entrepreneurship"),
  memberCount: 517,
  verification: "VERIFIED",
  visibility: "UNIVERSITY",
  joinPolicy: "REQUEST",
  viewerMembership: "PENDING",
}

export const musicSociety: CommunitySummary = {
  id: "c-music",
  slug: "music-society",
  name: "Music Society",
  tagline: "Open mics, jam rooms, and the annual showcase.",
  interest: interestBySlug("music"),
  memberCount: 342,
  verification: "UNVERIFIED",
  visibility: "UNIVERSITY",
  joinPolicy: "OPEN",
  viewerMembership: "NONE",
}

export const debateSociety: CommunitySummary = {
  id: "c-debate",
  slug: "debate-society",
  name: "Debate Society",
  tagline: "Parliamentary debate and public speaking.",
  interest: interestBySlug("literature"),
  memberCount: 168,
  verification: "PENDING",
  visibility: "UNIVERSITY",
  joinPolicy: "REQUEST",
  viewerMembership: "NONE",
}

export const communities: CommunitySummary[] = [
  devCircle,
  roboticsClub,
  designCollective,
  eCell,
  musicSociety,
  debateSociety,
]

/** The communities the viewer belongs to, for the sidebar and profile. */
export const viewerCommunities: CommunitySummary[] = [
  devCircle,
  roboticsClub,
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

export const lineFollowerEvent: EventSummary = {
  id: "e-1",
  slug: "line-follower-bootcamp",
  title: "Line Follower Bootcamp",
  startsAt: "2026-08-08T16:00:00+05:30",
  endsAt: "2026-08-08T19:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Block E Robotics Lab",
  community: toRef(roboticsClub),
  interest: interestBySlug("robotics"),
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
  startsAt: "2026-08-09T18:00:00+05:30",
  endsAt: "2026-08-09T20:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Design Studio, Block D",
  community: toRef(designCollective),
  interest: interestBySlug("design"),
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
  startsAt: "2026-08-11T10:00:00+05:30",
  endsAt: "2026-08-11T13:00:00+05:30",
  mode: "HYBRID",
  venue: "Auditorium 2 and online",
  community: toRef(devCircle),
  interest: interestBySlug("careers"),
  capacity: 200,
  registeredCount: 118,
  feeInPaise: 25_000,
  viewerRegistration: "REGISTERED",
}

export const firesideEvent: EventSummary = {
  id: "e-4",
  slug: "founder-fireside",
  title: "Founder Fireside: Building in Public",
  startsAt: "2026-08-14T17:30:00+05:30",
  endsAt: "2026-08-14T19:00:00+05:30",
  mode: "ONLINE",
  venue: "Streamed link shared on registration",
  community: toRef(eCell),
  interest: interestBySlug("entrepreneurship"),
  capacity: null,
  registeredCount: 264,
  feeInPaise: null,
  viewerRegistration: "NONE",
}

export const openMicEvent: EventSummary = {
  id: "e-5",
  slug: "open-mic-night",
  title: "Open Mic Night",
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
  startsAt: "2026-08-06T15:00:00+05:30",
  endsAt: "2026-08-06T18:00:00+05:30",
  mode: "IN_PERSON",
  venue: "Seminar Hall 3",
  community: toRef(debateSociety),
  interest: interestBySlug("literature"),
  capacity: 60,
  registeredCount: 60,
  feeInPaise: null,
  viewerRegistration: "CLOSED",
}

export const events: EventSummary[] = [
  lineFollowerEvent,
  critiqueNightEvent,
  mockInterviewEvent,
  firesideEvent,
  openMicEvent,
  debateTrialsEvent,
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
}

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
    kind: "MENTION",
    title: "Ishita Rao replied to your comment",
    body: "Provided. Bring only a laptop and a USB-A cable if you have one.",
    createdAt: "2026-08-07T08:26:00+05:30",
    read: false,
    href: "/prototype/post",
    actor: ishita,
  },
  {
    id: "n-3",
    kind: "MEMBERSHIP",
    title: "Your request to join Entrepreneurship Cell is pending",
    body: "A moderator reviews requests within two working days.",
    createdAt: "2026-08-06T18:20:00+05:30",
    read: false,
    href: "/prototype/community",
    actor: null,
  },
  {
    id: "n-4",
    kind: "COMMUNITY_POST",
    title: "New announcement in Dev Circle",
    body: "Placement week timetable is published.",
    createdAt: "2026-08-06T16:02:00+05:30",
    read: true,
    href: "/prototype/post",
    actor: priya,
  },
  {
    id: "n-5",
    kind: "MODERATION",
    title: "A post you reported was removed",
    body: "Thanks - the post breached the no-recruitment guideline.",
    createdAt: "2026-08-05T11:05:00+05:30",
    read: true,
    href: "/prototype/operations",
    actor: null,
  },
  {
    id: "n-6",
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
    scope: "COMMUNITY",
    title: "Robotics Club moderators",
    subtitle: "Community channel - moderators only",
    participants: [kabir, ishita],
    lastMessageAt: "2026-08-06T22:10:00+05:30",
    lastMessagePreview: "Ishita: two spare drivers logged on the shelf.",
    unreadCount: 0,
  },
  {
    id: "cv-4",
    scope: "DIRECT",
    title: "Aarav Menon",
    subtitle: "You share Dev Circle",
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
  bio: "Second year CSE. Moderating Dev Circle, building a line follower badly, and collecting internship rejections with good humour.",
  interests: [
    interestBySlug("technology"),
    interestBySlug("robotics"),
    interestBySlug("careers"),
  ],
  joinedAt: "2025-08-04T10:00:00+05:30",
  communities: viewerCommunities,
  eventsAttendedCount: 17,
  postCount: 42,
  badges: [
    {
      label: "Early member",
      description: "Joined in the first month Cirqles was live on campus.",
    },
    {
      label: "Moderator",
      description: "Keeps Dev Circle running.",
    },
    {
      label: "Regular",
      description: "Attended 15 or more events.",
    },
  ],
}

export const searchQuery = "robotics"

export const searchResults: SearchResult[] = [
  {
    id: "s-1",
    kind: "COMMUNITY",
    title: "Robotics Club",
    subtitle: "Build machines that leave the lab.",
    href: "/prototype/community",
    meta: "412 members - Verified",
  },
  {
    id: "s-2",
    kind: "EVENT",
    title: "Line Follower Bootcamp",
    subtitle: "Robotics Club - Block E Robotics Lab",
    href: "/prototype/event",
    meta: "Tomorrow, 4:00 pm - 3 seats left",
  },
  {
    id: "s-3",
    kind: "POST",
    title: "Build night recap: differential drive tracks straight",
    subtitle: "Kabir Sethi in Robotics Club",
    href: "/prototype/post",
    meta: "Yesterday - 41 likes",
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
    kind: "EVENT",
    title: "Robotics Open House",
    subtitle: "Robotics Club - Block E",
    href: "/prototype/event",
    meta: "22 August - Free",
  },
]

export const moderationQueue: ModerationItem[] = [
  {
    id: "mod-1",
    reason: "SPAM",
    status: "OPEN",
    targetKind: "POST",
    targetLabel: "Post in Dev Circle",
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
    action: "Removed post",
    target: "Post in Music Society - off topic",
    at: "2026-08-05T10:45:00+05:30",
  },
  {
    id: "a-2",
    actor: kabir,
    action: "Approved join request",
    target: "Aarav Menon joined Robotics Club",
    at: "2026-08-04T18:12:00+05:30",
  },
  {
    id: "a-3",
    actor: priya,
    action: "Verified community",
    target: "Entrepreneurship Cell",
    at: "2026-08-02T09:30:00+05:30",
  },
  {
    id: "a-4",
    actor: ishita,
    action: "Cancelled event",
    target: "Sensor Workshop - lab unavailable",
    at: "2026-08-01T16:00:00+05:30",
  },
]
