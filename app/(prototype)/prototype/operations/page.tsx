import { ShieldCheck } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  isActionable,
  moderationStatusLabel,
  moderationStatusTone,
  moderationTargetKindLabel,
  openCount,
  reportReasonLabel,
  reportReasonTone,
  sortModerationQueue,
} from "@/lib/domain/moderation"
import {
  auditTrail,
  moderationQueue,
  prototypeNow,
  verificationRequests,
} from "@/lib/prototype/fixtures"
import { formatRelativeTime } from "@/lib/format"

export const metadata = { title: "Operations Center" }

/**
 * The Operations Center.
 *
 * Three panels, in the order the work actually arrives: reports that need a
 * decision, communities asking to be verified, and a permanent record of what
 * staff did. The audit trail is not an afterthought - moderation without a log
 * is indistinguishable from abuse of moderation, and a student who is silenced
 * deserves a traceable reason.
 */
export default function PrototypeOperationsPage() {
  const queue = sortModerationQueue(moderationQueue)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 13"
        title="Operations Center"
        description="For moderators and university admins: the report queue, verification requests, and the audit trail behind every decision."
        notes={[
          "No actions execute - approve and remove are static",
          "The real screen is role-gated to moderators and admins",
          "Bulk actions, assignment, and SLA timers come with Phase 13",
        ]}
      />

      <div className="flex flex-col gap-8">
        <Card className="border-warning-border bg-warning-subtle/40">
          <CardContent className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning-foreground"
            />
            <div className="flex flex-col gap-1">
              <p className="text-body-sm font-medium">
                Restricted to moderators and university admins
              </p>
              <p className="text-caption text-muted-foreground">
                Everything on this screen is logged against your account,
                including views of reported content.
              </p>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="queue-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="queue-heading" className="text-h3">
              Report queue
            </h2>
            <Badge variant="error">
              <span data-numeric>{openCount(moderationQueue)}</span> need a
              decision
            </Badge>
          </div>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            Ordered by severity before volume. Ten reports about a course advert
            matter less than one report of harassment.
          </p>

          <ul className="flex flex-col gap-3">
            {queue.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={reportReasonTone[item.reason]}>
                        {reportReasonLabel[item.reason]}
                      </Badge>
                      <Badge variant={moderationStatusTone[item.status]}>
                        {moderationStatusLabel[item.status]}
                      </Badge>
                      <Badge variant="outline">
                        {moderationTargetKindLabel[item.targetKind]}
                      </Badge>
                      <span className="text-caption text-muted-foreground">
                        <span data-numeric>{item.reportCount}</span> reports -{" "}
                        {formatRelativeTime(item.reportedAt, prototypeNow)}
                      </span>
                    </div>
                    <CardTitle className="text-body-sm">
                      {item.targetLabel}
                    </CardTitle>
                    <CardDescription>{item.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-3">
                    {isActionable(item.status) ? (
                      <>
                        <Button type="button" variant="destructive" size="sm">
                          Remove content
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          Dismiss report
                        </Button>
                        <Button type="button" variant="ghost" size="sm">
                          View in context
                        </Button>
                      </>
                    ) : (
                      <p className="text-caption text-muted-foreground">
                        Closed. Visible here for the record.
                      </p>
                    )}
                    {item.assignee && (
                      <span className="ml-auto flex items-center gap-2 text-caption text-muted-foreground">
                        <Avatar
                          size="xs"
                          name={item.assignee.name}
                          src={item.assignee.avatarUrl}
                        />
                        {item.assignee.name}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="verification-heading" className="flex flex-col gap-4">
          <h2 id="verification-heading" className="text-h3">
            Verification requests
          </h2>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            The verified badge is the platform's trust signal. Granting it
            loosely is the fastest way to make it worthless.
          </p>
          <ul className="flex flex-col gap-3">
            {verificationRequests.map((request) => (
              <li key={request.id}>
                <Card>
                  <CardHeader className="gap-2">
                    <CardTitle className="text-body-sm">
                      {request.community.name}
                    </CardTitle>
                    <CardDescription>{request.evidence}</CardDescription>
                    <p className="text-caption text-muted-foreground">
                      Requested by {request.requestedBy.name} -{" "}
                      {formatRelativeTime(request.requestedAt, prototypeNow)}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button type="button" size="sm">
                      Approve
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      Ask for more evidence
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      Reject
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section aria-labelledby="audit-heading" className="flex flex-col gap-4">
          <h2 id="audit-heading" className="text-h3">
            Audit trail
          </h2>
          <Card>
            <CardContent>
              <ul className="flex flex-col divide-y divide-border">
                {auditTrail.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar
                      size="xs"
                      name={entry.actor.name}
                      src={entry.actor.avatarUrl}
                    />
                    <span className="text-body-sm font-medium">
                      {entry.actor.name}
                    </span>
                    <span className="text-body-sm text-muted-foreground">
                      {entry.action}
                    </span>
                    <span className="text-body-sm">{entry.target}</span>
                    <time
                      dateTime={entry.at}
                      className="ml-auto text-caption text-muted-foreground"
                    >
                      {formatRelativeTime(entry.at, prototypeNow)}
                    </time>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
