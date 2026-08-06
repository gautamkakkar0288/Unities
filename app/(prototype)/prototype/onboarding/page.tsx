import { Check, MailCheck } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CommunityCard } from "@/features/communities/components/community-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { communities, interests } from "@/lib/prototype/fixtures"
import { cn } from "@/lib/utils"

export const metadata = { title: "Onboarding" }

const selectedInterests = ["technology", "robotics", "careers"]

const steps = [
  { label: "Verify your university email", done: true },
  { label: "Pick your interests", done: false },
  { label: "Join your first communities", done: false },
]

/**
 * First run.
 *
 * Three steps, and only the first is mandatory. Onboarding that demands a
 * complete profile before showing anything is where signups go to die; interests
 * are collected because they immediately improve Explore, and the student can
 * see that payoff on the next screen.
 *
 * Verification comes first because everything downstream - trust badges,
 * university-scoped visibility, messaging permissions - depends on knowing this
 * is a real Chitkara student.
 */
export default function PrototypeOnboardingPage() {
  const suggested = communities
    .filter((community) => selectedInterests.includes(community.interest.slug))
    .slice(0, 3)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 6"
        title="Onboarding"
        description="What a student sees right after signing up: verify, choose interests, join something. Skippable after step one."
        notes={[
          "Interest chips are semantic but do not toggle - no client state yet",
          "Email verification is wired in Phase 2 but has no UI yet",
          "Progress is not persisted; the real flow resumes where you left off",
        ]}
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {steps.map((step, index) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium",
                  step.done
                    ? "bg-success text-success-foreground"
                    : "border border-border text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-body-sm",
                  step.done ? "text-muted-foreground" : "font-medium",
                )}
              >
                {step.label}
                {step.done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          ))}
        </ol>

        <Card className="border-success-border bg-success-subtle/40">
          <CardContent className="flex items-start gap-3">
            <MailCheck
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success-foreground"
            />
            <div className="flex flex-col gap-1">
              <p className="text-body-sm font-medium">
                gautam@chitkara.edu.in verified
              </p>
              <p className="text-caption text-muted-foreground">
                Only verified students can post, register, and message. This is
                what keeps campus content actually from campus.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What are you interested in?</CardTitle>
            <CardDescription>
              Choose at least two. This shapes your feed and Explore from your
              first minute - you can change it any time in settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-wrap gap-2">
              {interests.map((interest) => {
                const selected = selectedInterests.includes(interest.slug)
                return (
                  <li key={interest.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm transition-colors duration-150 ease-standard focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        selected
                          ? "border-primary-border bg-primary-subtle font-medium text-primary"
                          : "border-border hover:bg-muted",
                      )}
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
            <p className="text-caption text-muted-foreground">
              <span data-numeric>{selectedInterests.length}</span> of 8 selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start with these</CardTitle>
            <CardDescription>
              Based on what you picked. Joining now means your feed is not empty
              when you land on Home.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="grid gap-4 sm:grid-cols-2">
              {suggested.map((community) => (
                <li key={community.id} className="flex">
                  <CommunityCard
                    community={community}
                    href="/prototype/community"
                  />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/prototype/home" />}>
                Finish and go to Home
              </Button>
              <Button
                variant="ghost"
                size="lg"
                render={<Link href="/prototype/home" />}
              >
                Skip for now
              </Button>
              <Badge variant="outline">Skippable on purpose</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
