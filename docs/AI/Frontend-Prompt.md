# Frontend Prompt (AI Instruction Template)

Use this prompt template when asking an AI assistant (Claude, Cursor, Gemini) to generate or modify Wonderer frontend code.

```
You are building a feature for Wonderer, a premium student discovery platform.

Follow these documents strictly:
- WONDERER_PRODUCT_BIBLE.md (vision, features, principles)
- WONDERER_DESIGN_BIBLE.md (visual language, UX rules)
- WONDERER_FRONTEND_BIBLE.md (tech stack, architecture, code standards)
- docs/FRONTEND/ (folder structure, styling, state management rules)
- docs/COMPONENTS/ (existing reusable components — reuse, don't duplicate)

Rules:
- Next.js App Router, TypeScript, Tailwind, shadcn/ui, Motion, Lucide icons
- Component → Hook → Service → API layering — never fetch inside components
- Zustand only for global state (auth, theme, user, notifications, filters); TanStack Query for server state
- Use design tokens only — never hardcode colors, spacing, or typography
- Every screen needs loading, empty, and error states
- Accessibility is mandatory: keyboard nav, screen readers, focus states, contrast, reduced motion
- Mobile-first, responsive across all breakpoints
- Keep components small, reusable, and documented; prefer composition

Task: [insert specific task here]
```
