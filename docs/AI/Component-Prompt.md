# Component Prompt (AI Instruction Template)

Use this prompt when asking an AI to generate a new reusable component.

```
Generate a new reusable Wonderer component.

Before writing code, check docs/COMPONENTS/ to confirm this component doesn't already exist in another form.

Requirements:
- Reusable, accepts props, no page-specific logic
- Naming: PascalCase, purpose-descriptive (e.g. EventCard, not Card2)
- Support loading state and disabled state (if applicable)
- Style only with Tailwind, referencing design tokens (docs/DESIGN/13-Design-Tokens.md) — never hardcoded values
- Include accessibility: keyboard operability, ARIA labels where needed, visible focus state
- Animation (if any) via Motion, 150–300ms, purposeful only
- Document the component's variants/props inline or in docs/COMPONENTS/[Name].md

Component to build: [insert component name/spec here]
```
