/**
 * Whether the prototype and design-system routes are reachable.
 *
 * These are development tools. They render fabricated fixture data, and the
 * prototype includes payment and trip screens for a Phase 9 feature that does
 * not exist - screens that must never be reachable on a production deployment,
 * where a student could read them as a real charge.
 *
 * Default: on in development, off everywhere else. Set ENABLE_PROTOTYPE=true to
 * expose them on a deployed preview, which is a deliberate act rather than an
 * accident of configuration.
 *
 * Kept free of imports so the edge-safe auth config can use it.
 */
export function prototypeRoutesEnabled(): boolean {
  const flag = process.env.ENABLE_PROTOTYPE

  if (flag === "true") return true
  if (flag === "false") return false

  return process.env.NODE_ENV !== "production"
}
