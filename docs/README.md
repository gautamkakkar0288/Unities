# Cirqles

> Discover. Connect. Belong.

Cirqles is the community-first evolution of Wonderer: a premium platform for student discovery, campus communities, official university workflows, and trusted opportunities.

It helps students find events, communities, opportunities, and people in one place, while giving organizers, universities, and operations teams the structure they need to keep the platform trustworthy at scale.

---

## Vision

Build the default campus community layer for multi-university student life.

---

## Features

- Personalized discovery feed
- Communities and memberships
- Events and registrations
- Student profiles
- Search and filters
- Notifications and reminders
- Messaging and announcements
- Operations Center for moderation and verification
- AI-assisted recommendations and summaries

---

## Screenshots Placeholder

Add product screenshots here once the core screens are implemented.

---

## Architecture Overview

- Next.js App Router frontend
- TypeScript throughout
- Reusable component system
- Feature-based architecture
- Server Components where possible
- Client Components for interactivity
- Centralized data fetching and state handling
- Role-aware access control

For the detailed engineering source of truth, see [docs/ENGINEERING/ARCHITECTURE.md](docs/ENGINEERING/ARCHITECTURE.md).

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Lucide React

### Backend Direction

- Node.js
- PostgreSQL
- Redis
- Prisma or another typed data layer

### Deployment

- Vercel for the frontend
- Managed infrastructure for data and background services

---

## Folder Structure

```text
docs/
	AI/
	COMPONENTS/
	DESIGN/
	DEVELOPMENT/
	ENGINEERING/
	FRONTEND/
	PRD/
	REFERENCES/
	SCREENS/
	UX/
```

Each folder has a single responsibility and should stay that way.

---

## Getting Started

1. Read [PRD.md](PRD.md) for the current product direction.
2. Read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the visual and component rules.
3. Read [docs/DEVELOPMENT/GEMINI.md](docs/DEVELOPMENT/GEMINI.md) for AI and workflow guidance.
4. Review the detailed engineering docs in [docs/ENGINEERING/](docs/ENGINEERING).

---

## Development

- Keep implementation aligned with the documentation tree.
- Reuse existing components before inventing new ones.
- Maintain loading, empty, error, and offline states for every meaningful surface.
- Validate accessibility and responsiveness before merging.

---

## Contributing

Contributions should preserve product history while moving Cirqles forward.

Before editing, read the relevant docs and update planning documents if the change affects scope or sequencing.

---

## Roadmap

The roadmap is maintained in [docs/DEVELOPMENT/ROADMAP.md](docs/DEVELOPMENT/ROADMAP.md).

---

## Future

Cirqles is designed to expand into multi-university operations, AI-assisted discovery, and mobile experiences without rewriting the core product model.

---

## Project Evolution

Wonderer was the original product name and discovery concept.

Cirqles keeps that historical context while expanding the product into a broader campus community platform with stronger identity, operations, and university workflows.

---

## License

Add the final project license here when the repository license is finalized.

---

Built with ❤️ for students.