# Design System Implementation

How the design specification maps to code. `DESIGN_SYSTEM.md` and `docs/DESIGN/*` remain the intent; this file records the implementation and is the contract for anyone building a feature.

## Where things live

| Concern | Location |
|---|---|
| Token definitions | `app/globals.css` (`@theme`) |
| Token reference | `docs/DESIGN/13-Design-Tokens.md` |
| Primitives | `components/ui/*` |
| Layout primitives | `components/layout/*` |
| Theme provider | `components/providers/index.tsx` |
| Live gallery | `/design` |

## Primitive inventory

| Primitive | Purpose | Notes |
|---|---|---|
| `Button` | actions | pre-existing; variants default / secondary / outline / ghost / destructive / link |
| `Input`, `Textarea` | text entry | token borders, `aria-invalid` styling |
| `Label` | field labels | optional `required` marker with screen-reader text |
| `Field` | label + control + hint + error | render prop wires `aria-invalid` and `aria-describedby` |
| `Card` + subcomponents | primary content container | `interactive` adds hover elevation and focus ring |
| `Badge` | status and metadata | 9 variants; always carries a text label |
| `Avatar` | identity | initials fallback, accessible name, 5 sizes |
| `Alert` | inline feedback | picks its own icon; `alert` role for error/warning, `status` otherwise |
| `EmptyState` | zero-data surfaces | requires a title, expects an action |
| `Skeleton` | content loading | preferred over spinners for pages and lists |
| `Spinner` | in-flight actions | sr-only status label by default |
| `Separator` | visual division | `role="separator"` with orientation |
| `Container` | horizontal rhythm | `page` / `wide` / `readable` + responsive padding |
| `ThemeToggle` | light / dark / system | radiogroup, hydration-safe |

## Rules for feature work

1. **Never hardcode a value.** No hex colours, raw `px` font sizes, or arbitrary shadows. If a token is missing, add it to `globals.css` and document it in `13-Design-Tokens.md` first.
2. **Reuse before creating.** Check this inventory and `/design` before writing a new component. Extend a primitive with a variant rather than forking it.
3. **Use named type roles.** `text-h2`, `text-body`, `text-caption` — never `text-[15px]`.
4. **Wrap every form control in `Field`.** Do not hand-wire `aria-describedby`.
5. **Colour is never the only signal.** Pair status with a label or icon.
6. **Every feature ships all four states:** loading (skeleton), empty (`EmptyState`), error (`Alert`), and success.
7. **Verify both themes.** Open `/design` and toggle before opening a PR.
8. **Respect motion limits.** 150–300ms, `ease-*` tokens, and never animate everything at once.

## Known documentation deltas

Recorded in `docs/DEVELOPMENT/DECISIONS.md`:

- **D11** — shadcn surface tokens are kept neutral; Cirqles meaning tokens are added alongside rather than remapping `secondary` and `accent`.
- **D12** — theme state uses next-themes, not the Zustand `store/theme` in `10-Theme-System.md`, because a client store cannot avoid a first-paint flash.
- **D13** — dark mode ships in Phase 3 rather than post-MVP, because retrofitting a theme after product surfaces exist costs more than tokenising once.

## Not yet built

Deferred until a feature needs them, to avoid speculative components: Dialog, Sheet, Dropdown, Popover, Tooltip, Tabs, Select, Checkbox, Radio, Switch, Toast, Table, Pagination, Command palette, and the mobile bottom navigation / desktop sidebar shells (Phase 5). Overlays must trap focus and close on Escape when introduced.
