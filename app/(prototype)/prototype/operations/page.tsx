import { AlertTriangle, ShieldAlert } from "lucide-react"

import { ScreenHeader } from "@/features/prototype/components/screen-header"
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
import {
  moderationStatusLabel,
  moderationStatusTone,
  moderationTargetKindLabel,
  openCount,
  reportReasonLabel,
  reportReasonTone,
  sortModerationQueue,
} from "@/lib/domain/moderation"
import { formatCount, formatDate, formatRelativeTime } from "@/lib/format"
import {
  auditTrail,
  communityProposals,
  interestSuggestions,
  moderationQueue,
  prototypeNow,
  verificationRequests,
} from "@/lib/prototype/fixtures"

/**
 * The Operations Center.
 *
 * Four queues, in the order their neglect hurts: reports, then community
 * proposals, then interest suggestions, then verification. The two middle
 * queues exist because of the locked decisions - approval-gated communities and
 * a curated-but-extensible taxonomy both create review work, and review work
 * without a queue becomes a WhatsApp message to an admin.
 *
 * The audit trail is not optional. Moderation without a record is
 * indistinguishable from abuse of moderation.
 */

const queue = sortModerationQueue(moderationQueue)
const pendingProposals = communityProposals.filter(
  (proposal) => proposal.status === "PENDING",
)
const decidedProposals = communityProposals.filter(
  (proposal) => proposal.status !== "PENDING",
)
const pendingSuggestions = interestSuggestions.filter(
  (suggestion) => suggestion.status === "PENDING",
)

export default function PrototypeOperationsScreen() {
  return (
    <div className="flex flex-col gap-10">
      <ScreenHeader
        phase="Phase 13"
        title="Operations Center"
        description="Reports, community proposals, interest suggestions, and verification - with a record of every decision."
        notes={[
          "Queue ordering is real: severity first, then age, never report volume.",
          "Approve, reject, and merge controls are inert.",
          "Access control is not enforced on this prototype route.",
        ]}
      />

      <Card className="border-warning-border bg-warning-subtle">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldAlert aria-hidden="true" className="size-5 text-warning" />
          <p className="text-body-sm">
            Restricted to university admins and platform admins. In the real app
            this route is unreachable for everyone else, and every action below
            is written to the audit trail with your name on it.
          </p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3">Reports</h2>
            <p className="text-body-sm text-muted-foreground">
              Sorted by severity, then by age. Harassment is never behind spam,
              however many people reported the spam.
            </p>
          </div>
          <Badge variant="warning" data-numeric>
            {openCount(moderationQueue)} open
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          {queue.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 py-4">
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
                    <span data-numeric>{formatCount(item.reportCount)}</span>{" "}
                    reports
                    <span aria-hidden="true"> · </span>
                    {formatRelativeTime(item.reportedAt, prototypeNow)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-body-sm font-medium">{item.targetLabel}</p>
                  <p className="max-w-readable text-body-sm text-muted-foreground">
                    {item.excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="destructive">
                    Remove
                  </Button>
                  <Button type="button" size="sm" variant="outline">
                    Dismiss
                  </Button>
                  {item.assignee ? (
                    <span className="ml-auto flex items-center gap-2 text-caption text-muted-foreground">
                      <Avatar name={item.assignee.name} size="xs" />
                      {item.assignee.name}
                    </span>
                  ) : (
                    <span className="ml-auto text-caption text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Community proposals</h2>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            Students propose, you decide. The duplicate check runs before you
            see it, so the question is usually "approve or merge", not "does this
            already exist".
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {pendingProposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{proposal.interest.label}</Badge>
                  <Badge variant="neutral" data-numeric>
                    {proposal.supporterCount} supporters
                  </Badge>
                  {proposal.similarTo.length > 0 && (
                    <Badge variant="warning">Possible duplicate</Badge>
                  )}
                </div>
                <CardTitle className="text-h4">
                  {proposal.proposedName}
                </CardTitle>
                <CardDescription>{proposal.tagline}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3">
                <p className="max-w-readable text-body-sm text-muted-foreground">
                  {proposal.reason}
                </p>

                {proposal.similarTo.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-lg border border-warning-border bg-warning-subtle p-3">
                    <p className="flex items-center gap-2 text-body-sm font-medium">
                      <AlertTriangle aria-hidden="true" className="size-4" />
                      Looks like an existing community
                    </p>
                    <ul className="flex flex-col gap-1 text-body-sm text-muted-foreground">
                      {proposal.similarTo.map((similar) => (
                        <li key={similar.id}>{similar.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm">
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="outline">
                    Merge into existing
                  </Button>
                  <Button type="button" size="sm" variant="ghost">
                    Decline
                  </Button>
                  <span className="ml-auto flex items-center gap-2 text-caption text-muted-foreground">
                    <Avatar name={proposal.proposedBy.name} size="xs" />
                    {proposal.proposedBy.name}
                    <span aria-hidden="true">·</span>
                    {formatRelativeTime(proposal.proposedAt, prototypeNow)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <details className="rounded-lg border border-border bg-muted/40 px-4 py-3">
          <summary className="cursor-pointer list-none text-body-sm font-medium">
            Recently decided ({decidedProposals.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {decidedProposals.map((proposal) => (
              <li key={proposal.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm font-medium">
                    {proposal.proposedName}
                  </span>
                  <Badge
                    variant={
                      proposal.status === "REJECTED" ? "error" : "success"
                    }
                  >
                    {proposal.status === "MERGED" ? "Merged" : "Declined"}
                  </Badge>
                </div>
                {proposal.reviewerNote && (
                  <p className="max-w-readable text-caption text-muted-foreground">
                    {proposal.reviewerNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3">Interest suggestions</h2>
          <p className="max-w-readable text-body-sm text-muted-foreground">
            Promote when there is real demand, map to an existing interest when
            it is the same thing under another name. Both outcomes keep the
            taxonomy usable.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 py-4">
            {interestSuggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="flex flex-col gap-2">
                {index > 0 && <Separator />}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body-sm font-medium">
                        {suggestion.label}
                      </span>
                      {suggestion.mapsTo && (
                        <Badge variant="neutral">
                          Same as {suggestion.mapsTo.label}
                        </Badge>
                      )}
                      {suggestion.status === "APPROVED" && (
                        <Badge variant="success">Promoted</Badge>
                      )}
                    </div>
                    <span className="text-caption text-muted-foreground">
                      <span data-numeric>{suggestion.demandCount}</span> students
                      asked
                      <span aria-hidden="true"> · </span>
                      first suggested {formatDate(suggestion.suggestedAt)}
                    </span>
                  </div>

                  {suggestion.status === "PENDING" && (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm">
                        Promote
                      </Button>
                      <Button type="button" size="sm" variant="outline">
                        Map to existing
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pendingSuggestions.length === 0 && (
              <p className="text-body-sm text-muted-foreground">
                Nothing waiting.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3">Verification requests</h2>
        <div className="flex flex-col gap-3">
          {verificationRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-sm font-medium">
                    {request.community.name}
                  </span>
                  <Badge variant="warning">Pending</Badge>
                  <span className="text-caption text-muted-foreground">
                    {formatRelativeTime(request.requestedAt, prototypeNow)}
                  </span>
                </div>
                <p className="max-w-readable text-body-sm text-muted-foreground">
                  {request.evidence}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm">
                    Verify
                  </Button>
                  <Button type="button" size="sm" variant="outline">
                    Ask for more
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3">Audit trail</h2>
        <Card>
          <CardContent className="py-4">
            <ol className="flex flex-col gap-4">
              {auditTrail.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3">
                  <Avatar name={entry.actor.name} size="xs" />
                  <div className="flex min-w-0 flex-col">
                    <p className="text-body-sm">
                      <span className="font-medium">{entry.actor.name}</span>{" "}
                      {entry.action.toLowerCase()}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {entry.target}
                      <span aria-hidden="true"> · </span>
                      <time dateTime={entry.at}>
                        {formatRelativeTime(entry.at, prototypeNow)}
                      </time>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
