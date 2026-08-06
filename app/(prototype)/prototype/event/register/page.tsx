import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Mail,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import { lineFollowerDetail } from "@/lib/prototype/fixtures"
import { formatDay, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Tone } from "@/lib/ui/tone"

export const metadata = { title: "Registration outcome" }

/**
 * The three ways registration ends.
 *
 * Shown side by side rather than one per route so the copy can be compared and
 * approved in one pass. Every outcome answers the same three questions: what
 * happened, what happens next, and what you can do now. "Waitlisted" in
 * particular fails silently in most products - a student who is 4th in line and
 * not told so simply does not turn up.
 */

function Outcome({
  tone,
  icon,
  title,
  children,
  actions,
}: {
  tone: Tone
  icon: ReactNode
  title: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <Card
      className={cn(
        "h-full gap-4",
        tone === "success" && "border-success-border",
        tone === "warning" && "border-warning-border",
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full",
              tone === "success" && "bg-success-subtle text-success-foreground",
              tone === "warning" && "bg-warning-subtle text-warning-foreground",
              tone === "neutral" && "bg-muted text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
          <Badge variant={tone}>{title}</Badge>
        </div>
        <h2 className="text-h4">{lineFollowerDetail.title}</h2>
        <p className="text-caption text-muted-foreground">
          {formatDay(lineFollowerDetail.startsAt)},{" "}
          {formatTime(lineFollowerDetail.startsAt)} -{" "}
          {lineFollowerDetail.venue}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-body-sm text-muted-foreground">
          {children}
        </div>
        <div className="mt-auto flex flex-col gap-2">{actions}</div>
      </CardContent>
    </Card>
  )
}

export default function PrototypeRegistrationOutcomePage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 8"
        title="Registration outcome"
        description="Confirmed, waitlisted, and closed - shown together so the wording can be compared. In the real product a student sees exactly one."
        notes={[
          "All three are static; the real screen renders one based on the result",
          "Calendar files, email confirmations, and QR check-in land in Phase 8",
          "Paid events add a payment step before this screen",
        ]}
      />

      <ul className="grid gap-4 lg:grid-cols-3">
        <li className="flex">
          <Outcome
            tone="success"
            title="You are in"
            icon={<CheckCircle2 className="size-5" />}
          >
            <p>
              Seat 38 of 40. A calendar invite is on its way to your university
              email.
            </p>
            <p>
              Bring a laptop and a USB-A cable if you have one. Kits are
              provided.
            </p>
            <p className="text-caption">
              Cannot make it? Cancel by 12:00 pm on the day so a waitlisted
              student takes your place.
            </p>
          </Outcome>
        </li>

        <li className="flex">
          <Outcome
            tone="warning"
            title="Waitlisted"
            icon={<Clock className="size-5" />}
          >
            <p>
              You are <strong className="text-foreground">4th</strong> on the
              waitlist. Two seats usually free up in the 24 hours before an
              event.
            </p>
            <p>
              If a seat opens you are notified immediately and it is held for
              two hours.
            </p>
            <p className="text-caption">
              Turning up on the day without a seat is not a plan the organisers
              can support - the lab has a fire code.
            </p>
          </Outcome>
        </li>

        <li className="flex">
          <Outcome
            tone="neutral"
            title="Registration closed"
            icon={<XCircle className="size-5" />}
          >
            <p>Registration closed at 12:00 pm and the waitlist is full.</p>
            <p>
              Robotics Club runs a build night every Thursday, and the next
              bootcamp is in September.
            </p>
            <p className="text-caption">
              This is the only outcome with nothing to celebrate, so it leads
              somewhere instead of apologising.
            </p>
          </Outcome>
        </li>
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" render={<Link href="/prototype/event" />}>
          <CalendarPlus aria-hidden="true" />
          Back to the event
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/prototype/community" />}>
          <Mail aria-hidden="true" />
          Follow Robotics Club
        </Button>
      </div>
    </div>
  )
}
