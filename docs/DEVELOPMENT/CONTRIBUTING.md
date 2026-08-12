# Contributing

## Ground Rules

- The documentation tree is the source of truth. Read the relevant docs before changing code.
- Keep implementation aligned with `PRD.md`, `DESIGN_SYSTEM.md`, and `docs/ENGINEERING/`.
- Reuse existing components and patterns before creating new ones.

## Workflow

1. Create a branch per phase or feature: `phase-N/name` or `feat/name`.
2. Open a pull request against `main`. CI must pass (typecheck, lint, test, build).
3. Update `docs/DEVELOPMENT/TASKS.md` and `ROADMAP.md` when a feature changes scope or sequencing.
4. Record architectural choices in `docs/DEVELOPMENT/DECISIONS.md`.

## Quality Bar

Every merged surface must include loading, empty, error, responsive, and accessible states. See `docs/DEVELOPMENT/CODING_GUIDELINES.md`.
