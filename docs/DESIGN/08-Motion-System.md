# 08 — Motion System

## Purpose
Motion should communicate, not decorate. Use animation for:
- Navigation transitions
- Feedback (button presses, likes, saves)
- Loading states
- State changes

## Animation Principles
- Smooth
- Responsive
- Fast
- Purposeful

## Recommended Duration
**150ms–300ms** for most transitions. Avoid long transitions that slow perceived performance.

## Implementation
Use the **Motion** library (Framer Motion successor) in the frontend. Avoid excessive movement — animate selectively, only where it improves understanding of what changed on screen.

## What to Avoid
- Animating everything indiscriminately
- Long, decorative transitions
- Motion that blocks user input while playing
