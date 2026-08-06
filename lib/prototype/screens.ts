/**
 * The prototype screen index.
 *
 * One list drives the sidebar, the mobile picker, and the overview page, so a
 * new screen is added in exactly one place. `phase` records which phase
 * replaces the fixtures with real data, which keeps the prototype honest about
 * being a plan rather than a product.
 */

export type PrototypeScreen = {
  href: string
  title: string
  description: string
  phase: string
}

export type PrototypeScreenGroup = {
  label: string
  screens: PrototypeScreen[]
}

export const prototypeScreenGroups: PrototypeScreenGroup[] = [
  {
    label: "Getting in",
    screens: [
      {
        href: "/prototype/onboarding",
        title: "Onboarding",
        description:
          "The interests step that turns a new account into a personalised feed.",
        phase: "Phase 6",
      },
    ],
  },
  {
    label: "Everyday",
    screens: [
      {
        href: "/prototype/home",
        title: "Home feed",
        description:
          "What is happening now: upcoming events, community posts, announcements.",
        phase: "Phase 7",
      },
      {
        href: "/prototype/explore",
        title: "Explore",
        description:
          "Discovery by interest for students who have not joined anything yet.",
        phase: "Phase 6",
      },
      {
        href: "/prototype/search",
        title: "Search results",
        description: "One query across events, communities, people, and posts.",
        phase: "Phase 10",
      },
    ],
  },
  {
    label: "Communities",
    screens: [
      {
        href: "/prototype/communities",
        title: "Community directory",
        description: "Every community on campus, filterable by interest.",
        phase: "Phase 6",
      },
      {
        href: "/prototype/community",
        title: "Community detail",
        description: "About, members, moderators, posts, and upcoming events.",
        phase: "Phase 6",
      },
      {
        href: "/prototype/post",
        title: "Post detail",
        description: "A single post with its comment thread.",
        phase: "Phase 7",
      },
    ],
  },
  {
    label: "Events",
    screens: [
      {
        href: "/prototype/events",
        title: "Event listing",
        description: "Upcoming events with date, mode, fee, and seats left.",
        phase: "Phase 8",
      },
      {
        href: "/prototype/event",
        title: "Event detail",
        description: "Agenda, organisers, venue, and the registration panel.",
        phase: "Phase 8",
      },
      {
        href: "/prototype/event/register",
        title: "Registration outcome",
        description:
          "Confirmed, waitlisted, and closed - the three endings that matter.",
        phase: "Phase 8",
      },
    ],
  },
  {
    label: "You",
    screens: [
      {
        href: "/prototype/profile",
        title: "Profile",
        description: "Interests, communities, activity, and badges.",
        phase: "Phase 9",
      },
      {
        href: "/prototype/settings",
        title: "Settings",
        description: "Account, privacy, and notification preferences.",
        phase: "Phase 9",
      },
      {
        href: "/prototype/notifications",
        title: "Notifications",
        description: "Grouped by kind, each one leading somewhere specific.",
        phase: "Phase 12",
      },
      {
        href: "/prototype/messages",
        title: "Messages",
        description: "Scoped conversations: official, community, event, direct.",
        phase: "Phase 11",
      },
    ],
  },
  {
    label: "Running the place",
    screens: [
      {
        href: "/prototype/operations",
        title: "Operations Center",
        description:
          "Moderation queue, verification requests, and the audit trail.",
        phase: "Phase 13",
      },
    ],
  },
  {
    label: "Reference",
    screens: [
      {
        href: "/prototype/states",
        title: "Loading, empty, error",
        description:
          "The three states every screen ships with, side by side for approval.",
        phase: "Every phase",
      },
    ],
  },
]

export const allPrototypeScreens: PrototypeScreen[] =
  prototypeScreenGroups.flatMap((group) => group.screens)
