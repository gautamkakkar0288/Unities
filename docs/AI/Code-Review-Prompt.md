# Code Review Prompt (AI Instruction Template)

Use this prompt when asking an AI to review a Wonderer PR/diff.

```
Review this code change for Wonderer against the following checklist:

- [ ] No fetch calls directly inside components (Component → Hook → Service → API)
- [ ] No hardcoded colors, spacing, or typography — design tokens only
- [ ] Zustand used only for global state (auth, theme, user, notifications, filters)
- [ ] Server state managed via TanStack Query, not manual useState/useEffect
- [ ] Component is reusable, appropriately named, and not a duplicate of an existing one
- [ ] Loading, empty, and error states are handled
- [ ] Accessibility: keyboard nav, ARIA where needed, visible focus states, contrast
- [ ] Responsive across mobile/tablet/laptop/desktop
- [ ] Animations use Motion, 150–300ms, purposeful only
- [ ] No console.logs, no TypeScript errors, no ESLint warnings
- [ ] Naming conventions followed (PascalCase components, camelCase hooks, UPPER_CASE constants)

Flag any violations with the specific rule from docs/FRONTEND/ or docs/DESIGN/ that applies.

Code to review: [insert diff/code here]
```
