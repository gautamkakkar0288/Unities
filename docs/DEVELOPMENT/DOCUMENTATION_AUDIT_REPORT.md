# Documentation Audit Report

> Audit date: 2026-08-06
>
> Scope: repository markdown documentation

---

## Summary

The documentation set now has a clearer Cirqles direction, but it still contains legacy Wonderer-era language and duplicated concepts across multiple folders.

The biggest strengths are the existing product, design, UX, and frontend detail docs. The main risks are overlap, naming inconsistency, and a few empty placeholder docs that need either content or explicit deprecation.

---

## Findings

### 1. Legacy terminology still appears in many historical docs

Several docs still use Wonderer as the active product name. That is acceptable for history, but those docs should be clearly labeled as historical or legacy where they are not the current source of truth.

### 2. Product knowledge is duplicated across several layers

The root PRD, the legacy PRD folder, the design docs, the screens docs, and the frontend docs all overlap in scope. The repository needs a sharper distinction between:

- Product source of truth
- Design system source of truth
- Engineering source of truth
- Historical legacy context

### 3. Empty placeholder docs exist in the development layer

Several development files were empty or nearly empty before this update. Those files should either be filled as living reference docs or explicitly marked deprecated.

### 4. The documentation tree needs more cross references

Many documents are useful in isolation, but fewer of them point to each other. Cross references should make the set easier for both humans and AI models to navigate.

### 5. Multi-university and operations concepts were under-documented

The new Cirqles direction introduces official university workflows, Operations Center behavior, messaging, and multi-university tenancy. Those topics now need to remain consistent across PRD, architecture, database, API, and backlog docs.

---

## Actions Taken

- Added a Cirqles master PRD.
- Added a Cirqles master design system.
- Expanded the roadmap into phased engineering delivery.
- Expanded the backlog into epics, features, tasks, and subtasks.
- Added a Cirqles context section to Gemini instructions.
- Rewrote the README to explain the Wonderer-to-Cirqles evolution.
- Added engineering source-of-truth placeholders for architecture, database, and API docs.

---

## Remaining Recommendations

1. Continue consolidating legacy planning docs into clearly scoped reference layers.
2. Add cross-links from UX and frontend docs to the new engineering sources of truth.
3. Decide which legacy Wonderer docs stay historical only and label them accordingly.
4. Keep the Cirqles naming consistent in new work unless the document is explicitly historical.
