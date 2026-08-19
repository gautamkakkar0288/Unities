import { cn } from "@/lib/utils"

/**
 * The unread count, as worn by a navigation item.
 *
 * Renders nothing at zero. A badge showing 0 is a permanent fixture that means
 * "nothing", and once it is always there people stop seeing it when it matters.
 *
 * Capped at 9+. The exact number stops being actionable well before that, and an
 * uncapped count grows wider than the icon it is pinned to.
 *
 * The digits are hidden from assistive technology and the same information is
 * given as words, because "Notifications 3" read aloud is ambiguous - three what.
 */
export function UnreadBadge({
  count,
  className,
  floating = false,
}: {
  count: number
  className?: string
  /** Pin it to the corner of an icon rather than sitting inline. */
  floating?: boolean
}) {
  if (count <= 0) return null

  return (
    <>
      <span
        aria-hidden="true"
        data-numeric
        className={cn(
          "flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-medium text-primary-foreground",
          floating && "absolute top-1 right-1 min-w-4 px-1 text-[0.625rem]",
          className,
        )}
      >
        {count > 9 ? "9+" : count}
      </span>
      <span className="sr-only">
        {count === 1 ? "1 unread notification" : `${count} unread notifications`}
      </span>
    </>
  )
}
