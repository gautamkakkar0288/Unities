# 13 — Design Tokens

## Purpose
This is the single source of truth for raw design values — color, typography, spacing, radius, shadow, and motion — referenced by every other design and frontend document instead of hardcoded values.

## Token Categories
- **Color** — semantic tokens (primary, success, error, warning, info, surface, text) mapped to raw values
- **Typography** — font family, size scale, weight scale, line-height scale
- **Spacing** — consistent numeric scale (e.g. 4px base unit)
- **Radius** — consistent corner-rounding scale for cards, buttons, inputs
- **Shadow/Elevation** — mapped to the levels in `09-Elevation-System.md`
- **Motion** — standard durations (150–300ms) and easing curves

## Rules
- Never invent a new color, spacing value, or type size outside this token set.
- All components (`COMPONENTS/`) and frontend styling (`FRONTEND/07-Styling.md`) must reference tokens, never hardcode raw values.
- Tokens should be implemented as Tailwind theme extensions so they're enforced at the tooling level.

---

# Finalised Values

> Implemented in `app/globals.css` as Tailwind v4 `@theme` tokens. Values are OKLCH for perceptually even lightness across light and dark themes. This section and that file must stay in sync.

## Colour Architecture

Two layers (see `DECISIONS.md` D11):

1. **Surface tokens** — neutral chrome: `background`, `card`, `popover`, `muted`, `secondary`, `accent`, `border`, `input`, `ring`.
2. **Meaning tokens** — brand and status. Each ships four variants:

| Variant | Use |
|---|---|
| base | solid fills, icons, emphasis text |
| `-foreground` | readable text on the subtle background |
| `-subtle` | tinted background for badges, alerts, banners |
| `-border` | border paired with the subtle background |

## Brand and Status

| Token | Role | Light | Dark |
|---|---|---|---|
| `primary` | Wonder Blue — primary actions, links, active nav | `oklch(0.55 0.185 258)` | `oklch(0.70 0.145 256)` |
| `support` | Soft Indigo — tags, charts, sub-navigation | `oklch(0.55 0.16 288)` | `oklch(0.70 0.13 288)` |
| `featured` | Warm Orange — trending, featured, limited-time. Use sparingly | `oklch(0.70 0.16 55)` | `oklch(0.76 0.145 62)` |
| `success` | verified, registered, active | `oklch(0.60 0.13 155)` | `oklch(0.72 0.13 157)` |
| `warning` | capacity, deadlines, pending approval | `oklch(0.75 0.14 78)` | `oklch(0.80 0.13 80)` |
| `info` | tips, educational banners | `oklch(0.64 0.12 235)` | `oklch(0.72 0.11 235)` |
| `destructive` | validation, failed, cancelled — clear, not aggressive | `oklch(0.58 0.205 26)` | `oklch(0.66 0.18 25)` |

Surfaces: light `background` is a warm off-white `oklch(0.992 0.003 95)` with pure-white cards for lift; dark `background` is `oklch(0.17 0.008 260)` — never pure black, per `DESIGN_SYSTEM.md` §4.

`ring` follows `primary`, so focus rings are brand-coloured in both themes.

## Typography

Family: Geist, then Inter, SF Pro Display, Segoe UI, Roboto, sans-serif.

| Utility | Size | Line height | Weight |
|---|---|---|---|
| `text-display` | `clamp(2.5rem, 1.9rem + 3vw, 4rem)` | 1.05 | 700 |
| `text-h1` | `clamp(1.875rem, 1.55rem + 1.6vw, 2.5rem)` | 1.15 | 600 |
| `text-h2` | `clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)` | 1.2 | 600 |
| `text-h3` | 1.25rem | 1.3 | 600 |
| `text-h4` | 1.0625rem | 1.4 | 600 |
| `text-body-lg` | 1.0625rem | 1.65 | 400 |
| `text-body` | 0.9375rem | 1.6 | 400 |
| `text-body-sm` | 0.875rem | 1.55 | 400 |
| `text-caption` | 0.8125rem | 1.45 | 400 |
| `text-label` | 0.875rem | 1.2 | 500 |

Display, h1, and h2 scale fluidly, so there is no separate mobile type system. Weights are limited to 400 / 500 / 600 / 700. Apply `data-numeric` for tabular figures on counts, capacity, and countdowns.

## Spacing

Tailwind's 4px base scale, restricted to the documented 8-point rhythm: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80px (`p-1` through `p-20`). No arbitrary values.

Page padding steps are owned by the `Container` primitive: 16px mobile, 24px tablet, 32px desktop, 48px large desktop.

## Containers

| Utility | Width | Use |
|---|---|---|
| `max-w-page` | 80rem (1280px) | standard app and marketing pages |
| `max-w-wide` | 90rem (1440px) | dense Operations Center tables |
| `max-w-readable` | 68ch | long-form copy, 60–80 characters per line |

## Radius

Base `--radius: 0.625rem`, with `sm` / `md` / `lg` / `xl` / `2xl` / `3xl` / `4xl` derived from it. Inputs and buttons use `lg`; cards use `xl`; pills use `rounded-full`.

## Elevation

Mapped to `09-Elevation-System.md`, lightest effective shadow at every level.

| Utility | Level |
|---|---|
| — | base surface (no shadow) |
| `shadow-card` | card |
| `shadow-panel` | floating panel, dropdown, popover |
| `shadow-dialog` | modal, dialog |
| `shadow-toast` | toast |

## Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 150ms | micro-interactions, hover, focus |
| `--duration-base` | 200ms | state changes |
| `--duration-slow` | 300ms | screen transitions |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default |
| `ease-entrance` | `cubic-bezier(0, 0, 0.2, 1)` | entering elements |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | leaving elements |

A global `prefers-reduced-motion` rule in `app/globals.css` neutralises animation and transition durations, so honouring the OS preference is automatic rather than per-component.
