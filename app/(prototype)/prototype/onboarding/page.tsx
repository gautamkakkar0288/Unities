import { Building2, Check, ShieldCheck } from "lucide-react"
import Link from "next/link"

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
import { formatCount } from "@/lib/format"
import {
  campusOverview,
  interests,
  viewer,
  viewerInterestSlugs,
} from "@/lib/prototype/fixtures"

/**
 * The one step between signing up and a populated product.
 *
 * Two things are decided here. First, the student is already inside their
 * campus - Chitkara is seeded, so nobody arrives at an empty screen and has to
 * create their own university. Second, interests come from a curated list,
 * because a free-text field on day one produces "Coding", "coding", "DSA", and
 * "Leetcode" as four separate categories and permanently splits discovery.
 *
 * The step is skippable. A student who skips still lands on a full campus.
 */

const minimumInterests = 3

export default function PrototypeOnboardingScreen() {
  const selectedCount = viewerInterestSlugs.length

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <ScreenHeader
        phase="Phase 6"
        title={`Welcome, ${viewer.name.split(" ")[0]}`}
        description="Two things and you are in. Neither of them is creating anything."
        notes={[
          "Interest selection is fixed to the fixture set; chips do not toggle.",
          "Suggesting an interest does not submit.",
          "Continue and Skip do not navigate.",
        ]}
      />

      <Card className="border-success-border bg-success-subtle">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <ShieldCheck aria-hidden="true" className="size-5 text-success" />
          <div className="flex min-w-0 flex-col">
            <p className="text-body-sm font-medium">
              University email verified
            </p>
            <p className="text-caption text-muted-foreground">
              gautam.kakkar@chitkara.edu.in - this is what keeps the platform
              students-only.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Already set up</Badge>
          </div>
          <CardTitle>You are in at {campusOverview.university.name}</CardTitle>
          <CardDescription>
            Your campus community already exists, with everyone and everything
            already in it. You do not have to build it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-border p-4">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <Building2 className="size-5" />
            </span>
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              {[
                {
                  label: "Students",
                  value: formatCount(campusOverview.studentCount),
                },
                {
                  label: "Upcoming events",
                  value: formatCount(campusOverview.upcomingEventCount),
                },
                {
                  label: "Active clubs",
                  value: formatCount(campusOverview.clubCount),
                },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="text-caption text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="text-h4" data-numeric>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What are you into?</CardTitle>
          <CardDescription>
            Pick at least {minimumInterests}. This decides what "Recommended for
            you" means, and you can change it whenever.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ul className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const selected = viewerInterestSlugs.includes(interest.slug)

              return (
                <li key={interest.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-body-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:border-primary-border aria-pressed:bg-primary-subtle aria-pressed:text-primary"
                  >
                    {selected && (
                      <Check aria-hidden="true" className="size-3.5" />
                    )}
                    {interest.label}
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="text-caption text-muted-foreground" data-numeric>
            {selectedCount} of {minimumInterests} selected
          </p>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
            <p className="text-body-sm font-medium">Not on the list?</p>
            <p className="text-body-sm text-muted-foreground">
              Tell us and it goes to review. Enough requests and it becomes an
              official interest for everyone.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                aria-label="Suggest an interest"
                placeholder="Padel, Cricket, Anime..."
                className="h-9 min-w-40 flex-1 rounded-lg border border-input bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
              <Button type="button" size="sm" variant="outline">
                Suggest
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" render={<Link href="/prototype/home" />}>
          Continue
        </Button>
        <Button variant="ghost" size="lg" render={<Link href="/prototype/home" />}>
          Skip for now
        </Button>
      </div>
    </div>
  )
}
