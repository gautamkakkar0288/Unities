import {
  Bell,
  CalendarCheck,
  Compass,
  MessagesSquare,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

/**
 * Marketing copy lives here as typed data rather than inside JSX.
 *
 * Copy changes far more often than layout, and it is the part a non-engineer
 * will want to edit. Keeping it in one typed module means edits cannot break
 * markup, the same strings can be reused across pages and metadata, and moving
 * to a CMS later is a swap of this module rather than a rewrite of components.
 */

export type NavLink = { label: string; href: string }

export const marketingNav: NavLink[] = [
  { label: "What you get", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "For organisers", href: "#organisers" },
  { label: "For universities", href: "#universities" },
  { label: "FAQ", href: "#faq" },
]

export const hero = {
  eyebrow: "Now piloting at Chitkara University",
  headline: "Everything happening on campus, in one place.",
  subheadline:
    "Events, communities, and opportunities are scattered across a dozen group chats. Cirqles brings them together, shows you who is behind each one, and makes joining take one tap.",
  primaryCta: { label: "Create your account", href: "/sign-up" },
  secondaryCta: { label: "See how it works", href: "#how-it-works" },
  reassurance: "Free for students. Verified organisers only.",
  signals: [
    "Verified organisers",
    "University-scoped",
    "No endless feed",
  ] as const,
}

export type Problem = { title: string; description: string }

/** Straight from PRD section 4 - the problems we actually solve. */
export const problems: Problem[] = [
  {
    title: "You hear about it the day after",
    description:
      "The workshop you wanted was announced in a group you left last semester.",
  },
  {
    title: "You cannot tell what is real",
    description:
      "Anyone can make a poster. Knowing which clubs are active and legitimate takes asking around.",
  },
  {
    title: "Discovery runs on luck",
    description:
      "Finding the right community depends on knowing the right senior, not on searching for it.",
  },
]

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = [
  {
    icon: Users,
    title: "Communities that feel alive",
    description:
      "Join the clubs and societies that match your interests, and see their posts, events, and announcements in one hub.",
  },
  {
    icon: CalendarCheck,
    title: "Events you can trust",
    description:
      "Every event shows its organiser, capacity, and status. Register in a tap and get a reminder before it starts.",
  },
  {
    icon: Compass,
    title: "A feed with a purpose",
    description:
      "Recommendations based on your interests, university, and communities. Built to help you act, not to keep you scrolling.",
  },
  {
    icon: ShieldCheck,
    title: "Trust you can see",
    description:
      "Verified organisers, real profiles, and university affiliation are visible everywhere, not buried in a policy page.",
  },
  {
    icon: Search,
    title: "Search that actually finds it",
    description:
      "Look up events, communities, people, and opportunities across your campus with filters that make sense.",
  },
  {
    icon: Bell,
    title: "Reminders, not spam",
    description:
      "Get told about the things you signed up for and the updates you asked for. Control every category yourself.",
  },
]

export type Step = { title: string; description: string }

export const steps: Step[] = [
  {
    title: "Create your account",
    description:
      "Sign up with your email and tell us your university. Takes under a minute.",
  },
  {
    title: "Pick your interests",
    description:
      "Choose what you care about, from hackathons to badminton, and follow the communities behind them.",
  },
  {
    title: "Show up",
    description:
      "Register for what looks good, get a reminder, and meet people who are into the same things.",
  },
]

export type Audience = {
  id: string
  eyebrow: string
  title: string
  description: string
  points: string[]
  cta: NavLink
  icon: LucideIcon
}

export const audiences: Audience[] = [
  {
    id: "organisers",
    eyebrow: "For organisers",
    title: "Run your community like it deserves.",
    description:
      "Stop chasing reach across five platforms. Publish once, reach the students who actually want to hear from you, and prove you are legitimate.",
    points: [
      "Publish events and announcements to your members",
      "Manage registrations and capacity without a spreadsheet",
      "Earn a verified badge that students can see",
      "Understand what your community responds to",
    ],
    cta: { label: "Start a community", href: "/sign-up" },
    icon: MessagesSquare,
  },
  {
    id: "universities",
    eyebrow: "For universities",
    title: "One official channel to your students.",
    description:
      "Separate approved activity from informal activity without shutting either down. Cirqles treats each university as its own tenant with its own rules.",
    points: [
      "Verified official profile and controlled publishing",
      "Visibility rules scoped to your campus",
      "A moderation and verification workflow with an audit trail",
      "Reach students where they already look",
    ],
    cta: { label: "Talk to us", href: "mailto:hello@cirqles.app" },
    icon: ShieldCheck,
  },
]

export type Faq = { question: string; answer: string }

export const faqs: Faq[] = [
  {
    question: "Does it cost anything?",
    answer:
      "No. Cirqles is free for students and for the communities they run. We plan to earn from university partnerships and organiser tooling, never by charging students.",
  },
  {
    question: "Is this just another social media app?",
    answer:
      "No. There is no infinite feed and no engagement bait. The feed exists to help you find something worth showing up to, then get out of your way.",
  },
  {
    question: "Who can see my profile?",
    answer:
      "You control it. Your profile has public and private fields, and you choose what your campus can see.",
  },
  {
    question: "How do you stop fake events and spam?",
    answer:
      "Organisers are verified, events are tied to a real community or university workflow, and anything can be reported. Reports go to a review queue with a recorded decision.",
  },
  {
    question: "Which universities can use Cirqles?",
    answer:
      "We are piloting at Chitkara University first so we can get discovery, joining, and moderation right. The platform is built for multiple universities from day one, so more campuses follow.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Cirqles works on your phone browser today and is designed mobile-first. Native apps come after the web experience is genuinely good.",
  },
]

export const finalCta = {
  headline: "Stop finding out too late.",
  description:
    "Join the students already using Cirqles to find what is happening on campus.",
  primaryCta: { label: "Create your account", href: "/sign-up" },
  secondaryCta: { label: "Sign in", href: "/sign-in" },
}

export const footerSections: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "What you get", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Audiences",
    links: [
      { label: "For organisers", href: "#organisers" },
      { label: "For universities", href: "#universities" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
    ],
  },
]

export const brand = {
  name: "Cirqles",
  tagline: "Discover. Connect. Belong.",
  description:
    "The community-first campus platform. Discover events, communities, opportunities, and people in one trusted place.",
  email: "hello@cirqles.app",
}
