import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { finalCta } from "@/lib/marketing/content"

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-border bg-card border-t py-20 sm:py-24"
    >
      <div className="max-w-page mx-auto flex w-full flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8 xl:px-12">
        <h2 id="final-cta-heading" className="text-h1 max-w-2xl">
          {finalCta.headline}
        </h2>
        <p className="max-w-readable text-body-lg text-muted-foreground">
          {finalCta.description}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={finalCta.primaryCta.href}
            className={buttonVariants({ size: "lg" })}
          >
            {finalCta.primaryCta.label}
          </Link>
          <Link
            href={finalCta.secondaryCta.href}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            {finalCta.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
