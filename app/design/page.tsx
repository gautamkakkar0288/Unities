import { CalendarPlus, Compass, Sparkles, Users } from "lucide-react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { Alert } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">{title}</h2>
        <p className="text-body-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      <Separator className="mt-4" />
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-14 rounded-lg border border-border ${className}`}
        aria-hidden="true"
      />
      <span className="text-caption text-muted-foreground">{name}</span>
    </div>
  )
}

/**
 * Internal gallery for reviewing every primitive in both themes at once.
 * Kept in-repo instead of adding Storybook: zero extra dependencies, and it
 * renders through the real app pipeline, so token regressions surface here.
 */
export default function DesignSystemPage() {
  return (
    <Container className="flex flex-col gap-10 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">Cirqles design system</h1>
          <p className="text-body text-muted-foreground">
            Every primitive, rendered from live tokens. Toggle the theme to
            review both palettes.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section
        title="Colour"
        description="Surfaces stay neutral; meaning is carried by brand and status tokens."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="background" className="bg-background" />
          <Swatch name="card" className="bg-card" />
          <Swatch name="muted" className="bg-muted" />
          <Swatch name="primary" className="bg-primary" />
          <Swatch name="support" className="bg-support" />
          <Swatch name="featured" className="bg-featured" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="info" className="bg-info" />
          <Swatch name="destructive" className="bg-destructive" />
          <Swatch name="primary-subtle" className="bg-primary-subtle" />
          <Swatch name="success-subtle" className="bg-success-subtle" />
        </div>
      </Section>

      <Section
        title="Typography"
        description="Named roles only. Components never set a raw font size."
      >
        <div className="flex flex-col gap-3">
          <p className="text-display">Display</p>
          <p className="text-h1">Heading 1</p>
          <p className="text-h2">Heading 2</p>
          <p className="text-h3">Heading 3</p>
          <p className="text-h4">Heading 4</p>
          <p className="text-body-lg">Body large — descriptions.</p>
          <p className="text-body">Body — the default reading size.</p>
          <p className="text-body-sm text-muted-foreground">
            Body small — supporting information.
          </p>
          <p className="text-caption text-muted-foreground" data-numeric>
            Caption — 12 Aug, 6:30 PM · 128 going
          </p>
        </div>
      </Section>

      <Section title="Buttons" description="One primary action per screen.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Join community</Button>
          <Button variant="secondary">Save event</Button>
          <Button variant="outline">Explore</Button>
          <Button variant="ghost">Dismiss</Button>
          <Button variant="destructive">Cancel event</Button>
          <Button disabled>
            <Spinner size="sm" label={null} />
            Registering…
          </Button>
        </div>
      </Section>

      <Section
        title="Badges"
        description="Status pills always carry a text label, never colour alone."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Draft</Badge>
          <Badge variant="brand">Recommended</Badge>
          <Badge variant="support">Workshop</Badge>
          <Badge variant="featured">
            <Sparkles aria-hidden="true" />
            Trending
          </Badge>
          <Badge variant="success">Verified</Badge>
          <Badge variant="warning">Filling fast</Badge>
          <Badge variant="info">Registration open</Badge>
          <Badge variant="error">Cancelled</Badge>
          <Badge variant="outline">Sports</Badge>
        </div>
      </Section>

      <Section
        title="Feedback"
        description="Alerts pick their own icon, so meaning survives greyscale."
      >
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Verify your student email">
            Verified students get early access to limited-capacity events.
          </Alert>
          <Alert variant="success" title="You&apos;re registered" />
          <Alert variant="warning" title="Only 6 seats left" />
          <Alert variant="error" title="We couldn&apos;t save your changes">
            Check your connection and try again.
          </Alert>
        </div>
      </Section>

      <Section title="Cards" description="The primary content container.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card interactive>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar name="Coding Club" />
                <div className="flex flex-col">
                  <CardTitle>Coding Club</CardTitle>
                  <CardDescription>1,240 members · Very active</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="success">Verified</Badge>
              <Badge variant="outline">Technology</Badge>
            </CardContent>
            <CardFooter>
              <Button size="sm">Join</Button>
              <Button size="sm" variant="ghost">
                Preview
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading state</CardTitle>
              <CardDescription>
                Skeletons mirror the final layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        title="Avatars"
        description="Initials fallback keeps identity visible without an image."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Avatar size="xs" name="Aarav Sharma" />
          <Avatar size="sm" name="Aarav Sharma" />
          <Avatar size="md" name="Gautam Kakkar" />
          <Avatar size="lg" name="Chitkara University" />
          <Avatar size="xl" name="Robotics Society" />
        </div>
      </Section>

      <Section
        title="Forms"
        description="Field wires labels, hints, and errors to the control automatically."
      >
        <div className="grid max-w-md gap-4">
          <Field id="demo-name" label="Event name" required>
            {(field) => <Input placeholder="Hack the Campus" {...field} />}
          </Field>
          <Field
            id="demo-email"
            label="Contact email"
            error="Enter a valid email address"
          >
            {(field) => <Input defaultValue="not-an-email" {...field} />}
          </Field>
          <Field
            id="demo-about"
            label="Description"
            hint="Tell students what to expect."
          >
            {(field) => <Textarea rows={3} {...field} />}
          </Field>
        </div>
      </Section>

      <Section
        title="Empty states"
        description="Never a dead end — always a way forward."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            icon={Compass}
            title="No events yet"
            description="Once communities publish events at your university, they'll show up here."
            action={<Button size="sm">Explore communities</Button>}
          />
          <EmptyState
            icon={Users}
            title="You haven't joined a community"
            description="Communities are the fastest way to hear about what's happening."
            action={
              <Button size="sm">
                <CalendarPlus aria-hidden="true" />
                Browse
              </Button>
            }
            secondaryAction={
              <Button size="sm" variant="ghost">
                Maybe later
              </Button>
            }
          />
        </div>
      </Section>
    </Container>
  )
}
