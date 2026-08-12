import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { hero } from "@/lib/marketing/content"
import { cn } from "@/lib/utils"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/*
       * Token-driven ambient wash. Uses the primary-subtle variable rather
       * than a hardcoded colour, so it re-tints correctly in dark mode.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(70%_60%_at_50%_0%,var(--primary-subtle),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-page px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32 xl:px-12">
        <div className="flex max-w-3xl flex-col gap-6">
          <Badge variant="brand" className="w-fit">
            {hero.eyebrow}
          </Badge>

          <h1 className="text-display text-balance">{hero.headline}</h1>

          <p className="max-w-readable text-body-lg text-muted-foreground">
            {hero.subheadline}
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={hero.primaryCta.href}
              className={cn(buttonVariants({ size: "lg" }), "group")}
            >
              {hero.primaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-150 ease-standard group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {hero.secondaryCta.label}
            </Link>
          </div>

          <p className="text-caption text-muted-foreground">
            {hero.reassurance}
          </p>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {hero.signals.map((signal) => (
              <li
                key={signal}
                className="flex items-center gap-2 text-body-sm text-muted-foreground"
              >
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-success"
                />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
