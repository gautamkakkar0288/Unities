import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ReportDecisionButtons } from "@/features/moderation/components/report-decision-buttons"
import { PageHeader } from "@/features/shell/components/page-header"
import { listModerationQueue } from "@/lib/services/moderation"
import type { ReportReasonValue } from "@/lib/db/schema"

export const metadata: Metadata = { title: "Moderation queue" }

/** Rendered on the server, so a reload never disagrees with the first paint. */
const formatWhen = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

/**
 * Human wording for the report reasons. The vocabulary itself is the database
 * enum - this only decides how each value reads on screen.
 */
const reasonLabels: Record<ReportReasonValue, string> = {
  SPAM: "Spam or advertising",
  HARASSMENT: "Harassment or abuse",
  MISINFORMATION: "Misleading information",
  OFF_TOPIC: "Not relevant to this community",
  OTHER: "Something else",
}

/** Harassment should not look like a duplicate-posting complaint. */
const reasonTone: Record<ReportReasonValue, "error" | "warning" | "neutral"> = {
  HARASSMENT: "error",
  MISINFORMATION: "warning",
  SPAM: "warning",
  OFF_TOPIC: "neutral",
  OTHER: "neutral",
}

/**
 * The moderation queue.
 *
 * Same shape as the verification queue next door, for the same reason: there is
 * no role check in this page. `listModerationQueue` refuses anyone who
 * moderates nothing, and rendering that refusal is what keeps the page and the
 * service from disagreeing about who is a moderator. A student who types the
 * URL gets the service's "You do not moderate any communities" rather than a
 * queue, and an anonymous visitor is redirected to sign in.
 *
 * Deliberately not a dashboard. Open reports, oldest first, with the content
 * attached and three decisions. Counts, charts and per-moderator statistics are
 * for a phase where someone is actually operating this at volume.
 */
export default async function ModerationQueuePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const queue = await listModerationQueue({
    moderatorId: session.user.id,
    status: "OPEN",
    limit: 60,
  })

  return (
    <>
      <PageHeader
        title="Moderation queue"
        description="Reported posts and comments from the communities you moderate, oldest first."
      />

      {!queue.ok ? (
        <Alert variant="error">{queue.message}</Alert>
      ) : queue.data.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          Nothing is waiting. Reports appear here when someone reports a post or
          a comment in a community you moderate.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {queue.data.map((report) => (
            <li key={report.id} className="flex flex-col gap-3 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={reasonTone[report.reason]}>
                  {reasonLabels[report.reason]}
                </Badge>
                <Badge variant="outline">
                  {report.targetKind === "COMMENT" ? "Comment" : "Post"}
                </Badge>
                {report.reportCount > 1 && (
                  <Badge variant="neutral">
                    Reported by {report.reportCount} people
                  </Badge>
                )}
                {report.target?.removed && (
                  <Badge variant="neutral">Already removed</Badge>
                )}
              </div>

              <p className="text-body-sm text-muted-foreground">
                Reported by {report.reporterName ?? "a removed account"} on{" "}
                {formatWhen(report.createdAt)}
              </p>

              {report.detail && (
                <p className="max-w-readable text-body-sm whitespace-pre-line">
                  &ldquo;{report.detail}&rdquo;
                </p>
              )}

              {report.target ? (
                <div className="flex flex-col gap-1 border-l-2 border-border pl-3">
                  {report.targetKind === "POST" && (
                    <p className="text-body font-medium wrap-anywhere">
                      {report.target.title}
                    </p>
                  )}
                  <p className="max-w-readable text-body-sm text-muted-foreground wrap-anywhere">
                    {report.target.excerpt}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    by {report.target.authorName ?? "a removed account"}
                    {report.target.communitySlug && (
                      <>
                        {" in "}
                        <Link
                          href={`/communities/${report.target.communitySlug}`}
                          className="underline underline-offset-2"
                        >
                          {report.target.communitySlug}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  The reported content no longer exists.
                </p>
              )}

              <ReportDecisionButtons
                reportId={report.id}
                targetKind={report.targetKind}
                communitySlug={report.target?.communitySlug ?? null}
                alreadyRemoved={report.target?.removed ?? false}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
