# Design Review Prompt (AI Instruction Template)

Use this prompt when asking an AI to review a Wonderer screen/mockup for design quality.

```
Review this screen/mockup for Wonderer against the design checklist:

- [ ] Clear visual hierarchy
- [ ] Responsive across breakpoints
- [ ] Accessible (contrast, touch targets, focus states)
- [ ] Premium appearance — clean, airy, warm light theme
- [ ] One primary action, no competing CTAs
- [ ] Smooth, purposeful interactions only (no gratuitous motion)
- [ ] Consistent spacing (design token scale, not arbitrary values)
- [ ] Consistent typography (existing type scale only)
- [ ] Reusable components used, not one-off inventions
- [ ] Proper loading state present
- [ ] Proper empty state present (explains + guides to action)
- [ ] Proper error state present (plain language + retry)
- [ ] No invented colors, icons outside Lucide, or new spacing values

Flag any violations with the specific principle from docs/DESIGN/ that applies.

Screen to review: [insert screen name or description here]
```
