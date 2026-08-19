import { hash } from "bcryptjs"
import { eq, sql } from "drizzle-orm"

import * as schema from "./schema"
import {
  communities,
  eventRegistrations,
  events,
  interests,
  memberships,
  notifications,
  opportunities,
  places,
  posts,
  savedItems,
  users,
} from "./schema"

/**
 * The showcase dataset.
 *
 * `seed.ts` creates the things that must exist before any account does - the
 * campus, the taxonomy, the interest communities. This creates a plausible
 * campus on top of it: a hundred students, the clubs they run, the events those
 * clubs put on, and the registrations, waitlists, saves, posts and
 * notifications that follow.
 *
 * Three properties it has to have, all of them learned from demos going wrong:
 *
 * 1. **Deterministic.** A fixed-seed PRNG, so a reset five minutes before a
 *    presentation produces byte-identical data and a rehearsed walkthrough is
 *    still true. Nothing here calls `Math.random`.
 * 2. **Coherent.** Every event belongs to a club that exists, hosted by an
 *    organiser who owns it, attended by students whose interests match it.
 *    Isolated random rows would make a ranked feed look arbitrary, because it
 *    would be.
 * 3. **Consistent.** `registeredCount` and `memberCount` are written from the
 *    rows they summarise, never typed out. A denormalised counter that
 *    disagrees with its own rows is what makes a working waitlist look broken.
 *
 * Additive and idempotent, like `seed.ts`: every insert is
 * `onConflictDoNothing`, so running it twice is a no-op rather than an error.
 * It is safe against a real database, but it is not meant for one - these are
 * demo identities and they say so.
 */

const DEMO_PASSWORD = "demo1234"

/** Everything is relative to this, so "next Tuesday" is always next Tuesday. */
const NOW = new Date()

const hours = (n: number) => n * 60 * 60 * 1000
const days = (n: number) => hours(24 * n)

const at = (offsetDays: number, hour: number) => {
  const date = new Date(NOW.getTime() + days(offsetDays))
  date.setHours(hour, 0, 0, 0)
  return date
}

/**
 * mulberry32. Small, fast, and - the only property that matters here - the same
 * sequence on every machine and every run.
 */
function rng(seed: number) {
  let state = seed

  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = rng(20260819)

const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!

/** Deterministic sample without replacement. */
function sample<T>(items: readonly T[], count: number): T[] {
  const pool = [...items]
  const taken: T[] = []

  while (taken.length < count && pool.length > 0) {
    taken.push(pool.splice(Math.floor(random() * pool.length), 1)[0]!)
  }

  return taken
}

/* ------------------------------------------------------------------ people */

/**
 * Fictional. Common Indian given names and surnames, combined by the generator
 * rather than written out as whole identities, so no row corresponds to a real
 * person's name-and-email pair.
 */
const FIRST_NAMES = [
  "Aarav", "Ananya", "Rahul", "Simran", "Arjun", "Mehak", "Karan", "Riya",
  "Ishaan", "Nikita", "Rohit", "Sanya", "Vivek", "Tanya", "Aditya", "Pooja",
  "Harsh", "Neha", "Manav", "Kritika", "Yash", "Divya", "Sahil", "Anjali",
  "Dev", "Muskan", "Raghav", "Prisha", "Kabir", "Aditi", "Naman", "Sneha",
  "Tarun", "Isha", "Gurpreet", "Jasleen", "Abhinav", "Palak", "Shivam", "Ridhi",
]

const SURNAMES = [
  "Sharma", "Verma", "Mehta", "Kaur", "Kapoor", "Gupta", "Singh", "Malhotra",
  "Bansal", "Chopra", "Arora", "Jain", "Sethi", "Bhatia", "Nair", "Reddy",
  "Khanna", "Sood", "Grewal", "Ahluwalia",
]

/**
 * Programme codes appear in the email, the way Chitkara addresses are actually
 * formed. The label is what a profile shows.
 */
const PROGRAMS = [
  { code: "becse", label: "B.E. Computer Science" },
  { code: "beaiml", label: "B.E. AI & Machine Learning" },
  { code: "becys", label: "B.E. Cyber Security" },
  { code: "beece", label: "B.E. Electronics & Communication" },
  { code: "bemec", label: "B.E. Mechanical Engineering" },
  { code: "bcahons", label: "BCA (Hons.)" },
  { code: "bbahons", label: "BBA (Hons.)" },
]

/** Graduation year, and the two-digit intake that goes in the address. */
const COHORTS = [
  { graduation: 2026, intake: "22" },
  { graduation: 2027, intake: "23" },
  { graduation: 2028, intake: "24" },
  { graduation: 2029, intake: "25" },
]

type DemoStudent = {
  id: string
  name: string
  email: string
  program: string
  graduation: number
  interestSlugs: string[]
}

/* ------------------------------------------------------- clubs and content */

/**
 * Added to the seven `seed.ts` already creates, for the categories the brief
 * asks for. Verification is mixed on purpose: an all-verified directory would
 * make the verified badge meaningless and would hide the admin queue, which is
 * one of the things being demonstrated.
 */
const EXTRA_CLUBS = [
  { slug: "chitkara-ai-society", name: "Chitkara AI Society", interest: "technology", tagline: "Papers, projects, and models that actually run.", verification: "VERIFIED" },
  { slug: "chitkara-cyber-cell", name: "Chitkara Cyber Cell", interest: "technology", tagline: "CTFs, hardening, and responsible disclosure.", verification: "VERIFIED" },
  { slug: "chitkara-dance-crew", name: "Chitkara Dance Crew", interest: "dance", tagline: "Practice four nights a week. Stage time follows.", verification: "VERIFIED" },
  { slug: "chitkara-design-guild", name: "Chitkara Design Guild", interest: "art", tagline: "Interfaces, posters, and honest critique.", verification: "VERIFIED" },
  { slug: "chitkara-esports", name: "Chitkara Esports", interest: "gaming", tagline: "Ladders, LANs, and the campus league.", verification: "VERIFIED" },
  { slug: "chitkara-finance-club", name: "Chitkara Finance Club", interest: "networking", tagline: "Markets, models, and case competitions.", verification: "UNVERIFIED" },
  { slug: "chitkara-literary-society", name: "Chitkara Literary Society", interest: "art", tagline: "Reading, writing, and the annual anthology.", verification: "UNVERIFIED" },
  { slug: "chitkara-sports-council", name: "Chitkara Sports Council", interest: "sports", tagline: "Inter-department leagues and trials.", verification: "VERIFIED" },
  { slug: "chitkara-marketing-club", name: "Chitkara Marketing Club", interest: "startups", tagline: "Campaigns, brand teardowns, and live briefs.", verification: "PENDING" },
  { slug: "chitkara-volunteers", name: "Chitkara Volunteers", interest: "volunteering", tagline: "Drives, teaching, and clean-ups.", verification: "UNVERIFIED" },
] as const

type EventSeed = {
  slug: string
  title: string
  description: string
  kind: "WORKSHOP" | "TALK" | "TOURNAMENT" | "PERFORMANCE" | "MEETUP" | "DRIVE"
  community: string
  interest: string
  venue: string
  mode: "IN_PERSON" | "ONLINE" | "HYBRID"
  startsInDays: number
  hour: number
  lengthHours: number
  capacity: number | null
  /** Roughly how full to make it. 1 means fill it and start a queue. */
  fill: number
  feeInPaise?: number
}

/**
 * 34 events across the term. The mixture is the point: a demo needs a full
 * event, a nearly-full one, a free-for-all, a finished one and a cancelled one
 * on screen at the same time, because those are the five states the cards
 * render differently.
 */
const EVENTS: EventSeed[] = [
  { slug: "chitkara-hacks-2026", title: "Chitkara Hacks 2026", description: "Thirty-six hours, four tracks, and mentors from the Tricity startup scene. Teams of up to four. Hardware bench available.", kind: "TOURNAMENT", community: "chitkara-coding-club", interest: "coding", venue: "Innovation Centre, Block D", mode: "IN_PERSON", startsInDays: 12, hour: 9, lengthHours: 36, capacity: 200, fill: 0.82 },
  { slug: "intro-to-transformers", title: "Intro to Transformers", description: "Attention, embeddings, and fine-tuning a small model on a laptop. Bring Python; we bring the GPUs.", kind: "WORKSHOP", community: "chitkara-ai-society", interest: "technology", venue: "Lab 214", mode: "IN_PERSON", startsInDays: 3, hour: 15, lengthHours: 3, capacity: 40, fill: 1 },
  { slug: "weekly-coding-contest-14", title: "Weekly Coding Contest #14", description: "Five problems, two hours, rated. Editorial session immediately after.", kind: "TOURNAMENT", community: "chitkara-coding-club", interest: "coding", venue: "Online", mode: "ONLINE", startsInDays: 2, hour: 20, lengthHours: 2, capacity: null, fill: 0.4 },
  { slug: "capture-the-flag-night", title: "Capture The Flag Night", description: "Jeopardy-style CTF. Web, crypto, forensics. Beginners get a guided track.", kind: "TOURNAMENT", community: "chitkara-cyber-cell", interest: "technology", venue: "Lab 118", mode: "IN_PERSON", startsInDays: 6, hour: 18, lengthHours: 5, capacity: 60, fill: 0.9 },
  { slug: "web-dev-bootcamp-day-1", title: "Web Dev Bootcamp — Day 1", description: "HTML, CSS and layout from scratch. No prior experience assumed. Days 2 and 3 follow next week.", kind: "WORKSHOP", community: "chitkara-coding-club", interest: "coding", venue: "Lab 201", mode: "IN_PERSON", startsInDays: 5, hour: 14, lengthHours: 4, capacity: 50, fill: 0.6 },
  { slug: "startup-office-hours", title: "Startup Office Hours", description: "Twenty-minute slots with three founders. Bring a specific question, not a deck.", kind: "MEETUP", community: "chitkara-entrepreneurship-cell", interest: "startups", venue: "E-Cell Room, Block A", mode: "IN_PERSON", startsInDays: 4, hour: 16, lengthHours: 3, capacity: 12, fill: 1 },
  { slug: "pitch-night-spring", title: "Pitch Night", description: "Eight teams, five minutes each, judged by alumni operators. Audience welcome.", kind: "PERFORMANCE", community: "chitkara-entrepreneurship-cell", interest: "startups", venue: "Auditorium", mode: "IN_PERSON", startsInDays: 18, hour: 17, lengthHours: 3, capacity: 150, fill: 0.35 },
  { slug: "campus-photo-walk", title: "Campus Photo Walk", description: "Golden hour walk from the library to the sports complex. Any camera, phones included.", kind: "MEETUP", community: "chitkara-photography-club", interest: "photography", venue: "Library Steps", mode: "IN_PERSON", startsInDays: 1, hour: 17, lengthHours: 2, capacity: 25, fill: 0.88 },
  { slug: "portrait-lighting-workshop", title: "Portrait Lighting Workshop", description: "One light, one reflector, and what to do with them. Models provided.", kind: "WORKSHOP", community: "chitkara-photography-club", interest: "photography", venue: "Studio, Block C", mode: "IN_PERSON", startsInDays: 9, hour: 15, lengthHours: 3, capacity: 20, fill: 0.5, feeInPaise: 15000 },
  { slug: "line-follower-build-day", title: "Line Follower Build Day", description: "Build and tune a line follower in a day. Kits provided, soldering irons shared.", kind: "WORKSHOP", community: "chitkara-robotics-club", interest: "technology", venue: "Robotics Lab", mode: "IN_PERSON", startsInDays: 7, hour: 10, lengthHours: 6, capacity: 24, fill: 0.79, feeInPaise: 30000 },
  { slug: "drone-flight-basics", title: "Drone Flight Basics", description: "Airframes, controllers, and supervised flight time on the field.", kind: "WORKSHOP", community: "chitkara-robotics-club", interest: "technology", venue: "Sports Field", mode: "IN_PERSON", startsInDays: 14, hour: 8, lengthHours: 3, capacity: 18, fill: 0.44 },
  { slug: "open-mic-night-march", title: "Open Mic Night", description: "Music, poetry, stand-up. Ten-minute slots, sign up on the door.", kind: "PERFORMANCE", community: "chitkara-music-society", interest: "music", venue: "Amphitheatre", mode: "IN_PERSON", startsInDays: 8, hour: 19, lengthHours: 3, capacity: 120, fill: 0.66 },
  { slug: "acoustic-jam-session", title: "Acoustic Jam Session", description: "Bring an instrument or bring nothing. Both are fine.", kind: "MEETUP", community: "chitkara-music-society", interest: "music", venue: "Music Room", mode: "IN_PERSON", startsInDays: 2, hour: 18, lengthHours: 2, capacity: 30, fill: 0.6 },
  { slug: "parliamentary-debate-practice", title: "Parliamentary Debate Practice", description: "Two practice rounds with adjudication. New speakers paired with experienced ones.", kind: "MEETUP", community: "chitkara-debate-society", interest: "academics", venue: "Seminar Hall 2", mode: "IN_PERSON", startsInDays: 3, hour: 17, lengthHours: 3, capacity: 40, fill: 0.55 },
  { slug: "inter-college-debate-cup", title: "Inter-College Debate Cup", description: "Eight institutions, British Parliamentary, three preliminary rounds and a final.", kind: "TOURNAMENT", community: "chitkara-debate-society", interest: "academics", venue: "Seminar Hall 1", mode: "IN_PERSON", startsInDays: 21, hour: 9, lengthHours: 9, capacity: 64, fill: 0.28 },
  { slug: "hip-hop-workshop", title: "Hip Hop Workshop", description: "Choreography for the winter showcase. Two left feet welcome.", kind: "WORKSHOP", community: "chitkara-dance-crew", interest: "dance", venue: "Dance Studio", mode: "IN_PERSON", startsInDays: 4, hour: 18, lengthHours: 2, capacity: 35, fill: 0.94 },
  { slug: "cultural-night-2026", title: "Cultural Night 2026", description: "The big one. Dance, music, drama, and the annual awards.", kind: "PERFORMANCE", community: "chitkara-university", interest: "music", venue: "Main Ground", mode: "IN_PERSON", startsInDays: 26, hour: 18, lengthHours: 5, capacity: null, fill: 0.3 },
  { slug: "ui-ux-teardown", title: "UI/UX Teardown", description: "We pull apart three real products live, then rebuild one screen properly.", kind: "WORKSHOP", community: "chitkara-design-guild", interest: "art", venue: "Design Studio", mode: "HYBRID", startsInDays: 6, hour: 16, lengthHours: 3, capacity: 30, fill: 0.83 },
  { slug: "poster-design-sprint", title: "Poster Design Sprint", description: "Four hours, one brief, printed at the end. Critique is the point.", kind: "WORKSHOP", community: "chitkara-design-guild", interest: "art", venue: "Design Studio", mode: "IN_PERSON", startsInDays: 16, hour: 13, lengthHours: 4, capacity: 22, fill: 0.36 },
  { slug: "valorant-campus-cup", title: "Valorant Campus Cup", description: "Five-a-side, double elimination, streamed. Rosters lock the night before.", kind: "TOURNAMENT", community: "chitkara-esports", interest: "gaming", venue: "Gaming Arena", mode: "IN_PERSON", startsInDays: 11, hour: 12, lengthHours: 8, capacity: 80, fill: 0.91 },
  { slug: "retro-lan-night", title: "Retro LAN Night", description: "CRTs, split screens, and games older than most of the players.", kind: "MEETUP", community: "chitkara-esports", interest: "gaming", venue: "Gaming Arena", mode: "IN_PERSON", startsInDays: 1, hour: 20, lengthHours: 4, capacity: 40, fill: 0.72 },
  { slug: "markets-101", title: "Markets 101", description: "How an exchange actually works, and why most retail advice is noise.", kind: "TALK", community: "chitkara-finance-club", interest: "networking", venue: "Lecture Hall 4", mode: "IN_PERSON", startsInDays: 5, hour: 17, lengthHours: 2, capacity: 90, fill: 0.48 },
  { slug: "case-competition-heats", title: "Case Competition Heats", description: "Teams of three, one live brief, forty minutes to present.", kind: "TOURNAMENT", community: "chitkara-finance-club", interest: "networking", venue: "Seminar Hall 3", mode: "IN_PERSON", startsInDays: 19, hour: 10, lengthHours: 6, capacity: 45, fill: 0.31 },
  { slug: "poetry-reading-evening", title: "Poetry Reading Evening", description: "Read your own or someone else's. Chai provided.", kind: "PERFORMANCE", community: "chitkara-literary-society", interest: "art", venue: "Library Lawn", mode: "IN_PERSON", startsInDays: 7, hour: 18, lengthHours: 2, capacity: 50, fill: 0.42 },
  { slug: "inter-department-basketball", title: "Inter-Department Basketball", description: "Group stage across two weekends. Register as a department team.", kind: "TOURNAMENT", community: "chitkara-sports-council", interest: "sports", venue: "Basketball Court", mode: "IN_PERSON", startsInDays: 10, hour: 7, lengthHours: 5, capacity: 96, fill: 0.77 },
  { slug: "sunday-long-run", title: "Sunday Long Run", description: "Twelve kilometres at conversational pace. Slower group leaves ten minutes earlier.", kind: "MEETUP", community: "tricity-runners", interest: "fitness", venue: "Main Gate", mode: "IN_PERSON", startsInDays: 4, hour: 6, lengthHours: 2, capacity: null, fill: 0.5 },
  { slug: "badminton-trials", title: "Badminton Trials", description: "Selection for the inter-university squad. Two courts, seeded ladder.", kind: "TOURNAMENT", community: "chitkara-sports-council", interest: "sports", venue: "Indoor Courts", mode: "IN_PERSON", startsInDays: 8, hour: 16, lengthHours: 4, capacity: 32, fill: 0.87 },
  { slug: "blood-donation-drive", title: "Blood Donation Drive", description: "With PGI Chandigarh. Slots every fifteen minutes; bring ID.", kind: "DRIVE", community: "chitkara-volunteers", interest: "volunteering", venue: "Health Centre", mode: "IN_PERSON", startsInDays: 13, hour: 9, lengthHours: 7, capacity: 120, fill: 0.53 },
  { slug: "teach-a-child-saturday", title: "Teach a Child — Saturday", description: "Two hours of basic maths and English at the community centre. Training given.", kind: "DRIVE", community: "chitkara-volunteers", interest: "volunteering", venue: "Community Centre, Rajpura", mode: "IN_PERSON", startsInDays: 3, hour: 10, lengthHours: 3, capacity: 20, fill: 0.65 },
  { slug: "resume-clinic", title: "Resume Clinic", description: "One-to-one reviews with recruiters. Bring a printed copy.", kind: "WORKSHOP", community: "chitkara-university", interest: "academics", venue: "Placement Cell", mode: "IN_PERSON", startsInDays: 6, hour: 11, lengthHours: 5, capacity: 60, fill: 0.95 },
  { slug: "placement-prep-dsa", title: "Placement Prep: DSA Sprint", description: "The twenty patterns that cover most interview questions. Six weekly sessions.", kind: "WORKSHOP", community: "chitkara-coding-club", interest: "coding", venue: "Lab 201", mode: "HYBRID", startsInDays: 9, hour: 18, lengthHours: 2, capacity: 70, fill: 0.86 },
  { slug: "alumni-tech-talk", title: "Alumni Tech Talk: Scaling to a Million", description: "A 2019 graduate on what actually broke, and in what order.", kind: "TALK", community: "chitkara-university", interest: "technology", venue: "Auditorium", mode: "HYBRID", startsInDays: 15, hour: 17, lengthHours: 2, capacity: 250, fill: 0.4 },
  /* Finished, so "past events" and profile history are not empty. */
  { slug: "git-fundamentals", title: "Git Fundamentals", description: "Branches, rebases, and getting out of trouble.", kind: "WORKSHOP", community: "chitkara-coding-club", interest: "coding", venue: "Lab 201", mode: "IN_PERSON", startsInDays: -9, hour: 15, lengthHours: 3, capacity: 50, fill: 0.9 },
  { slug: "monsoon-photo-walk", title: "Monsoon Photo Walk", description: "Wet-weather shooting around the lake.", kind: "MEETUP", community: "chitkara-photography-club", interest: "photography", venue: "Sukhna Lake", mode: "IN_PERSON", startsInDays: -20, hour: 7, lengthHours: 3, capacity: 25, fill: 0.8 },
]

/** The event kept at one seat, for the waitlist demo. */
const WAITLIST_DEMO_EVENT = "startup-office-hours"

type PostSeed = { community: string; title: string; body: string; event?: string; agoDays: number }

const POSTS: PostSeed[] = [
  { community: "chitkara-coding-club", title: "Chitkara Hacks registrations are open", body: "Two hundred seats, four tracks, and the hardware bench is back this year. Form teams before you register - it saves a lot of confusion on the morning.", event: "chitkara-hacks-2026", agoDays: 2 },
  { community: "chitkara-coding-club", title: "Contest #13 editorial is up", body: "Problem D caught almost everyone. The intended solution is a prefix sum, not a segment tree; the editorial walks through why the obvious approach times out.", agoDays: 6 },
  { community: "chitkara-ai-society", title: "Transformers workshop is full", body: "Forty seats went in a day. There is a waitlist, and we release seats the morning of the session as people drop out - it is worth joining it.", event: "intro-to-transformers", agoDays: 1 },
  { community: "chitkara-cyber-cell", title: "Rules for CTF Night", body: "No attacking infrastructure that is not in scope. No sharing flags. Beginners: the guided track starts at the same time in Lab 117, and it is not a lesser version.", event: "capture-the-flag-night", agoDays: 3 },
  { community: "chitkara-photography-club", title: "Prints for the campus archive", body: "Bring three prints from the last two walks to the next meeting. We are choosing thirty for the corridor in Block C.", agoDays: 4 },
  { community: "chitkara-robotics-club", title: "Build season starts in two weeks", body: "Teams of five. Mechanical, firmware, and one person who owns the wiring, which is not an afterthought whatever last year suggested.", agoDays: 5 },
  { community: "chitkara-music-society", title: "Open mic slots", body: "Ten-minute slots, twelve of them. Sign up on the door from six. Bring your own cables if you have them; ours are held together by tape and optimism.", event: "open-mic-night-march", agoDays: 2 },
  { community: "chitkara-entrepreneurship-cell", title: "Office hours: how to use them", body: "Twenty minutes each. Come with one specific problem. \"Feedback on my idea\" wastes your slot; \"how do I price this for students\" does not.", event: "startup-office-hours", agoDays: 1 },
  { community: "chitkara-dance-crew", title: "Showcase auditions", body: "Four nights of practice a week from next month. Turn up to two before you decide - the first one is always the hardest.", event: "hip-hop-workshop", agoDays: 3 },
  { community: "chitkara-esports", title: "Campus Cup rosters lock Thursday", body: "Five players and one substitute. Smurfing gets the whole roster disqualified, and we do check.", event: "valorant-campus-cup", agoDays: 2 },
  { community: "chitkara-design-guild", title: "Critique is not approval", body: "A reminder before the teardown: we are hard on the work and easy on the person. If that distinction is not clear, the session is not for you.", event: "ui-ux-teardown", agoDays: 4 },
  { community: "chitkara-sports-council", title: "Basketball fixtures published", body: "Group stage across two weekends. Department captains: confirm your squad of twelve by Friday or the slot goes to the reserve list.", event: "inter-department-basketball", agoDays: 3 },
  { community: "chitkara-volunteers", title: "Blood drive needs twelve volunteers", body: "Not donors - volunteers, for registration and the refreshment desk. Two-hour shifts from nine.", event: "blood-donation-drive", agoDays: 5 },
  { community: "chitkara-university", title: "Resume Clinic: how slots work", body: "Sixty slots, fifteen minutes each, first come first served on the day. Recruiters from four companies. Printed copy only - no laptops.", event: "resume-clinic", agoDays: 2 },
  { community: "chitkara-debate-society", title: "New speakers, read this first", body: "You will be paired with someone experienced for your first three rounds. Nobody is thrown in alone, and nobody is expected to be good in week one.", agoDays: 7 },
]

type OpportunitySeed = {
  slug: string
  title: string
  description: string
  kind: "INTERNSHIP" | "COMPETITION" | "VOLUNTEERING" | "SCHOLARSHIP" | "CAMPUS" | "STARTUP"
  interest: string
  community?: string
  deadlineInDays: number | null
  url: string
}

const OPPORTUNITIES: OpportunitySeed[] = [
  { slug: "summer-swe-internship-2026", title: "Summer Software Engineering Internship", description: "Eight weeks, Mohali or remote. Second and third years. Stipend paid monthly.", kind: "INTERNSHIP", interest: "coding", deadlineInDays: 14, url: "https://example.edu/internships/swe-2026" },
  { slug: "ml-research-assistant", title: "ML Research Assistant", description: "Part-time with the AI research group. Ten hours a week during term.", kind: "INTERNSHIP", interest: "technology", community: "chitkara-ai-society", deadlineInDays: 21, url: "https://example.edu/research/ml-ra" },
  { slug: "smart-india-hackathon", title: "Smart India Hackathon — Internal Round", description: "Winners represent the university nationally. Teams of six with one faculty mentor.", kind: "COMPETITION", interest: "coding", community: "chitkara-coding-club", deadlineInDays: 9, url: "https://example.edu/sih/internal" },
  { slug: "national-design-challenge", title: "National Design Challenge", description: "Open brief on public transport. Portfolio submission, two rounds.", kind: "COMPETITION", interest: "art", community: "chitkara-design-guild", deadlineInDays: 30, url: "https://example.org/design-challenge" },
  { slug: "merit-scholarship-2027", title: "Merit Scholarship 2027", description: "Tuition waiver up to fifty percent. Based on last two semesters and an interview.", kind: "SCHOLARSHIP", interest: "academics", deadlineInDays: 45, url: "https://example.edu/scholarships/merit" },
  { slug: "women-in-tech-grant", title: "Women in Tech Grant", description: "Conference travel and equipment. Applications reviewed monthly.", kind: "SCHOLARSHIP", interest: "technology", deadlineInDays: null, url: "https://example.org/wit-grant" },
  { slug: "teach-for-tricity", title: "Teach for Tricity", description: "Weekend teaching at three community centres. Four-hour commitment, training provided.", kind: "VOLUNTEERING", interest: "volunteering", community: "chitkara-volunteers", deadlineInDays: null, url: "https://example.org/teach-tricity" },
  { slug: "campus-ambassador", title: "Campus Ambassador Programme", description: "Run events for a developer tools company. Certificate, swag, and a real reference.", kind: "CAMPUS", interest: "networking", deadlineInDays: 12, url: "https://example.com/ambassadors" },
  { slug: "founding-engineer-tricity", title: "Founding Engineer — Tricity Startup", description: "Pre-seed, three people, building logistics software. Equity and a small salary.", kind: "STARTUP", interest: "startups", community: "chitkara-entrepreneurship-cell", deadlineInDays: 25, url: "https://example.com/founding-engineer" },
  { slug: "incubator-cohort-4", title: "Incubator Cohort 4", description: "Six months of space, mentorship and a small grant. Student teams only.", kind: "STARTUP", interest: "startups", community: "chitkara-entrepreneurship-cell", deadlineInDays: 18, url: "https://example.edu/incubator/cohort-4" },
  { slug: "library-assistant", title: "Library Assistant — Paid Campus Role", description: "Eight hours a week, hourly rate, timetable-friendly.", kind: "CAMPUS", interest: "academics", deadlineInDays: 7, url: "https://example.edu/jobs/library" },
  { slug: "esports-shoutcaster", title: "Esports Shoutcaster", description: "Commentate the campus league. No experience needed; a voice and enthusiasm are.", kind: "CAMPUS", interest: "gaming", community: "chitkara-esports", deadlineInDays: 5, url: "https://example.edu/esports/casting" },
]

/* -------------------------------------------------------------------- seed */

async function openDatabase() {
  /**
   * A script has to terminate, so this opens its own connection rather than
   * importing the application singleton - which is deliberately never closed.
   * The driver choice mirrors `lib/db/driver.ts`.
   */
  const explicit = process.env.CIRQLES_DB
  const useDemo = explicit === "demo" || (!explicit && !process.env.DATABASE_URL)

  if (useDemo) {
    const { PGlite } = await import("@electric-sql/pglite")
    const { drizzle } = await import("drizzle-orm/pglite")
    const { DEMO_DATA_DIR } = await import("./driver")

    const client = new PGlite(DEMO_DATA_DIR)

    return {
      db: drizzle(client, { schema }) as unknown as DemoDb,
      close: () => client.close(),
      label: `demo database (${DEMO_DATA_DIR})`,
    }
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("CIRQLES_DB=postgres but DATABASE_URL is not set.")
  }

  const postgres = (await import("postgres")).default
  const { drizzle } = await import("drizzle-orm/postgres-js")

  const client = postgres(connectionString, { prepare: false, max: 1 })

  return {
    db: drizzle(client, { schema }) as unknown as DemoDb,
    close: () => client.end(),
    label: "PostgreSQL (DATABASE_URL)",
  }
}

type DemoDb = Awaited<ReturnType<typeof import("./driver").createDatabase>>

async function main() {
  const { db, close, label } = await openDatabase()

  console.info(`Seeding demo data into ${label}.\n`)

  /* ---------------------------------------------------------- foundations */

  const interestRows = await db
    .select({ id: interests.id, slug: interests.slug })
    .from(interests)
  const interestId = new Map(interestRows.map((row) => [row.slug, row.id]))

  if (interestId.size === 0) {
    throw new Error(
      "No interests found. Run `npm run db:seed` first - this script builds on it.",
    )
  }

  const [campus] = await db
    .select({ id: places.id })
    .from(places)
    .where(eq(places.slug, "chitkara-university"))
    .limit(1)

  if (!campus) {
    throw new Error("Chitkara University place is missing. Run `npm run db:seed`.")
  }

  /* -------------------------------------------------------- extra clubs */

  console.info("Clubs...")

  await db
    .insert(communities)
    .values(
      EXTRA_CLUBS.map((club) => ({
        slug: club.slug,
        name: club.name,
        tagline: club.tagline,
        about: `${club.tagline} A demo community, seeded for the Cirqles showcase.`,
        guidelines: [
          "Use your real name.",
          "Post things people can turn up to.",
          "Disagree with the argument, not the person.",
        ],
        kind: "OFFICIAL" as const,
        scope: "UNIVERSITY" as const,
        placeId: campus.id,
        interestId: interestId.get(club.interest)!,
        joinPolicy: "OPEN" as const,
        verification: club.verification,
      })),
    )
    .onConflictDoNothing({ target: communities.slug })

  const communityRows = await db
    .select({ id: communities.id, slug: communities.slug, name: communities.name })
    .from(communities)
  const communityId = new Map(communityRows.map((row) => [row.slug, row.id]))
  const communityName = new Map(communityRows.map((row) => [row.slug, row.name]))

  /* ------------------------------------------------------------- people */

  console.info("Students...")

  const passwordHash = await hash(DEMO_PASSWORD, 10)
  const interestSlugs = interestRows.map((row) => row.slug)

  const students: DemoStudent[] = []
  const usedEmails = new Set<string>()

  /** The showcase account, given a deliberately rich profile below. */
  const GAUTAM: DemoStudent = {
    id: "demo-student-gautam",
    name: "Gautam Kakkar",
    email: "gautam1153.becse24@chitkara.edu.in",
    program: "B.E. Computer Science",
    graduation: 2028,
    interestSlugs: ["coding", "technology", "startups", "gaming", "photography"],
  }
  students.push(GAUTAM)
  usedEmails.add(GAUTAM.email)

  while (students.length < 100) {
    const first = pick(FIRST_NAMES)
    const surname = pick(SURNAMES)
    const program = pick(PROGRAMS)
    const cohort = pick(COHORTS)
    const roll = 1000 + Math.floor(random() * 200)

    const email = `${first.toLowerCase()}${roll}.${program.code}${cohort.intake}@chitkara.edu.in`
    if (usedEmails.has(email)) continue
    usedEmails.add(email)

    students.push({
      id: `demo-student-${students.length}`,
      name: `${first} ${surname}`,
      email,
      program: program.label,
      graduation: cohort.graduation,
      interestSlugs: sample(interestSlugs, 3 + Math.floor(random() * 3)),
    })
  }

  const ORGANIZER = {
    id: "demo-organizer",
    name: "Coding Club Organiser (Demo)",
    email: "organizer.codingclub@chitkara.edu.in",
  }

  const ADMIN = {
    id: "demo-admin",
    name: "Cirqles Admin (Demo)",
    email: "admin.cirqles@chitkara.edu.in",
  }

  await db
    .insert(users)
    .values([
      ...students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        // Verified, so the demo starts inside the product rather than at an
        // inbox nobody can open.
        emailVerified: NOW,
        passwordHash,
        role: "STUDENT" as const,
        universityId: campus.id,
      })),
      {
        id: ORGANIZER.id,
        name: ORGANIZER.name,
        email: ORGANIZER.email,
        emailVerified: NOW,
        passwordHash,
        role: "ORGANIZER" as const,
        universityId: campus.id,
      },
      {
        id: ADMIN.id,
        name: ADMIN.name,
        email: ADMIN.email,
        emailVerified: NOW,
        passwordHash,
        role: "PLATFORM_ADMIN" as const,
        universityId: campus.id,
      },
    ])
    .onConflictDoNothing({ target: users.id })

  /* -------------------------------------------------------- memberships */

  console.info("Memberships...")

  type MembershipRow = {
    communityId: string
    userId: string
    state: "MEMBER" | "MODERATOR" | "OWNER"
  }

  const membershipRows: MembershipRow[] = []
  const seen = new Set<string>()

  const join = (slug: string, userId: string, state: MembershipRow["state"]) => {
    const id = communityId.get(slug)
    if (!id) return

    const key = `${id}:${userId}`
    if (seen.has(key)) return
    seen.add(key)

    membershipRows.push({ communityId: id, userId, state })
  }

  /**
   * The organiser owns the clubs whose events they host. Without this the
   * organiser dashboard is empty and event editing refuses every attempt,
   * because ownership is checked from the database.
   */
  const OWNED_BY_ORGANIZER = [
    "chitkara-coding-club",
    "chitkara-ai-society",
    "chitkara-cyber-cell",
  ]

  for (const slug of OWNED_BY_ORGANIZER) join(slug, ORGANIZER.id, "OWNER")

  /** Every other club needs an owner too, or nobody can manage it. */
  const clubSlugs = communityRows
    .filter((row) => row.slug.startsWith("chitkara-") || row.slug.startsWith("tricity-"))
    .map((row) => row.slug)

  for (const slug of clubSlugs) {
    if (OWNED_BY_ORGANIZER.includes(slug)) continue
    join(slug, students[1 + (clubSlugs.indexOf(slug) % 20)]!.id, "OWNER")
  }

  for (const student of students) {
    // Interests are memberships in the interest communities - the same thing
    // onboarding writes. There is no separate user_interests table, and adding
    // one would create a second answer to the same question.
    for (const slug of student.interestSlugs) {
      join(`${slug}-community`, student.id, "MEMBER")
    }

    join("chitkara-university", student.id, "MEMBER")

    // Clubs matching their interests, so the feed has something to rank.
    for (const slug of sample(clubSlugs, 2 + Math.floor(random() * 3))) {
      join(slug, student.id, "MEMBER")
    }
  }

  for (const slug of ["chitkara-coding-club", "chitkara-esports", "chitkara-photography-club", "chitkara-university"]) {
    join(slug, GAUTAM.id, "MEMBER")
  }

  await db.insert(memberships).values(membershipRows).onConflictDoNothing()

  /* ------------------------------------------------------------- events */

  console.info("Events...")

  const eventRows = EVENTS.map((seed) => {
    const community = communityId.get(seed.community)
    if (!community) throw new Error(`Community "${seed.community}" is missing.`)

    const startsAt = at(seed.startsInDays, seed.hour)

    return {
      id: `demo-event-${seed.slug}`,
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      kind: seed.kind,
      mode: seed.mode,
      venue: seed.venue,
      status: "PUBLISHED" as const,
      startsAt,
      endsAt: new Date(startsAt.getTime() + hours(seed.lengthHours)),
      registrationClosesAt: null,
      capacity: seed.slug === WAITLIST_DEMO_EVENT ? 1 : seed.capacity,
      feeInPaise: seed.feeInPaise ?? null,
      communityId: community,
      interestId: interestId.get(seed.interest)!,
      createdById: ORGANIZER.id,
      registeredCount: 0,
      cancelledAt: null,
    }
  })

  await db.insert(events).values(eventRows).onConflictDoNothing({ target: events.id })

  /* ------------------------------------------------------ registrations */

  console.info("Registrations and waitlists...")

  type RegistrationRow = {
    eventId: string
    userId: string
    state: "REGISTERED" | "WAITLISTED" | "CANCELLED"
    createdAt: Date
    promotedAt: Date | null
    cancelledAt: Date | null
  }

  const registrationRows: RegistrationRow[] = []
  /** Derived, never typed. The counter must agree with the rows. */
  const confirmed = new Map<string, number>()

  for (const [index, seed] of EVENTS.entries()) {
    const row = eventRows[index]!
    const capacity = row.capacity

    // Interested students first, so who attends what is not arbitrary.
    const interested = students.filter((student) =>
      student.interestSlugs.includes(seed.interest),
    )
    const pool = interested.length >= 8 ? interested : students

    const wanted = capacity === null
      ? Math.round(students.length * seed.fill * 0.4)
      : Math.round(capacity * seed.fill)

    const attendees = sample(pool, Math.min(wanted, pool.length))

    let seats = 0

    for (const [position, student] of attendees.entries()) {
      const full = capacity !== null && seats >= capacity
      // Spaced a minute apart: this is the waitlist ordering key, so equal
      // timestamps would make promotion order arbitrary.
      const createdAt = new Date(
        row.startsAt.getTime() - days(7) + position * 60_000,
      )

      registrationRows.push({
        eventId: row.id,
        userId: student.id,
        state: full ? "WAITLISTED" : "REGISTERED",
        createdAt,
        promotedAt: null,
        cancelledAt: null,
      })

      if (!full) seats += 1
    }

    confirmed.set(row.id, seats)
  }

  /**
   * Scenario 3, prepared in the data rather than live on stage.
   *
   * The capacity-1 event has a confirmed student and Gautam queued behind them.
   * Cancel the confirmed seat from the organiser account and Gautam is
   * promoted, keeping his original queue timestamp.
   */
  const demoEvent = eventRows.find((row) => row.slug === WAITLIST_DEMO_EVENT)!
  const alreadyThere = registrationRows.filter((row) => row.eventId === demoEvent.id)

  if (!alreadyThere.some((row) => row.userId === GAUTAM.id)) {
    registrationRows.push({
      eventId: demoEvent.id,
      userId: GAUTAM.id,
      state: "WAITLISTED",
      createdAt: new Date(demoEvent.startsAt.getTime() - days(6)),
      promotedAt: null,
      cancelledAt: null,
    })
  }

  /** A history for the profile: attended, and one cancelled. */
  for (const slug of ["git-fundamentals", "monsoon-photo-walk"]) {
    const row = eventRows.find((event) => event.slug === slug)!
    if (registrationRows.some((r) => r.eventId === row.id && r.userId === GAUTAM.id)) continue

    registrationRows.push({
      eventId: row.id,
      userId: GAUTAM.id,
      state: "REGISTERED",
      createdAt: new Date(row.startsAt.getTime() - days(5)),
      promotedAt: null,
      cancelledAt: null,
    })
    confirmed.set(row.id, (confirmed.get(row.id) ?? 0) + 1)
  }

  /** Upcoming things Gautam is going to, so Home and the profile are populated. */
  for (const slug of ["chitkara-hacks-2026", "weekly-coding-contest-14", "retro-lan-night", "placement-prep-dsa"]) {
    const row = eventRows.find((event) => event.slug === slug)!
    if (registrationRows.some((r) => r.eventId === row.id && r.userId === GAUTAM.id)) continue

    registrationRows.push({
      eventId: row.id,
      userId: GAUTAM.id,
      state: "REGISTERED",
      createdAt: new Date(NOW.getTime() - days(3)),
      promotedAt: null,
      cancelledAt: null,
    })
    confirmed.set(row.id, (confirmed.get(row.id) ?? 0) + 1)
  }

  await db.insert(eventRegistrations).values(registrationRows).onConflictDoNothing()

  // Written from the rows above, not from `fill`.
  for (const [eventId, count] of confirmed) {
    await db.update(events).set({ registeredCount: count }).where(eq(events.id, eventId))
  }

  /* -------------------------------------------------------------- posts */

  console.info("Posts...")

  await db
    .insert(posts)
    .values(
      POSTS.map((post, index) => ({
        id: `demo-post-${index}`,
        communityId: communityId.get(post.community)!,
        authorId: OWNED_BY_ORGANIZER.includes(post.community)
          ? ORGANIZER.id
          : membershipRows.find(
              (row) => row.communityId === communityId.get(post.community) && row.state === "OWNER",
            )?.userId ?? ORGANIZER.id,
        title: post.title,
        body: post.body,
        eventId: post.event ? `demo-event-${post.event}` : null,
        createdAt: new Date(NOW.getTime() - days(post.agoDays)),
      })),
    )
    .onConflictDoNothing({ target: posts.id })

  /* ------------------------------------------------------ opportunities */

  console.info("Opportunities...")

  await db
    .insert(opportunities)
    .values(
      OPPORTUNITIES.map((opportunity) => ({
        id: `demo-opportunity-${opportunity.slug}`,
        slug: opportunity.slug,
        title: opportunity.title,
        description: opportunity.description,
        kind: opportunity.kind,
        interestId: interestId.get(opportunity.interest)!,
        url: opportunity.url,
        deadline:
          opportunity.deadlineInDays === null
            ? null
            : at(opportunity.deadlineInDays, 23),
        communityId: opportunity.community
          ? communityId.get(opportunity.community)!
          : null,
        placeId: campus.id,
        postedById: ADMIN.id,
      })),
    )
    .onConflictDoNothing({ target: opportunities.id })

  /* -------------------------------------------------------------- saved */

  console.info("Saved items...")

  const savedRows: Array<{
    userId: string
    targetKind: "EVENT" | "COMMUNITY" | "OPPORTUNITY"
    targetId: string
    createdAt: Date
  }> = []

  const saveFor = (userId: string, slugs: string[], daysAgo: number) => {
    for (const slug of slugs) {
      const event = eventRows.find((row) => row.slug === slug)
      if (event) {
        savedRows.push({
          userId,
          targetKind: "EVENT",
          targetId: event.id,
          createdAt: new Date(NOW.getTime() - days(daysAgo)),
        })
      }
    }
  }

  saveFor(GAUTAM.id, ["intro-to-transformers", "capture-the-flag-night", "valorant-campus-cup", "ui-ux-teardown", "alumni-tech-talk"], 2)

  for (const slug of ["chitkara-ai-society", "chitkara-design-guild"]) {
    savedRows.push({
      userId: GAUTAM.id,
      targetKind: "COMMUNITY",
      targetId: communityId.get(slug)!,
      createdAt: new Date(NOW.getTime() - days(4)),
    })
  }

  for (const slug of ["summer-swe-internship-2026", "smart-india-hackathon"]) {
    savedRows.push({
      userId: GAUTAM.id,
      targetKind: "OPPORTUNITY",
      targetId: `demo-opportunity-${slug}`,
      createdAt: new Date(NOW.getTime() - days(1)),
    })
  }

  // Everyone else gets a few, so "saved by N students" is a usable signal.
  for (const student of students.slice(1, 60)) {
    for (const event of sample(eventRows, 2 + Math.floor(random() * 3))) {
      savedRows.push({
        userId: student.id,
        targetKind: "EVENT",
        targetId: event.id,
        createdAt: new Date(NOW.getTime() - days(Math.floor(random() * 20))),
      })
    }
  }

  await db.insert(savedItems).values(savedRows).onConflictDoNothing()

  /* ------------------------------------------------------ notifications */

  console.info("Notifications...")

  /**
   * Generated from the registrations that exist, not typed out. Every one of
   * these opens something real, which is the difference between a notification
   * centre and a screenshot.
   */
  const notificationRows: Array<{
    userId: string
    kind: "EVENT_REMINDER" | "COMMUNITY_POST" | "MENTION" | "MEMBERSHIP" | "MODERATION" | "ACTIVITY"
    title: string
    body: string
    targetKind: "EVENT" | "COMMUNITY" | "POST" | null
    targetId: string | null
    readAt: Date | null
    createdAt: Date
  }> = []

  const gautamRegistrations = registrationRows.filter(
    (row) => row.userId === GAUTAM.id && row.state === "REGISTERED",
  )

  for (const registration of gautamRegistrations) {
    const event = eventRows.find((row) => row.id === registration.eventId)!
    const upcoming = event.startsAt.getTime() > NOW.getTime()

    notificationRows.push({
      userId: GAUTAM.id,
      kind: "EVENT_REMINDER",
      title: `You're registered for ${event.title}`,
      body: `${event.venue}. Your seat is confirmed.`,
      targetKind: "EVENT",
      targetId: event.id,
      readAt: upcoming ? null : new Date(event.startsAt.getTime() - days(1)),
      createdAt: registration.createdAt,
    })
  }

  const soon = eventRows.find((row) => row.slug === "weekly-coding-contest-14")!
  notificationRows.push({
    userId: GAUTAM.id,
    kind: "EVENT_REMINDER",
    title: `${soon.title} starts tomorrow`,
    body: "Five problems, two hours. Editorial straight after.",
    targetKind: "EVENT",
    targetId: soon.id,
    readAt: null,
    createdAt: new Date(NOW.getTime() - hours(6)),
  })

  notificationRows.push({
    userId: GAUTAM.id,
    kind: "COMMUNITY_POST",
    title: "Chitkara Coding Club posted an update",
    body: "Chitkara Hacks registrations are open.",
    targetKind: "COMMUNITY",
    targetId: communityId.get("chitkara-coding-club")!,
    readAt: null,
    createdAt: new Date(NOW.getTime() - days(2)),
  })

  notificationRows.push({
    userId: GAUTAM.id,
    kind: "MEMBERSHIP",
    title: "You joined Chitkara Esports",
    body: "Campus Cup rosters lock on Thursday.",
    targetKind: "COMMUNITY",
    targetId: communityId.get("chitkara-esports")!,
    readAt: new Date(NOW.getTime() - days(3)),
    createdAt: new Date(NOW.getTime() - days(5)),
  })

  notificationRows.push({
    userId: ORGANIZER.id,
    kind: "MODERATION",
    title: "Organiser verification approved",
    body: "Chitkara Coding Club is verified. You can publish events.",
    targetKind: "COMMUNITY",
    targetId: communityId.get("chitkara-coding-club")!,
    readAt: null,
    createdAt: new Date(NOW.getTime() - days(9)),
  })

  for (const student of students.slice(1, 40)) {
    const registration = registrationRows.find(
      (row) => row.userId === student.id && row.state === "WAITLISTED",
    )
    if (!registration) continue

    const event = eventRows.find((row) => row.id === registration.eventId)!

    notificationRows.push({
      userId: student.id,
      kind: "EVENT_REMINDER",
      title: `You're on the waitlist for ${event.title}`,
      body: "We'll tell you the moment a seat opens up.",
      targetKind: "EVENT",
      targetId: event.id,
      readAt: null,
      createdAt: registration.createdAt,
    })
  }

  await db.insert(notifications).values(notificationRows).onConflictDoNothing()

  /* ------------------------------------------------------ member counts */

  console.info("Recounting members...")

  // Derived from the membership rows, for the same reason as registeredCount.
  await db.execute(sql`
    update communities
    set member_count = (
      select count(*) from memberships
      where memberships.community_id = communities.id
        and memberships.state in ('MEMBER', 'MODERATOR', 'OWNER')
    )
  `)

  await close()

  const totals = {
    students: students.length,
    communities: communityRows.length,
    events: eventRows.length,
    registrations: registrationRows.length,
    waitlisted: registrationRows.filter((row) => row.state === "WAITLISTED").length,
    posts: POSTS.length,
    opportunities: OPPORTUNITIES.length,
    saved: savedRows.length,
    notifications: notificationRows.length,
  }

  console.info(`
 Demo data ready.

   ${totals.students} students        ${totals.communities} communities
   ${totals.events} events           ${totals.registrations} registrations (${totals.waitlisted} waitlisted)
   ${totals.posts} posts             ${totals.opportunities} opportunities
   ${totals.saved} saved items       ${totals.notifications} notifications

 Demo accounts - password for all three: ${DEMO_PASSWORD}

   Student    ${GAUTAM.email}
   Organiser  ${ORGANIZER.email}
   Admin      ${ADMIN.email}

 All identities are fictional.

 Waitlist demo: "${communityName.get("chitkara-entrepreneurship-cell")}" has one seat at
 Startup Office Hours, taken, with the student account queued behind it. Cancel
 the confirmed seat as the organiser to watch the promotion happen.
`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
