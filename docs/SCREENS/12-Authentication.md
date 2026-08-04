# 12 — Authentication

## Purpose
Simple, trustworthy login/signup.

## Flow
Login / Signup choice → Credential entry (or SSO if available) → Token issued → Redirect to Onboarding (new user) or Home (returning user)

## Requirements
- Clear validation and error messages
- Loading state on submit
- "Forgot password" recovery flow
- Never expose protected routes without a valid session (see `FRONTEND/00-Architecture.md` auth flow)

## States
- Loading: disabled submit with spinner
- Error: inline, non-technical (e.g. "Incorrect email or password.")
