/**
 * The semantic tones the design system exposes, matching the `Badge` variants
 * in `components/ui/badge.tsx`.
 *
 * Extracted so domain logic can decide *what a thing means* ("this event is
 * full") and return a tone, without importing a component. Business rules that
 * import UI are rules that cannot be tested or reused on the server.
 */
export type Tone =
  | "neutral"
  | "brand"
  | "support"
  | "featured"
  | "success"
  | "warning"
  | "info"
  | "error"
  | "outline"

/** The button variants an action descriptor is allowed to ask for. */
export type ActionVariant = "default" | "outline" | "secondary"
