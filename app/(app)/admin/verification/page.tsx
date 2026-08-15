import type { Metadata } from "next"
import Link from "next/link"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RoleControl } from "@/features/admin/components/role-control"
import { VerificationDecisionButtons } from "@/features/admin/components/verification-decision-buttons"
import { PageHeader } from "@/features/shell/components/page-header"
import { redirect } from "next/navigation"

import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import {
  listAuditEntries,
  listVerificationRequests,
} from "@/lib/services/organizer-verification"

export const metadata: Metadata = { title: "Verification queue" }

/** Dates are rendered on the server, so the two never disagree on a reload. */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

/**
 * The administrator's verification queue (Phase 2.5).
 *
 * Deliberately small. "Basic admin controls" means the pending queue, a
 * decision, and a record of what was decided - not an operations centre, which
 * is Phase 5 and only worth building once there is something to operate.
 *
 * There is no role check on this page. `listVerificationRequests` refuses a
 * non-administrator and the refusal is rendered as an error, so the page and
 * the service cannot end up with different ideas of who is an admin. The route
 * is not public, so an anonymous visitor is redirected to sign in by the layout
 * before any of this runs.
 */
export default async function VerificationQueuePage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const [pending, trail] = await Promise.all([
    listVerificationRequests({
      reviewerId: session.user.id,
      status: "PENDING",
    }),
    listAuditEntries({ viewerId: session.user.id, limit: 20 }),
  ])

  return (
    <>
      <PageHeader
        title="Verification queue"
        description="Clubs waiting to be confirmed as real, oldest first."
      />

      <div className="flex flex-col gap-10">
        <section aria-labelledby="pending-requests">
          <h2 id="pending-requests" className="pb-3 text-h4">
            Waiting for a decision
          </h2>

          {!pending.ok ? (
            <Alert variant="error">{pending.message}</Alert>
          ) : pending.data.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Nothing is waiting. Requests appear here as clubs ask to be
              verified.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {pending.data.map((request) => {
                const requester = request.requestedBy
                const name = requester?.name ?? "A former member"

                return (
                  <li key={request.id} className="flex flex-col gap-3 py-5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Link
                        href={`/communities/${request.community.slug}`}
                        className="text-body font-medium underline underline-offset-2"
                      >
                        {request.community.name}
                      </Link>
                      <span className="text-body-sm text-muted-foreground">
                        asked on {formatDate(request.requestedAt)}
                      </span>
                    </div>

                    <p className="max-w-readable text-body-sm whitespace-pre-line">
                      {request.evidence}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body-sm text-muted-foreground">
                        Asked by {name}
                      </span>
                      {requester && (
                        <Badge variant={roleBadgeVariant[requester.role]}>
                          {roleLabels[requester.role]}
                        </Badge>
                      )}
                    </div>

                    {requester && (
                      <RoleControl
                        userId={requester.id}
                        personName={name}
                        currentRole={requester.role}
                      />
                    )}

                    <VerificationDecisionButtons
                      requestId={request.id}
                      communityName={request.community.name}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="audit-trail">
          <h2 id="audit-trail" className="pb-1 text-h4">
            Recent activity
          </h2>
          <p className="pb-3 text-body-sm text-muted-foreground">
            Every decision is recorded, including who made it.
          </p>

          {!trail.ok ? (
            <Alert variant="error">{trail.message}</Alert>
          ) : trail.data.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Nothing has happened yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {trail.data.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-2 py-3"
                >
                  <span className="text-body-sm">{entry.summary}</span>
                  <span className="text-body-sm text-muted-foreground">
                    by {entry.actor?.name ?? "a removed account"} on{" "}
                    {formatDate(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
