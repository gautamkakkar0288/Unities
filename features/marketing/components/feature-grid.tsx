import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { features } from "@/lib/marketing/content"

import { Section } from "./section"

export function FeatureGrid() {
  return (
    <Section
      id="features"
      eyebrow="What you get"
      title="One place for everything happening around you."
      description="Cirqles is built community-first. Events, posts, and opportunities strengthen the communities behind them instead of floating alone in a feed."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex">
            <Card className="gap-4">
              <CardHeader className="gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  )
}
