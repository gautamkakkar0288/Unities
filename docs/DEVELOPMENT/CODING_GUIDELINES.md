# Cirqles Coding Guidelines

> Applies to all code in this repository. Extends `docs/DEVELOPMENT/GEMINI.md` and `DESIGN_SYSTEM.md`.

---

## Language and Types

- TypeScript strict mode everywhere. `any` is forbidden unless justified in an inline comment.
- Components stay under ~300 lines. Extract reusable logic into `hooks/` or `lib/services/`.
- Composition over duplication. Reuse `components/ui/` before creating anything new.

---

## Data and Validation

- Zod schemas live in `lib/schemas/` and are the single validation contract.
- Forms use React Hook Form + `@hookform/resolvers/zod`.
- Server state uses TanStack Query. Never fetch directly inside UI components.
- Zustand is for genuinely local client state only (e.g. UI toggles).
- Business logic belongs in `lib/services/`, never in components.

---

## Styling

- Semantic tokens from `app/globals.css` only. Never hardcode colors.
- Use `cn()` from `lib/utils` for conditional classes.
- Semantic HTML and accessibility are mandatory: labels, focus states, keyboard support.

---

## Motion

- Use Motion. Durations 150–300ms. Fade/slide/scale/stagger only.
- Respect reduced-motion preferences.

---

## States

- Every surface ships with loading (skeletons over spinners), empty (explanation + action), and error (plain language + recovery) states.
