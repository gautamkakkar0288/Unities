# Cirqles Architecture

> Engineering source of truth for system design.
>
> This document is intentionally engineering-focused and does not repeat PRD-level product requirements.

---

## 1. System Architecture

Cirqles should use a modular, feature-oriented architecture with clear boundaries between presentation, domain logic, data access, and platform infrastructure.

### Core Layers

- Presentation layer: routes, layouts, components, screens.
- Feature layer: community, event, profile, search, messaging, notifications, operations.
- Domain layer: entities, policies, workflows, permissions.
- Data layer: repositories, API clients, query services, caches.
- Infrastructure layer: auth, storage, search, messaging, analytics, deployment.

### Architectural Goals

- Preserve product clarity at scale.
- Support multi-university tenancy.
- Keep server-state and UI-state concerns separate.
- Make moderation and verification auditable.
- Make the app fast on mobile and comfortable on desktop.

---

## 2. Frontend

### Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Lucide React

### Frontend Principles

- Server Components by default for static or read-heavy surfaces.
- Client Components only for interactivity.
- Feature-based file organization.
- Shared components stay reusable and presentation-focused.
- Forms use schema validation and accessible feedback.

### UI Composition

- `components/` holds reusable primitives.
- Feature folders compose primitives into real screens.
- Navigation, cards, overlays, and feedback states must be shared instead of reimplemented.

---

## 3. Backend

### Backend Shape

The backend should expose typed services and REST endpoints grouped by domain.

### Responsibilities

- Authentication and session management
- Authorization and role enforcement
- Community, event, and profile workflows
- Search indexing and retrieval
- Notifications and messaging orchestration
- Moderation and audit logging

### Service Boundaries

- Identity service
- Community service
- Event service
- Feed/recommendation service
- Notification service
- Messaging service
- Operations service
- Search service

---

## 4. Database

### Primary Store

Use PostgreSQL as the primary relational system of record.

### Database Principles

- Model tenants explicitly.
- Prefer normalized core entities.
- Use join tables where relationships are many-to-many.
- Keep audit and moderation records append-friendly.
- Index by access patterns, not only by entity type.

### Supporting Systems

- Redis for caching, rate limiting, and ephemeral workflow state.
- Object storage for media and attachments.
- Search index for fast discovery.

---

## 5. Authentication

### Authentication Model

Authentication should support secure sign-in, session persistence, and role-aware access.

### Requirements

- Protected routes must reject unauthenticated access.
- Role claims must be verified server-side.
- Sessions should be revocable.
- Verification status and tenant membership must be part of access decisions where relevant.

---

## 6. Authorization

### Roles

- Student
- Organizer
- Community Moderator
- University Admin
- Platform Admin

### Authorization Rules

- Permissions are checked at the API boundary and again where needed in the UI.
- Community-scoped actions cannot escape their tenant or community boundaries.
- Operations Center actions require explicit elevated privileges.

---

## 7. Domain Driven Design

### Bounded Contexts

- Identity and access
- Communities
- Events and registrations
- Profiles and identity
- Feed and recommendations
- Messaging
- Notifications
- Operations and moderation

### Domain Rules

- Keep aggregate boundaries small.
- Avoid leaking persistence models directly into UI code.
- Preserve business rules in domain services or policies.
- Use event-driven updates where it reduces coupling.

---

## 8. Caching

### What to Cache

- Feed summaries
- Community and event previews
- Search suggestions
- Permission snapshots where safe
- Frequently used metadata

### Cache Rules

- Cache must never become the source of truth for protected state.
- Expiration should match content freshness.
- Invalidation must be explicit for moderation-sensitive data.

---

## 9. Storage

### Structured Data

PostgreSQL remains the source of truth for structured entities and relationships.

### Media and Assets

- Store images, attachments, and uploaded media in object storage.
- Store references and metadata in the database.

### Audit and Logs

- Keep audit records append-only where possible.
- Separate product analytics from moderation audit records.

---

## 10. Search

### Search Scope

- Events
- Communities
- Users and profiles where permitted
- Opportunities
- Official announcements where visible

### Search Requirements

- Fast suggestions.
- Filtered result sets.
- Rank by relevance, trust, recency, and context.
- Support multi-university scoping.

### Implementation Guidance

- Keep indexing asynchronous.
- Do not make search depend on live joins for every query.
- Use the search service as the abstraction boundary.

---

## 11. AI

### AI Use Cases

- Recommendations
- Content summarization
- Search assistance
- Moderation assistance
- Duplicate detection

### AI Rules

- AI should be assistive and explainable.
- Human review remains required for moderation actions.
- AI outputs must not bypass trust or permission checks.

---

## 12. Notifications

### Channels

- In-app notifications
- Push notifications
- Email digests where supported

### Notification Rules

- Notifications must be preference-aware.
- Delivery should be grouped and deduplicated.
- Critical updates can bypass low-priority grouping.

---

## 13. Deployment

### Baseline

- Frontend on Vercel or equivalent modern deployment platform.
- Backend services on managed infrastructure.
- Database on managed PostgreSQL.

### Deployment Requirements

- Reproducible environments.
- Preview deployments for review.
- Safe rollback strategy.
- Environment-specific configuration.

---

## 14. Scaling Strategy

### Early Scale

- Optimize for a few pilot universities first.
- Keep data access patterns simple.
- Use caching and pagination early.

### Growth Scale

- Introduce async processing for moderation, search indexing, and notifications.
- Partition tenant-sensitive data models where needed.
- Keep the Operations Center scalable before expanding the user base aggressively.

---

## 15. Security

### Security Baseline

- HTTPS everywhere
- Input validation
- Rate limiting on sensitive flows
- Secure session storage
- CSRF and XSS protections
- Strict role enforcement

### Security Philosophy

- Secure by default.
- Minimize trust in client-side claims.
- Log sensitive actions without leaking sensitive content.

---

## 16. Future Mobile

### Strategy

The architecture should remain compatible with future mobile clients.

### Requirements

- API contracts must be client-agnostic.
- Domain logic should not assume web-only behavior.
- Authentication and tenancy rules must be consistent across clients.

---

## 17. API Philosophy

### Principles

- REST-first and domain-oriented.
- Predictable resource naming.
- Consistent error shapes.
- Versioned contracts.
- Clear permission semantics.

### Design Rules

- APIs should describe resources, not UI screens.
- Mutations should be explicit and auditable.
- Keep payloads compact but complete enough for the UI.

---

## 18. Engineering Principles

- Prefer clarity over cleverness.
- Preserve historical context in docs, but keep new code aligned with Cirqles.
- Keep reusable logic reusable.
- Keep state boundaries sharp.
- Make moderation, verification, and tenancy explicit in code and data.
