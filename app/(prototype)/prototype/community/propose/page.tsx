import { AlertTriangle, ArrowRight, Check } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import {
  communityKindDescription,
  communityKindLabel,
  findSimilarCommunities,
  joinPolicyDescription,
  joinPolicyLabel,
} from "@/lib/domain/community"
import type { CommunityKind, JoinPolicy } from "@/lib/domain/types"
import { formatCount } from "@/lib/format"
import { communities, interests } from "@/lib/prototype/fixtures"

/**
 * Propose a community.
 *
 * The important part of this screen is the duplicate warning, and it appears
 * while the student is still typing rather than after a reviewer rejects them
 * three days later. Most duplicate communities are not bad intent - they are a
 * failed search. Showing the existing community with a Join button converts a
 * would-be duplicate into a member, which is the outcome everybody wanted.
 *
 * The typed name here is fixed so the warning is always visible for review.
 */

const typedName = "Chitkara Football Lovers"
const matches = findSimilarCommunities(typedName, communities)

const kinds: CommunityKind[] = ["OFFICIAL", "INTEREST", "STUDENT"]
const policies: JoinPolicy[] = ["OPEN", "APPROVAL", "INVITE"]

const steps = [
  {
    title: "You propose it",
    detail: "Name, what it is for, and which interest it belongs to.",
  },
  {
    title: "We check for duplicates",
    detail: "Automatically, on the name, before a human ever sees it.",
  },
  {
    title: "A reviewer decides",
    detail:
      "Approve, or fold it into an existing community and make you a moderator there.",
  },
  {
    title: "It goes live",
    detail: "You are the owner, and you choose who can join.",
  },
]

export default function PrototypeProposeCommunityScreen() {
  return (
    <div className="flex flex-col gap-8">
      <ScreenHeader
        phase="Phase 6"
        title="Propose a community"
        description="Students propose, a reviewer approves. It is one extra day, and it is why there is one football community instead of four."
        notes={[
          "The duplicate check is real: findSimilarCommunities() runs against the fixture communities.",
          "The form does not submit and the name field is fixed so the warning stays visible.",
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>What do you want to create?</CardTitle>
              <CardDescription>
                Give it the name students would search for, not the longest
                version of it.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="proposal-name"
                  className="text-label text-muted-foreground"
                >
                  Community name
                </label>
                <input
                  id="proposal-name"
                  type="text"
                  defaultValue={typedName}
                  aria-describedby="duplicate-warning"
                  className="h-10 w-full rounded-lg border border-warning-border bg-background px-3 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              </div>

              {matches.length > 0 && (
                <div
                  id="duplicate-warning"
                  className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4"
                >
                  <p className="flex items-center gap-2 text-body-sm font-medium text-warning-foreground">
                    <AlertTriangle aria-hidden="true" className="size-4" />
                    This already exists
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    We found a community that looks like the same thing. Joining
                    it puts you with the people already there, instead of
                    splitting them across two.
                  </p>

                  {matches.map(({ community, similarity }) => (
                    <div
                      key={community.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-body-sm font-medium">
                            {community.name}
                          </span>
                          <Badge variant="neutral" data-numeric>
                            {Math.round(similarity * 100)}% match
                          </Badge>
                        </div>
                        <span className="text-caption text-muted-foreground">
                          <span data-numeric>
                            {formatCount(community.memberCount)}
                          </span>{" "}
                          members already here
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        aria-label={`Join ${community.name} instead of proposing a new community`}
                      >
                        Join instead
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="proposal-reason"
                  className="text-label text-muted-foreground"
                >
                  Why does campus need it?
                </label>
                <textarea
                  id="proposal-reason"
                  rows={3}
                  defaultValue="There is no football group for our year. We play every evening near the hostel ground and organise over WhatsApp."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
                <p className="text-caption text-muted-foreground">
                  A reviewer reads this. "Because it would be cool" gets
                  declined; "twenty of us already do this" does not.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-label text-muted-foreground">
                  Interest
                </span>
                <div className="flex flex-wrap gap-2">
                  {interests.slice(0, 9).map((interest) => (
                    <Badge
                      key={interest.id}
                      variant={interest.slug === "sports" ? "brand" : "outline"}
                    >
                      {interest.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <span className="text-label text-muted-foreground">
                  Who can join, once it is live?
                </span>
                {policies.map((policy) => (
                  <label
                    key={policy}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <input
                      type="radio"
                      name="join-policy"
                      defaultChecked={policy === "OPEN"}
                      className="mt-1 size-4"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm font-medium">
                        {joinPolicyLabel[policy]}
                        {policy === "OPEN" && (
                          <span className="ml-2 text-caption font-normal text-muted-foreground">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {joinPolicyDescription[policy]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button">Send for review</Button>
                <p className="text-caption text-muted-foreground">
                  Reviewed within two working days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">What happens next</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-medium"
                      data-numeric
                    >
                      {index + 1}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm font-medium">
                        {step.title}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Three kinds of community</CardTitle>
              <CardDescription>
                Only one of them is something you create.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {kinds.map((kind) => (
                <div key={kind} className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-body-sm font-medium">
                    {kind === "STUDENT" && (
                      <Check aria-hidden="true" className="size-3.5 text-success" />
                    )}
                    {communityKindLabel[kind]}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {communityKindDescription[kind]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/prototype/communities" />}
          >
            Back to the directory
            <ArrowRight aria-hidden="true" />
          </Button>
        </aside>
      </div>
    </div>
  )
}
