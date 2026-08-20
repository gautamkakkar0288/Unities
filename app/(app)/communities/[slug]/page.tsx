import { Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"

import { auth } from "@/auth"
import { VerificationBadge } from "@/components/domain/verification-badge"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PostCard } from "@/features/activity/components/post-card"
import { PostComposer } from "@/features/activity/components/post-composer"
import { JoinButton } from "@/features/communities/components/join-button"
import { EventCard } from "@/features/events/components/event-card"
import { SaveButton } from "@/features/saved/components/save-button"
import { PageHeader } from "@/features/shell/components/page-header"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { canComment, canPublish } from "@/lib/domain/activity"
import {
  communityKindLabel,
  communityKindTone,
  communityScopeLabel,
  joinPolicyDescription,
  joinPolicyLabel,
} from "@/lib/domain/community"
import { canModerate, membershipBadgeLabel } from "@/lib/domain/membership"
import { formatCount } from "@/lib/format"
import {
  linkableEvents,
  listCommunityActivity,
} from "@/lib/services/community-activity"
import { commentsForPosts } from "@/lib/services/community-comments"
import { listCommunityLeads } from "@/lib/services/community-members"
import { getCommunityBySlug } from "@/lib/services/communities"
import { listEvents } from "@/lib/services/events"
import { reportedTargetIds } from "@/lib/services/moderation"
import { isSaved } from "@/lib/services/saved"
import { cn } from "@/lib/utils"

/**
 * Memoised for the duration of one request, because `generateMetadata` and the
 * page body both need the community and would otherwise run the same query
 * twice on every single view.
 */
const loadCommunity = cache(async (slug: string, viewerId: string | null) =>
  getCommunityBySlug({ slug, viewerId }),
)

async function viewerId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const community = await loadCommunity(slug, await viewerId())

  if (!community) return { title: "Community not found" }

  return { title: community.name, description: community.tagline }
}

/**
 * A single community.
 *
 * Activity is the main column, because it is the only part of this page that
 * changes week to week - a page whose most prominent content is a static
 * description is a page nobody returns to. About, guidelines, joining and
 * organisers are still here, moved to the aside where reference material
 * belongs.
 *
 * Everything rendered is a column that exists. Reaction and comment counts are
 * aggregates over real rows, which is new on this branch; before the tables
 * existed this page correctly showed no counts rather than invented ones.
 *
 * Eight queries, flat: community, leads, activity, upcoming events, linkable
 * events, comments, the viewer's reported ids, and whether the viewer saved
 * this community. Nothing is per-post and nothing is per-comment - the two
 * reported-id lookups take the whole page's ids at once.
 */
export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const viewer = await viewerId()
  const community = await loadCommunity(slug, viewer)

  // A slug that does not exist and a slug that is archived are the same answer
  // to a student: there is nothing here. The service already excludes archived.
  if (!community) notFound()

  const membershipState = community.viewerMembership
  const mayPublish = canPublish(membershipState)
  const mayComment = canComment(membershipState)

  const [leads, activity, upcoming, composerEvents] = await Promise.all([
    listCommunityLeads({ communityId: community.id }),
    listCommunityActivity({ communityId: community.id, viewerId: viewer }),
    listEvents({ viewerId: viewer, communityId: community.id, limit: 3 }),
    // Only fetched when there is a composer to fill.
    mayPublish
      ? linkableEvents({ communityId: community.id })
      : Promise.resolve([]),
  ])

  const postIds = activity.map((post) => post.id)

  const [comments, reportedPosts, saved] = await Promise.all([
    commentsForPosts({ postIds, viewerId: viewer }),
    viewer
      ? reportedTargetIds({
          reporterId: viewer,
          targetKind: "POST",
          targetIds: postIds,
        })
      : Promise.resolve(new Set<string>()),
    // The saved service owns the logged-out answer, so there is no anonymous
    // branch here and the header cannot disagree with the Saved page.
    isSaved({
      viewerId: viewer,
      targetKind: "COMMUNITY",
      targetId: community.id,
    }),
  ])

  /*
    Which comments this viewer already reported. Depends on the comment ids, so
    it cannot join the batch above - but it is still one query for every comment
    on the page, and it is scoped to this viewer's own reports, so it cannot
    reveal what anybody else reported.
  */
  const commentIds = [...comments.values()].flat().map((comment) => comment.id)

  const reportedComments = viewer
    ? await reportedTargetIds({
        reporterId: viewer,
        targetKind: "COMMENT",
        targetIds: commentIds,
      })
    : new Set<string>()

  const membership = membershipBadgeLabel[membershipState]
  // One clock for the whole page, so two "3 hours ago" labels agree.
  const now = new Date().toISOString()

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Badge variant={communityKindTone[community.kind]}>
          {communityKindLabel[community.kind]}
        </Badge>
        <Badge variant="outline">{community.interest.label}</Badge>
        <VerificationBadge state={community.verification} />
        <Badge variant="neutral">{communityScopeLabel[community.scope]}</Badge>
        {membership && <Badge variant="brand">{membership}</Badge>}
      </div>

      <PageHeader title={community.name} description={community.tagline} />

      <dl className="flex flex-wrap gap-x-6 gap-y-2 pb-4 text-caption text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="contents">
            <Users aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Members</span>
          </dt>
          <dd data-numeric>
            {formatCount(community.memberCount)}{" "}
            {community.memberCount === 1 ? "member" : "members"}
          </dd>
        </div>
        {community.place && (
          <div>
            <dt className="sr-only">Based at</dt>
            <dd>{community.place.name}</dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Joining</dt>
          <dd>{joinPolicyLabel[community.joinPolicy]}</dd>
        </div>
      </dl>

      {/*
        Join and save sit together in the header, where a student decides
        whether this community is for them, rather than being separated across
        the page. Save is the same control used on cards elsewhere, and now
        reflects the row that actually exists.
      */}
      <div className="flex flex-wrap items-center gap-2 pb-8">
        <JoinButton community={community} />
        <SaveButton
          targetKind="COMMUNITY"
          targetId={community.id}
          label={community.name}
          saved={saved}
          variant="outline"
          size="lg"
          showLabel
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
            <h2 id="activity-heading" className="text-h3">
              Activity
            </h2>

            {/*
              The composer is rendered for members only - and the service checks
              membership again, because hiding this is a courtesy, not a control.
            */}
            {mayPublish && (
              <Card>
                <CardHeader>
                  <CardTitle>Post an update</CardTitle>
                </CardHeader>
                <CardContent>
                  <PostComposer
                    communityId={community.id}
                    slug={community.slug}
                    events={composerEvents}
                  />
                </CardContent>
              </Card>
            )}

            {activity.length === 0 ? (
              <EmptyState
                title="No updates yet"
                description={
                  mayPublish
                    ? "Be the first to tell members what is happening."
                    : "When this community posts an update, it will appear here."
                }
                action={
                  mayPublish ? undefined : (
                    <Link
                      href="/explore"
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Explore other communities
                    </Link>
                  )
                }
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {activity.map((post) => (
                  <li key={post.id}>
                    <PostCard
                      post={post}
                      comments={comments.get(post.id) ?? []}
                      linkableEvents={composerEvents}
                      canComment={mayComment}
                      alreadyReported={reportedPosts.has(post.id)}
                      reportedComments={reportedComments}
                      now={now}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="events-heading" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="events-heading" className="text-h3">
                Upcoming events
              </h2>
              <Link
                href="/explore?tab=events"
                className="text-body-sm font-medium underline underline-offset-4"
              >
                All events
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                Nothing scheduled right now.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      now={new Date(now)}
                      href={`/events/${event.slug}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4" aria-label="Community details">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {community.about ? (
                <p className="text-body-sm whitespace-pre-line text-muted-foreground">
                  {community.about}
                </p>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  This community has not written an introduction yet.
                </p>
              )}
              {/*
                The policy is stated above the control rather than left for the
                student to infer from its wording: "Request to join" does not by
                itself explain that a moderator has to approve it.
              */}
              <p className="text-caption text-muted-foreground">
                {joinPolicyDescription[community.joinPolicy]}
              </p>
            </CardContent>
          </Card>

          {/*
            Guidelines keep real estate rather than becoming a modal, following
            the prototype's reasoning: most campus community conflict is a rule
            nobody read, and moderation is easier to defend when the rule was
            visible beforehand. Hidden entirely when there are none, because an
            empty "Guidelines" heading suggests the page is broken.
          */}
          {community.guidelines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-body-sm text-muted-foreground">
                  {community.guidelines.map((guideline) => (
                    <li key={guideline}>{guideline}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/*
            Shown to moderators whatever the join policy is. Pending rows
            outlive a policy change - a community switched from APPROVAL to OPEN
            still has people waiting, and hiding the queue would leave them
            waiting permanently.

            The moderation queue is linked from here too, because it is the only
            place a community moderator would look for it: it is not in the
            primary navigation, which every student sees.
          */}
          {canModerate(membershipState) && (
            <Card>
              <CardHeader>
                <CardTitle>Moderating</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link
                  href={`/communities/${community.slug}/requests`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full",
                  )}
                >
                  Join requests
                </Link>
                <Link
                  href="/admin/moderation"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full",
                  )}
                >
                  Reported content
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Who runs this</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                  {community.kind === "INTEREST"
                    ? "Nobody. Interest communities belong to everyone who joins them."
                    : "No owner or moderator listed yet."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {leads.map((lead) => {
                    const name = lead.name ?? "A Cirqles member"
                    return (
                      <li key={lead.id} className="flex items-center gap-3">
                        <Avatar size="sm" name={name} src={lead.avatarUrl} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body-sm font-medium">
                            {name}
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {lead.state === "OWNER" ? "Owner" : "Moderator"}
                          </span>
                        </div>
                        <Badge
                          variant={roleBadgeVariant[lead.role]}
                          className="ml-auto"
                        >
                          {roleLabels[lead.role]}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
