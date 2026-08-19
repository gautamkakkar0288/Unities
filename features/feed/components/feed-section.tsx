import type { ReactNode } from "react"

/**
 * A titled band of the feed.
 *
 * Home is a stack of sections that all need the same heading treatment and the
 * same optional "see all" affordance. Doing that inline would mean seven
 * slightly different headings by the third review - and the heading level is the
 * page's document outline, so drift there is an accessibility bug rather than a
 * cosmetic one.
 *
 * The title is an `h2` because the page title in `PageHeader` is the `h1`.
 */
export function FeedSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  /** Usually a link to the full list. */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-h4">{title}</h2>
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
