# 13 — Code Standards

## Naming Conventions
- Components: `PascalCase`
- Hooks: `camelCase` starting with `use`
- Types: `PascalCase`
- Constants: `UPPER_CASE`
- Files: consistent `kebab-case` or `PascalCase` (pick one per project and stay consistent)

## Code Quality
- Single responsibility per file
- Avoid duplicate logic — extract to `hooks/`, `utils/`, or `services/`
- Avoid deeply nested components — prefer composition
- TypeScript everywhere, strict typing enforced

## Git Workflow
- Feature branches
- Small, meaningful commits
- PRs required, code review before merge — see `AI/Code-Review-Prompt.md`

## AI/Assistant Instructions (Summary)
- Never invent new UI patterns, colors, spacing, or typography outside the design system
- Reuse existing components; do not duplicate logic
- Keep components small; prefer composition
- Maintain accessibility and responsiveness on every change
- Never hardcode values that belong in `constants/` or design tokens
