# Screen Prompt (AI Instruction Template)

Use this prompt when asking an AI to build a full screen/page.

```
Build the [SCREEN NAME] screen for Wonderer.

Reference: docs/SCREENS/[matching-file].md for this screen's purpose, content order, primary action, and required states.

Every screen must include:
- Clear purpose and exactly one primary action
- Logical content hierarchy (see the screen's content order)
- Loading state (skeleton, not spinner where possible)
- Empty state (explain why + guide to an action)
- Error state (plain language + retry action)
- Full responsiveness (mobile-first)
- Accessibility support

Compose from existing components in docs/COMPONENTS/ wherever possible — do not duplicate existing patterns.
Follow data-fetching rules in docs/FRONTEND/03-Data-Fetching.md and docs/FRONTEND/05-API-Integration.md.

Screen to build: [insert screen name here]
```
