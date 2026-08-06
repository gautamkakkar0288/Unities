# Cirqles Engineering Backlog

> This file is a living backlog for the repository.
>
> It preserves historical Wonderer planning while organizing Cirqles work into epics, features, tasks, and subtasks.

---

# Backlog Rules

- Keep completed items visible.
- Mark deprecated items explicitly.
- Every task needs priority, complexity, dependencies, owner placeholder, acceptance criteria, and status.
- Group work by epic, then feature, then task, then subtasks.

---

# Epic 1 — Foundation

## Feature — Repository and App Structure

### Task — Establish app shell

- Priority: High
- Complexity: Medium
- Dependencies: None
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: App renders a coherent shell, routes are organized, and shared layout patterns are consistent.
- Subtasks:
	- Confirm route groups.
	- Wire shared layout.
	- Add loading and error boundaries.

### Task — Define shared component boundaries

- Priority: High
- Complexity: Medium
- Dependencies: App shell
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Reusable components are separated from feature composition and documented.
- Subtasks:
	- Audit component reuse opportunities.
	- Map existing UI primitives.
	- Document ownership rules.

## Feature — Core Data Model

### Task — Define tenant-aware entities

- Priority: High
- Complexity: High
- Dependencies: Product direction
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: University, user, community, event, and role relationships are defined for multi-university support.
- Subtasks:
	- Define entity boundaries.
	- Identify primary keys and relationships.
	- Align schema assumptions with API design.

---

# Epic 2 — Authentication

## Feature — Sign Up and Sign In

### Task — Build authentication flows

- Priority: High
- Complexity: Medium
- Dependencies: Identity provider choice
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Users can register, sign in, and resume a session securely.
- Subtasks:
	- Implement credential form.
	- Add session persistence.
	- Handle error states and recovery.

### Task — Implement role-aware access control

- Priority: High
- Complexity: High
- Dependencies: Auth flows
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Students, organizers, university users, and admins see only authorized surfaces.
- Subtasks:
	- Define roles and permissions.
	- Protect routes and API endpoints.
	- Add access-denied states.

---

# Epic 3 — Design System

## Feature — Tokenized Visual Language

### Task — Finalize tokens

- Priority: High
- Complexity: Medium
- Dependencies: Brand direction
- Owner Placeholder: Design
- Status: Not started
- Acceptance Criteria: Colors, spacing, type, radius, elevation, and motion are tokenized and documented.
- Subtasks:
	- Validate semantic color mapping.
	- Define typography scale.
	- Confirm spacing rhythm.

## Feature — Reusable Components

### Task — Document base components

- Priority: High
- Complexity: Medium
- Dependencies: Tokens
- Owner Placeholder: Design
- Status: Not started
- Acceptance Criteria: Buttons, cards, inputs, navigation, feedback, and overlays each have explicit behavior rules.
- Subtasks:
	- Define loading states.
	- Define empty/error patterns.
	- Capture accessibility requirements.

---

# Epic 4 — Landing

## Feature — Public Product Story

### Task — Ship landing page

- Priority: Medium
- Complexity: Medium
- Dependencies: Design system
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: New visitors understand Cirqles, its benefits, and its evolution from Wonderer.
- Subtasks:
	- Write value proposition.
	- Add screenshots placeholder.
	- Add conversion CTA.

---

# Epic 5 — Home

## Feature — Personalized Feed

### Task — Build feed sections

- Priority: High
- Complexity: High
- Dependencies: Auth, content models
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Home surfaces relevant content with consistent section hierarchy and useful loading states.
- Subtasks:
	- Implement recommended content section.
	- Add trending section.
	- Add community updates section.

### Task — Implement ranking signals

- Priority: High
- Complexity: High
- Dependencies: Feed sections
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Ranking can use interests, memberships, university context, and behavior.
- Subtasks:
	- Define signal inputs.
	- Add explainability metadata.
	- Add fallback ranking.

---

# Epic 6 — Communities

## Feature — Community Pages

### Task — Build community identity surface

- Priority: High
- Complexity: Medium
- Dependencies: Core community entity
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Users can discover, join, and understand communities with clear membership state.
- Subtasks:
	- Add community hero area.
	- Show membership counts.
	- Add community feed and upcoming events.

### Task — Add community membership model

- Priority: High
- Complexity: High
- Dependencies: Backend schema
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Memberships support join, leave, roles, and moderation scopes.
- Subtasks:
	- Define membership permissions.
	- Add audit fields.
	- Add moderation boundaries.

---

# Epic 7 — Feed

## Feature — Discovery Feed

### Task — Blend content types

- Priority: High
- Complexity: High
- Dependencies: Communities, events, opportunities
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Feed can display multiple content types without feeling chaotic.
- Subtasks:
	- Define card variants.
	- Add spacing and grouping rules.
	- Add deep-link behavior.

---

# Epic 8 — Events

## Feature — Event Detail and Registration

### Task — Build event detail page

- Priority: High
- Complexity: High
- Dependencies: Event schema
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Users can understand an event, trust it, and act on it quickly.
- Subtasks:
	- Add hero summary.
	- Add trust signals.
	- Add sticky primary CTA.

### Task — Build registration flow

- Priority: High
- Complexity: Medium
- Dependencies: Auth, event capacity
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Users can register, handle validation errors, and recover from full events.
- Subtasks:
	- Add form validation.
	- Add capacity checks.
	- Add confirmation screen.

---

# Epic 9 — Profiles

## Feature — Student Profile

### Task — Implement profile editing

- Priority: High
- Complexity: Medium
- Dependencies: Auth
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Users can edit identity, interests, affiliations, and visibility-sensitive fields.
- Subtasks:
	- Add profile form.
	- Add validation.
	- Add success feedback.

---

# Epic 10 — Search

## Feature — Global Search

### Task — Implement search experience

- Priority: High
- Complexity: High
- Dependencies: Core indexed entities
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Search returns relevant events, communities, opportunities, and people with filters.
- Subtasks:
	- Add search screen.
	- Add suggestions.
	- Add ranking and filters.

---

# Epic 11 — Messaging

## Feature — Scoped Communication

### Task — Define message boundaries

- Priority: Medium
- Complexity: High
- Dependencies: Roles and permissions
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Messaging supports approved communication paths without exposing users to spam or abuse.
- Subtasks:
	- Define message sources.
	- Add moderation rules.
	- Add notification triggers.

---

# Epic 12 — Notifications

## Feature — Notification Center

### Task — Build notification inbox

- Priority: High
- Complexity: Medium
- Dependencies: Events, communities, messaging
- Owner Placeholder: Frontend
- Status: Not started
- Acceptance Criteria: Notifications are grouped, readable, and actionable.
- Subtasks:
	- Add grouping by recency.
	- Add unread indicator.
	- Add preference handling.

---

# Epic 13 — Operations Center

## Feature — Moderation and Verification

### Task — Build review queues

- Priority: High
- Complexity: High
- Dependencies: Auth, roles, reports
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Admins can review verification requests, reports, and content actions with auditability.
- Subtasks:
	- Add queue model.
	- Add decision logging.
	- Add moderation history.

---

# Epic 14 — AI

## Feature — Assistive AI

### Task — Define AI use cases

- Priority: Medium
- Complexity: Medium
- Dependencies: Search, feed, moderation
- Owner Placeholder: Product
- Status: Not started
- Acceptance Criteria: AI use cases are narrow, useful, and mapped to product value.
- Subtasks:
	- Prioritize recommendations.
	- Prioritize summaries.
	- Prioritize moderation support.

---

# Epic 15 — Multi University

## Feature — Tenant Model

### Task — Make university scoping explicit

- Priority: High
- Complexity: High
- Dependencies: Core data model
- Owner Placeholder: Backend
- Status: Not started
- Acceptance Criteria: Users, communities, events, and permissions can be scoped per university or across universities.
- Subtasks:
	- Define tenant boundaries.
	- Add visibility modes.
	- Add cross-university rules.

---

# Legacy Items

## Deprecated

- Early Wonderer-only naming and assumptions are deprecated where they conflict with Cirqles multi-university scope.

## Completed Historical Work

- The product thinking that led to the original Wonderer discovery model is preserved in the historical docs.

## Maintenance Note

The backlog should be updated whenever a feature moves phases, changes priority, or gains a new dependency.
