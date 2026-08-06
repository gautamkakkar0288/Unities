# App Shell

The authenticated frame at `app/(app)/`. Every feature from Phase 6 onward renders inside it, so its contracts matter more than its own visible surface area.

## Structure

| Location | Role |
|---|---|
| `app/(app)/layout.tsx` | session guard, skip link, shell composition |
| `app/(app)/loading.tsx` | layout-mirroring skeleton |
| `lib/navigation/config.ts` | navigation model and active-route matching |
| `lib/auth/roles.ts` | role labels and badge treatment |
| `features/shell/components/*` | sidebar, top bar, mobile bar, user card, page header |
| `features/shell/actions.ts` | sign-out server action |

## Navigation model

One typed module defines navigation; components render it and never hardcode links.

- **Mobile bottom bar** — Home, Explore, Search, Notifications, Profile. Exactly five, per `docs/UX/02`. A test enforces the cap, because "just one more tab" is how a bottom bar rots.
- **Desktop sidebar** — Home, Explore, Communities, Saved, Profile. See D18 for why Search and Notifications are not here.
- **Top bar** — global search, notifications, appearance.
- **Communities and Saved on mobile** are reached through Profile. The five-item cap leaves no room for them, and `docs/UX/00` explicitly routes them through a primary screen. Profile is that screen; without those links they would be unreachable on a phone.

### Active state

`isActiveRoute` is exact-match for the destination and boundary-aware prefix-match for its children, so `/communities/robotics` highlights Communities while `/savedsomething` does not highlight Saved. Active items get `aria-current="page"` — the colour change is only the visual half of communicating position.

## Rules for feature work

1. **Add destinations to `lib/navigation/config.ts`**, never as a hardcoded link in a component.
2. **Use `PageHeader` for the page title.** It owns the `h1`, which keeps heading order correct across every feature.
3. **Do not add a second `main` or a nested navigation bar.** The shell owns both.
4. **Every empty state points somewhere.** `docs/UX/02` requires empty navigation states to guide, not dead-end.
5. **Authorise in the server component that reads data**, not only in middleware. Middleware is an optimisation, not a security boundary.
6. **Respect the mobile bar's space.** Full-bleed or fixed-bottom content must clear it; the shell's bottom padding covers normal page content.

## Layout mechanics

- The sidebar is `fixed` and the main column is offset by `lg:pl-64`, so a long feed scrolls without navigation scrolling away.
- The mobile bar uses `env(safe-area-inset-bottom)`. Without it, the lowest pixels of every tap target are unreachable on modern iPhones.
- Touch targets are 44x44 on mobile, tightening to 36px only at `lg` where a pointer is assumed.
- The top bar and mobile bar use frosted glass, which `docs/DESIGN/02` permits for floating navigation and nowhere else.

## Known gaps

- **No command palette.** Worth adding for power users once search exists (Phase 10).
- **No breadcrumbs.** `docs/UX/02` marks them optional on deep desktop pages; revisit when community and event detail pages land.
- **No unread notification indicator.** The bell has no badge because there is no notification data yet (Phase 12).
- **No user dropdown.** See D20.
- **No onboarding.** `docs/SCREENS/11-Onboarding.md` defines an interests step that should follow sign-up; it needs the interests taxonomy from Phase 6.
- **Placeholder destinations.** Six of the seven primary pages are honest empty states. They exist so navigation never 404s, and each is replaced by its own phase.
