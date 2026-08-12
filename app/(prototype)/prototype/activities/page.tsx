import { Plus } from "lucide-react"

import { ActivityCard } from "@/features/activities/components/activity-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { activityKindLabel, liveActivities } from "@/lib/domain/activity"
import { bucketFor, bucketLabel } from "@/lib/domain/time-buckets"
import type { ActivityKind } from "@/lib/domain/types"
import { activities, expiredActivity, prototypeNow } from "@/lib/prototype/fixtures"

/**
 * "Find people" - the lightest thing anyone can post.
 *
 * The composer is three fields and a number, sitting at the top rather than
 * behind a button, because the entire value of this surface is that posting
 * takes less effort than opening WhatsApp. Anything heavier and students go
 * back to the group chat.
 */

const kinds: ActivityKind[] = ["SPORT", "STUDY", "TEAM", "TRAVEL", "CASUAL"]

const live = liveActivities(activities, prototypeNow)

const grouped = ["TODAY", "TOMORROW", "THIS_WEEKEND", "THIS_WEEK", "LATER"]
  .map((bucket) => ({
    bucket,
    items: live.filter(
      (activity) =>
        bucketFor(
          { startsAt: activity.happensAt, endsAt: activity.happensAt },
          prototypeNow,
        ) === bucket,
    ),
  }))
  .filter((group) => group.items.length > 0)

export default function PrototypeActivitiesScreen() {
  return (
    <div className="flex flex-col gap-8">
      <ScreenHeader
        phase="New - not yet in the phase plan"
        title="Find people"
        description="Someone needs a doubles partner, a hackathon teammate, or two more for a study group. These expire on their own."
        notes={[
          "Activities are a new concept introduced by the locked Phase 6 decisions - they are not in the original 16-phase plan and need a phase of their own.",
          "The composer does not submit. Joining does nothing.",
          "An expired activity is in the fixtures and is correctly hidden from the list below.",
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>What are you up for?</CardTitle>
          <CardDescription>
            Three fields. No description, no cover image, no approval - this is
            meant to be faster than typing it into a group chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {kinds.map((kind, index) => (
              <Badge key={kind} variant={index === 0 ? "brand" : "outline"}>
                {activityKindLabel[kind]}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="activity-title"
              className="text-label text-muted-foreground"
            >
              In your own words
            </label>
            <input
              id="activity-title"
              type="text"
              defaultValue="Badminton doubles at 6"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="activity-when"
                className="text-label text-muted-foreground"
              >
                When
              </label>
              <input
                id="activity-when"
                type="text"
                defaultValue="Today, 6:00 pm"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="activity-where"
                className="text-label text-muted-foreground"
              >
                Where
              </label>
              <input
                id="activity-where"
                type="text"
                defaultValue="Sports Complex, Court 3"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="activity-spots"
                className="text-label text-muted-foreground"
              >
                People needed
              </label>
              <input
                id="activity-spots"
                type="number"
                defaultValue={2}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                data-numeric
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">
              <Plus aria-hidden="true" />
              Post it
            </Button>
            <p className="text-caption text-muted-foreground">
              Disappears automatically 30 minutes before it starts.
            </p>
          </div>
        </CardContent>
      </Card>

      {grouped.map((group) => (
        <section key={group.bucket} className="flex flex-col gap-3">
          <h2 className="text-h4">
            {bucketLabel[group.bucket as keyof typeof bucketLabel]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                now={prototypeNow}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-h4">What expiry looks like</h2>
        <p className="max-w-readable text-body-sm text-muted-foreground">
          This one is in the fixtures and is filtered out of every live surface.
          Shown here only so the expired state is reviewable - a stale request
          for a doubles partner is worse than no request at all.
        </p>
        <div className="max-w-md">
          <ActivityCard activity={expiredActivity} now={prototypeNow} />
        </div>
      </section>
    </div>
  )
}
