# Cirqles Product Requirements Document

> This document is the master product reference for the repository.
>
> It preserves historical Wonderer context while defining the current Cirqles direction.

---

# 1. Executive Summary

Cirqles is the evolution of Wonderer into a community-first, multi-university platform for student discovery, engagement, and operations.

The product is designed to help students discover events, communities, opportunities, and people in one place, while giving verified organizers, university partners, and internal operators the tooling they need to manage trust at scale.

Cirqles is not just an event listing product. It is a student ecosystem with a feed, communities, profiles, messaging, search, recommendations, verification workflows, and an Operations Center that can scale across universities.

This PRD keeps the historical Wonderer thinking intact, but it defines the current product direction as Cirqles.

---

# 2. Product Vision

## Current Cirqles Direction

Cirqles exists so every student can know what is happening around them, who is behind it, and how to take part without having to search across fragmented social channels.

The platform should feel:

- Community-first
- Trust-first
- Personal
- Useful
- Premium
- Calm

## Long-Term Vision

Cirqles becomes the default campus community layer for universities and student-led ecosystems.

It should support:

- Campus discovery
- Cross-community engagement
- Official university communication
- Student profiles and identity
- Opportunities and recommendations
- Messaging and notifications
- Operations tooling for moderators and university teams

## Previous Product Direction

Wonderer was originally framed as a student discovery product centered on events, trips, workshops, and communities.

That direction remains important historical context, but Cirqles expands it into a broader operating layer for student communities.

---

# 3. Product Philosophy

## Community First

Communities are the center of the product. Events, opportunities, announcements, and messaging should strengthen communities rather than sit beside them as isolated features.

## Trust First

Trust is a product feature, not a policy afterthought. Verification, role boundaries, moderation, and university affiliation must be visible throughout the experience.

## Discovery Without Noise

The feed should surface relevant opportunities without becoming a generic social feed. Cirqles should guide students toward useful actions, not endless browsing.

## Official Where Needed, Open Where Useful

The product must support both student-driven communities and official university workflows without collapsing those two modes into one unclear system.

## Personalization With Boundaries

Recommendations should feel helpful and explainable. The system should personalize based on interests, university, community membership, behavior, and declared preferences, while respecting privacy.

---

# 4. Problems We Solve

## For Students

- Information is scattered across social channels.
- Students miss events and opportunities.
- It is hard to know which communities are active or trustworthy.
- Student profiles are fragmented across platforms.
- Discovery often depends on luck instead of relevance.

## For Organizers

- Event promotion is inconsistent.
- Communities lack structured tooling.
- Registrations, messaging, and updates are hard to manage.
- It is difficult to prove trust and legitimacy.

## For Universities

- Official communication to students is fragmented.
- It is difficult to separate approved activity from informal activity.
- Institutions need a structured workflow for verification, moderation, and visibility.

## For Operations Teams

- Moderation and verification need a single place to live.
- Spam, duplicate content, and policy violations need scalable handling.
- Internal tools must be able to manage communities, events, reports, and university-level approvals.

---

# 5. Target Audience

## Primary Audience

- University students
- Student organizers
- Community moderators
- University staff
- Internal operations teams

## Initial Market Shape

The first rollout should support one or more pilot universities with enough flexibility to scale to multiple institutions without reworking the product model.

## Multi-University Assumption

Cirqles must support multiple universities as first-class tenants, not as an afterthought.

---

# 6. User Personas

## Student Explorer

Wants to find events, communities, and opportunities quickly.

Needs:

- Personalized feed
- Search
- Trust signals
- Easy joining and registration

## Student Builder

Wants to participate, post, and build a presence inside communities.

Needs:

- Profile identity
- Engagement tools
- Messaging
- Opportunities discovery

## Organizer

Wants to publish events and grow a community with trust.

Needs:

- Verification
- Publishing workflow
- Registration management
- Announcements

## University Partner

Wants an official, controlled workflow for communication and visibility.

Needs:

- Official verification
- Controlled publishing
- Visibility rules
- Auditability

## Operations Admin

Wants to keep the platform safe, consistent, and scalable.

Needs:

- Moderation queues
- Verification review
- Content takedowns
- Analytics and oversight

---

# 7. User Journeys

## Discovery Journey

Home or feed → community/event/opportunity card → detail page → save/join/register/share

## Community Journey

Search or browse → community page → join → follow updates → engage with feed and events

## Event Journey

Feed or search → event detail → trust check → register → confirmation → notifications

## Profile Journey

Sign up → onboarding → profile setup → interests and affiliations → personalized discovery

## Operations Journey

Report or review queue → moderation screen → decision → audit trail → follow-up action

## University Journey

Institution request → verification → official profile setup → publishing permissions → governed communication

---

# 8. Product Goals

## Core Goals

- Increase discovery quality.
- Increase student retention.
- Build trust in content and organizers.
- Make communities feel active and useful.
- Support multi-university scale.
- Provide operational control.

## Secondary Goals

- Enable meaningful messaging.
- Support opportunities beyond events.
- Create a sustainable monetization model.
- Make AI useful without becoming noisy.

---

# 9. Product Scope

## In Scope

- Authentication
- Student onboarding
- Student profiles
- Communities
- Event discovery and registration
- Feed and recommendations
- Search
- Notifications
- Messaging
- Operations Center
- University verification workflows
- AI roadmap foundations
- Monetization hooks

## Out of Scope for Early Launch

- Full native mobile apps
- Unbounded public social posting
- Live video infrastructure
- Complex creator monetization
- Overly broad marketplace features

---

# 10. Functional Requirements

## Authentication

- Users can sign up and sign in using supported identity providers.
- Sessions must be persistent and secure.
- The platform must support role-aware access control.
- Authentication flows must differentiate students, organizers, university users, and admins.

## Communities

- Users can discover communities.
- Users can join or leave communities.
- Communities can publish posts, updates, and events.
- Communities must support moderation and role assignment.

## Events

- Users can view, save, and register for events.
- Events must be tied to a community, organizer, or university workflow.
- Events must expose trust and capacity information.

## Feed

- Users see a personalized discovery feed.
- The feed can blend communities, events, opportunities, and announcements.
- The feed must avoid irrelevant spammy content.

## Profiles

- Users can maintain a public student profile.
- Profiles can show interests, communities, saved items, activity, and badges.
- Profile visibility must respect privacy settings.

## Search

- Search supports events, communities, people, opportunities, and organizations.
- Search must support filters and ranking.
- Search must be fast and relevance-aware.

## Notifications

- Notifications cover reminders, updates, approvals, messages, and recommendations.
- Users can manage preferences by category.

## Messaging

- Users can receive targeted messages from approved sources.
- Community and event-related messaging must be scoped and moderated.

## Operations Center

- Admins can manage reports, verification, moderation, and platform health.
- Operators can review content, approvals, and policy actions.

## AI

- AI can assist with recommendations, summarization, moderation assistance, search assistance, and content generation support.
- AI outputs must be explainable enough to avoid trust erosion.

## Monetization

- The platform may support premium university services, promoted opportunities, or value-added organizer tooling.
- Monetization must not damage trust or student usefulness.

---

# 11. Non Functional Requirements

## Performance

- Fast initial load on mobile networks.
- Feed and search must feel immediate.
- Detail pages should render quickly and progressively.

## Reliability

- Graceful failure handling.
- Recoverable loading and error states.
- Strong auditability for moderated actions.

## Security

- Role-based access control.
- Secure session management.
- Protected moderation and university workflows.
- Input validation everywhere.

## Accessibility

- Keyboard support.
- Screen-reader support.
- Visible focus states.
- Clear contrast and tap targets.

## Scalability

- Multi-university support.
- Content growth without feed collapse.
- Operational tooling that scales with moderation volume.

---

# 12. Community System

Communities are first-class objects in Cirqles.

They should support:

- Public discovery
- University-scoped visibility
- Membership and roles
- Announcements
- Event publishing
- Community identity and trust signals
- Engagement surfaces inside the feed

Communities should feel like living hubs, not static groups.

---

# 13. Event System

Events remain a core discovery surface, but they are part of a wider ecosystem.

Events should support:

- Rich detail pages
- Registration flow
- Capacity and status information
- Organizer or community ownership
- Recommendations and related items
- Messaging and notification hooks

The event system must stay reliable and trustworthy.

---

# 14. Feed System

The feed is the primary discovery surface.

It should combine:

- Recommended events
- Community activity
- Opportunities
- University announcements
- Followed or joined entity updates

The feed should never become generic social noise.

Ranking must favor relevance, recency, trust, and usefulness.

---

# 15. Profile System

Profiles are identity and context surfaces.

They should include:

- Name and role
- University affiliation
- Interests
- Community memberships
- Saved items
- Activity history
- Badges and verification

Profiles must support public and private fields.

---

# 16. Search

Search should be global, fast, and intelligent.

It must support:

- Query suggestions
- Ranked results
- Filters
- Deep links to entities
- Search across universities where permitted

Future search upgrades may include semantic search and AI-assisted intent interpretation.

---

# 17. Notifications

Notifications must be useful, timely, and non-spammy.

Types include:

- Event reminders
- Registration updates
- Community posts
- Official university announcements
- Messaging alerts
- Recommendation nudges

Preference controls are required.

---

# 18. Messaging

Messaging should be scoped and intentional.

It may include:

- Official messages
- Community announcements
- Event-specific updates
- Direct messaging where approved

Messaging must be constrained by safety, privacy, and role rules.

---

# 19. Operations Center

The Operations Center is the internal control plane.

It should include:

- Verification review
- Moderation queues
- Reports and abuse handling
- Content takedown tools
- University approval workflows
- Platform analytics
- Auditable decisions

This system is essential for trust at scale.

---

# 20. AI

AI roadmap areas:

- Personalized recommendations
- Event and post summaries
- Search assistance
- Moderation assistance
- Duplicate detection
- Content quality checks

AI should augment the product, not obscure it.

---

# 21. Monetization

Potential monetization paths:

- University partnerships
- Verified organizer tooling
- Premium event promotion controls
- Managed community or admin services
- Value-added analytics

Monetization must be aligned with trust and student value.

---

# 22. Future Vision

Cirqles can expand into:

- Career opportunities
- Internships
- Mentorship
- Student services
- Campus commerce
- Mobile native experiences
- Broader university ecosystems

---

# 23. Launch Strategy

## Launch Approach

1. Pilot one or more universities.
2. Validate discovery, joining, registration, and moderation.
3. Expand community tooling.
4. Introduce official university workflows.
5. Scale to more campuses and institutions.

## Launch Principles

- Ship a trustworthy core first.
- Avoid feature bloat.
- Instrument the product from the beginning.
- Keep the feed and communities healthy.

---

# 24. Success Metrics

## Product Metrics

- Weekly active students
- Community joins
- Event registrations
- Return visits
- Search usage
- Profile completion rate

## Trust Metrics

- Verification approval rate
- Report resolution time
- Moderation turnaround time
- Content quality score

## Platform Metrics

- Feed engagement quality
- Notification opt-in rate
- Messaging response rate
- Multi-university adoption

---

# 25. Open Questions

- What exact entities are required for the first multi-university release?
- Which authentication provider is the final standard?
- How much direct messaging should be allowed at launch?
- What monetization model best preserves student trust?
- Which AI features are safe to ship first?
- What is the minimum official university workflow needed for pilots?

---

# Historical Context

## Legacy Wonderer Materials

The historical Wonderer product notes remain in the `docs/` tree, especially:

- [docs/PRD/00-Overview.md](docs/PRD/00-Overview.md)
- [docs/PRD/01-Product.md](docs/PRD/01-Product.md)
- [docs/PRD/02-Users.md](docs/PRD/02-Users.md)
- [docs/PRD/03-Features.md](docs/PRD/03-Features.md)
- [docs/PRD/04-Architecture.md](docs/PRD/04-Architecture.md)
- [docs/PRD/05-Requirements.md](docs/PRD/05-Requirements.md)
- [docs/PRD/06-Roadmap.md](docs/PRD/06-Roadmap.md)

Those documents are preserved for product history and reasoning.
