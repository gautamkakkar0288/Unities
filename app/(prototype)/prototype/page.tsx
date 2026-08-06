import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prototypeScreenGroups } from "@/lib/prototype/screens"

export const metadata = {
  title: "Prototype overview",
}

export default function PrototypeOverviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-readable flex-col gap-3">
        <p className="text-caption font-medium tracking-wide text-primary uppercase">
          Phase 6-P
        </p>
        <h1 className="text-h1">Every screen, before every table</h1>
        <p className="text-body-sm text-muted-foreground">
          This is the whole product as clickable screens, built from the real
          design system and typed against the real domain model in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-caption">
            lib/domain/types.ts
          </code>
          . Nothing here talks to a database. The point is to find what is wrong
          with the product now, while a change costs an afternoon instead of a
          migration.
        </p>
        <p className="text-body-sm text-muted-foreground">
          Each screen names the phase that replaces its fixtures with real data.
          The components themselves survive that swap.
        </p>
      </header>

      {prototypeScreenGroups.map((group) => (
        <section key={group.label} className="flex flex-col gap-4">
          <h2 className="text-h3">{group.label}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.screens.map((screen) => (
              <li key={screen.href} className="flex">
                <Card interactive className="w-full gap-4">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle>
                        <Link
                          href={screen.href}
                          className="group/link inline-flex items-center gap-1.5 focus-visible:outline-none"
                        >
                          {screen.title}
                          <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 ease-standard group-hover/link:translate-x-0.5" />
                        </Link>
                      </CardTitle>
                      <Badge variant="outline">{screen.phase}</Badge>
                    </div>
                    <CardDescription>{screen.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
