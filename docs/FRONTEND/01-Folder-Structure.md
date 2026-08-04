# 01 — Folder Structure

```
src/
  app/          # Routes, layouts, pages, loading, error, not-found
  components/   # Reusable UI: Button, Input, Card, Modal, Dialog, Badge, Avatar, Navbar
  features/     # Business logic grouped by feature: events, communities, profile, search, notifications
  hooks/        # useDebounce, useTheme, useMediaQuery, useInfiniteScroll, useToast
  lib/          # Configuration, utilities, third-party setup
  services/     # API calls — never fetch directly inside components
  store/        # Global Zustand stores: theme, user, notifications, filters
  types/        # Shared interfaces
  constants/    # App-wide constants
  utils/        # Pure helper functions
  styles/
public/
```

## Rule
Never fetch or manage server state directly inside a UI component. Always: Component → Hook → Service → API.
