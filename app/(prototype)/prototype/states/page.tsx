import {
  CalendarX,
  Compass,
  Lock,
  SearchX,
  TriangleAlert,
  WifiOff,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ScreenHeader } from "@/features/prototype/components/screen-header"

export const metadata = { title: "States" }

/**
 * The states nobody designs until production.
 *
 * Loading, empty, error, offline, and forbidden are the majority of what a real
 * user hits on a bad network in a lecture hall basement. Collecting them on one
 * reviewable screen is how they stop being an afterthought - and every one of
 * them offers a way forward, because a dead end is a bug.
 */
function StateBlock({
  title,
  rationale,
  children,
}: {
  title: string
  rationale: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>{title}</CardTitle>
        <p className="text-caption text-muted-foreground">{rationale}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function PrototypeStatesPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Every phase"
        title="States"
        description="Loading, empty, error, offline, and permission states for the whole product, in one place so they can be reviewed as a set."
        notes={[
          "These are static examples, not live states",
          "Each real screen imports the same primitives so the wording stays consistent",
          "Toasts and inline form errors arrive with the first mutations",
        ]}
      />

      <div className="flex flex-col gap-6">
        <StateBlock
          title="Loading a feed"
          rationale="Skeletons match the shape of the content, so the layout does not jump when data lands."
        >
          <div className="flex flex-col gap-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex w-full flex-col gap-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
            <p className="sr-only" role="status">
              Loading posts
            </p>
          </div>
        </StateBlock>

        <StateBlock
          title="Working"
          rationale="A spinner is for an action the user just took, never for a first page load. It always carries a label for screen readers."
        >
          <div className="flex items-center gap-3">
            <Spinner label="Registering you for the bootcamp" />
            <p className="text-body-sm text-muted-foreground">
              Registering you for the bootcamp
            </p>
          </div>
        </StateBlock>

        <StateBlock
          title="Empty: no communities yet"
          rationale="The first-run empty state is the most important screen in the product. It cannot simply say 'nothing here'."
        >
          <EmptyState
            icon={Compass}
            title="You have not joined anything yet"
            description="Pick two or three interests and we will show you the communities and events worth your first hour."
            action={
              <Button render={<Link href="/prototype/explore" />}>
                Explore communities
              </Button>
            }
            secondaryAction={
              <Button variant="outline" render={<Link href="/prototype/onboarding" />}>
                Choose interests
              </Button>
            }
          />
        </StateBlock>

        <StateBlock
          title="Empty: no events this week"
          rationale="A quiet week is not an error. It points at the next useful action instead of apologising."
        >
          <EmptyState
            icon={CalendarX}
            title="Nothing scheduled this week"
            description="Campus is quiet during exams. Follow a community and you will hear first when something is announced."
            action={
              <Button variant="outline" render={<Link href="/prototype/communities" />}>
                Browse communities
              </Button>
            }
          />
        </StateBlock>

        <StateBlock
          title="Empty: no search results"
          rationale="Echoes the query back so the user can see a typo, and suggests a broader route."
        >
          <EmptyState
            icon={SearchX}
            title="No results for “robtics”"
            description="Check the spelling, or browse by interest instead."
            action={
              <Button variant="outline" render={<Link href="/prototype/explore" />}>
                Browse by interest
              </Button>
            }
          />
        </StateBlock>

        <StateBlock
          title="Error: something failed"
          rationale="Names what failed, keeps the user's work, and offers a retry. No error codes without an explanation."
        >
          <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive-border bg-destructive-subtle/40 px-4 py-4">
            <div className="flex items-start gap-3">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-destructive"
              />
              <div className="flex flex-col gap-1">
                <p className="text-body-sm font-medium">
                  We could not load your feed
                </p>
                <p className="text-caption text-muted-foreground">
                  Your draft is saved. This is usually a temporary connection
                  problem, not something you did.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm">
                Try again
              </Button>
              <Button type="button" variant="outline" size="sm">
                Report a problem
              </Button>
            </div>
          </div>
        </StateBlock>

        <StateBlock
          title="Offline"
          rationale="Campus wifi drops in lecture halls and basements. Cached content stays readable and writes are queued rather than lost."
        >
          <EmptyState
            icon={WifiOff}
            title="You are offline"
            description="Showing what was last loaded. Anything you write is kept and sent when you reconnect."
            action={
              <Button type="button" variant="outline">
                Retry now
              </Button>
            }
          />
        </StateBlock>

        <StateBlock
          title="Not allowed"
          rationale="Explains the rule rather than the status code, and shows the way to gain access where one exists."
        >
          <EmptyState
            icon={Lock}
            title="Moderators only"
            description="The Operations Center is limited to community moderators and university admins. If you run a society, ask a moderator to add you."
            action={
              <Button variant="outline" render={<Link href="/prototype/home" />}>
                Back to home
              </Button>
            }
          />
        </StateBlock>
      </div>
    </div>
  )
}
