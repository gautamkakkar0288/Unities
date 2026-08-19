import { ArrowUpRight, CalendarClock } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  deadlineState,
  deadlineStateTone,
  opportunityKindLabel,
  opportunityKindTone,
} from "@/lib/domain/opportunity"
import { formatDate } from "@/lib/format"
import type { OpportunitySummary } from "@/lib/services/opportunities"

/**
 * An opportunity in a list.
 *
 * The title is an external link with `rel="noreferrer"` and a visible arrow,
 * because leaving the product is the whole point of this card and a link that
 * silently opens somewhere else is a small betrayal. When there is no url - a
 * campus listing with nothing to apply to yet - the title is plain text rather
 * than a dead anchor.
 *
 * The deadline is the fact that decides whether a student acts, so it is shown
 * as a badge rather than buried in the description.
 */
export function OpportunityCard({
  opportunity,
  now,
  action,
}: {
  opportunity: OpportunitySummary
  now: string
  action?: ReactNode
}) {
  const deadline = deadlineState(opportunity.deadline, now)

  const deadlineLabel =
    deadline === "ROLLING"
      ? "Rolling deadline"
      : deadline === "CLOSED"
        ? `Closed ${formatDate(opportunity.deadline as string)}`
        : `Closes ${formatDate(opportunity.deadline as string)}`

  return (
    <Card interactive className="h-full gap-4">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={opportunityKindTone[opportunity.kind]}>
            {opportunityKindLabel[opportunity.kind]}
          </Badge>
          <Badge variant="outline">{opportunity.interest.label}</Badge>
          <Badge variant={deadlineStateTone[deadline]}>
            <CalendarClock aria-hidden="true" />
            {deadlineLabel}
          </Badge>
        </div>

        <CardTitle className="text-h4">
          {opportunity.url ? (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-1 rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {opportunity.title}
              <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            opportunity.title
          )}
        </CardTitle>

        {opportunity.description && (
          <CardDescription>{opportunity.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="mt-auto">
        <p className="text-caption text-muted-foreground">
          {opportunity.community
            ? `Posted by ${opportunity.community.name}`
            : "Open to all Chitkara students"}
        </p>
      </CardContent>

      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  )
}
