import { Check } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { audiences } from "@/lib/marketing/content"

export function AudienceSections() {
  return (
    <>
      {audiences.map(
        ({ id, eyebrow, title, description, points, cta, icon: Icon }, i) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-heading`}
            className={
              i % 2 === 0
                ? "border-border bg-card scroll-mt-20 border-y py-16 sm:py-20 lg:py-24"
                : "scroll-mt-20 py-16 sm:py-20 lg:py-24"
            }
          >
            <div className="max-w-page mx-auto grid w-full gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 xl:px-12">
              <div className="flex flex-col gap-4">
                <span className="bg-support-subtle text-support flex size-11 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="text-caption text-support font-semibold tracking-wide uppercase">
                  {eyebrow}
                </p>
                <h2 id={`${id}-heading`} className="text-h2">
                  {title}
                </h2>
                <p className="max-w-readable text-body-lg text-muted-foreground">
                  {description}
                </p>
                <Link
                  href={cta.href}
                  className={`${buttonVariants({ variant: "outline" })} mt-2 w-fit`}
                >
                  {cta.label}
                </Link>
              </div>

              <ul className="flex flex-col gap-3">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check
                      aria-hidden="true"
                      className="text-success mt-0.5 size-4 shrink-0"
                    />
                    <span className="text-body">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ),
      )}
    </>
  )
}
