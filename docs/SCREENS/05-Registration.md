# 05 — Registration

## Purpose
Low-friction event sign-up.

## Layout
Event summary (recap) → Registration form (React Hook Form + Zod) → Confirmation step

## Form Requirements
- Only necessary fields
- Inline validation and clear error messages
- Loading, success, and disabled states on submit

## Primary Action
Submit registration.

## States
- Loading: disabled submit button with spinner/skeleton
- Success: confirmation screen with option to Save/Share/Add to Calendar
- Error: clear, non-technical error message with retry
- Edge case: event fills up mid-registration — surface immediately, don't let user submit into a full event
