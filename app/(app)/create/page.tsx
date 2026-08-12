import { CalendarDays, Sparkles, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/features/shell/components/page-header"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Create" }

type CreateOption = {
  title: string
  description: string
  icon: LucideIcon
  /** Where this path goes once it exists. `null` while it is still unbuilt. */
  href: string | null
  /** Shown when `href` is null, so the card never pretends to be usable. */
  unavailableLabel?: string
  unavailableReason?: string
}

/**
 * The three creation paths, in the order the product defines them.
 *
 * Trips are deliberately absent. D34 separates Trips from Activities and Events
 * and places them in Phase 9, behind payments; putting them in the first chooser
 * a student ever sees would advertise a product that does not exist.
 *
 * Cards for paths whose service layer is not built yet render as unavailable
 * rather than as links. A chooser that navigates to a form which cannot save
 * anything is worse than one that says so.
 */
const options: CreateOption[] = [
  {
    title: "Community",
    description:
      "Start a club, society, or interest group. Students propose a community and it goes to review; verified organisers and staff create one directly.",
    icon: Users,
    href: null,
    unavailableLabel: "Phase 1",
    unavailableReason:
      "The proposal service and duplicate detection exist and are tested. The screen that calls them is the next thing being built.",
  },
  {
    title: "Event",
    description:
      "A scheduled, ticketed-by-registration happening with a venue, a start time, and a capacity - a workshop, a fest, a talk.",
    icon: CalendarDays,
    href: null,
    unavailableLabel: "Phase 3",
    unavailableReason:
      "Events need their own schema, service, and registration rules before a create form can honestly save one.",
  },
  {
    title: "Activity",
    description:
      "A lightweight, recurring or spontaneous thing to do with other people - a run, a jam session, a study group.",
    icon: Sparkles,
    href: null,
    unavailableLabel: "Phase 5",
    unavailableReason:
      "Activities are a distinct model from Events (D34) and are built after the event loop is stable.",
  },
]

export default function CreatePage() {
  return (
    <>
      <PageHeader
        title="Create"
        description="Bring something new to campus. Pick what you want to create."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon
          const available = option.href !== null

          return (
            <li key={option.title}>
              <Card
                interactive={available}
                className={cn("h-full", !available && "opacity-80")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {!available && (
                      <Badge variant="neutral">
                        Not yet available &middot; {option.unavailableLabel}
                      </Badge>
                    )}
                  </div>

                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>

                  {available ? (
                    <Link
                      href={option.href as string}
                      className={cn(buttonVariants(), "mt-2 w-fit")}
                    >
                      Create {option.title.toLowerCase()}
                    </Link>
                  ) : (
                    <p className="mt-2 text-body-sm text-muted-foreground">
                      {option.unavailableReason}
                    </p>
                  )}
                </CardHeader>
              </Card>
            </li>
          )
        })}
      </ul>
    </>
  )
}
